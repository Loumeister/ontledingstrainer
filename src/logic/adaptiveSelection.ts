/**
 * Adaptive sentence selection ("Slimme zinsselectie").
 *
 * 1. Per rol schatten we hoe zeker de leerling is: (goed + 1) / (gezien + 2),
 *    met recente sessies zwaarder dan oude (halveringstijd in sessies).
 *    Een rol die nooit gezien is blijft op 0,5 (neutraal).
 * 2. Een zin is zo interessant als zijn zwakste rol (maximale zwakte, niet
 *    het gemiddelde — PV en OW mogen een zwakke rol niet wegdrukken).
 * 3. Zinnen worden gewogen getrokken zonder terugleggen. Een zin met een
 *    zeer zwakke rol weegt maximaal (1 + ROLE_BOOST) keer zo zwaar.
 * 4. Variatie-ondergrens: zinnen met een zwakke rol vullen hooguit
 *    MAX_FOCUS_SHARE van de sessie, tenzij de pool niets anders biedt.
 */

import { Sentence, RoleKey, SessionHistoryEntry, Token, ValidationState, PlacementMap } from '../types';
import { roleMatchesToken } from './validation';
import { loadSessionHistory } from '../services/sessionHistory';
import { findStudent, getOrCreateStudent, getStudents } from '../services/studentStore';
import { ROLES } from '../constants';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

export interface RoleTally {
  seen: Partial<Record<RoleKey, number>>;
  correct: Partial<Record<RoleKey, number>>;
}

export interface RoleConfidence {
  role: RoleKey;
  confidence: number;   // 0.0 (weak) – 1.0 (strong); 0.5 = geen gegevens
  /** Gewogen aantal keer dat de rol beoordeeld is (na vervagen). */
  totalEncounters: number;
  /** Gewogen aantal fouten op deze rol (na vervagen). */
  recentErrors: number;
}

/** Na zoveel sessies telt een uitkomst nog maar half mee. */
export const HALF_LIFE_SESSIONS = 5;
/** Extra gewicht voor een zin waarvan de zwakste rol maximaal zwak is. */
export const ROLE_BOOST = 3;
/** Hoogstens dit deel van een sessie bestaat uit zinnen met een zwakke rol. */
export const MAX_FOCUS_SHARE = 0.6;
/** Een rol telt als zwak (focusrol) vanaf deze zwakte (= 1 − confidence). */
const WEAK_THRESHOLD = 0.55;

const LABEL_TO_KEY = new Map<string, RoleKey>(ROLES.map(r => [r.label, r.key]));

// ---------------------------------------------------------------------------
// Per-session role tallies
// ---------------------------------------------------------------------------

/**
 * Tel per rol hoeveel zinsdelen de leerling in deze zin benoemd heeft en hoeveel
 * daarvan goed waren, uit de chunkstatus van validateAnswer.
 * Alleen goed verdeelde zinsdelen tellen: bij een verdelingsfout (of een
 * zinsdeel buiten de actieve trede, status null) is de rol niet beoordeeld.
 * Een waarschuwing telt als goed als het hoofdlabel klopt (de waarschuwing
 * gaat dan over bijzinfunctie of verwijzing), anders als gezien maar fout.
 */
export function tallySentenceRoles(
  chunks: { tokens: Token[] }[],
  chunkStatus: Record<number, ValidationState>,
  chunkLabels: PlacementMap = {},
): RoleTally {
  const seen: Partial<Record<RoleKey, number>> = {};
  const correct: Partial<Record<RoleKey, number>> = {};
  chunks.forEach((chunk, idx) => {
    const status = chunkStatus[idx];
    if (status !== 'correct' && status !== 'incorrect-role' && status !== 'warning') return;
    const role = chunk.tokens[0].role;
    seen[role] = (seen[role] ?? 0) + 1;
    const label = chunkLabels[chunk.tokens[0].id] as RoleKey | undefined;
    const mainLabelOk = status === 'warning' && !!label && chunk.tokens.every(t => roleMatchesToken(label, t));
    if (status === 'correct' || mainLabelOk) correct[role] = (correct[role] ?? 0) + 1;
  });
  return { seen, correct };
}

