import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computeRoleConfidences,
  selectAdaptiveQueue,
  computeSentenceScore,
  saveRoleConfidences,
  loadRoleConfidences,
  RoleConfidence,
} from './adaptiveSelection';
import type { Sentence, RoleKey, SentenceUsageData } from '../types';

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  length: 0,
  key: vi.fn(() => null),
};
vi.stubGlobal('localStorage', localStorageMock);

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
vi.mock('../services/sessionHistory', () => ({
  loadSessionHistory: vi.fn(() => []),
}));

vi.mock('../services/usageData', () => ({
  loadUsageData: vi.fn(() => ({})),
}));

// Access the mocks
import { loadSessionHistory } from '../services/sessionHistory';
import { loadUsageData } from '../services/usageData';

const mockLoadSessionHistory = loadSessionHistory as ReturnType<typeof vi.fn>;
const mockLoadUsageData = loadUsageData as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSentence(id: number, roles: RoleKey[], level: 1 | 2 | 3 | 4 = 1): Sentence {
  return {
    id,
    label: `Zin ${id}`,
    predicateType: 'WG',
    level,
    tokens: roles.map((role, i) => ({
      id: `s${id}w${i}`,
      text: `woord${i}`,
      role,
    })),
  };
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
  mockLoadSessionHistory.mockReturnValue([]);
  mockLoadUsageData.mockReturnValue({});
});

// ---------------------------------------------------------------------------
// computeRoleConfidences
// ---------------------------------------------------------------------------

describe('computeRoleConfidences', () => {
  it('returns neutral confidence (0.5) when there is no history', () => {
    const confidences = computeRoleConfidences();
    const pvConf = confidences.get('pv');
    expect(pvConf).toBeDefined();
    expect(pvConf!.confidence).toBe(0.5);
    expect(pvConf!.totalEncounters).toBe(0);
  });

  it('returns high confidence for roles without errors', () => {
    mockLoadSessionHistory.mockReturnValue([
      { date: '2025-01-01', scorePercentage: 100, correct: 5, total: 5, mistakeStats: {}, sentenceCount: 5 },
      { date: '2025-01-02', scorePercentage: 100, correct: 5, total: 5, mistakeStats: {}, sentenceCount: 5 },
    ]);

    const confidences = computeRoleConfidences();
    const pvConf = confidences.get('pv');
    expect(pvConf!.confidence).toBe(1.0);
    expect(pvConf!.totalEncounters).toBe(2);
  });

  it('returns low confidence for roles with many errors', () => {
    mockLoadSessionHistory.mockReturnValue([
      { date: '2025-01-01', scorePercentage: 40, correct: 2, total: 5, mistakeStats: { 'Lijdend Voorwerp': 3 }, sentenceCount: 5 },
      { date: '2025-01-02', scorePercentage: 50, correct: 3, total: 5, mistakeStats: { 'Lijdend Voorwerp': 2 }, sentenceCount: 5 },
    ]);

    const confidences = computeRoleConfidences();
    const lvConf = confidences.get('lv');
    expect(lvConf!.confidence).toBeLessThan(0.5);
    expect(lvConf!.recentErrors).toBe(5);
  });

  it('clamps confidence between 0.1 and 1.0', () => {
    // Create extreme error scenario
    mockLoadSessionHistory.mockReturnValue([
      { date: '2025-01-01', scorePercentage: 0, correct: 0, total: 5, mistakeStats: { 'Persoonsvorm': 50 }, sentenceCount: 5 },
    ]);

    const confidences = computeRoleConfidences();
    const pvConf = confidences.get('pv');
    expect(pvConf!.confidence).toBeGreaterThanOrEqual(0.1);
    expect(pvConf!.confidence).toBeLessThanOrEqual(1.0);
  });
});

// ---------------------------------------------------------------------------
// computeSentenceScore
// ---------------------------------------------------------------------------

