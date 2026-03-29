/**
 * corpusGrouper.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Extraheert Zinnenlab-frames en -kaarten automatisch uit het bestaande
 * zinsontleed-corpus (de sentences-level-*.json bestanden).
 *
 * Werking:
 * 1. Groepeer zinnen op "slot-signatuur": de geordende unieke lijst van
 *    FrameSlotKey-rollen die in de zin voorkomen (bijv. ['ow','pv','lv','bwb']).
 * 2. Filter groepen met te weinig zinnen (< MIN_POOL_SIZE) — te kleine pools
 *    bieden geen zinvol remixpotentieel.
 * 3. Converteer elke groep naar een ConstructionFrame + ChunkCard[].
 *    - Annotaties (number, verbTense, timeRef) komen uit:
 *      a. Sentence.owNumber / Sentence.pvTense (docent-override, meest betrouwbaar)
 *      b. Heuristiek via pvTenseHeuristic / owNumberHeuristic / bwbTimeRefHeuristic
 * 4. Geef frames en kaarten terug voor gebruik in useZinsbouwlab.
 *
 * Design-keuzes:
 * - PURE functie: geen localStorage, geen React state — makkelijk testbaar
 * - MIN_POOL_SIZE = 3 (minstens 3 zinnen per pool voor zinvol mixen)
 * - Slot-signatuur bevat alleen FrameSlotKey-rollen (subset van RoleKey)
 *   → bijzin, bijv_bep, etc. worden genegeerd want niet ondersteund in frame-bouwer
 * - Frames per slot-signatuur krijgen een stabiel ID gebaseerd op de signatuur
 *
 * Gebruik: src/hooks/useZinsbouwlab.ts
 */

import type { Sentence, FrameSlotKey, ChunkCard, ConstructionFrame, RoleKey } from '../types';
import { detectPvTense } from './pvTenseHeuristic';
import { detectOwNumber } from './owNumberHeuristic';
import { detectBwbTimeRef } from './bwbTimeRefHeuristic';
import { v2WordOrders } from './v2WordOrders';

/** Minimaal aantal zinnen per pool voor zinvol mixen */
const MIN_POOL_SIZE = 3;

/**
 * De FrameSlotKey-rollen die we herkennen in de slot-signatuur.
 * Overige rollen (bijzin, bijv_bep, etc.) worden bewust genegeerd.
 */
const FRAME_SLOT_KEYS: ReadonlySet<FrameSlotKey> = new Set<FrameSlotKey>([
  'ow', 'pv', 'wg', 'ng', 'lv', 'mv', 'vv', 'bwb', 'nwd',
]);

/**
 * Bepaalt of een RoleKey een FrameSlotKey is.
 */
function isFrameSlotKey(role: RoleKey): role is FrameSlotKey {
  return FRAME_SLOT_KEYS.has(role as FrameSlotKey);
}

/**
 * Berekent de slot-signatuur van een zin: de geordende unieke lijst van
 * FrameSlotKey-rollen die in de zin voorkomen.
 *
 * Voorbeeld: zin met rollen [ow, ow, pv, lv, lv, bwb] → signatuur 'ow-pv-lv-bwb'
 *
 * De volgorde wordt bepaald door de eerste verschijning van elke rol in de zin,
 * wat de "canonieke" Nederlandse zinsvolgorde weerspiegelt.
 */
export function getSentenceSlotSignature(sentence: Sentence): string {
  const seen = new Set<FrameSlotKey>();
  const order: FrameSlotKey[] = [];

  for (const token of sentence.tokens) {
    // Gebruik de hoofdrol (role), niet de subrol
    if (isFrameSlotKey(token.role) && !seen.has(token.role)) {
      seen.add(token.role);
      order.push(token.role);
    }
  }

  return order.join('-');
}

/**
 * Groepeert een lijst zinnen op slot-signatuur.
 *
 * @returns Map van signatuur → zinnen met die signatuur
 */
export function groupSentencesBySlotSignature(
  sentences: Sentence[]
): Map<string, Sentence[]> {
  const groups = new Map<string, Sentence[]>();

  for (const sentence of sentences) {
    const sig = getSentenceSlotSignature(sentence);
    if (!sig) continue; // lege signatuur (geen frame-slotkeys) → overslaan

    const group = groups.get(sig);
    if (group) {
      group.push(sentence);
    } else {
      groups.set(sig, [sentence]);
    }
  }

  return groups;
}

