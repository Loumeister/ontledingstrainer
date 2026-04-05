import { describe, it, expect } from 'vitest';
import {
  buildExpectedChunks,
  buildStudentChunks,
  compareSentence,
  computeRecurringErrorStudents,
  getSentenceSols,
} from './sentenceAnalysis';
import type { Token, Sentence } from '../types';

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
// buildExpectedChunks
// ──────────────────────────────────────────────
describe('buildExpectedChunks', () => {
  it('groups consecutive tokens with the same role', () => {
    const sentence = makeSentence([
      makeToken({ id: 's1w0', text: 'De', role: 'ow' }),
      makeToken({ id: 's1w1', text: 'kat', role: 'ow' }),
      makeToken({ id: 's1w2', text: 'slaapt', role: 'pv' }),
    ]);
    const chunks = buildExpectedChunks(sentence);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].role).toBe('ow');
    expect(chunks[0].tokens.map(t => t.text)).toEqual(['De', 'kat']);
    expect(chunks[1].role).toBe('pv');
    expect(chunks[1].tokens.map(t => t.text)).toEqual(['slaapt']);
  });

  it('respects newChunk flag to split same-role tokens', () => {
    const sentence = makeSentence([
      makeToken({ id: 's1w0', text: 'Ik', role: 'ow' }),
      makeToken({ id: 's1w1', text: 'en', role: 'ow', newChunk: true }),
      makeToken({ id: 's1w2', text: 'jij', role: 'ow' }),
      makeToken({ id: 's1w3', text: 'lopen', role: 'pv' }),
    ]);
    const chunks = buildExpectedChunks(sentence);
    expect(chunks).toHaveLength(3);
    expect(chunks[0].tokens.map(t => t.text)).toEqual(['Ik']);
    expect(chunks[1].tokens.map(t => t.text)).toEqual(['en', 'jij']);
    expect(chunks[2].tokens.map(t => t.text)).toEqual(['lopen']);
  });

  it('produces one chunk for a single-token sentence', () => {
    const sentence = makeSentence([
      makeToken({ id: 's1w0', text: 'Loop!', role: 'pv' }),
    ]);
    const chunks = buildExpectedChunks(sentence);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].startIndex).toBe(0);
  });
});

// ──────────────────────────────────────────────
// buildStudentChunks
// ──────────────────────────────────────────────
describe('buildStudentChunks', () => {
  const sentence = makeSentence([
    makeToken({ id: 's1w0', text: 'De', role: 'ow' }),
    makeToken({ id: 's1w1', text: 'kat', role: 'ow' }),
    makeToken({ id: 's1w2', text: 'slaapt', role: 'pv' }),
    makeToken({ id: 's1w3', text: 'graag', role: 'bwb' }),
  ]);

  it('creates chunks from split indices', () => {
    const sol = { sp: [2], lb: { s1w0: 'ow', s1w2: 'pv' } };
    const chunks = buildStudentChunks(sentence, sol);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].tokens.map(t => t.text)).toEqual(['De', 'kat']);
    expect(chunks[0].role).toBe('ow');
    expect(chunks[1].tokens.map(t => t.text)).toEqual(['slaapt', 'graag']);
    expect(chunks[1].role).toBe('pv');
  });

  it('creates a single chunk when no splits', () => {
    const sol = { sp: [], lb: { s1w0: 'ow' } };
    const chunks = buildStudentChunks(sentence, sol);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].tokens).toHaveLength(4);
  });

  it('handles unlabeled chunks (null role)', () => {
    const sol = { sp: [2], lb: {} };
    const chunks = buildStudentChunks(sentence, sol);
    expect(chunks[0].role).toBeNull();
    expect(chunks[1].role).toBeNull();
  });
});

