import { describe, it, expect } from 'vitest';
import {
  buildUserChunks,
  countRealChunks,
  computeCorrectSplits,
  roleMatchesToken,
  getConsistentRole,
  validateAnswer,
} from './validation';
import type { Token, Sentence, PlacementMap } from './types';

// --- Helper factories ---

function makeToken(overrides: Partial<Token> & { id: string; text: string; role: Token['role'] }): Token {
  return { ...overrides };
}

function makeSentence(tokens: Token[], overrides?: Partial<Sentence>): Sentence {
  return {
    id: overrides?.id ?? 1,
    label: overrides?.label ?? 'Test zin',
    predicateType: overrides?.predicateType ?? 'WG',
    level: overrides?.level ?? 1,
    tokens,
  };
}

// ──────────────────────────────────────────────
// buildUserChunks
// ──────────────────────────────────────────────
describe('buildUserChunks', () => {
  it('creates a single chunk when no splits are placed', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
    ];
    const chunks = buildUserChunks(tokens, new Set());
    expect(chunks).toHaveLength(1);
    expect(chunks[0].tokens).toHaveLength(3);
    expect(chunks[0].originalIndices).toEqual([0, 1, 2]);
  });

  it('splits tokens at specified indices', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
    ];
    const chunks = buildUserChunks(tokens, new Set([1]));
    expect(chunks).toHaveLength(2);
    expect(chunks[0].tokens.map(t => t.text)).toEqual(['De', 'kat']);
    expect(chunks[1].tokens.map(t => t.text)).toEqual(['slaapt']);
  });

  it('handles multiple split indices', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
      makeToken({ id: 't4', text: 'rustig', role: 'bwb' }),
    ];
    const chunks = buildUserChunks(tokens, new Set([1, 2]));
    expect(chunks).toHaveLength(3);
    expect(chunks[0].tokens.map(t => t.text)).toEqual(['De', 'kat']);
    expect(chunks[1].tokens.map(t => t.text)).toEqual(['slaapt']);
    expect(chunks[2].tokens.map(t => t.text)).toEqual(['rustig']);
  });

  it('returns empty array for empty tokens', () => {
    expect(buildUserChunks([], new Set())).toEqual([]);
  });
});

// ──────────────────────────────────────────────
// countRealChunks
// ──────────────────────────────────────────────
describe('countRealChunks', () => {
  it('counts chunks with consecutive same roles as one', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
    ];
    expect(countRealChunks(tokens)).toBe(2);
  });

  it('counts newChunk boundaries as separate chunks', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: "'s ochtends", role: 'bwb' }),
      makeToken({ id: 't2', text: 'rustig', role: 'bwb', newChunk: true }),
    ];
    expect(countRealChunks(tokens)).toBe(2);
  });

  it('handles single-token sentence', () => {
    const tokens: Token[] = [makeToken({ id: 't1', text: 'Stop', role: 'pv' })];
    expect(countRealChunks(tokens)).toBe(1);
  });

  it('counts each role change as a new chunk', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
      makeToken({ id: 't4', text: 'lekker', role: 'bwb' }),
      makeToken({ id: 't5', text: 'op', role: 'bwb' }),
      makeToken({ id: 't6', text: 'de', role: 'bwb' }),
      makeToken({ id: 't7', text: 'bank', role: 'bwb' }),
    ];
    expect(countRealChunks(tokens)).toBe(3);
  });
});

// ──────────────────────────────────────────────
// computeCorrectSplits
// ──────────────────────────────────────────────
describe('computeCorrectSplits', () => {
  it('places splits between different roles', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
    ];
    const splits = computeCorrectSplits(tokens);
    expect(splits).toEqual(new Set([1]));
  });

  it('places splits at newChunk boundaries', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: "'s ochtends", role: 'bwb' }),
      makeToken({ id: 't2', text: 'rustig', role: 'bwb', newChunk: true }),
      makeToken({ id: 't3', text: 'de', role: 'lv' }),
    ];
    const splits = computeCorrectSplits(tokens);
    expect(splits).toEqual(new Set([0, 1]));
  });

  it('returns empty set for single-token sentence', () => {
    const tokens: Token[] = [makeToken({ id: 't1', text: 'Stop', role: 'pv' })];
    expect(computeCorrectSplits(tokens)).toEqual(new Set());
  });
});