/** Tel een per-zin telling op bij een sessietotaal (muteert `target`). */
export function addRoleTally(target: RoleTally, add: RoleTally): void {
  for (const [k, v] of Object.entries(add.seen) as [RoleKey, number][]) {
    target.seen[k] = (target.seen[k] ?? 0) + v;
  }
  for (const [k, v] of Object.entries(add.correct) as [RoleKey, number][]) {
    target.correct[k] = (target.correct[k] ?? 0) + v;
  }
}

// ---------------------------------------------------------------------------
// Role-confidence calculation
// ---------------------------------------------------------------------------

export interface ConfidenceOptions {
  /** Alleen sessies van deze leerling meetellen. */
  studentId?: string | null;
  /**
   * Sessies zonder studentId (van vóór deze versie) ook meetellen.
   * Alleen veilig als deze browser maar één leerling kent.
   */
  includeUntagged?: boolean;
}

/** Sessies die meetellen voor deze leerling, oud → nieuw. */
function relevantHistory(history: SessionHistoryEntry[], options: ConfidenceOptions): SessionHistoryEntry[] {
  const { studentId = null, includeUntagged = true } = options;
  return history.filter(s =>
    !s.adaptiveExcluded && (s.studentId ? s.studentId === studentId : includeUntagged),
  );
}

/** Na zoveel eigen sessies telt een eerder gemaakte zin weer als vers. */
const FRESHNESS_SESSIONS = 4;

/**
 * Sleutel waarmee versheid een zin herkent, afgeleid van de zinstekst.
 *
 * Niet `Sentence.id`: dat is alleen uniek binnen één bron. Een JSON-import,
 * een gedeelde link of een eigen zin kan hetzelfde getal dragen als een
 * andere ingebouwde zin, en dan zou die ingebouwde zin onterecht als "net
 * gemaakt" tellen. Dezelfde woorden uit een andere bron zijn voor de leerling
 * wél dezelfde zin, dus die tellen terecht samen.
 */