// ──────────────────────────────────────────────
// compareSentence
// ──────────────────────────────────────────────
describe('compareSentence', () => {
  it('returns all correct for a perfect answer', () => {
    const sentence = makeSentence([
      makeToken({ id: 's1w0', text: 'De', role: 'ow' }),
      makeToken({ id: 's1w1', text: 'kat', role: 'ow' }),
      makeToken({ id: 's1w2', text: 'slaapt', role: 'pv' }),
    ]);
    // Student split at 2 (between "kat" and "slaapt"), labeled correctly
    const sol = { sp: [2], lb: { s1w0: 'ow', s1w2: 'pv' } };
    const result = compareSentence(sentence, sol);

    expect(result.summary.splitErrors).toBe(0);
    expect(result.summary.labelErrors).toBe(0);
    expect(result.summary.correct).toBeGreaterThan(0);
    expect(result.firstDivergenceIndex).toBeNull();
  });

  it('detects a labeling error (benoeming)', () => {
    const sentence = makeSentence([
      makeToken({ id: 's1w0', text: 'De', role: 'ow' }),
      makeToken({ id: 's1w1', text: 'kat', role: 'ow' }),
      makeToken({ id: 's1w2', text: 'slaapt', role: 'pv' }),
    ]);
    // Student split correctly but labeled wrong
    const sol = { sp: [2], lb: { s1w0: 'ow', s1w2: 'lv' } };
    const result = compareSentence(sentence, sol);

    expect(result.summary.labelErrors).toBeGreaterThan(0);
    expect(result.firstDivergenceIndex).not.toBeNull();
    const firstDiv = result.tokenComparisons.find(tc => tc.isFirstDivergence);
    expect(firstDiv?.errorType).toBe('benoeming');
  });

  it('detects a split error (groepering)', () => {
    const sentence = makeSentence([
      makeToken({ id: 's1w0', text: 'De', role: 'ow' }),
      makeToken({ id: 's1w1', text: 'kat', role: 'ow' }),
      makeToken({ id: 's1w2', text: 'slaapt', role: 'pv' }),
    ]);
    // Student splits at wrong place (index 1 instead of 2)
    const sol = { sp: [1], lb: { s1w0: 'ow', s1w1: 'ow' } };
    const result = compareSentence(sentence, sol);

    expect(result.summary.splitErrors).toBeGreaterThan(0);
  });

  it('detects extra splits from student', () => {
    const sentence = makeSentence([
      makeToken({ id: 's1w0', text: 'De', role: 'ow' }),
      makeToken({ id: 's1w1', text: 'kat', role: 'ow' }),
      makeToken({ id: 's1w2', text: 'slaapt', role: 'pv' }),
    ]);
    // Student splits every word (too many chunks)
    const sol = { sp: [1, 2], lb: { s1w0: 'ow', s1w1: 'ow', s1w2: 'pv' } };
    const result = compareSentence(sentence, sol);

    // Extra split at index 1 is a groepering error
    expect(result.summary.splitErrors).toBeGreaterThan(0);
    // Total should reflect actual boundary points, not just expectedChunks.length
    expect(result.summary.total).toBeGreaterThanOrEqual(
      result.summary.splitErrors + result.summary.correct
    );
  });

  it('accepts alternativeRole as correct', () => {
    const sentence = makeSentence([
      makeToken({ id: 's1w0', text: 'Gisteren', role: 'bwb', alternativeRole: 'vv' }),
      makeToken({ id: 's1w1', text: 'liep', role: 'pv' }),
      makeToken({ id: 's1w2', text: 'ik', role: 'ow' }),
    ]);
    // Student labels first token with alternativeRole
    const sol = { sp: [1, 2], lb: { s1w0: 'vv', s1w1: 'pv', s1w2: 'ow' } };
    const result = compareSentence(sentence, sol);

    expect(result.summary.labelErrors).toBe(0);
    expect(result.summary.splitErrors).toBe(0);
  });

  it('handles missing student splits (fewer chunks than expected)', () => {
    const sentence = makeSentence([
      makeToken({ id: 's1w0', text: 'De', role: 'ow' }),
      makeToken({ id: 's1w1', text: 'kat', role: 'ow' }),
      makeToken({ id: 's1w2', text: 'slaapt', role: 'pv' }),
      makeToken({ id: 's1w3', text: 'graag', role: 'bwb' }),
    ]);
    // Student puts everything in one chunk
    const sol = { sp: [], lb: { s1w0: 'ow' } };
    const result = compareSentence(sentence, sol);

    expect(result.studentChunks).toHaveLength(1);
    expect(result.expectedChunks.length).toBeGreaterThan(1);
    // Missing splits are errors
    expect(result.summary.splitErrors + result.summary.labelErrors).toBeGreaterThan(0);
  });

  it('sets sentenceId on the result', () => {
    const sentence = makeSentence(
      [makeToken({ id: 's42w0', text: 'Hoi', role: 'pv' })],
      { id: 42 },
    );
    const result = compareSentence(sentence, { sp: [], lb: { s42w0: 'pv' } });
    expect(result.sentenceId).toBe(42);
  });
});

