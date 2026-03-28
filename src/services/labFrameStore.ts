/**
 * labFrameStore — Persistentie voor aangepaste ConstructionFrames.
 *
 * Ingebouwde frames staan in src/data/constructionFrames.ts.
 * Docenten kunnen hier eigen frames aan toevoegen of bestaande dupliceren.
 * Opslag: localStorage, key 'zinsdeellab_frames_v1'
 */

import type { ConstructionFrame } from '../types';

const FRAMES_KEY = 'zinsdeellab_frames_v1';

export function getCustomFrames(): ConstructionFrame[] {
  try {
    const raw = localStorage.getItem(FRAMES_KEY);
    return raw ? (JSON.parse(raw) as ConstructionFrame[]) : [];
  } catch {
    return [];
  }
}

function saveAll(frames: ConstructionFrame[]): void {
  try {
    localStorage.setItem(FRAMES_KEY, JSON.stringify(frames));
  } catch {
    // localStorage may be unavailable
  }
}

export function saveCustomFrame(frame: ConstructionFrame): void {
  const all = getCustomFrames();
  const idx = all.findIndex(f => f.id === frame.id);
  if (idx >= 0) {
    all[idx] = frame;
  } else {
    all.push(frame);
  }
  saveAll(all);
}

export function deleteCustomFrame(id: string): void {
  saveAll(getCustomFrames().filter(f => f.id !== id));
}

/** Genereer een uniek frame-id op basis van een label-string. */
export function generateFrameId(label: string, existingIds: string[]): string {
  const base = 'custom-' + label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'frame';
  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
