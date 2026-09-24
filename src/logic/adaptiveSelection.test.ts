import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computeRoleConfidences,
  selectAdaptiveQueue,
  computeSentenceScore,
  tallySentenceRoles,
  RoleConfidence,
} from './adaptiveSelection';
import type { Sentence, RoleKey, SentenceUsageData, SessionHistoryEntry } from '../types';

vi.mock('../services/usageData', () => ({
  loadUsageData: vi.fn(() => ({})),
}));

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

function session(partial: Partial<SessionHistoryEntry>): SessionHistoryEntry {
  return {
    date: '2026-01-01T10:00:00.000Z',
    scorePercentage: 80,
    correct: 4,
    total: 5,
    mistakeStats: {},
    sentenceCount: 5,
    ...partial,
  };
}

function conf(entries: [RoleKey, number][]): Map<RoleKey, RoleConfidence> {
  return new Map(entries.map(([role, confidence]) => [role, { role, confidence, totalEncounters: 10, recentErrors: 0 }]));
}

function seededRandom(seed = 42) {
  return () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
}

const isMV = (s: Sentence) => s.tokens.some(t => t.role === 'mv');

/** 100 zinnen, 20 met een MV. */
const mvPool: Sentence[] = [
  ...Array.from({ length: 20 }, (_, i) => makeSentence(i + 1, ['ow', 'pv', 'mv', 'lv'])),
  ...Array.from({ length: 80 }, (_, i) => makeSentence(i + 21, ['ow', 'pv', 'lv', 'bwb'])),
];

