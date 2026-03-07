/**
 * Tests for useTrainer hook.
 *
 * Focus areas:
 * 1. Sentence filtering (getFilteredSentences) – tested via availableSentences
 * 2. toggleSplit – adds and removes split indices
 * 3. handleNextStep / handleBackStep – step transitions
 * 4. startSession – queue setup and first sentence loaded
 * 5. nextSessionSentence – session advancement and finish detection
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Sentence } from '../types';
import { useTrainer } from './useTrainer';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSentence(overrides: Partial<Sentence> & { id: number }): Sentence {
  return {
    label: `Zin ${overrides.id}`,
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: `${overrides.id}-t1`, text: 'De', role: 'ow' },
      { id: `${overrides.id}-t2`, text: 'kat', role: 'ow' },
      { id: `${overrides.id}-t3`, text: 'slaapt', role: 'pv' },
    ],
    ...overrides,
  };
}

// Sentences covering many filter scenarios
const SENTENCES: Sentence[] = [
  // Basic WG sentences (level 1)
  makeSentence({ id: 1, predicateType: 'WG', level: 1 }),
  makeSentence({ id: 2, predicateType: 'WG', level: 1 }),

  // NG sentence (level 1)
  {
    ...makeSentence({ id: 3, predicateType: 'NG', level: 1 }),
    tokens: [
      { id: '3-t1', text: 'De', role: 'ow' },
      { id: '3-t2', text: 'kat', role: 'ow' },
      { id: '3-t3', text: 'is', role: 'pv' },
      { id: '3-t4', text: 'ziek', role: 'nwd' },
    ],
  },

  // Sentence with LV
  {
    ...makeSentence({ id: 4, predicateType: 'WG', level: 2 }),
    tokens: [
      { id: '4-t1', text: 'De', role: 'ow' },
      { id: '4-t2', text: 'kat', role: 'lv' },
      { id: '4-t3', text: 'slaapt', role: 'pv' },
    ],
  },

  // Sentence with MV (level 2)
  {
    ...makeSentence({ id: 5, predicateType: 'WG', level: 2 }),
    tokens: [
      { id: '5-t1', text: 'De', role: 'mv' },
      { id: '5-t2', text: 'kat', role: 'ow' },
      { id: '5-t3', text: 'slaapt', role: 'pv' },
    ],
  },

  // Sentence with bijst (level 2)
  {
    ...makeSentence({ id: 6, predicateType: 'WG', level: 2 }),
    tokens: [
      { id: '6-t1', text: 'De', role: 'bijst' },
      { id: '6-t2', text: 'kat', role: 'ow' },
      { id: '6-t3', text: 'slaapt', role: 'pv' },
    ],
  },

  // Sentence with VV (level 2)
  {
    ...makeSentence({ id: 7, predicateType: 'WG', level: 2 }),
    tokens: [
      { id: '7-t1', text: 'De', role: 'ow' },
      { id: '7-t2', text: 'kat', role: 'pv' },
      { id: '7-t3', text: 'geslapen', role: 'vv' },
    ],
  },

  // Compound sentence with bijzin (level 4)
  {
    ...makeSentence({ id: 8, predicateType: 'WG', level: 4 }),
    tokens: [
      { id: '8-t1', text: 'De', role: 'ow' },
      { id: '8-t2', text: 'kat', role: 'bijzin' },
      { id: '8-t3', text: 'slaapt', role: 'pv' },
    ],
  },
];

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('./useSentences', () => ({
  useSentences: (_level: unknown) => ({
    sentences: SENTENCES,
    isLoading: false,
    error: null,
    findSentenceById: async (id: number) => SENTENCES.find(s => s.id === id),
  }),
}));

vi.mock('../data/customSentenceStore', () => ({
  getCustomSentences: () => [],
}));

vi.mock('../usageData', () => ({
  recordAttempt: vi.fn(),
  recordShowAnswer: vi.fn(),
}));

vi.mock('../interactionLog', () => ({
  logInteraction: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Render the hook and return the result. Wraps every update in act(). */
function setup() {
  return renderHook(() => useTrainer());
}

// ─── availableSentences / getFilteredSentences ────────────────────────────────

