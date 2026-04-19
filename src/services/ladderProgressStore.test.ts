import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadLadderProgress,
  saveLadderProgress,
  appendLadderScore,
} from './ladderProgressStore';

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

const KEY = 'zinsontleding_ladder_v1';

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('loadLadderProgress', () => {
  it('geeft standaardwaarden terug als storage leeg is', () => {
    const p = loadLadderProgress();
    expect(p.enabled).toBe(false);
    expect(p.currentStage).toBe(1);
    expect(p.recentScores).toEqual([]);
  });

  it('laadt opgeslagen voortgang correct', () => {
    store[KEY] = JSON.stringify({
      enabled: true,
      currentStage: 4,
      lastChangedAt: '2026-01-01T00:00:00.000Z',
      recentScores: [{ score: 8, total: 10 }],
    });
    const p = loadLadderProgress();
    expect(p.enabled).toBe(true);
    expect(p.currentStage).toBe(4);
    expect(p.recentScores).toHaveLength(1);
  });

  it('clamt currentStage op [1, 8]', () => {
    store[KEY] = JSON.stringify({ enabled: false, currentStage: 99, lastChangedAt: '', recentScores: [] });
    expect(loadLadderProgress().currentStage).toBe(8);

    store[KEY] = JSON.stringify({ enabled: false, currentStage: -5, lastChangedAt: '', recentScores: [] });
    expect(loadLadderProgress().currentStage).toBe(1);
  });

  it('filtert ongeldige recentScores eruit', () => {
    store[KEY] = JSON.stringify({
      enabled: false,
      currentStage: 1,
      lastChangedAt: '',
      recentScores: [
        { score: 5, total: 10 },         // geldig
        { score: 'x', total: 10 },       // score is geen number
        { score: 5, total: 0 },           // total is 0 (ongeldig)
        { score: 11, total: 10 },         // score > total
        null,                             // null-waarde
      ],
    });
    const p = loadLadderProgress();
    expect(p.recentScores).toHaveLength(1);
    expect(p.recentScores[0]).toEqual({ score: 5, total: 10 });
  });

  it('valt terug op standaard bij ongeldig JSON', () => {
    store[KEY] = 'GEEN GELDIG JSON{';
    const p = loadLadderProgress();
    expect(p.currentStage).toBe(1);
    expect(p.enabled).toBe(false);
  });

  it('gebruikt false als enabled niet aanwezig is', () => {
    store[KEY] = JSON.stringify({ currentStage: 3, lastChangedAt: '', recentScores: [] });
    expect(loadLadderProgress().enabled).toBe(false);
  });
});

describe('saveLadderProgress', () => {
  it('slaat voortgang op in localStorage', () => {
    const now = new Date().toISOString();
    saveLadderProgress({ enabled: true, currentStage: 3, lastChangedAt: now, recentScores: [] });
    const stored = JSON.parse(store[KEY]);
    expect(stored.currentStage).toBe(3);
    expect(stored.enabled).toBe(true);
  });
});

describe('appendLadderScore', () => {
  it('voegt een score toe aan de lijst', () => {
    appendLadderScore(8, 10);
    expect(loadLadderProgress().recentScores).toEqual([{ score: 8, total: 10 }]);
  });

  it('voegt scores toe aan bestaande lijst', () => {
    appendLadderScore(7, 10);
    appendLadderScore(9, 10);
    expect(loadLadderProgress().recentScores).toHaveLength(2);
  });

  it('behoudt maximaal 20 recente scores', () => {
    for (let i = 0; i < 25; i++) {
      appendLadderScore(i, 25);
    }
    expect(loadLadderProgress().recentScores).toHaveLength(20);
  });

  it('behoudt de meest recente scores (slice van achteren)', () => {
    for (let i = 0; i < 21; i++) {
      appendLadderScore(i, 21);
    }
    const scores = loadLadderProgress().recentScores;
    expect(scores[0].score).toBe(1); // eerste score (0) valt af
    expect(scores[19].score).toBe(20);
  });
});
