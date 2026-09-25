import { describe, it, expect } from 'vitest';
import { isCorpusCurrent } from './useSentences';

describe('isCorpusCurrent', () => {
  it('is waar als de geladen set bij het gekozen niveau hoort', () => {
    expect(isCorpusCurrent(2, 2)).toBe(true);
    expect(isCorpusCurrent(null, null)).toBe(true);
  });

  it('is onwaar direct na een niveauwissel, zolang de oude set er nog staat', () => {
    expect(isCorpusCurrent(2, 1)).toBe(false);
    expect(isCorpusCurrent(null, 3)).toBe(false);
  });
});
