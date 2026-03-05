import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadInteractionLog,
  saveInteractionLog,
  logInteraction,
  clearInteractionLog,
  computeClickthroughStats,
} from './interactionLog';
import type { InteractionEntry } from './interactionLog';

// Mock localStorage
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

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('loadInteractionLog', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(loadInteractionLog()).toEqual([]);
  });

  it('returns parsed log from localStorage', () => {
    const log: InteractionEntry[] = [
      { timestamp: '2025-01-01T00:00:00Z', type: 'session_start' },
    ];
    store['zinsontleding_interactions_v1'] = JSON.stringify(log);
    expect(loadInteractionLog()).toEqual(log);
  });

  it('returns empty array on parse error', () => {
    store['zinsontleding_interactions_v1'] = '{invalid';
    expect(loadInteractionLog()).toEqual([]);
  });
});

describe('saveInteractionLog', () => {
  it('saves log to localStorage', () => {
    const log: InteractionEntry[] = [
      { timestamp: '2025-01-01T00:00:00Z', type: 'check', sentenceId: 5 },
    ];
    saveInteractionLog(log);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'zinsontleding_interactions_v1',
      JSON.stringify(log)
    );
  });
});

describe('logInteraction', () => {
  it('appends an entry with timestamp', () => {
    logInteraction('session_start');
    const log = loadInteractionLog();
    expect(log).toHaveLength(1);
    expect(log[0].type).toBe('session_start');
    expect(log[0].timestamp).toBeTruthy();
    expect(log[0].sentenceId).toBeUndefined();
  });

  it('includes sentenceId and detail when provided', () => {
    logInteraction('label_drop', 42, 'role=pv');
    const log = loadInteractionLog();
    expect(log[0].sentenceId).toBe(42);
    expect(log[0].detail).toBe('role=pv');
  });

  it('accumulates entries across calls', () => {
    logInteraction('session_start');
    logInteraction('sentence_start', 1);
    logInteraction('split_toggle', 1, 'index=2');
    logInteraction('check', 1);
    const log = loadInteractionLog();
    expect(log).toHaveLength(4);
    expect(log.map(e => e.type)).toEqual([
      'session_start', 'sentence_start', 'split_toggle', 'check'
    ]);
  });

  it('trims log to MAX_ENTRIES (2000)', () => {
    // Pre-fill with 1999 entries
    const existing: InteractionEntry[] = [];
    for (let i = 0; i < 1999; i++) {
      existing.push({ timestamp: `2025-01-01T00:00:${String(i).padStart(2, '0')}Z`, type: 'check' });
    }
    saveInteractionLog(existing);

    // Add 2 more → total would be 2001 → should trim to 2000
    logInteraction('hint', 1);
    logInteraction('show_answer', 2);

    const log = loadInteractionLog();
    expect(log.length).toBe(2000);
    // The last entry should be our show_answer
    expect(log[log.length - 1].type).toBe('show_answer');
    expect(log[log.length - 1].sentenceId).toBe(2);
  });
});

describe('clearInteractionLog', () => {
  it('removes interaction data from localStorage', () => {
    logInteraction('session_start');
    clearInteractionLog();
    expect(loadInteractionLog()).toEqual([]);
  });
});

describe('computeClickthroughStats', () => {
  it('returns zero stats for empty log', () => {
    const stats = computeClickthroughStats([]);
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalSentencesStarted).toBe(0);
    expect(stats.totalChecks).toBe(0);
    expect(stats.totalHints).toBe(0);
    expect(stats.totalShowAnswers).toBe(0);
    expect(stats.totalSplitErrors).toBe(0);
    expect(stats.totalRoleErrors).toBe(0);
    expect(stats.totalBijzinFunctieErrors).toBe(0);
    expect(stats.avgActionsPerSentence).toBe(0);
  });

  it('computes correct stats from a typical session', () => {
    const log: InteractionEntry[] = [
      { timestamp: '2025-01-01T00:00:00Z', type: 'session_start' },
      { timestamp: '2025-01-01T00:00:01Z', type: 'sentence_start', sentenceId: 1 },
      { timestamp: '2025-01-01T00:00:02Z', type: 'split_toggle', sentenceId: 1 },
      { timestamp: '2025-01-01T00:00:03Z', type: 'step_forward', sentenceId: 1 },
      { timestamp: '2025-01-01T00:00:04Z', type: 'label_drop', sentenceId: 1, detail: 'role=pv' },
      { timestamp: '2025-01-01T00:00:05Z', type: 'check', sentenceId: 1 },
      { timestamp: '2025-01-01T00:00:06Z', type: 'hint', sentenceId: 1 },
      { timestamp: '2025-01-01T00:00:07Z', type: 'sentence_start', sentenceId: 2 },
      { timestamp: '2025-01-01T00:00:08Z', type: 'show_answer', sentenceId: 2 },
    ];
    const stats = computeClickthroughStats(log);
    expect(stats.totalSessions).toBe(1);
    expect(stats.totalSentencesStarted).toBe(2);
    expect(stats.totalChecks).toBe(1);
    expect(stats.totalHints).toBe(1);
    expect(stats.totalShowAnswers).toBe(1);
    expect(stats.avgActionsPerSentence).toBe(9 / 2); // 9 total actions / 2 sentences
  });

  it('tracks error counts', () => {
    const log: InteractionEntry[] = [
      { timestamp: '2025-01-01T00:00:00Z', type: 'session_start' },
      { timestamp: '2025-01-01T00:00:01Z', type: 'sentence_start', sentenceId: 1 },
      { timestamp: '2025-01-01T00:00:02Z', type: 'check', sentenceId: 1 },
      { timestamp: '2025-01-01T00:00:03Z', type: 'error_split', sentenceId: 1, detail: 'chunk=0' },
      { timestamp: '2025-01-01T00:00:04Z', type: 'error_role', sentenceId: 1, detail: 'chunk=1' },
      { timestamp: '2025-01-01T00:00:05Z', type: 'error_role', sentenceId: 1, detail: 'chunk=2' },
      { timestamp: '2025-01-01T00:00:06Z', type: 'error_bijzin_functie', sentenceId: 1, detail: 'chunk=3' },
    ];
    const stats = computeClickthroughStats(log);
    expect(stats.totalSplitErrors).toBe(1);
    expect(stats.totalRoleErrors).toBe(2);
    expect(stats.totalBijzinFunctieErrors).toBe(1);
    expect(stats.totalChecks).toBe(1);
  });

  it('handles multiple sessions', () => {
    const log: InteractionEntry[] = [
      { timestamp: '2025-01-01T00:00:00Z', type: 'session_start' },
      { timestamp: '2025-01-01T00:00:01Z', type: 'sentence_start', sentenceId: 1 },
      { timestamp: '2025-01-01T00:00:02Z', type: 'check', sentenceId: 1 },
      { timestamp: '2025-01-01T00:00:03Z', type: 'session_finish' },
      { timestamp: '2025-01-01T00:00:04Z', type: 'session_start' },
      { timestamp: '2025-01-01T00:00:05Z', type: 'sentence_start', sentenceId: 5 },
      { timestamp: '2025-01-01T00:00:06Z', type: 'check', sentenceId: 5 },
    ];
    const stats = computeClickthroughStats(log);
    expect(stats.totalSessions).toBe(2);
    expect(stats.totalChecks).toBe(2);
  });
});