/**
 * Extraheert de tokens van een specifiek slot (rol) uit een zin.
 * Behandelt newChunk: tokens die niet bij het eerste chunk van die rol horen
 * worden NIET opgenomen (we nemen altijd het eerste chunk van elke rol).
 */
function extractSlotTokens(
  sentence: Sentence,
  slot: FrameSlotKey
): Array<{ text: string; role: RoleKey; subRole?: RoleKey }> {
  const result: Array<{ text: string; role: RoleKey; subRole?: RoleKey }> = [];
  let inSlot = false;

  for (const token of sentence.tokens) {
    const tokenRole = token.role as FrameSlotKey;

    if (tokenRole === slot) {
      if (!inSlot) {
        // Begin van het eerste chunk van dit slot
        inSlot = true;
        result.push({ text: token.text, role: token.role, subRole: token.subRole });
      } else if (token.newChunk) {
        // Nieuw chunk van hetzelfde slot → stop (neem alleen het eerste chunk)
        break;
      } else {
        // Vervolg van hetzelfde chunk
        result.push({ text: token.text, role: token.role, subRole: token.subRole });
      }
    } else if (inSlot) {
      // We zijn de tokens van dit slot voorbij
      break;
    }
  }

  return result;
}

/**
 * Genereert een stabiel frame-ID op basis van de slot-signatuur en het gezegdetype.
 * Voorbeeld: 'ow-pv-lv-bwb' + 'WG' → 'corpus-wg-ow-pv-lv-bwb'
 */
function makeFrameId(signature: string, predicateType: 'WG' | 'NG'): string {
  return `corpus-${predicateType.toLowerCase()}-${signature}`;
}

/**
 * Bepaalt het gezegdetype van een groep zinnen op basis van de meerderheid.
 * Bij gelijkspel wint WG (meest frequent in schoolcorpus).
 */
function dominantPredicateType(sentences: Sentence[]): 'WG' | 'NG' {
  let wgCount = 0;
  let ngCount = 0;
  for (const s of sentences) {
    if (s.predicateType === 'WG') wgCount++;
    else ngCount++;
  }
  return ngCount > wgCount ? 'NG' : 'WG';
}

/**
 * Bepaalt het moeilijkheidsniveau van een groep zinnen (gemiddelde, afgerond).
 */
function averageLevel(sentences: Sentence[]): 0 | 1 | 2 | 3 | 4 {
  const avg = sentences.reduce((sum, s) => sum + s.level, 0) / sentences.length;
  return Math.round(avg) as 0 | 1 | 2 | 3 | 4;
}

/**
 * Genereert een leesbaar prompt voor leerlingen op basis van de slot-signatuur.
 */
function makePrompt(slots: FrameSlotKey[], predicateType: 'WG' | 'NG'): string {
  const slotLabels: Record<FrameSlotKey, string> = {
    ow: 'onderwerp',
    pv: 'persoonsvorm',
    wg: 'werkwoordelijk gezegde',
    ng: 'naamwoordelijk gezegde',
    lv: 'lijdend voorwerp',
    mv: 'meewerkend voorwerp',
    vv: 'voorzetselvoorwerp',
    bwb: 'bijwoordelijke bepaling',
    nwd: 'naamwoordelijk deel',
  };

  const slotNames = slots.map(s => slotLabels[s] ?? s).join(', ');
  const typeHint = predicateType === 'NG'
    ? ' Let op: dit is een naamwoordelijk gezegde.'
    : '';

  return `Bouw een zin met: ${slotNames}. Elk zinsdeel kan voorop staan.${typeHint}`;
}

/**
 * Converteert een groep zinnen met dezelfde slot-signatuur naar een ConstructionFrame.
 */
