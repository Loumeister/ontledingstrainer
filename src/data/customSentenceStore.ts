import { Sentence } from '../types';

const STORAGE_KEY = 'custom-sentences';

export function getCustomSentences(): Sentence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomSentence(sentence: Sentence): void {
  const existing = getCustomSentences();
  const idx = existing.findIndex(s => s.id === sentence.id);
  if (idx >= 0) {
    existing[idx] = sentence;
  } else {
    existing.push(sentence);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deleteCustomSentence(id: number): void {
  const existing = getCustomSentences().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function exportCustomSentences(): string {
  return JSON.stringify(getCustomSentences(), null, 2);
}

export function importCustomSentences(json: string): Sentence[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('Ongeldig formaat');
  parsed.forEach((s: Record<string, unknown>) => {
    if (!s.id || !s.label || !s.tokens || !s.predicateType || !s.level) {
      throw new Error(`Ongeldige zin: ${s.id || 'onbekend'}`);
    }
  });
  // Merge with existing rather than overwrite
  const existing = getCustomSentences();
  for (const s of parsed as Sentence[]) {
    const idx = existing.findIndex(e => e.id === s.id);
    if (idx >= 0) {
      existing[idx] = s;
    } else {
      existing.push(s);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return existing;
}

// Custom sentences use IDs in the 10000+ range to avoid collisions
export function getNextCustomId(): number {
  const existing = getCustomSentences();
  const maxId = existing.reduce((max, s) => Math.max(max, s.id), 10000);
  return maxId + 1;
}

// --- Sharing via URL ---

export function encodeForSharing(sentences: Sentence[]): string {
  try {
    // encodeURIComponent makes JSON ASCII-safe; btoa for compact URL encoding
    return btoa(encodeURIComponent(JSON.stringify(sentences)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch {
    return '';
  }
}

export function decodeShared(encoded: string): Sentence[] {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (padded.length % 4)) % 4;
    return JSON.parse(decodeURIComponent(atob(padded + '='.repeat(pad))));
  } catch {
    return [];
  }
}

export function buildShareUrl(sentences: Sentence[]): string {
  const encoded = encodeForSharing(sentences);
  return `${window.location.origin}${window.location.pathname}?zinnen=${encoded}`;
}
