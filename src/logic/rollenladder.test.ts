import { describe, it, expect } from 'vitest';
import {
  LADDER_STAGES,
  getLadderStage,
  isRoleActiveInStage,
  getLadderSentenceFilter,
  computeLadderPromotion,
  filterValidationForStage,
} from './rollenladder';
import type { Sentence, Token } from '../types';
import type { ChunkData, ValidationResult } from './validation';

// --- Helpers ---

function makeToken(role: string, id = 'w1', text = 'woord'): Token {
  return { id, text, role: role as Token['role'] };
}

function makeChunk(tokens: Token[]): ChunkData {
  return { tokens, originalIndices: tokens.map((_, i) => i) };
}

function makeValidationResult(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    score: 2,
    total: 2,
    chunkStatus: { 0: 'correct', 1: 'correct' },
    chunkFeedback: {},
    isPerfect: true,
    bijzinWarningChunks: [],
    ...overrides,
  };
}

function makeSentence(level: number, roles: string[]): Sentence {
  const tokens: Token[] = roles.map((r, i) => makeToken(r, `w${i}`, `woord${i}`));
  return {
    id: 1,
    label: 'test',
    tokens,
    predicateType: 'WG',
    level: level as Sentence['level'],
  };
}

// --- LADDER_STAGES ---