function groupToFrame(
  signature: string,
  slots: FrameSlotKey[],
  sentences: Sentence[],
): ConstructionFrame {
  const predType = dominantPredicateType(sentences);
  const id = makeFrameId(signature, predType);

  return {
    id,
    label: `${slots.map(s => s.toUpperCase()).join(' + ')} (corpus)`,
    level: averageLevel(sentences),
    predicateType: predType,
    slots,
    families: [id],                  // pool is zijn eigen family
    wordOrders: v2WordOrders(slots),  // V2-regel genereert alle geldige volgordes
    prompt: makePrompt(slots, predType),
  };
}

/**
 * Converteert een zin naar een set ChunkCards (één per slot).
 *
 * Annotaties:
 * - OW: number via Sentence.owNumber (override) of owNumberHeuristic
 * - PV: verbTense via Sentence.pvTense (override) of pvTenseHeuristic
 * - BWB: timeRef via bwbTimeRefHeuristic
 */
function sentenceToCards(
  sentence: Sentence,
  slots: FrameSlotKey[],
  frameId: string,
): ChunkCard[] {
  const cards: ChunkCard[] = [];

  for (const slot of slots) {
    const tokens = extractSlotTokens(sentence, slot);
    if (tokens.length === 0) continue; // slot niet aanwezig in deze zin (onverwacht)

    const card: ChunkCard = {
      id: `${frameId}-s${sentence.id}-${slot}`,
      role: slot,
      familyId: frameId,
      frameIds: [frameId],
      tokens,
    };

    // ── Slot-specifieke annotaties ─────────────────────────────────────────
    if (slot === 'ow') {
      // Docent-override heeft voorrang; anders heuristiek
      card.number = sentence.owNumber ?? detectOwNumber(tokens.map(t => t.text));
    }

    if (slot === 'pv') {
      // Docent-override heeft voorrang; anders heuristiek op eerste token van PV
      const pvText = tokens[0]?.text ?? '';
      card.verbTense = sentence.pvTense ?? detectPvTense(pvText);
      // Congruentiegetal PV = zelfde als OW (wordt via OW-kaart bepaald bij validatie,
      // maar we vullen het hier in voor volledigheid)
      card.number = sentence.owNumber ?? detectOwNumber(
        // Zoek OW-tokens in dezelfde zin
        extractSlotTokens(sentence, 'ow').map(t => t.text)
      );
    }

    if (slot === 'bwb') {
      const timeRef = detectBwbTimeRef(tokens.map(t => t.text));
      if (timeRef) card.timeRef = timeRef;
    }

    cards.push(card);
  }

  return cards;
}

// ── Publieke API ─────────────────────────────────────────────────────────────

/**
 * Resultaat van de corpus-analyse: frames + kaarten klaar voor gebruik
 * in useZinsbouwlab.
 */
export interface CorpusLabData {
  frames: ConstructionFrame[];
  cards: ChunkCard[];
}

/**
 * Analyseert het corpus en genereert Zinnenlab-frames en -kaarten.
 *
 * @param sentences - Alle beschikbare zinnen (gefilterd of niet)
 * @returns Frames en kaarten voor gebruik in het Zinnenlab
 *
 * Alleen groepen met minstens MIN_POOL_SIZE zinnen worden meegenomen.
 * Dit voorkomt te kleine pools waarbij "mixen" weinig toegevoegde waarde heeft.
 */
export function corpusToLabData(sentences: Sentence[]): CorpusLabData {
  const groups = groupSentencesBySlotSignature(sentences);
  const frames: ConstructionFrame[] = [];
  const cards: ChunkCard[] = [];

  for (const [signature, groupSentences] of groups) {
    // Filter: te kleine groep → overslaan
    if (groupSentences.length < MIN_POOL_SIZE) continue;

    // Parseer de signatuur terug naar een geordende slot-array
    const slots = signature.split('-') as FrameSlotKey[];

    // Maak het frame aan
    const frame = groupToFrame(signature, slots, groupSentences);
    frames.push(frame);

    // Maak kaarten aan voor elke zin in de groep
    for (const sentence of groupSentences) {
      const sentenceCards = sentenceToCards(sentence, slots, frame.id);
      cards.push(...sentenceCards);
    }
  }

  // Sorteer frames op niveau voor consistente weergave in het Zinnenlab
  frames.sort((a, b) => a.level - b.level);

  return { frames, cards };
}