export function sentenceRecencyKey(sentence: Pick<Sentence, 'tokens'>): string {
  const text = sentence.tokens.map(t => t.text.trim().toLowerCase()).filter(Boolean).join(' ');
  // FNV-1a (32 bit): kort genoeg voor localStorage, botsingen zijn verwaarloosbaar
  // en kosten hooguit wat versheid.
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Per zinsleutel (zie sentenceRecencyKey): hoeveel sessies geleden de leerling
 * hem maakte (0 = vorige sessie), alleen voor de laatste FRESHNESS_SESSIONS
 * sessies van deze leerling. Oude sessies met alleen `sentenceIds` tellen niet
 * mee: uit een los id valt niet af te leiden welke zin het was.
 */
export function computeRecentSentences(
  history: SessionHistoryEntry[],
  options: ConfidenceOptions = {},
): Map<string, number> {
  const relevant = relevantHistory(history, options);
  const recent = new Map<string, number>();
  for (let age = 0; age < FRESHNESS_SESSIONS && age < relevant.length; age++) {
    for (const key of relevant[relevant.length - 1 - age].sentenceKeys ?? []) {
      if (!recent.has(key)) recent.set(key, age);
    }
  }
  return recent;
}

/**
 * Bereken per rol een confidence uit de sessiegeschiedenis (oud → nieuw).
 *
 * Nieuwe sessies hebben `roleSeen`/`roleCorrect`. Oude sessies hebben alleen
 * fouten; die tellen als "gezien en fout" — we weten daar niet hoe vaak de rol
 * goed ging, dus alleen fouten zijn bewijs. Rollen zonder bewijs blijven 0,5.
 */
export function computeRoleConfidences(
  history: SessionHistoryEntry[],
  options: ConfidenceOptions = {},
): Map<RoleKey, RoleConfidence> {
  const relevant = relevantHistory(history, options);

  const seen: Partial<Record<RoleKey, number>> = {};
  const errors: Partial<Record<RoleKey, number>> = {};

  relevant.forEach((session, idx) => {
    const age = relevant.length - 1 - idx; // 0 = meest recente sessie
    const w = Math.pow(0.5, age / HALF_LIFE_SESSIONS);

    if (session.roleSeen) {
      for (const [k, n] of Object.entries(session.roleSeen) as [RoleKey, number][]) {
        const ok = Math.min(n, session.roleCorrect?.[k] ?? 0);
        seen[k] = (seen[k] ?? 0) + w * n;
        errors[k] = (errors[k] ?? 0) + w * (n - ok);
      }
    } else {
      // Legacy: alleen fouten bekend, gekeyed op label.
      for (const [label, count] of Object.entries(session.mistakeStats ?? {})) {
        const k = LABEL_TO_KEY.get(label);
        if (!k || count <= 0) continue;
        seen[k] = (seen[k] ?? 0) + w * count;
        errors[k] = (errors[k] ?? 0) + w * count;
      }
    }
  });

  const result = new Map<RoleKey, RoleConfidence>();
  for (const { key } of ROLES) {
    const n = seen[key] ?? 0;
    const e = errors[key] ?? 0;
    // Laplace-schatting: 0,5 zonder gegevens; één fout duwt niet meteen naar 0.
    const confidence = (n - e + 1) / (n + 2);
    result.set(key, { role: key, confidence, totalEncounters: n, recentErrors: e });
  }
  return result;
}

/**
 * Stabiel student-id voor het labelen van sessiegeschiedenis, of null voor een
 * anonieme leerling (die krijgt anders elke keer een nieuw, niet-opgeslagen id).
 * studentStore matcht alleen op naam + klas; de initiaal komt erbij zodat
 * "Sam B." en "Sam K." uit dezelfde klas elk een eigen profiel houden.
 */
export function resolveHistoryStudentId(name: string, initiaal: string, klas: string): string | null {
  if (!name.trim()) return null;
  try {
    const { id } = getOrCreateStudent(name, initiaal, klas);
    return `${id}:${initiaal.trim().toUpperCase()}`;
  } catch { return null; }
}

/**
 * Zelfde id als resolveHistoryStudentId, maar zonder een studentrecord aan te
 * maken (veilig tijdens renderen). Geen record = nog geen eigen sessies = null.
 */
export function findHistoryStudentId(name: string, initiaal: string, klas: string): string | null {
  const student = findStudent(name, klas);
  return student ? `${student.id}:${initiaal.trim().toUpperCase()}` : null;
}

/**
 * Welke sessies uit localStorage bij de huidige leerling horen. Oude sessies
 * zonder studentId tellen alleen mee als deze browser maar één leerling kent
 * én er geen gelabelde sessie van iemand anders is (bijv. Sam B. naast Sam K.,
 * die in studentStore hetzelfde record delen).
 */
function historyOptionsFor(history: SessionHistoryEntry[], name: string, initiaal: string, klas: string): ConfidenceOptions {
  const studentId = resolveHistoryStudentId(name, initiaal, klas);
  const otherTagged = history.some(s => s.studentId && s.studentId !== studentId);
  return { studentId, includeUntagged: getStudents().length <= 1 && !otherTagged };
}

/** Confidences voor de huidige leerling (rollenkas op het scorescherm). */
export function loadRoleConfidencesFor(name: string, initiaal: string, klas: string): Map<RoleKey, RoleConfidence> {
  const history = loadSessionHistory();
  return computeRoleConfidences(history, historyOptionsFor(history, name, initiaal, klas));
}

/** Alles wat selectAdaptiveQueue voor de huidige leerling nodig heeft. */
export function loadAdaptiveProfileFor(name: string, initiaal: string, klas: string): {
  confidences: Map<RoleKey, RoleConfidence>;
  recentSentences: Map<string, number>;
} {
  const history = loadSessionHistory();
  const options = historyOptionsFor(history, name, initiaal, klas);
  return {
    confidences: computeRoleConfidences(history, options),
    recentSentences: computeRecentSentences(history, options),
  };
}

// ---------------------------------------------------------------------------
// Weighted sentence selection
// ---------------------------------------------------------------------------

/** Zwakte (1 − confidence) van de zwakste rol in de zin; 0,5 bij onbekend. */
export function sentenceWeakness(
  sentence: Sentence,
  roleConfidences: Map<RoleKey, RoleConfidence>,
): number {
  let max = 0;
  for (const t of sentence.tokens) {
    max = Math.max(max, 1 - (roleConfidences.get(t.role)?.confidence ?? 0.5));
  }
  return sentence.tokens.length > 0 ? max : 0.5;
}

/**
 * Gewicht van een zin bij het trekken. Neutraal = 1.
 * - Zwakste rol: 1 + ROLE_BOOST × (hoeveel zwakker dan neutraal), 1 … 1+ROLE_BOOST
 * - Versheid: zin uit de vorige eigen sessie ×0,6, daarna +0,1 per sessie tot ×1
 *
 * Bewust niet uit de gedeelde gebruiksstatistiek (usageData): die is per
 * browser en bevat ook Rollenladder-pogingen en andere leerlingen.
 */
export function computeSentenceScore(
  sentence: Sentence,
  roleConfidences: Map<RoleKey, RoleConfidence>,
  recentSentences: Map<string, number> = new Map(),
): number {
  const weakness = sentenceWeakness(sentence, roleConfidences);
  const roleFactor = 1 + ROLE_BOOST * Math.max(0, (weakness - 0.5) / 0.5);

  const age = recentSentences.get(sentenceRecencyKey(sentence));
  const freshnessFactor = age === undefined ? 1 : Math.min(1, 0.6 + 0.1 * age);

  return roleFactor * freshnessFactor;
}

function weakRolesIn(sentence: Sentence, weakRoles: Set<RoleKey>): boolean {
  return sentence.tokens.some(t => weakRoles.has(t.role));
}

/**
 * Kies `count` zinnen uit `pool` met gewogen trekking zonder terugleggen.
 * Pure functie: recente zinnen en random zijn injecteerbaar.
 */
export function selectAdaptiveQueue(
  pool: Sentence[],
  count: number,
  roleConfidences: Map<RoleKey, RoleConfidence>,
  random: () => number = Math.random,
  recentSentences: Map<string, number> = new Map(),
): Sentence[] {
  if (pool.length === 0) return [];
  const n = Math.min(count, pool.length);

  const weakRoles = new Set<RoleKey>();
  roleConfidences.forEach((c, k) => {
    if (1 - c.confidence >= WEAK_THRESHOLD) weakRoles.add(k);
  });

  const remaining = pool.map(sentence => ({
    sentence,
    score: computeSentenceScore(sentence, roleConfidences, recentSentences),
    focus: weakRolesIn(sentence, weakRoles),
  }));

  // Variatie-ondergrens: nooit meer focuszinnen dan het maximum van
  // MAX_FOCUS_SHARE en wat de pool van nature al zou geven.
  const poolFocusShare = remaining.filter(r => r.focus).length / pool.length;
  // Altijd minstens één andere zin als de pool die heeft (fallback hieronder).
  const focusCap = n < 2
    ? n
    : Math.min(n - 1, Math.max(Math.ceil(n * MAX_FOCUS_SHARE), Math.round(n * poolFocusShare)));

  const selected: Sentence[] = [];
  let focusPicked = 0;

  for (let i = 0; i < n; i++) {
    let candidates = remaining.filter(r => !r.focus || focusPicked < focusCap);
    if (candidates.length === 0) candidates = remaining; // pool dwingt het af

    const total = candidates.reduce((sum, r) => sum + r.score, 0);
    let r = random() * total;
    let picked = candidates[candidates.length - 1];
    for (const c of candidates) {
      r -= c.score;
      if (r <= 0) { picked = c; break; }
    }

    selected.push(picked.sentence);
    if (picked.focus) focusPicked++;
    remaining.splice(remaining.indexOf(picked), 1);
  }

  // Volgorde husselen zodat de zwaarste zin niet altijd eerst komt
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}