describe('LADDER_STAGES', () => {
  it('has 8 stages', () => {
    expect(LADDER_STAGES).toHaveLength(8);
  });

  it('stage ids are 1 through 8', () => {
    const ids = LADDER_STAGES.map(s => s.id);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('stage 3 adds wg and ng (alle werkwoorden) vs stage 2', () => {
    const s2 = getLadderStage(2)!;
    const s3 = getLadderStage(3)!;
    const added = s3.activeRoles.filter(r => !s2.activeRoles.includes(r));
    expect(added).toEqual(expect.arrayContaining(['wg', 'ng']));
    expect(added).toHaveLength(2);
  });

  it('stage 3 maxSentenceLevel is 1 (stage 2 is 0)', () => {
    expect(getLadderStage(2)!.maxSentenceLevel).toBe(0);
    expect(getLadderStage(3)!.maxSentenceLevel).toBe(1);
  });

  it('stage 4 adds wwd and nwd vs stage 3', () => {
    const s3 = getLadderStage(3)!;
    const s4 = getLadderStage(4)!;
    const added = s4.activeRoles.filter(r => !s3.activeRoles.includes(r));
    expect(added).toEqual(expect.arrayContaining(['wwd', 'nwd']));
    expect(added).toHaveLength(2);
  });

  it('each stage has cumulative roles (every stage includes all from previous)', () => {
    for (let i = 2; i <= 8; i++) {
      const prev = getLadderStage(i - 1)!;
      const cur = getLadderStage(i)!;
      for (const role of prev.activeRoles) {
        expect(cur.activeRoles).toContain(role);
      }
    }
  });

  it('stage 1 maxSentenceLevel is 0', () => {
    expect(getLadderStage(1)!.maxSentenceLevel).toBe(0);
  });

  it('stage 8 maxSentenceLevel is 4', () => {
    expect(getLadderStage(8)!.maxSentenceLevel).toBe(4);
  });

  it('bijzin and vw_neven only appear from stage 8', () => {
    for (let i = 1; i <= 7; i++) {
      const stage = getLadderStage(i)!;
      expect(stage.activeRoles).not.toContain('bijzin');
      expect(stage.activeRoles).not.toContain('vw_neven');
    }
    const s8 = getLadderStage(8)!;
    expect(s8.activeRoles).toContain('bijzin');
    expect(s8.activeRoles).toContain('vw_neven');
  });

  it('wg and ng appear from stage 3', () => {
    for (let i = 1; i <= 2; i++) {
      expect(getLadderStage(i)!.activeRoles).not.toContain('wg');
      expect(getLadderStage(i)!.activeRoles).not.toContain('ng');
    }
    for (let i = 3; i <= 8; i++) {
      expect(getLadderStage(i)!.activeRoles).toContain('wg');
      expect(getLadderStage(i)!.activeRoles).toContain('ng');
    }
  });

  it('wwd and nwd appear from stage 4', () => {
    for (let i = 1; i <= 3; i++) {
      expect(getLadderStage(i)!.activeRoles).not.toContain('wwd');
      expect(getLadderStage(i)!.activeRoles).not.toContain('nwd');
    }
    for (let i = 4; i <= 8; i++) {
      expect(getLadderStage(i)!.activeRoles).toContain('wwd');
      expect(getLadderStage(i)!.activeRoles).toContain('nwd');
    }
  });

  it('stage 8 includes vw_onder and bijv_bep', () => {
    expect(getLadderStage(8)!.activeRoles).toContain('vw_onder');
    expect(getLadderStage(8)!.activeRoles).toContain('bijv_bep');
  });
});

// --- getLadderStage ---

describe('getLadderStage', () => {
  it('returns stage for valid id', () => {
    expect(getLadderStage(1)?.id).toBe(1);
    expect(getLadderStage(8)?.id).toBe(8);
  });

  it('returns undefined for invalid id', () => {
    expect(getLadderStage(0)).toBeUndefined();
    expect(getLadderStage(9)).toBeUndefined();
  });
});

// --- isRoleActiveInStage ---

describe('isRoleActiveInStage', () => {
  it('pv is active in all stages', () => {
    for (let i = 1; i <= 8; i++) {
      expect(isRoleActiveInStage('pv', i)).toBe(true);
    }
  });

  it('bijzin is active only in stage 8', () => {
    for (let i = 1; i <= 7; i++) {
      expect(isRoleActiveInStage('bijzin', i)).toBe(false);
    }
    expect(isRoleActiveInStage('bijzin', 8)).toBe(true);
  });

  it('wg is not active in stages 1-2, active in 3-8', () => {
    for (let i = 1; i <= 2; i++) {
      expect(isRoleActiveInStage('wg', i)).toBe(false);
    }
    for (let i = 3; i <= 8; i++) {
      expect(isRoleActiveInStage('wg', i)).toBe(true);
    }
  });

  it('lv is active from stage 5', () => {
    for (let i = 1; i <= 4; i++) {
      expect(isRoleActiveInStage('lv', i)).toBe(false);
    }
    for (let i = 5; i <= 8; i++) {
      expect(isRoleActiveInStage('lv', i)).toBe(true);
    }
  });

  it('returns true for unknown stage id', () => {
    expect(isRoleActiveInStage('pv', 99)).toBe(true);
  });
});

// --- getLadderSentenceFilter ---

describe('getLadderSentenceFilter', () => {
  it('excludes sentences above maxSentenceLevel', () => {
    const filter = getLadderSentenceFilter(1);
    expect(filter(makeSentence(0, ['pv', 'ow']))).toBe(true);
    expect(filter(makeSentence(1, ['pv', 'ow', 'wg']))).toBe(false);
  });

  it('excludes bijzin sentences at stages 1-7', () => {
    for (let i = 1; i <= 7; i++) {
      const filter = getLadderSentenceFilter(i);
      // Level-3 sentence with bijzin
      const s = makeSentence(3, ['pv', 'ow', 'bijzin']);
      expect(filter(s)).toBe(false);
    }
  });

  it('allows bijzin sentences at stage 8', () => {
    const filter = getLadderSentenceFilter(8);
    const s = makeSentence(4, ['pv', 'ow', 'bijzin']);
    expect(filter(s)).toBe(true);
  });

  it('allows level 1 sentence at stage 3', () => {
    const filter = getLadderSentenceFilter(3);
    const s = makeSentence(1, ['pv', 'ow', 'wg']);
    expect(filter(s)).toBe(true);
  });

  it('excludes vw_neven sentences at stage 7', () => {
    const filter = getLadderSentenceFilter(7);
    const s = makeSentence(3, ['pv', 'ow', 'vw_neven']);
    expect(filter(s)).toBe(false);
  });

  it('allows sentences up to maxSentenceLevel', () => {
    const filter = getLadderSentenceFilter(7);
    expect(filter(makeSentence(3, ['pv', 'ow', 'bwb']))).toBe(true);
    expect(filter(makeSentence(4, ['pv', 'ow']))).toBe(false);
  });
});

// --- computeLadderPromotion ---

describe('computeLadderPromotion', () => {
  it('empty array → no promote, no demote, windowScore 0', () => {
    const r = computeLadderPromotion([]);
    expect(r.shouldPromote).toBe(false);
    expect(r.shouldSuggestDemote).toBe(false);
    expect(r.windowScore).toBe(0);
    expect(r.windowSize).toBe(0);
  });

  it('10 perfect scores → shouldPromote true', () => {
    const scores = Array.from({ length: 10 }, () => ({ score: 3, total: 3 }));
    const r = computeLadderPromotion(scores);
    expect(r.shouldPromote).toBe(true);
    expect(r.windowScore).toBe(1);
  });

  it('10 zero scores → shouldSuggestDemote true, shouldPromote false', () => {
    const scores = Array.from({ length: 10 }, () => ({ score: 0, total: 3 }));
    const r = computeLadderPromotion(scores);
    expect(r.shouldPromote).toBe(false);
    expect(r.shouldSuggestDemote).toBe(true);
  });

  it('7/10 ratio = 0.7 < 0.8 → no promote', () => {
    const scores = Array.from({ length: 10 }, (_, i) => ({ score: i < 7 ? 1 : 0, total: 1 }));
    const r = computeLadderPromotion(scores);
    expect(r.shouldPromote).toBe(false);
  });

  it('window not yet full (< 10) → no promote', () => {
    const scores = Array.from({ length: 9 }, () => ({ score: 3, total: 3 }));
    const r = computeLadderPromotion(scores);
    expect(r.shouldPromote).toBe(false);
  });

  it('exactly 80% over 10 sentences → shouldPromote true', () => {
    const scores = Array.from({ length: 10 }, (_, i) => ({ score: i < 8 ? 1 : 0, total: 1 }));
    const r = computeLadderPromotion(scores);
    expect(r.shouldPromote).toBe(true);
  });

  it('uses only last 10 scores for promotion check', () => {
    // 15 scores: first 5 are 0, last 10 are perfect
    const scores = [
      ...Array.from({ length: 5 }, () => ({ score: 0, total: 1 })),
      ...Array.from({ length: 10 }, () => ({ score: 1, total: 1 })),
    ];
    const r = computeLadderPromotion(scores);
    expect(r.shouldPromote).toBe(true);
  });
});

// --- filterValidationForStage ---

describe('filterValidationForStage', () => {
  it('out-of-stage chunks get status null (not assessed) and are excluded from total', () => {
    // Stage 1: only pv is active. Chunk 0 = pv (correct), Chunk 1 = ow (out-of-stage)
    const chunks = [
      makeChunk([makeToken('pv', 'w1')]),
      makeChunk([makeToken('ow', 'w2')]),
    ];
    const vResult = makeValidationResult({
      score: 1,
      total: 2,
      chunkStatus: { 0: 'correct', 1: 'incorrect-role' },
      isPerfect: false,
    });
    const { result } = filterValidationForStage(vResult, {}, 1, chunks);
    expect(result.chunkStatus[1]).toBeNull();
    expect(result.total).toBe(1);
    expect(result.score).toBe(1);
    expect(result.isPerfect).toBe(true);
  });

  it('active-stage mistakes are kept', () => {
    const chunks = [
      makeChunk([makeToken('pv', 'w1')]),
    ];
    const vResult = makeValidationResult({
      score: 0,
      total: 1,
      chunkStatus: { 0: 'incorrect-role' },
      isPerfect: false,
    });
    const mistakes = { Persoonsvorm: 1 };
    const { mistakes: filtered } = filterValidationForStage(vResult, mistakes, 1, chunks);
    expect(filtered['Persoonsvorm']).toBe(1);
  });

  it('out-of-stage mistakes are removed', () => {
    const chunks = [
      makeChunk([makeToken('pv', 'w1')]),
      makeChunk([makeToken('bwb', 'w2')]),
    ];
    const vResult = makeValidationResult({
      score: 0,
      total: 2,
      chunkStatus: { 0: 'incorrect-role', 1: 'incorrect-role' },
      isPerfect: false,
    });
    const mistakes = { Persoonsvorm: 1, 'Bijwoordelijke Bepaling': 1 };
    const { mistakes: filtered } = filterValidationForStage(vResult, mistakes, 1, chunks);
    expect(filtered['Persoonsvorm']).toBe(1);
    expect(filtered['Bijwoordelijke Bepaling']).toBeUndefined();
  });

  it('isPerfect is false when an active-stage chunk is incorrect', () => {
    const chunks = [makeChunk([makeToken('pv', 'w1')])];
    const vResult = makeValidationResult({
      score: 0,
      total: 1,
      chunkStatus: { 0: 'incorrect-role' },
      isPerfect: false,
    });
    const { result } = filterValidationForStage(vResult, {}, 1, chunks);
    expect(result.isPerfect).toBe(false);
  });

  it('returns original result unchanged for unknown stageId', () => {
    const chunks = [makeChunk([makeToken('pv', 'w1')])];
    const vResult = makeValidationResult();
    const { result } = filterValidationForStage(vResult, {}, 99, chunks);
    expect(result).toEqual(vResult);
  });

  it('stage 4 keeps wg/ng chunks in total', () => {
    const chunks = [
      makeChunk([makeToken('pv', 'w1')]),
      makeChunk([makeToken('ow', 'w2')]),
      makeChunk([makeToken('wg', 'w3')]),
    ];
    const vResult = makeValidationResult({
      score: 3,
      total: 3,
      chunkStatus: { 0: 'correct', 1: 'correct', 2: 'correct' },
      isPerfect: true,
    });
    const { result } = filterValidationForStage(vResult, {}, 4, chunks);
    expect(result.total).toBe(3);
    expect(result.score).toBe(3);
  });
});