// ──────────────────────────────────────────────
// roleMatchesToken
// ──────────────────────────────────────────────
describe('roleMatchesToken', () => {
  it('matches primary role', () => {
    const token = makeToken({ id: 't1', text: 'op', role: 'bwb' });
    expect(roleMatchesToken('bwb', token)).toBe(true);
  });

  it('does not match a wrong role', () => {
    const token = makeToken({ id: 't1', text: 'op', role: 'bwb' });
    expect(roleMatchesToken('lv', token)).toBe(false);
  });

  it('matches alternativeRole', () => {
    const token = makeToken({ id: 't1', text: 'op', role: 'bwb', alternativeRole: 'vv' });
    expect(roleMatchesToken('vv', token)).toBe(true);
  });

  it('still matches primary when alternativeRole exists', () => {
    const token = makeToken({ id: 't1', text: 'op', role: 'bwb', alternativeRole: 'vv' });
    expect(roleMatchesToken('bwb', token)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// getConsistentRole
// ──────────────────────────────────────────────
describe('getConsistentRole', () => {
  it('returns null for empty array', () => {
    expect(getConsistentRole([])).toBeNull();
  });

  it('returns the role when all tokens have the same primary role', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
    ];
    expect(getConsistentRole(tokens)).toBe('ow');
  });

  it('returns null when tokens have different, incompatible roles', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'slaapt', role: 'pv' }),
    ];
    expect(getConsistentRole(tokens)).toBeNull();
  });

  it('returns shared alternativeRole when primary roles differ but all share an alternative', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'naar', role: 'bwb', alternativeRole: 'vv' }),
      makeToken({ id: 't2', text: 'school', role: 'bwb', alternativeRole: 'vv' }),
    ];
    // Primary roles are the same, so it should return 'bwb' first
    expect(getConsistentRole(tokens)).toBe('bwb');
  });

  it('resolves when primary roles differ but are bridged by alternativeRole', () => {
    const tokens: Token[] = [
      makeToken({ id: 't1', text: 'op', role: 'bwb', alternativeRole: 'vv' }),
      makeToken({ id: 't2', text: 'het', role: 'vv' }),
    ];
    // t1 allows bwb and vv; t2 allows vv
    // tokens[0].alternativeRole is 'vv', tokens[1].role is 'vv' => match on 'vv'
    const result = getConsistentRole(tokens);
    expect(result).not.toBeNull();
  });
});

