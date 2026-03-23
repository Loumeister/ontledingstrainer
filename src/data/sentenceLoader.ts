import { Sentence, DifficultyLevel } from '../types';

const cache: Partial<Record<DifficultyLevel, Sentence[]>> = {};

async function loadJson(level: DifficultyLevel): Promise<Sentence[]> {
  switch (level) {
    case 1: return (await import('./sentences-level-1.json')).default as unknown as Sentence[];
    case 2: return (await import('./sentences-level-2.json')).default as unknown as Sentence[];
    case 3: return (await import('./sentences-level-3.json')).default as unknown as Sentence[];
    case 4: return (await import('./sentences-level-4.json')).default as unknown as Sentence[];
  }
}

export async function loadSentencesByLevel(level: DifficultyLevel): Promise<Sentence[]> {
  if (cache[level]) return cache[level]!;
  const data = await loadJson(level);
  cache[level] = data;
  return data;
}

export async function loadAllSentences(): Promise<Sentence[]> {
  const levels: DifficultyLevel[] = [1, 2, 3, 4];
  const results = await Promise.all(levels.map(loadSentencesByLevel));
  return results.flat();
}

export function findSentenceInCache(id: number): Sentence | undefined {
  for (const sentences of Object.values(cache)) {
    if (!sentences) continue;
    const found = sentences.find(s => s.id === id);
    if (found) return found;
  }
  return undefined;
}

export function preloadCommonLevels(): void {
  loadSentencesByLevel(1);
  loadSentencesByLevel(2);
}