// ──────────────────────────────────────────────
// computeRecurringErrorStudents
// ──────────────────────────────────────────────
describe('computeRecurringErrorStudents', () => {
  it('returns empty for students with fewer sessions than threshold', () => {
    const reports = [
      { name: 'Jan', err: { pv: 2 }, ts: '2025-01-01T10:00:00Z' },
    ];
    const result = computeRecurringErrorStudents(reports);
    expect(result).toHaveLength(0);
  });

  it('detects a student with the same role error in 2+ sessions', () => {
    const reports = [
      { name: 'Jan', err: { pv: 1, ow: 1 }, ts: '2025-01-01T10:00:00Z' },
      { name: 'Jan', err: { pv: 2 }, ts: '2025-01-02T10:00:00Z' },
    ];
    const result = computeRecurringErrorStudents(reports);
    expect(result).toHaveLength(1);
    expect(result[0].studentName).toBe('jan');
    expect(result[0].recurringRoles).toContain('pv');
    // OW only appeared in 1 session, so not recurring
    expect(result[0].recurringRoles).not.toContain('ow');
  });

  it('is case-insensitive on student names', () => {
    const reports = [
      { name: 'Jan', err: { pv: 1 }, ts: '2025-01-01T10:00:00Z' },
      { name: 'jan', err: { pv: 1 }, ts: '2025-01-02T10:00:00Z' },
    ];
    const result = computeRecurringErrorStudents(reports);
    expect(result).toHaveLength(1);
  });

  it('returns empty when no role recurs across sessions', () => {
    const reports = [
      { name: 'Jan', err: { pv: 1 }, ts: '2025-01-01T10:00:00Z' },
      { name: 'Jan', err: { ow: 1 }, ts: '2025-01-02T10:00:00Z' },
    ];
    const result = computeRecurringErrorStudents(reports);
    expect(result).toHaveLength(0);
  });

  it('respects custom threshold', () => {
    const reports = [
      { name: 'Jan', err: { pv: 1 }, ts: '2025-01-01T10:00:00Z' },
      { name: 'Jan', err: { pv: 1 }, ts: '2025-01-02T10:00:00Z' },
      { name: 'Jan', err: { pv: 1 }, ts: '2025-01-03T10:00:00Z' },
    ];
    // With threshold=3: pv appears in 3 sessions
    expect(computeRecurringErrorStudents(reports, 3)).toHaveLength(1);
    // With threshold=4: not enough
    expect(computeRecurringErrorStudents(reports, 4)).toHaveLength(0);
  });

  it('handles multiple students independently', () => {
    const reports = [
      { name: 'Jan', err: { pv: 1 }, ts: '2025-01-01T10:00:00Z' },
      { name: 'Jan', err: { pv: 1 }, ts: '2025-01-02T10:00:00Z' },
      { name: 'Piet', err: { lv: 1 }, ts: '2025-01-01T10:00:00Z' },
      { name: 'Piet', err: { lv: 1 }, ts: '2025-01-02T10:00:00Z' },
      { name: 'Klaas', err: { bwb: 1 }, ts: '2025-01-01T10:00:00Z' },
    ];
    const result = computeRecurringErrorStudents(reports);
    expect(result).toHaveLength(2);
    const names = result.map(r => r.studentName).sort();
    expect(names).toEqual(['jan', 'piet']);
  });
});

