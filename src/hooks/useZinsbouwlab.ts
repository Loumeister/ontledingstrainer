import { useState, useMemo } from 'react';
import { CONSTRUCTION_FRAMES } from '../data/constructionFrames';
import { CHUNK_CARDS } from '../data/chunkCards';
import { SENTENCE_POOLS } from '../data/labSentencePools';
import { poolToFrame, poolToCards } from '../logic/poolToFrame';
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

export function useZinsbouwlab(): UseZinsbouwlabReturn {
  const [activeFrame, setActiveFrameState] = useState<ConstructionFrame | null>(null);
  const [placedCards, setPlacedCards] = useState<Partial<Record<FrameSlotKey, ChunkCard>>>({});
  const [orderedSlots, setOrderedSlots] = useState<FrameSlotKey[]>([]);
  const [checkResult, setCheckResult] = useState<ConstructionCheckResult | null>(null);

  // Pool-derived frames and cards (generated once from SENTENCE_POOLS)
  const poolFrames = useMemo(() => SENTENCE_POOLS.map(poolToFrame), []);
  const poolCards = useMemo(() => SENTENCE_POOLS.flatMap(poolToCards), []);

  // Merge built-in + pool + custom (loaded once at mount)
  const allFrames = useMemo(
    () => [...CONSTRUCTION_FRAMES, ...poolFrames, ...getCustomFrames()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poolFrames]
  );
  const allCards = useMemo(
    () => [...CHUNK_CARDS, ...poolCards, ...getCustomCards()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poolCards]
  );

  const frames = allFrames;

  const cardsForSlot = useMemo(() => (slot: FrameSlotKey): ChunkCard[] => {
    if (!activeFrame) return [];
    return allCards.filter(
      c => c.role === slot && c.frameIds.some(fid => fid === activeFrame.id)
    );
  }, [activeFrame, allCards]);

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

  function buildSentence(): Sentence | null {
    if (!activeFrame) return null;
    const result = checkResult ?? validateConstruction(activeFrame, placedCards, orderedSlots);
    if (!result.ok) return null;

    const tokens: Token[] = orderedSlots.flatMap((slot, slotIdx) => {
      const card = placedCards[slot];
      if (!card) return [];
      return card.tokens.map((t, ti) => ({
        id: `zl-${activeFrame.id}-s${slotIdx}-t${ti}`,
        text: t.text,
        role: t.role,
        subRole: t.subRole,
        newChunk: ti === 0 && slotIdx > 0,
      }));
    });

    return {
      id: 20000 + (Date.now() % 10000),
      label: `Zinsdeellab: ${activeFrame.prompt.slice(0, 40)}`,
      tokens,
      predicateType: activeFrame.predicateType,
      level: activeFrame.level,
    };
  }

  function handleSetActiveFrame(frame: ConstructionFrame | null): void {
    setActiveFrameState(frame);
    setPlacedCards({});
    setOrderedSlots([]);
    setCheckResult(null);
  }

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
