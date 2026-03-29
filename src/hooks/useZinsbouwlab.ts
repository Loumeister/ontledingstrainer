/**
 * useZinsbouwlab.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook voor het Zinnenlab (route #/zinnenlab).
 *
 * Bronnen voor frames en kaarten (gecombineerd):
 *   1. Built-in frames/kaarten uit constructionFrames.ts + chunkCards.ts
 *      (handmatig gecureerde, altijd beschikbaar)
 *   2. Corpus-frames/kaarten gegenereerd door corpusGrouper uit het doorgegeven
 *      sentences-array (automatisch, afhankelijk van de geladen zinnen)
 *   3. Custom frames/kaarten opgeslagen via labFrameStore + labChunkCardStore
 *      (docent-aangemaakt, geladen bij mount)
 *
 * De corpusGrouper vervangt de oude labSentencePools-aanpak:
 *   - OUD: handmatig gecureerde SentencePool-objecten in labSentencePools.ts
 *   - NIEUW: automatisch gegenereerd uit bestaand corpus via corpusGrouper.ts
 *
 * Props:
 *   sentences — de volledige lijst beschikbare zinnen (gefilterd op level/predicateType
 *   door de parent indien gewenst). Geef [] door als nog niet geladen.
 */

import { useState, useMemo } from 'react';
import { CONSTRUCTION_FRAMES } from '../data/constructionFrames';
import { CHUNK_CARDS } from '../data/chunkCards';
import { corpusToLabData } from '../logic/corpusGrouper';
import { getCustomFrames } from '../services/labFrameStore';
import { getCustomCards } from '../services/labChunkCardStore';
import type {
  ConstructionFrame, ChunkCard, FrameSlotKey, Sentence, Token
} from '../types';
import { validateConstruction } from '../logic/constructionValidation';
import type { ConstructionCheckResult } from '../logic/constructionValidation';

export interface UseZinsbouwlabReturn {
  frames: ConstructionFrame[];
  activeFrame: ConstructionFrame | null;
  setActiveFrame: (frame: ConstructionFrame | null) => void;

  // Kaarten voor het actieve frame, per slot
  cardsForSlot: (slot: FrameSlotKey) => ChunkCard[];

  // Bouwbalk state
  placedCards: Partial<Record<FrameSlotKey, ChunkCard>>;
  orderedSlots: FrameSlotKey[];
  placeCard: (slot: FrameSlotKey, card: ChunkCard) => void;
  removeCard: (slot: FrameSlotKey) => void;
  reorderSlots: (newOrder: FrameSlotKey[]) => void;

  // Validatie
  checkResult: ConstructionCheckResult | null;
  runCheck: () => ConstructionCheckResult;

  // Zin bouwen
  buildSentence: () => Sentence | null;

  // Reset
  reset: () => void;
}

