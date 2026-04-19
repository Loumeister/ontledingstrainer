import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadSessionHistory,
  saveSessionToHistory,
  getStreak,
  getPreviousScore,
  getPersonalRecord,
  updatePersonalRecord,
  getConsistencyStreak,
  getPerfectSessionCount,
  incrementPerfectSessionCount,
} from './sessionHistory';
import type { SessionHistoryEntry } from '../types';

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

const HIST_KEY = 'zinsontleding_session_history_v1';
const PR_KEY = 'zinsontleding_pr_v1';
const PERFECT_KEY = 'zinsontleding_perfect_count_v1';

function makeEntry(date: string, scorePercentage = 80): SessionHistoryEntry {
  return { date, scorePercentage, correct: 8, total: 10, mistakeStats: {}, sentenceCount: 10 };
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

// ── loadSessionHistory / saveSessionToHistory ─────────────────────────────────

describe('loadSessionHistory', () => {
  it('geeft lege array terug als storage leeg is', () => {
    expect(loadSessionHistory()).toEqual([]);
  });

  it('geeft lege array terug bij ongeldig JSON', () => {
    store[HIST_KEY] = 'GEEN JSON{';
    expect(loadSessionHistory()).toEqual([]);
  });

  it('laadt opgeslagen sessies correct', () => {
    const entry = makeEntry('2026-01-01T10:00:00.000Z');
    store[HIST_KEY] = JSON.stringify([entry]);
    expect(loadSessionHistory()).toHaveLength(1);
  });
});

describe('saveSessionToHistory', () => {
  it('voegt een sessie toe', () => {
    saveSessionToHistory(makeEntry('2026-01-01T10:00:00.000Z'));
    expect(loadSessionHistory()).toHaveLength(1);
  });

  it('behoudt maximaal 20 sessies', () => {
    for (let i = 0; i < 21; i++) {
      saveSessionToHistory(makeEntry(`2026-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`));
    }
    expect(loadSessionHistory()).toHaveLength(20);
  });
});

// ── getStreak ─────────────────────────────────────────────────────────────────

describe('getStreak', () => {
  it('geeft 0 terug als er geen sessies zijn', () => {
    expect(getStreak()).toBe(0);
  });

  it('geeft 0 terug als de laatste sessie ouder is dan gisteren', () => {
    store[HIST_KEY] = JSON.stringify([makeEntry('2020-01-01')]);
    expect(getStreak()).toBe(0);
  });

  it('telt aaneengesloten dagen correct', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);

    store[HIST_KEY] = JSON.stringify([
      makeEntry(dayBefore.toISOString()),
      makeEntry(yesterday.toISOString()),
      makeEntry(today.toISOString()),
    ]);
    expect(getStreak()).toBe(3);
  });
});

// ── getPreviousScore ───────────────────────────────────────────────────────────

describe('getPreviousScore', () => {
  it('geeft null terug als er geen sessies zijn', () => {
    expect(getPreviousScore()).toBeNull();
  });

  it('geeft het scorePercentage van de laatste sessie terug', () => {
    store[HIST_KEY] = JSON.stringify([
      makeEntry('2026-01-01', 60),
      makeEntry('2026-01-02', 95),
    ]);
    expect(getPreviousScore()).toBe(95);
  });
});

// ── getPersonalRecord / updatePersonalRecord ──────────────────────────────────

describe('getPersonalRecord', () => {
  it('geeft 0 terug als er geen record is', () => {
    expect(getPersonalRecord()).toBe(0);
  });

  it('geeft het opgeslagen record terug', () => {
    store[PR_KEY] = '85';
    expect(getPersonalRecord()).toBe(85);
  });
});

describe('updatePersonalRecord', () => {
  it('slaat een hogere score op en geeft true terug', () => {
    expect(updatePersonalRecord(90)).toBe(true);
    expect(getPersonalRecord()).toBe(90);
  });

  it('slaat een lagere score niet op en geeft false terug', () => {
    store[PR_KEY] = '90';
    expect(updatePersonalRecord(70)).toBe(false);
    expect(getPersonalRecord()).toBe(90);
  });

  it('slaat een gelijke score niet op en geeft false terug', () => {
    store[PR_KEY] = '90';
    expect(updatePersonalRecord(90)).toBe(false);
  });
});

// ── getConsistencyStreak ──────────────────────────────────────────────────────

describe('getConsistencyStreak', () => {
  it('geeft 0 terug voor lege history', () => {
    expect(getConsistencyStreak([], 70)).toBe(0);
  });

  it('telt aaneengesloten sessies boven de drempel', () => {
    const history = [
      makeEntry('2026-01-01', 60),
      makeEntry('2026-01-02', 80),
      makeEntry('2026-01-03', 90),
      makeEntry('2026-01-04', 75),
    ];
    expect(getConsistencyStreak(history, 70)).toBe(3);
  });

  it('stopt bij de eerste sessie onder de drempel (van achter naar voor)', () => {
    const history = [
      makeEntry('2026-01-01', 90),
      makeEntry('2026-01-02', 50),
      makeEntry('2026-01-03', 85),
    ];
    expect(getConsistencyStreak(history, 70)).toBe(1);
  });
});

// ── getPerfectSessionCount / incrementPerfectSessionCount ─────────────────────

describe('getPerfectSessionCount', () => {
  it('geeft 0 terug als er geen perfecte sessies zijn', () => {
    expect(getPerfectSessionCount()).toBe(0);
  });

  it('geeft het opgeslagen aantal terug', () => {
    store[PERFECT_KEY] = '3';
    expect(getPerfectSessionCount()).toBe(3);
  });
});

describe('incrementPerfectSessionCount', () => {
  it('verhoogt de teller met 1 en geeft de nieuwe waarde terug', () => {
    expect(incrementPerfectSessionCount()).toBe(1);
    expect(incrementPerfectSessionCount()).toBe(2);
  });
});
