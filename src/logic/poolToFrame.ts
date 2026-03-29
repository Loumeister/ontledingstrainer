import type { ConstructionFrame, ChunkCard } from '../types';
import type { SentencePool } from '../data/labSentencePools';
import { v2WordOrders } from './v2WordOrders';

/**
 * Converteert een SentencePool naar een ConstructionFrame.
 * De pool is zijn eigen family; wordOrders worden automatisch gegenereerd
 * via de V2-regel (PV altijd op positie 2).
 */
export function poolToFrame(pool: SentencePool): ConstructionFrame {
  return {
    id: pool.id,
    label: pool.label,
    level: pool.level,
    predicateType: pool.predicateType,
    slots: pool.slots,
    families: [pool.id],
    wordOrders: v2WordOrders(pool.slots),
    prompt: pool.prompt,
  };
}

/**
 * Converteert een SentencePool naar een lijst ChunkCards.
 * Elke entry in de pool levert één kaart per slot.
 * De kaarten erven number, verbTense en timeRef van de entry-annotaties.
 */
export function poolToCards(pool: SentencePool): ChunkCard[] {
  return pool.entries.flatMap((entry, entryIdx) =>
    entry.chunks.map(chunk => ({
      id: `${pool.id}-e${entryIdx}-${chunk.slot}`,
      role: chunk.slot,
      familyId: pool.id,
      frameIds: [pool.id],
      tokens: chunk.tokens,
      number: chunk.number,
      verbTense: chunk.verbTense,
      timeRef: chunk.timeRef,
    }))
  );
}