export function useZinsbouwlab(sentences: Sentence[] = []): UseZinsbouwlabReturn {
  const [activeFrame, setActiveFrameState] = useState<ConstructionFrame | null>(null);
  const [placedCards, setPlacedCards] = useState<Partial<Record<FrameSlotKey, ChunkCard>>>({});
  const [orderedSlots, setOrderedSlots] = useState<FrameSlotKey[]>([]);
  const [checkResult, setCheckResult] = useState<ConstructionCheckResult | null>(null);

  // ── Corpus-gebaseerde frames en kaarten ──────────────────────────────────
  // corpusToLabData groepeert de beschikbare zinnen op slot-signatuur en genereert
  // automatisch frames en kaarten met heuristische annotaties voor ev/mv en tt/vt.
  // Wordt opnieuw berekend als de sentences-prop verandert (bijv. na laden).
  const { frames: corpusFrames, cards: corpusCards } = useMemo(
    () => corpusToLabData(sentences),
    [sentences]
  );

  // ── Gecombineerde frames en kaarten ──────────────────────────────────────
  // Volgorde: built-in → corpus (automatisch) → custom (docent)
  // Built-in frames hebben prioriteit bij ID-conflicten (geen deduplicatie nodig
  // want ID-ranges zijn disjunct: built-in=vaste slug, corpus='corpus-*', custom='custom-*')
  const allFrames = useMemo(
    () => [...CONSTRUCTION_FRAMES, ...corpusFrames, ...getCustomFrames()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [corpusFrames]
  );
  const allCards = useMemo(
    () => [...CHUNK_CARDS, ...corpusCards, ...getCustomCards()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [corpusCards]
  );

  const frames = allFrames;

  // cardsForSlot filtert de gedeelde kaarten op rol + frameId
  const cardsForSlot = useMemo(() => (slot: FrameSlotKey): ChunkCard[] => {
    if (!activeFrame) return [];
    return allCards.filter(
      c => c.role === slot && c.frameIds.some(fid => fid === activeFrame.id)
    );
  }, [activeFrame, allCards]);

  // ── Mutaties ──────────────────────────────────────────────────────────────

  function placeCard(slot: FrameSlotKey, card: ChunkCard): void {
    setPlacedCards(prev => ({ ...prev, [slot]: card }));
    setOrderedSlots(prev => {
      if (prev.includes(slot)) return prev;
      return [...prev, slot];
    });
    setCheckResult(null);
  }

  function removeCard(slot: FrameSlotKey): void {
    setPlacedCards(prev => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
    setOrderedSlots(prev => prev.filter(s => s !== slot));
    setCheckResult(null);
  }

  function reorderSlots(newOrder: FrameSlotKey[]): void {
    setOrderedSlots(newOrder);
    setCheckResult(null);
  }

  // ── Validatie ─────────────────────────────────────────────────────────────

  function runCheck(): ConstructionCheckResult {
    if (!activeFrame) {
      const empty: ConstructionCheckResult = {
        ok: false, feedback: ['Kies eerst een frame.'],
        congruenceError: false, missingSlots: [], familyError: false, orderError: false
      };
      setCheckResult(empty);
      return empty;
    }
    const result = validateConstruction(activeFrame, placedCards, orderedSlots);
    setCheckResult(result);
    return result;
  }

  // ── Zin bouwen ────────────────────────────────────────────────────────────

  function buildSentence(): Sentence | null {
    if (!activeFrame) return null;
    const result = checkResult ?? validateConstruction(activeFrame, placedCards, orderedSlots);
    if (!result.ok) return null;

    // Bouw tokens in de volgorde van orderedSlots (= de volgorde die de leerling heeft gekozen)
    const tokens: Token[] = orderedSlots.flatMap((slot, slotIdx) => {
      const card = placedCards[slot];
      if (!card) return [];
      return card.tokens.map((t, ti) => ({
        id: `zl-${activeFrame.id}-s${slotIdx}-t${ti}`,
        text: t.text,
        role: t.role,
        subRole: t.subRole,
        // newChunk markeert het begin van een nieuw zinsdeel (voor de ontleed-trainer)
        newChunk: ti === 0 && slotIdx > 0,
      }));
    });

    return {
      id: 20000 + (Date.now() % 10000),
      label: `Zinnenlab: ${activeFrame.prompt.slice(0, 40)}`,
      tokens,
      predicateType: activeFrame.predicateType,
      level: activeFrame.level,
    };
  }

  // ── Frame selectie ────────────────────────────────────────────────────────

  function handleSetActiveFrame(frame: ConstructionFrame | null): void {
    setActiveFrameState(frame);
    setPlacedCards({});
    setOrderedSlots([]);
    setCheckResult(null);
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function reset(): void {
    setPlacedCards({});
    setOrderedSlots([]);
    setCheckResult(null);
  }

  return {
    frames,
    activeFrame,
    setActiveFrame: handleSetActiveFrame,
    cardsForSlot,
    placedCards,
    orderedSlots,
    placeCard,
    removeCard,
    reorderSlots,
    checkResult,
    runCheck,
    buildSentence,
    reset,
  };
}