// ──────────────────────────────────────────────
// validateAnswer – Split validation
// ──────────────────────────────────────────────
describe('validateAnswer – split checking', () => {
  const simpleSentence = makeSentence([
    makeToken({ id: 't1', text: 'De', role: 'ow' }),
    makeToken({ id: 't2', text: 'kat', role: 'ow' }),
    makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
  ]);

  it('marks correct splits as correct', () => {
    const splits = new Set([1]); // After 'kat'
    const labels: PlacementMap = { t1: 'ow', t3: 'pv' };
    const { result } = validateAnswer(simpleSentence, splits, labels, {}, false);
    expect(result.chunkStatus[0]).toBe('correct');
    expect(result.chunkStatus[1]).toBe('correct');
    expect(result.isPerfect).toBe(true);
  });

  it('detects split too early (incomplete chunk)', () => {
    const splits = new Set([0]); // After 'De' only — splits OW too early
    const labels: PlacementMap = { t1: 'ow', t2: 'ow' }; // both get ow
    const { result } = validateAnswer(simpleSentence, splits, labels, {}, false);
    // The first chunk [De] has nextToken 'kat' with same role → splitTooEarly
    expect(result.chunkStatus[0]).toBe('incorrect-split');
  });

  it('detects inconsistent roles within a chunk', () => {
    // No splits at all: [De kat slaapt] has ow,ow,pv → inconsistent
    const labels: PlacementMap = { t1: 'ow' };
    const { result } = validateAnswer(simpleSentence, new Set(), labels, {}, false);
    expect(result.chunkStatus[0]).toBe('incorrect-split');
  });

  it('detects missed newChunk split', () => {
    const sentence = makeSentence([
      makeToken({ id: 't1', text: "'s ochtends", role: 'bwb' }),
      makeToken({ id: 't2', text: 'rustig', role: 'bwb', newChunk: true }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
    ]);
    // User puts no split between t1 and t2
    const splits = new Set([1]); // After rustig
    const labels: PlacementMap = { t1: 'bwb', t3: 'pv' };
    const { result } = validateAnswer(sentence, splits, labels, {}, false);
    // The chunk [ochtends, rustig] has newChunk on t2 → missedInternalSplit
    expect(result.chunkStatus[0]).toBe('incorrect-split');
  });
});

// ──────────────────────────────────────────────
// validateAnswer – Label validation
// ──────────────────────────────────────────────
describe('validateAnswer – label checking', () => {
  const sentence = makeSentence([
    makeToken({ id: 't1', text: 'De', role: 'ow' }),
    makeToken({ id: 't2', text: 'kat', role: 'ow' }),
    makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
    makeToken({ id: 't4', text: 'lekker', role: 'bwb' }),
  ]);
  const correctSplits = new Set([1, 2]);

  it('marks correct labels as correct', () => {
    const labels: PlacementMap = { t1: 'ow', t3: 'pv', t4: 'bwb' };
    const { result } = validateAnswer(sentence, correctSplits, labels, {}, false);
    expect(result.score).toBe(3);
    expect(result.isPerfect).toBe(true);
  });

  it('marks wrong labels as incorrect-role', () => {
    const labels: PlacementMap = { t1: 'lv', t3: 'pv', t4: 'bwb' }; // ow → lv is wrong
    const { result } = validateAnswer(sentence, correctSplits, labels, {}, false);
    expect(result.chunkStatus[0]).toBe('incorrect-role');
    expect(result.score).toBe(2);
    expect(result.isPerfect).toBe(false);
  });

  it('gives warning for PV labeled as WG', () => {
    const labels: PlacementMap = { t1: 'ow', t3: 'wg', t4: 'bwb' }; // PV → WG
    const { result } = validateAnswer(sentence, correctSplits, labels, {}, false);
    expect(result.chunkStatus[1]).toBe('warning');
  });

  it('tracks role mistakes', () => {
    const labels: PlacementMap = { t1: 'lv', t3: 'ow', t4: 'bwb' };
    const { mistakes } = validateAnswer(sentence, correctSplits, labels, {}, false);
    expect(mistakes['Onderwerp']).toBe(1);
    expect(mistakes['Persoonsvorm']).toBe(1);
  });
});

// ──────────────────────────────────────────────
// validateAnswer – SubRole validation
// ──────────────────────────────────────────────
describe('validateAnswer – subRole checking', () => {
  const sentence = makeSentence([
    makeToken({ id: 't1', text: 'De', role: 'ow' }),
    makeToken({ id: 't2', text: 'nieuwe', role: 'ow', subRole: 'bijv_bep' }),
    makeToken({ id: 't3', text: 'kat', role: 'ow' }),
    makeToken({ id: 't4', text: 'slaapt', role: 'pv' }),
  ]);
  const splits = new Set([2]);

  it('is perfect when subRoles match and includeBB is true', () => {
    const labels: PlacementMap = { t1: 'ow', t4: 'pv' };
    const subLabels: PlacementMap = { t2: 'bijv_bep' };
    const { result } = validateAnswer(sentence, splits, labels, subLabels, true);
    expect(result.isPerfect).toBe(true);
  });

  it('is not perfect when subRole is missing and includeBB is true', () => {
    const labels: PlacementMap = { t1: 'ow', t4: 'pv' };
    const { result } = validateAnswer(sentence, splits, labels, {}, true);
    expect(result.isPerfect).toBe(false);
  });

  it('ignores bijv_bep subRole when includeBB is false', () => {
    const labels: PlacementMap = { t1: 'ow', t4: 'pv' };
    const { result } = validateAnswer(sentence, splits, labels, {}, false);
    expect(result.isPerfect).toBe(true);
  });
});

// ──────────────────────────────────────────────
// validateAnswer – Ambiguous sentences (alternativeRole)
// ──────────────────────────────────────────────
describe('validateAnswer – ambiguous sentences', () => {
  it('accepts alternativeRole as correct label', () => {
    const sentence = makeSentence([
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'wacht', role: 'pv' }),
      makeToken({ id: 't4', text: 'op', role: 'bwb', alternativeRole: 'vv' }),
      makeToken({ id: 't5', text: 'eten', role: 'bwb', alternativeRole: 'vv' }),
    ]);
    const splits = new Set([1, 2]);
    // User labels the last chunk as VV (the alternative)
    const labels: PlacementMap = { t1: 'ow', t3: 'pv', t4: 'vv' };
    const { result } = validateAnswer(sentence, splits, labels, {}, false);
    expect(result.chunkStatus[2]).toBe('correct');
    expect(result.score).toBe(3);
    expect(result.isPerfect).toBe(true);
  });

  it('still accepts primary role on ambiguous tokens', () => {
    const sentence = makeSentence([
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'wacht', role: 'pv' }),
      makeToken({ id: 't4', text: 'op', role: 'bwb', alternativeRole: 'vv' }),
      makeToken({ id: 't5', text: 'eten', role: 'bwb', alternativeRole: 'vv' }),
    ]);
    const splits = new Set([1, 2]);
    // User labels the last chunk with primary role (BWB)
    const labels: PlacementMap = { t1: 'ow', t3: 'pv', t4: 'bwb' };
    const { result } = validateAnswer(sentence, splits, labels, {}, false);
    expect(result.chunkStatus[2]).toBe('correct');
    expect(result.isPerfect).toBe(true);
  });

  it('rejects wrong role even when alternativeRole exists', () => {
    const sentence = makeSentence([
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'wacht', role: 'pv' }),
      makeToken({ id: 't4', text: 'op', role: 'bwb', alternativeRole: 'vv' }),
      makeToken({ id: 't5', text: 'eten', role: 'bwb', alternativeRole: 'vv' }),
    ]);
    const splits = new Set([1, 2]);
    // User labels the last chunk as LV (neither primary nor alternative)
    const labels: PlacementMap = { t1: 'ow', t3: 'pv', t4: 'lv' };
    const { result } = validateAnswer(sentence, splits, labels, {}, false);
    expect(result.chunkStatus[2]).toBe('incorrect-role');
  });

  it('handles a full ambiguous sentence correctly', () => {
    // "De jongen kijkt naar het schilderij" - "naar het schilderij" can be BWB or VV
    const sentence = makeSentence([
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'jongen', role: 'ow' }),
      makeToken({ id: 't3', text: 'kijkt', role: 'pv' }),
      makeToken({ id: 't4', text: 'naar', role: 'vv', alternativeRole: 'bwb' }),
      makeToken({ id: 't5', text: 'het', role: 'vv', alternativeRole: 'bwb' }),
      makeToken({ id: 't6', text: 'schilderij', role: 'vv', alternativeRole: 'bwb' }),
    ]);
    const splits = new Set([1, 2]);

    // Accept primary (VV)
    const labels1: PlacementMap = { t1: 'ow', t3: 'pv', t4: 'vv' };
    const { result: r1 } = validateAnswer(sentence, splits, labels1, {}, false);
    expect(r1.isPerfect).toBe(true);

    // Accept alternative (BWB)
    const labels2: PlacementMap = { t1: 'ow', t3: 'pv', t4: 'bwb' };
    const { result: r2 } = validateAnswer(sentence, splits, labels2, {}, false);
    expect(r2.isPerfect).toBe(true);
  });
});