describe('computeSentenceScore', () => {
  it('gives higher score to sentences with weak roles', () => {
    const confidences = new Map<RoleKey, RoleConfidence>();
    confidences.set('pv', { role: 'pv', confidence: 0.9, totalEncounters: 10, recentErrors: 1 });
    confidences.set('lv', { role: 'lv', confidence: 0.2, totalEncounters: 10, recentErrors: 8 });
    confidences.set('ow', { role: 'ow', confidence: 0.9, totalEncounters: 10, recentErrors: 1 });

    const sentenceWithLV = makeSentence(1, ['pv', 'ow', 'lv']);
    const sentenceWithoutLV = makeSentence(2, ['pv', 'ow', 'bwb']);

    // Run multiple times and check average scores
    const usageStore: Record<number, SentenceUsageData> = {};
    const now = Date.now();

    let scoreLV = 0;
    let scoreNoLV = 0;
    const runs = 100;

    for (let i = 0; i < runs; i++) {
      scoreLV += computeSentenceScore(sentenceWithLV, confidences, usageStore, now);
      scoreNoLV += computeSentenceScore(sentenceWithoutLV, confidences, usageStore, now);
    }

    // Sentence with weak LV should have a higher average score
    expect(scoreLV / runs).toBeGreaterThan(scoreNoLV / runs);
  });

  it('gives freshness bonus to sentences not recently attempted', () => {
    const confidences = new Map<RoleKey, RoleConfidence>();
    confidences.set('pv', { role: 'pv', confidence: 0.5, totalEncounters: 5, recentErrors: 2 });

    const sentence = makeSentence(1, ['pv']);
    const now = Date.now();

    const recentUsage: Record<number, SentenceUsageData> = {
      1: { attempts: 5, perfectCount: 3, showAnswerCount: 0, roleErrors: {}, splitErrors: 0, flagged: false, note: '', lastAttempted: new Date().toISOString() },
    };
    const oldUsage: Record<number, SentenceUsageData> = {
      1: { attempts: 5, perfectCount: 3, showAnswerCount: 0, roleErrors: {}, splitErrors: 0, flagged: false, note: '', lastAttempted: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString() },
    };

    let recentScore = 0;
    let oldScore = 0;
    const runs = 100;
    for (let i = 0; i < runs; i++) {
      recentScore += computeSentenceScore(sentence, confidences, recentUsage, now);
      oldScore += computeSentenceScore(sentence, confidences, oldUsage, now);
    }

    expect(oldScore / runs).toBeGreaterThan(recentScore / runs);
  });

  it('always returns a positive score', () => {
    const confidences = new Map<RoleKey, RoleConfidence>();
    confidences.set('pv', { role: 'pv', confidence: 1.0, totalEncounters: 10, recentErrors: 0 });

    const sentence = makeSentence(1, ['pv']);
    const score = computeSentenceScore(sentence, confidences, {}, Date.now());
    expect(score).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// selectAdaptiveQueue
// ---------------------------------------------------------------------------

describe('selectAdaptiveQueue', () => {
  it('returns empty array for empty pool', () => {
    const confidences = new Map<RoleKey, RoleConfidence>();
    expect(selectAdaptiveQueue([], 5, confidences)).toEqual([]);
  });

  it('returns all sentences when count >= pool size', () => {
    const pool = [makeSentence(1, ['pv']), makeSentence(2, ['ow'])];
    const confidences = new Map<RoleKey, RoleConfidence>();
    const result = selectAdaptiveQueue(pool, 10, confidences);
    expect(result).toHaveLength(2);
  });

  it('returns exactly count sentences', () => {
    const pool = Array.from({ length: 20 }, (_, i) => makeSentence(i + 1, ['pv', 'ow']));
    const confidences = new Map<RoleKey, RoleConfidence>();
    const result = selectAdaptiveQueue(pool, 5, confidences);
    expect(result).toHaveLength(5);
  });

  it('returns no duplicates', () => {
    const pool = Array.from({ length: 20 }, (_, i) => makeSentence(i + 1, ['pv', 'ow']));
    const confidences = new Map<RoleKey, RoleConfidence>();
    const result = selectAdaptiveQueue(pool, 10, confidences);
    const ids = result.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('favours sentences with weak roles over many runs', () => {
    const confidences = new Map<RoleKey, RoleConfidence>();
    confidences.set('pv', { role: 'pv', confidence: 0.9, totalEncounters: 10, recentErrors: 1 });
    confidences.set('ow', { role: 'ow', confidence: 0.9, totalEncounters: 10, recentErrors: 1 });
    confidences.set('lv', { role: 'lv', confidence: 0.15, totalEncounters: 10, recentErrors: 8 });
    confidences.set('bwb', { role: 'bwb', confidence: 0.9, totalEncounters: 10, recentErrors: 1 });

    // 5 sentences with LV, 15 without
    const pool = [
      ...Array.from({ length: 5 }, (_, i) => makeSentence(i + 1, ['pv', 'ow', 'lv'])),
      ...Array.from({ length: 15 }, (_, i) => makeSentence(i + 6, ['pv', 'ow', 'bwb'])),
    ];

    // Over many runs, LV sentences should appear more than their 25% base rate
    let lvCount = 0;
    const totalRuns = 200;
    const selectCount = 5;

    for (let r = 0; r < totalRuns; r++) {
      const selected = selectAdaptiveQueue(pool, selectCount, confidences);
      lvCount += selected.filter(s => s.tokens.some(t => t.role === 'lv')).length;
    }

    const lvRate = lvCount / (totalRuns * selectCount);
    // Base rate would be 25% (5/20). Adaptive should push it above that.
    // Threshold is conservative because 35% of the score is random.
    expect(lvRate).toBeGreaterThan(0.27);
  });

  it('produces varying results across runs (not deterministic)', () => {
    const pool = Array.from({ length: 20 }, (_, i) => makeSentence(i + 1, ['pv', 'ow']));
    const confidences = new Map<RoleKey, RoleConfidence>();

    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const selected = selectAdaptiveQueue(pool, 5, confidences);
      results.add(selected.map(s => s.id).sort().join(','));
    }

    // With 20 sentences and 5 picks, we should see different combinations
    expect(results.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

describe('saveRoleConfidences / loadRoleConfidences', () => {
  it('round-trips confidence data through localStorage', () => {
    const map = new Map<RoleKey, RoleConfidence>();
    map.set('pv', { role: 'pv', confidence: 0.85, totalEncounters: 10, recentErrors: 2 });
    map.set('lv', { role: 'lv', confidence: 0.3, totalEncounters: 8, recentErrors: 5 });

    saveRoleConfidences(map);
    const loaded = loadRoleConfidences();

    expect(loaded).not.toBeNull();
    expect(loaded!.get('pv')!.confidence).toBe(0.85);
    expect(loaded!.get('lv')!.confidence).toBe(0.3);
  });

  it('returns null when no data stored', () => {
    expect(loadRoleConfidences()).toBeNull();
  });
});
