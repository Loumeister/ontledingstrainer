/**
 * labChunkCardStore — Persistentie voor aangepaste ChunkCards.
 *
 * Ingebouwde kaarten staan in src/data/chunkCards.ts.
 * Docenten kunnen hier eigen kaarten toevoegen per zinsdeel-rol.
 * Opslag: localStorage, key 'zinsdeellab_cards_v1'
 */

import type { ChunkCard } from '../types';

const CARDS_KEY = 'zinsdeellab_cards_v1';

export function getCustomCards(): ChunkCard[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    return raw ? (JSON.parse(raw) as ChunkCard[]) : [];
  } catch {
    return [];
  }
}

function saveAll(cards: ChunkCard[]): void {
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch {
    // localStorage may be unavailable
  }
}

export function saveCustomCard(card: ChunkCard): void {
  const all = getCustomCards();
  const idx = all.findIndex(c => c.id === card.id);
  if (idx >= 0) {
    all[idx] = card;
  } else {
    all.push(card);
  }
  saveAll(all);
}

export function deleteCustomCard(id: string): void {
  saveAll(getCustomCards().filter(c => c.id !== id));
}

/** Genereer een uniek kaart-id. */
export function generateCardId(role: string, familyId: string, existingIds: string[]): string {
  const base = `cc-custom-${role}-${familyId.slice(0, 12).replace(/[^a-z0-9]/g, '')}`;
  if (!existingIds.includes(`${base}-01`)) return `${base}-01`;
  let n = 2;
  while (existingIds.includes(`${base}-${String(n).padStart(2, '0')}`)) n++;
  return `${base}-${String(n).padStart(2, '0')}`;
}
