/**
 * Persistente rolbeheersing (Rollenkas): hoe vaak een rol achter elkaar
 * foutloos is geoefend. Een rol is "beheerst" na 3 sessies achter elkaar
 * waarin de leerling de rol echt benoemde en daarbij geen fouten maakte.
 *
 * - Alleen rollen die in de sessie beoordeeld zijn (of een fout kregen) tellen;
 *   een rol die niet voorkwam laat de reeks ongemoeid.
 * - Opslag is per leerling (zelfde id als de sessiegeschiedenis). Anonieme
 *   leerlingen krijgen geen persistente beheersing: op een gedeelde laptop
 *   is dan niet te zeggen van wie de reeks is.
 */

import { ROLES } from '../constants';
import type { RoleKey, SessionHistoryEntry } from '../types';

const STORAGE_PREFIX = 'zinsontleding_role_mastery_v2:';
/**
 * Oude, browserbrede opslag; bewust niet meer gelezen (niet per leerling, telde
 * ongeoefende rollen mee). In plaats daarvan: rebuildRoleMastery.
 */
export const LEGACY_STORAGE_KEY = 'zinsontleding_role_mastery_v1';
export const MASTERY_SESSIONS = 3;

export interface RoleMasteryEntry {
  consecutiveClean: number; // sessies achter elkaar geoefend zonder fouten
  mastered: boolean;        // true zodra consecutiveClean >= MASTERY_SESSIONS
  achievedAt?: string;      // ISO-datum van eerste keer mastered
}

export type RoleMasteryStore = Record<string, RoleMasteryEntry>;

/** Wat de leerling in één sessie per rol liet zien. */
export interface SessionRoleEvidence {
  /** Aantal beoordeelde zinsdelen per rol. */
  seen: Partial<Record<RoleKey, number>>;
  /** Waarvan goed benoemd. */
  correct: Partial<Record<RoleKey, number>>;
}

function storageKey(studentKey: string): string {
  return STORAGE_PREFIX + studentKey;
}

/** Opgeslagen beheersing van deze leerling, of null als er nog niets is opgeslagen. */
function readStoredMastery(studentKey: string): RoleMasteryStore | null {
  try {
    const raw = localStorage.getItem(storageKey(studentKey));
    return raw ? (JSON.parse(raw) as RoleMasteryStore) : null;
  } catch {
    return null;
  }
}

export function loadRoleMastery(studentKey: string | null): RoleMasteryStore {
  return (studentKey && readStoredMastery(studentKey)) || {};
}

function saveRoleMastery(studentKey: string, store: RoleMasteryStore): void {
  try {
    localStorage.setItem(storageKey(studentKey), JSON.stringify(store));
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Per rollabel: is de rol deze sessie geoefend, en zo ja, foutloos?
 * Rollen die niet voorkwamen ontbreken in het resultaat.
 */
export function practicedRoleOutcomes(
  evidence: SessionRoleEvidence,
  mistakeStats: Record<string, number>,
): Map<string, { clean: boolean }> {
  const outcomes = new Map<string, { clean: boolean }>();
  for (const { key, label } of ROLES) {
    const seen = evidence.seen[key] ?? 0;
    const hadError = (mistakeStats[label] ?? 0) > 0;
    if (seen <= 0 && !hadError) continue;
    const allCorrect = (evidence.correct[key] ?? 0) >= seen;
    outcomes.set(label, { clean: !hadError && allCorrect });
  }
  return outcomes;
}

/** Pas één sessie toe op de store (muteert); geeft de nieuw beheerste rollabels terug. */
function applySession(
  store: RoleMasteryStore,
  outcomes: Map<string, { clean: boolean }>,
  date: string,
): string[] {
  const newlyMastered: string[] = [];
  for (const [label, { clean }] of outcomes) {
    const prev = store[label] ?? { consecutiveClean: 0, mastered: false };
    const consecutiveClean = clean ? prev.consecutiveClean + 1 : 0;
    const justMastered = !prev.mastered && consecutiveClean >= MASTERY_SESSIONS;
    store[label] = {
      consecutiveClean,
      mastered: prev.mastered || consecutiveClean >= MASTERY_SESSIONS,
      achievedAt: justMastered ? date : prev.achievedAt,
    };
    if (justMastered) newlyMastered.push(label);
  }
  return newlyMastered;
}

/**
 * Reconstrueer de beheersing uit de eigen sessiegeschiedenis (oud → nieuw),
 * voor leerlingen die nog geen opgeslagen beheersing per leerling hebben.
 *
 * Alleen sessies met dit leerling-id tellen. Sessies zonder telling per rol
 * (van vóór adaptieve selectie v2) kunnen een reeks alleen breken via een
 * fout, nooit verlengen: zonder telling is niet te zien of een rol geoefend is.
 * Rollenladder-sessies tellen niet mee.
 */
export function rebuildRoleMastery(history: SessionHistoryEntry[], studentKey: string): RoleMasteryStore {
  const store: RoleMasteryStore = {};
  for (const session of history) {
    if (session.adaptiveExcluded || session.studentId !== studentKey) continue;
    const evidence = { seen: session.roleSeen ?? {}, correct: session.roleCorrect ?? {} };
    applySession(store, practicedRoleOutcomes(evidence, session.mistakeStats ?? {}), session.date.slice(0, 10));
  }
  return store;
}

/**
 * Werk de beheersing van deze leerling bij na een sessie.
 *
 * @param studentKey    Stabiel leerling-id (resolveHistoryStudentId); null = anoniem, niets opslaan
 * @param evidence      Gezien/goed per rol uit deze sessie
 * @param mistakeStats  Fouten per rollabel uit deze sessie
 * @param priorHistory  Sessiegeschiedenis van vóór deze sessie; startpunt als er nog niets is opgeslagen
 * @returns Bijgewerkte store + rollabels die deze sessie voor het eerst beheerst zijn
 */
export function updateRoleMastery(
  studentKey: string | null,
  evidence: SessionRoleEvidence,
  mistakeStats: Record<string, number>,
  priorHistory: SessionHistoryEntry[] = [],
): { store: RoleMasteryStore; newlyMastered: string[] } {
  if (!studentKey) return { store: {}, newlyMastered: [] };

  const store = readStoredMastery(studentKey) ?? rebuildRoleMastery(priorHistory, studentKey);
  const today = new Date().toISOString().slice(0, 10);
  const newlyMastered = applySession(store, practicedRoleOutcomes(evidence, mistakeStats), today);

  saveRoleMastery(studentKey, store);
  return { store, newlyMastered };
}