// ──────────────────────────────────────────────
// validateAnswer – Perfect score calculation
// ──────────────────────────────────────────────
describe('validateAnswer – perfect score', () => {
  it('is not perfect if fewer chunks than real', () => {
    const sentence = makeSentence([
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
      makeToken({ id: 't4', text: 'lekker', role: 'bwb' }),
    ]);
    // Only split after kat, not after slaapt → 2 user chunks but 3 real
    const splits = new Set([1]);
    const labels: PlacementMap = { t1: 'ow' }; // can only label first chunk correctly
    const { result } = validateAnswer(sentence, splits, labels, {}, false);
    expect(result.isPerfect).toBe(false);
  });

  it('is not perfect if there are too many chunks', () => {
    const sentence = makeSentence([
      makeToken({ id: 't1', text: 'De', role: 'ow' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
    ]);
    // Split after every token → 3 chunks instead of 2
    const splits = new Set([0, 1]);
    const labels: PlacementMap = { t1: 'ow', t2: 'ow', t3: 'pv' };
    const { result } = validateAnswer(sentence, splits, labels, {}, false);
    expect(result.isPerfect).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Sentence data integrity (loading)
// ──────────────────────────────────────────────
describe('sentence data integrity', () => {
  // We'll test the JSON data files directly
  it('level 1 sentences have valid structure', async () => {
    const data = (await import('./data/sentences-level-1.json')).default as unknown as Sentence[];
    expect(data.length).toBeGreaterThan(0);
    for (const s of data) {
      expect(s.id).toBeTypeOf('number');
      expect(s.label).toBeTypeOf('string');
      expect(s.tokens.length).toBeGreaterThan(0);
      expect(['WG', 'NG']).toContain(s.predicateType);
      expect(s.level).toBe(1);
      for (const t of s.tokens) {
        expect(t.id).toBeTypeOf('string');
        expect(t.text).toBeTypeOf('string');
        expect(t.text.length).toBeGreaterThan(0);
        expect(t.role).toBeTypeOf('string');
      }
    }
  });

  it('all sentence IDs are unique across all levels', async () => {
    const level1 = (await import('./data/sentences-level-1.json')).default as unknown as Sentence[];
    const level2 = (await import('./data/sentences-level-2.json')).default as unknown as Sentence[];
    const level3 = (await import('./data/sentences-level-3.json')).default as unknown as Sentence[];
    const level4 = (await import('./data/sentences-level-4.json')).default as unknown as Sentence[];
    const allIds = [...level1, ...level2, ...level3, ...level4].map(s => s.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('all token IDs are unique within each sentence', async () => {
    const level1 = (await import('./data/sentences-level-1.json')).default as unknown as Sentence[];
    const level2 = (await import('./data/sentences-level-2.json')).default as unknown as Sentence[];
    const level3 = (await import('./data/sentences-level-3.json')).default as unknown as Sentence[];
    const level4 = (await import('./data/sentences-level-4.json')).default as unknown as Sentence[];
    for (const s of [...level1, ...level2, ...level3, ...level4]) {
      const tokenIds = s.tokens.map(t => t.id);
      const uniqueTokenIds = new Set(tokenIds);
      expect(uniqueTokenIds.size).toBe(tokenIds.length);
    }
  });

  it('every sentence has at least one PV token', async () => {
    const level1 = (await import('./data/sentences-level-1.json')).default as unknown as Sentence[];
    const level2 = (await import('./data/sentences-level-2.json')).default as unknown as Sentence[];
    const level3 = (await import('./data/sentences-level-3.json')).default as unknown as Sentence[];
    const level4 = (await import('./data/sentences-level-4.json')).default as unknown as Sentence[];
    for (const s of [...level1, ...level2, ...level3, ...level4]) {
      const hasPv = s.tokens.some(t => t.role === 'pv');
      expect(hasPv).toBe(true);
    }
  });
});

// ──────────────────────────────────────────────
// validateAnswer – Sub-label promotion (role on word instead of chunk)
// ──────────────────────────────────────────────
describe('validateAnswer – sub-label promotion', () => {
  const sentence = makeSentence([
    makeToken({ id: 't1', text: 'De', role: 'ow' }),
    makeToken({ id: 't2', text: 'kat', role: 'ow' }),
    makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
  ]);
  const correctSplits = new Set([1]);

  it('accepts sub-label on word as chunk label when chunk has no main label (single role)', () => {
    // Student dropped 'pv' on the word 'slaapt' instead of the chunk header
    const chunkLabels: PlacementMap = { t1: 'ow' }; // no label for t3 chunk
    const subLabels: PlacementMap = { t3: 'pv' }; // sub-label on the word
    const { result } = validateAnswer(sentence, correctSplits, chunkLabels, subLabels, false);
    expect(result.chunkStatus[1]).toBe('correct');
  });

  it('does not accept wrong sub-label as chunk label', () => {
    const chunkLabels: PlacementMap = { t1: 'ow' };
    const subLabels: PlacementMap = { t3: 'lv' }; // wrong role on word
    const { result } = validateAnswer(sentence, correctSplits, chunkLabels, subLabels, false);
    expect(result.chunkStatus[1]).not.toBe('correct');
  });

  it('does not promote sub-label when token has a different expected subRole (dual role)', () => {
    const dualRoleSentence = makeSentence([
      makeToken({ id: 't1', text: 'De', role: 'ow', subRole: 'bijv_bep' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
    ]);
    const splits = new Set([1]);
    // Student dropped 'ow' on word t1 instead of chunk header
    const chunkLabels: PlacementMap = {}; // no chunk label for t1 chunk
    const subLabels: PlacementMap = { t1: 'ow' };
    const { result } = validateAnswer(dualRoleSentence, splits, chunkLabels, subLabels, true);
    // Should NOT be promoted because t1 has subRole 'bijv_bep' (dual role)
    expect(result.chunkStatus[0]).not.toBe('correct');
  });

  it('ignores dual-role check for bijv_bep subRole when includeBB is false', () => {
    const dualRoleSentence = makeSentence([
      makeToken({ id: 't1', text: 'De', role: 'ow', subRole: 'bijv_bep' }),
      makeToken({ id: 't2', text: 'kat', role: 'ow' }),
      makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
    ]);
    const splits = new Set([1]);
    const chunkLabels: PlacementMap = { t3: 'pv' }; // no chunk label for t1 chunk
    const subLabels: PlacementMap = { t1: 'ow' };
    // When includeBB is false, bijv_bep subRole is ignored, so it's single role
    const { result } = validateAnswer(dualRoleSentence, splits, chunkLabels, subLabels, false);
    expect(result.chunkStatus[0]).toBe('correct');
  });
});

// ──────────────────────────────────────────────
// validateAnswer – Constructive feedback for unlabeled chunks
// ──────────────────────────────────────────────
describe('validateAnswer – constructive feedback', () => {
  const sentence = makeSentence([
    makeToken({ id: 't1', text: 'De', role: 'ow' }),
    makeToken({ id: 't2', text: 'kat', role: 'ow' }),
    makeToken({ id: 't3', text: 'slaapt', role: 'pv' }),
  ]);
  const correctSplits = new Set([1]);

  it('gives constructive feedback when chunk has no label at all', () => {
    const chunkLabels: PlacementMap = { t1: 'ow' }; // no label for t3 chunk
    const { result } = validateAnswer(sentence, correctSplits, chunkLabels, {}, false);
    expect(result.chunkStatus[1]).toBe('incorrect-role');
    // Should NOT contain "Gekozen"
    expect(result.chunkFeedback[1]).not.toContain('Gekozen');
    // Should be constructive
    expect(result.chunkFeedback[1]).toContain('benoemen');
  });

  it('gives constructive feedback for wrong label without "Gekozen" fallback', () => {
    const chunkLabels: PlacementMap = { t1: 'lv', t3: 'pv' }; // wrong: ow → lv
    const { result } = validateAnswer(sentence, correctSplits, chunkLabels, {}, false);
    expect(result.chunkStatus[0]).toBe('incorrect-role');
    // Should NOT contain the old "Dit is niet X, maar het Y" pattern
    expect(result.chunkFeedback[0]).not.toContain('Gekozen');
  });
});
