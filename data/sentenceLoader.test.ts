import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Sentence } from '../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSentence(id: number, level: Sentence['level']): Sentence {
  return {
    id,
    label: `Zin ${id}`,
    predicateType: 'WG',
    level,
    tokens: [{ id: `t${id}`, text: 'slaapt', role: 'pv' }],
  };
}

const LEVEL_1_DATA: Sentence[] = [makeSentence(1, 1), makeSentence(2, 1)];
const LEVEL_2_DATA: Sentence[] = [makeSentence(3, 2)];
const LEVEL_3_DATA: Sentence[] = [makeSentence(4, 3)];
const LEVEL_4_DATA: Sentence[] = [makeSentence(5, 4)];

// ─── Mock dynamic imports ─────────────────────────────────────────────────────
// vi.mock hoists this to the top of the file so all imports from sentenceLoader
// will use the mocked versions of the JSON files.

vi.mock('./sentences-level-1.json', () => ({ default: LEVEL_1_DATA }));
vi.mock('./sentences-level-2.json', () => ({ default: LEVEL_2_DATA }));
vi.mock('./sentences-level-3.json', () => ({ default: LEVEL_3_DATA }));
vi.mock('./sentences-level-4.json', () => ({ default: LEVEL_4_DATA }));

// Import AFTER mocking so the module uses the mocked JSON files.
// We use a factory import to be able to re-import between describe blocks.
import {
  loadSentencesByLevel,
  loadAllSentences,
  findSentenceInCache,
  preloadCommonLevels,
} from './sentenceLoader';

// ─── loadSentencesByLevel ────────────────────────────────────────────────────

describe('loadSentencesByLevel', () => {
  it('loads level 1 sentences', async () => {
    const result = await loadSentencesByLevel(1);
    expect(result).toEqual(LEVEL_1_DATA);
  });

  it('loads level 2 sentences', async () => {
    const result = await loadSentencesByLevel(2);
    expect(result).toEqual(LEVEL_2_DATA);
  });

  it('loads level 3 sentences', async () => {
    const result = await loadSentencesByLevel(3);
    expect(result).toEqual(LEVEL_3_DATA);
  });

  it('loads level 4 sentences', async () => {
    const result = await loadSentencesByLevel(4);
    expect(result).toEqual(LEVEL_4_DATA);
  });

  it('returns the same reference on repeated calls (cache hit)', async () => {
    const first = await loadSentencesByLevel(1);
    const second = await loadSentencesByLevel(1);
    expect(first).toBe(second);
  });
});

// ─── loadAllSentences ────────────────────────────────────────────────────────

describe('loadAllSentences', () => {
  it('returns sentences from all four levels combined', async () => {
    const all = await loadAllSentences();
    expect(all).toEqual([
      ...LEVEL_1_DATA,
      ...LEVEL_2_DATA,
      ...LEVEL_3_DATA,
      ...LEVEL_4_DATA,
    ]);
  });

  it('returns the correct total count', async () => {
    const all = await loadAllSentences();
    const expected = LEVEL_1_DATA.length + LEVEL_2_DATA.length + LEVEL_3_DATA.length + LEVEL_4_DATA.length;
    expect(all).toHaveLength(expected);
  });

  it('does not duplicate sentences across calls', async () => {
    const first = await loadAllSentences();
    const second = await loadAllSentences();
    expect(first).toHaveLength(second.length);
  });
});

// ─── findSentenceInCache ─────────────────────────────────────────────────────

describe('findSentenceInCache', () => {
  beforeEach(async () => {
    // Warm up the cache by loading all sentences
    await loadAllSentences();
  });

  it('finds a sentence that is in the cache', () => {
    const found = findSentenceInCache(1);
    expect(found).toBeDefined();
    expect(found!.id).toBe(1);
  });

  it('returns undefined for an id that does not exist', () => {
    expect(findSentenceInCache(9999)).toBeUndefined();
  });

  it('finds sentences from every level', () => {
    [1, 3, 4, 5].forEach(id => {
      expect(findSentenceInCache(id)).toBeDefined();
    });
  });
});

// ─── preloadCommonLevels ─────────────────────────────────────────────────────

describe('preloadCommonLevels', () => {
  it('populates the cache for levels 1 and 2 without awaiting', async () => {
    preloadCommonLevels();
    // Give the microtask queue a tick to resolve the import promises
    await Promise.resolve();
    await Promise.resolve();
    expect(findSentenceInCache(1)).toBeDefined(); // level 1
    expect(findSentenceInCache(3)).toBeDefined(); // level 2
  });
});