describe('getFilteredSentences (via availableSentences)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all sentences when no filters are set', () => {
    const { result } = setup();
    // The level 4 (bijzin) sentence is excluded by default when no focusBijzin
    const ids = result.current.availableSentences.map(s => s.id);
    expect(ids).not.toContain(8); // compound excluded without focusBijzin
  });

  it('filters by predicateMode WG', () => {
    const { result } = setup();
    act(() => result.current.setPredicateMode('WG'));
    const allWG = result.current.availableSentences.every(s => s.predicateType === 'WG');
    expect(allWG).toBe(true);
    const ids = result.current.availableSentences.map(s => s.id);
    expect(ids).not.toContain(3); // NG sentence excluded
  });

  it('filters by predicateMode NG', () => {
    const { result } = setup();
    act(() => result.current.setPredicateMode('NG'));
    const ids = result.current.availableSentences.map(s => s.id);
    expect(ids).toContain(3);
    // WG-only sentences should be excluded
    expect(ids).not.toContain(1);
  });

  it('includes compound (bijzin) sentences when focusBijzin is true', () => {
    const { result } = setup();
    act(() => result.current.setFocusBijzin(true));
    const ids = result.current.availableSentences.map(s => s.id);
    expect(ids).toContain(8);
  });

  it('focuses on sentences containing LV when focusLV is set', () => {
    const { result } = setup();
    act(() => result.current.setFocusLV(true));
    const ids = result.current.availableSentences.map(s => s.id);
    expect(ids).toContain(4); // has LV token
    expect(ids).not.toContain(1); // plain WG, no LV
  });

  it('focuses on sentences containing MV when focusMV is set', () => {
    const { result } = setup();
    act(() => result.current.setFocusMV(true));
    const ids = result.current.availableSentences.map(s => s.id);
    expect(ids).toContain(5);
    expect(ids).not.toContain(1);
  });

  it('focuses on sentences containing VV when focusVV is set', () => {
    const { result } = setup();
    act(() => result.current.setFocusVV(true));
    const ids = result.current.availableSentences.map(s => s.id);
    expect(ids).toContain(7);
    expect(ids).not.toContain(1);
  });

  it('filters to a specific level when selectedLevel is set', () => {
    const { result } = setup();
    act(() => result.current.setSelectedLevel(2));
    const levels = result.current.availableSentences.map(s => s.level);
    expect(levels.every(l => l === 2)).toBe(true);
  });

  it('includes bijst sentences at level 2 when includeBijst is on', () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedLevel(2);
      result.current.setIncludeBijst(true);
    });
    const ids = result.current.availableSentences.map(s => s.id);
    expect(ids).toContain(6); // bijst sentence at level 2
  });

  it('excludes bijst sentences at level 2 when includeBijst is off', () => {
    const { result } = setup();
    act(() => result.current.setSelectedLevel(2));
    const ids = result.current.availableSentences.map(s => s.id);
    expect(ids).not.toContain(6);
  });

  it('shows only compound (level 4) sentences when focusBijzin is the only focus active', () => {
    // When focusBijzin is on and no other focus (LV/MV/VV) is active, the filter
    // returns ONLY compound sentences.
    const { result } = setup();
    act(() => result.current.setFocusBijzin(true));
    const levels = new Set(result.current.availableSentences.map(s => s.level));
    expect(levels.has(4)).toBe(true);
    expect(levels.has(1)).toBe(false);
  });
});

// ─── toggleSplit ──────────────────────────────────────────────────────────────

describe('toggleSplit', () => {
  it('adds a split index when the index is not present', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => result.current.toggleSplit(1));
    expect(result.current.splitIndices.has(1)).toBe(true);
  });

  it('removes a split index when toggled twice', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => result.current.toggleSplit(1));
    act(() => result.current.toggleSplit(1));
    expect(result.current.splitIndices.has(1)).toBe(false);
  });

  it('clears validation result when a split is toggled', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => result.current.handleNextStep());
    act(() => result.current.handleBackStep());
    act(() => result.current.toggleSplit(1));
    expect(result.current.validationResult).toBeNull();
  });
});

// ─── handleNextStep / handleBackStep ─────────────────────────────────────────

describe('step transitions', () => {
  it('handleNextStep advances from split to label', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    expect(result.current.step).toBe('split');
    act(() => result.current.handleNextStep());
    expect(result.current.step).toBe('label');
  });

  it('handleBackStep returns from label to split', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => result.current.handleNextStep());
    expect(result.current.step).toBe('label');
    act(() => result.current.handleBackStep());
    expect(result.current.step).toBe('split');
  });

  it('clears validationResult on step change', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => result.current.handleNextStep());
    act(() => result.current.handleBackStep());
    expect(result.current.validationResult).toBeNull();
  });
});

// ─── startSession ─────────────────────────────────────────────────────────────