/** Tien sessies waarin de leerling telkens het MV fout doet en de rest goed. */
const mvFailingHistory: SessionHistoryEntry[] = Array.from({ length: 10 }, () => session({
  studentId: 'std-a',
  mistakeStats: { 'Meewerkend Voorwerp': 2 },
  roleSeen: { pv: 5, ow: 5, lv: 5, mv: 2, bwb: 3 },
  roleCorrect: { pv: 5, ow: 5, lv: 5, mv: 0, bwb: 3 },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// computeRoleConfidences
// ---------------------------------------------------------------------------

describe('computeRoleConfidences', () => {
  it('geeft 0,5 zonder geschiedenis', () => {
    const c = computeRoleConfidences([]);
    expect(c.get('pv')!.confidence).toBe(0.5);
    expect(c.get('pv')!.totalEncounters).toBe(0);
  });

  it('geeft nooit geziene rollen geen hoge confidence (Instap zonder bijstelling)', () => {
    const history = Array.from({ length: 10 }, () => session({
      roleSeen: { pv: 5, ow: 5 },
      roleCorrect: { pv: 5, ow: 5 },
    }));
    const c = computeRoleConfidences(history);
    expect(c.get('bijst')!.confidence).toBe(0.5);
    expect(c.get('vw_onder')!.confidence).toBe(0.5);
    expect(c.get('pv')!.confidence).toBeGreaterThan(0.9);
  });

  it('dempt één enkele fout (koude start)', () => {
    const c = computeRoleConfidences([session({ roleSeen: { mv: 1 }, roleCorrect: { mv: 0 } })]);
    expect(c.get('mv')!.confidence).toBeCloseTo(1 / 3);
  });

  it('laat recente fouten zwaarder wegen dan oude', () => {
    const good = session({ roleSeen: { lv: 4 }, roleCorrect: { lv: 4 } });
    const bad = session({ roleSeen: { lv: 4 }, roleCorrect: { lv: 0 } });
    const badLongAgo = computeRoleConfidences([bad, ...Array(9).fill(good)]);
    const badRecently = computeRoleConfidences([...Array(9).fill(good), bad]);
    expect(badRecently.get('lv')!.confidence).toBeLessThan(badLongAgo.get('lv')!.confidence);
  });

  it('leest oude sessies zonder roleSeen (alleen fouten, gekeyed op label)', () => {
    const c = computeRoleConfidences([session({ mistakeStats: { 'Lijdend Voorwerp': 3, Verdeling: 2 } })]);
    expect(c.get('lv')!.confidence).toBeLessThan(0.5);
    expect(c.get('pv')!.confidence).toBe(0.5);
  });

  it('negeert Rollenladder-sessies', () => {
    const c = computeRoleConfidences([session({ adaptiveExcluded: true, mistakeStats: { 'Meewerkend Voorwerp': 4 } })]);
    expect(c.get('mv')!.confidence).toBe(0.5);
  });

  it('telt alleen sessies van de huidige leerling op een gedeelde browser', () => {
    const other = session({ studentId: 'std-b', roleSeen: { mv: 5 }, roleCorrect: { mv: 0 } });
    const legacy = session({ mistakeStats: { 'Meewerkend Voorwerp': 4 } });
    const c = computeRoleConfidences([other, legacy], { studentId: 'std-a', includeUntagged: false });
    expect(c.get('mv')!.confidence).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// tallySentenceRoles
// ---------------------------------------------------------------------------

describe('tallySentenceRoles', () => {
  const s = makeSentence(1, ['ow', 'ow', 'pv', 'mv', 'lv', 'lv']);
  const chunk = (from: number, to: number) => ({ tokens: s.tokens.slice(from, to) });

  it('telt goed en fout benoemde zinsdelen per rol', () => {
    const chunks = [chunk(0, 2), chunk(2, 3), chunk(3, 4), chunk(4, 6)];
    const { seen, correct } = tallySentenceRoles(chunks, { 0: 'correct', 1: 'correct', 2: 'incorrect-role', 3: 'warning' });
    expect(seen).toEqual({ ow: 1, pv: 1, mv: 1, lv: 1 });
    expect(correct).toEqual({ ow: 1, pv: 1 });
  });

  it('telt een waarschuwing als goed als het hoofdlabel klopt', () => {
    const labels = { [s.tokens[4].id]: 'lv' as RoleKey };
    const { correct } = tallySentenceRoles([chunk(4, 6)], { 0: 'warning' }, labels);
    expect(correct).toEqual({ lv: 1 });
  });

  it('telt niets bij een verdelingsfout of een zinsdeel buiten de trede', () => {
    const { seen, correct } = tallySentenceRoles([chunk(0, 6)], { 0: 'incorrect-split' });
    expect(seen).toEqual({});
    expect(correct).toEqual({});
    expect(tallySentenceRoles([chunk(0, 2)], { 0: null }).seen).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// computeSentenceScore
// ---------------------------------------------------------------------------

describe('computeSentenceScore', () => {
  it('laat één zwakke rol niet wegdrukken door sterke PV en OW', () => {
    const c = conf([['pv', 0.95], ['ow', 0.95], ['lv', 0.95], ['mv', 0.1]]);
    const withMV = computeSentenceScore(makeSentence(1, ['pv', 'ow', 'lv', 'mv']), c, {}, Date.now());
    const without = computeSentenceScore(makeSentence(2, ['pv', 'ow', 'lv']), c, {}, Date.now());
    expect(withMV / without).toBeGreaterThan(3);
  });

  it('geeft recent geoefende zinnen minder gewicht', () => {
    const now = Date.now();
    const base: SentenceUsageData = { attempts: 5, perfectCount: 3, showAnswerCount: 0, roleErrors: {}, splitErrors: 0, flagged: false, note: '' };
    const s = makeSentence(1, ['pv']);
    const recent = computeSentenceScore(s, new Map(), { 1: { ...base, lastAttempted: new Date(now).toISOString() } }, now);
    const old = computeSentenceScore(s, new Map(), { 1: { ...base, lastAttempted: new Date(now - 30 * 864e5).toISOString() } }, now);
    expect(old).toBeGreaterThan(recent);
  });
});

// ---------------------------------------------------------------------------
// selectAdaptiveQueue
// ---------------------------------------------------------------------------

describe('selectAdaptiveQueue', () => {
  it('geeft een lege lijst bij een lege pool', () => {
    expect(selectAdaptiveQueue([], 5, new Map())).toEqual([]);
  });

  it('geeft precies count unieke zinnen', () => {
    const pool = Array.from({ length: 20 }, (_, i) => makeSentence(i + 1, ['pv', 'ow']));
    const result = selectAdaptiveQueue(pool, 10, new Map(), seededRandom(), {});
    expect(result).toHaveLength(10);
    expect(new Set(result.map(s => s.id)).size).toBe(10);
  });

  it('kiest MV-zinnen minstens 1,5× zo vaak als toeval bij een leerling die MV steeds fout doet', () => {
    const c = computeRoleConfidences(mvFailingHistory, { studentId: 'std-a' });
    const random = seededRandom(7);
    let mv = 0;
    let picks = 0;
    for (let run = 0; run < 200; run++) {
      const selected = selectAdaptiveQueue(mvPool, 5, c, random, {});
      mv += selected.filter(isMV).length;
      picks += selected.length;
    }
    expect(picks).toBe(1000);
    expect(mv / picks).toBeGreaterThanOrEqual(0.2 * 1.5);
  });

  it('vult een sessie van 3+ zinnen nooit alleen met de zwakke rol als de pool anders kan', () => {
    const c = computeRoleConfidences(mvFailingHistory, { studentId: 'std-a' });
    const random = seededRandom(11);
    for (const size of [3, 4, 5, 10]) {
      for (let run = 0; run < 200; run++) {
        const selected = selectAdaptiveQueue(mvPool, size, c, random, {});
        expect(selected.every(isMV)).toBe(false);
      }
    }
  });

  it('laat altijd ruimte voor een andere zin als de pool die heeft', () => {
    const pool = [
      ...Array.from({ length: 9 }, (_, i) => makeSentence(i + 1, ['ow', 'pv', 'mv'])),
      makeSentence(10, ['ow', 'pv', 'lv']),
    ];
    const c = conf([['mv', 0.05]]);
    const random = seededRandom(5);
    for (let run = 0; run < 100; run++) {
      expect(selectAdaptiveQueue(pool, 5, c, random, {}).every(isMV)).toBe(false);
    }
  });

  it('is zonder geschiedenis (koude start) niet gericht op één rol', () => {
    const c = computeRoleConfidences([]);
    const random = seededRandom(3);
    let mv = 0;
    for (let run = 0; run < 200; run++) {
      mv += selectAdaptiveQueue(mvPool, 5, c, random, {}).filter(isMV).length;
    }
    expect(mv / 1000).toBeGreaterThan(0.15);
    expect(mv / 1000).toBeLessThan(0.25);
  });
});