// ──────────────────────────────────────────────
// getSentenceSols
// ──────────────────────────────────────────────
describe('getSentenceSols', () => {
  const sol1 = { sid: 10, sp: [1], lb: { s10w0: 'ow' } };
  const sol2 = { sid: 10, sp: [2], lb: { s10w0: 'pv' } };
  const sol3 = { sid: 99, sp: [], lb: {} };

  it('returns [] for empty reports array', () => {
    expect(getSentenceSols(10, [])).toEqual([]);
  });

  it('returns [] when no report has a sols field', () => {
    const reports = [{ name: 'Jan', ts: '2025-01-01T10:00:00Z' }];
    expect(getSentenceSols(10, reports)).toEqual([]);
  });

  it('returns [] when sols exist but none match the target sentence id', () => {
    const reports = [{ name: 'Jan', ts: '2025-01-01T10:00:00Z', sols: [sol3] }];
    expect(getSentenceSols(10, reports)).toEqual([]);
  });

  it('returns entry with matching sol', () => {
    const reports = [{ name: 'Jan', ts: '2025-01-01T10:00:00Z', sols: [sol1] }];
    const result = getSentenceSols(10, reports);
    expect(result).toHaveLength(1);
    expect(result[0].sol).toEqual({ sp: [1], lb: { s10w0: 'ow' } });
    expect(result[0].timestamp).toBe('2025-01-01T10:00:00Z');
  });

  it('formats studentName as name + initiaal when initiaal is present', () => {
    const reports = [{ name: 'Jan', initiaal: 'D', ts: '2025-01-01T10:00:00Z', sols: [sol1] }];
    const result = getSentenceSols(10, reports);
    expect(result[0].studentName).toBe('Jan D.');
  });

  it('formats studentName as just name when initiaal is absent', () => {
    const reports = [{ name: 'Maria', ts: '2025-01-01T10:00:00Z', sols: [sol1] }];
    const result = getSentenceSols(10, reports);
    expect(result[0].studentName).toBe('Maria');
  });

  it('includes klas when present', () => {
    const reports = [{ name: 'Jan', klas: '2A', ts: '2025-01-01T10:00:00Z', sols: [sol1] }];
    const result = getSentenceSols(10, reports);
    expect(result[0].klas).toBe('2A');
  });

  it('klas is undefined when absent', () => {
    const reports = [{ name: 'Jan', ts: '2025-01-01T10:00:00Z', sols: [sol1] }];
    const result = getSentenceSols(10, reports);
    expect(result[0].klas).toBeUndefined();
  });

  it('returns only the matching report when multiple reports exist', () => {
    const reports = [
      { name: 'Jan', ts: '2025-01-01T10:00:00Z', sols: [sol3] },       // no match
      { name: 'Piet', ts: '2025-01-02T10:00:00Z', sols: [sol1] },      // match
    ];
    const result = getSentenceSols(10, reports);
    expect(result).toHaveLength(1);
    expect(result[0].studentName).toBe('Piet');
  });

  it('returns all matching reports when multiple have sols for target', () => {
    const reports = [
      { name: 'Jan', ts: '2025-01-01T10:00:00Z', sols: [sol1] },
      { name: 'Piet', ts: '2025-01-02T10:00:00Z', sols: [sol2] },
    ];
    const result = getSentenceSols(10, reports);
    expect(result).toHaveLength(2);
  });

  it('sorts results most-recent-first by timestamp', () => {
    const reports = [
      { name: 'Jan', ts: '2025-01-01T10:00:00Z', sols: [sol1] },
      { name: 'Piet', ts: '2025-01-03T10:00:00Z', sols: [sol2] },
      { name: 'Maria', ts: '2025-01-02T10:00:00Z', sols: [sol1] },
    ];
    const result = getSentenceSols(10, reports);
    expect(result.map(r => r.studentName)).toEqual(['Piet', 'Maria', 'Jan']);
  });
});