describe('startSession', () => {
  it('sets mode to session', () => {
    const { result } = setup();
    act(() => { result.current.startSession(); });
    expect(result.current.mode).toBe('session');
  });

  it('sets a current sentence from the available pool', () => {
    const { result } = setup();
    act(() => { result.current.startSession(); });
    expect(result.current.currentSentence).not.toBeNull();
  });

  it('respects customSessionCount', () => {
    const { result } = setup();
    act(() => { result.current.setCustomSessionCount(2); });
    act(() => { result.current.startSession(); });
    expect(result.current.sessionQueue).toHaveLength(2);
  });

  it('caps sessionQueue at the pool size', () => {
    const { result } = setup();
    act(() => { result.current.setCustomSessionCount(999); });
    act(() => { result.current.startSession(); });
    // Queue cannot exceed available sentences count
    expect(result.current.sessionQueue.length).toBeLessThanOrEqual(
      result.current.availableSentences.length
    );
  });

  it('resets session stats to zero', () => {
    const { result } = setup();
    act(() => { result.current.startSession(); });
    expect(result.current.sessionStats).toEqual({ correct: 0, total: 0 });
  });

  it('resets isSessionFinished to false', () => {
    const { result } = setup();
    act(() => { result.current.startSession(); });
    expect(result.current.isSessionFinished).toBe(false);
  });
});

// ─── nextSessionSentence ──────────────────────────────────────────────────────

describe('nextSessionSentence', () => {
  it('advances to the next sentence in the queue', () => {
    const { result } = setup();
    act(() => {
      result.current.setCustomSessionCount(2);
      result.current.startSession();
    });
    const first = result.current.currentSentence;
    act(() => { result.current.nextSessionSentence(); });
    const second = result.current.currentSentence;
    // The two sentences should be different (queue has at least 2)
    expect(second?.id).not.toBe(first?.id);
  });

  it('sets isSessionFinished when last sentence is done', () => {
    const { result } = setup();
    act(() => { result.current.setCustomSessionCount(1); });
    act(() => { result.current.startSession(); });
    act(() => { result.current.nextSessionSentence(); });
    expect(result.current.isSessionFinished).toBe(true);
  });

  it('sets currentSentence to null when session ends', () => {
    const { result } = setup();
    act(() => { result.current.setCustomSessionCount(1); });
    act(() => { result.current.startSession(); });
    act(() => { result.current.nextSessionSentence(); });
    expect(result.current.currentSentence).toBeNull();
  });
});

// ─── resetToHome ──────────────────────────────────────────────────────────────

describe('resetToHome', () => {
  it('resets mode to free', () => {
    const { result } = setup();
    act(() => { result.current.startSession(); });
    act(() => { result.current.resetToHome(); });
    expect(result.current.mode).toBe('free');
  });

  it('clears currentSentence', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => { result.current.resetToHome(); });
    expect(result.current.currentSentence).toBeNull();
  });

  it('clears sessionQueue', () => {
    const { result } = setup();
    act(() => { result.current.startSession(); });
    act(() => { result.current.resetToHome(); });
    expect(result.current.sessionQueue).toHaveLength(0);
  });
});

// ─── bijvBep linking ──────────────────────────────────────────────────────────

describe('bijvBep linking', () => {
  it('startBijvBepLinking sets linkingBijvBepId', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => { result.current.startBijvBepLinking('chunk-1'); });
    expect(result.current.linkingBijvBepId).toBe('chunk-1');
  });

  it('cancelBijvBepLinking clears linkingBijvBepId', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => { result.current.startBijvBepLinking('chunk-1'); });
    act(() => { result.current.cancelBijvBepLinking(); });
    expect(result.current.linkingBijvBepId).toBeNull();
  });

  it('completeBijvBepLink saves the link and clears linking mode', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => { result.current.startBijvBepLinking('chunk-1'); });
    act(() => { result.current.completeBijvBepLink('token-5'); });
    expect(result.current.bijvBepLinks['chunk-1']).toBe('token-5');
    expect(result.current.linkingBijvBepId).toBeNull();
  });

  it('removeBijvBepLink removes the link', async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleSentenceSelect(1); });
    act(() => { result.current.startBijvBepLinking('chunk-1'); });
    act(() => { result.current.completeBijvBepLink('token-5'); });
    act(() => { result.current.removeBijvBepLink('chunk-1'); });
    expect(result.current.bijvBepLinks['chunk-1']).toBeUndefined();
  });
});
