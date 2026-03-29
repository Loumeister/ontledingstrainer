import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSubmissions,
  saveSubmission,
  getSubmissionsForStudent,
  getSubmissionsForAssignment,
  getAttempts,
  saveAttempt,
  getAttemptsForSubmission,
  generateSubmissionId,
  generateAttemptId,
} from './trainerSubmissionStore';
import type { TrainerSubmission, TrainerAttempt } from '../types';

// ── localStorage mock ──────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
  localStorageMock.clear();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSub(overrides: Partial<TrainerSubmission> = {}): TrainerSubmission {
  return {
    id: generateSubmissionId(),
    studentId: 'std-001',
    studentName: 'Emma',
    studentKlas: '2hv1',
    assignmentId: null,
    assignmentVersion: null,
    startedAt: '2026-01-01T10:00:00.000Z',
    completedAt: '2026-01-01T10:15:00.000Z',
    scoreCorrect: 8,
    scoreTotal: 10,
    levelPlayed: 2,
    showAnswerCount: 1,
    durationSeconds: 900,
    mistakeStats: { ow: 1, bwb: 1 },
    ...overrides,
  };
}

function makeAttempt(overrides: Partial<TrainerAttempt> = {}): TrainerAttempt {
  return {
    id: generateAttemptId(),
    submissionId: 'tsub-001',
    sentenceId: 42,
    startedAt: '2026-01-01T10:00:00.000Z',
    scoreCorrect: 3,
    scoreTotal: 4,
    showAnswerUsed: false,
    splitIndices: [2, 4],
    userLabels: { s42t1: 'ow', s42t3: 'pv' },
    ...overrides,
  };
}

// ── ID generator tests ────────────────────────────────────────────────────────

describe('generateSubmissionId', () => {
  it('starts with tsub-', () => {
    expect(generateSubmissionId()).toMatch(/^tsub-/);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 20 }, generateSubmissionId));
    expect(ids.size).toBe(20);
  });
});

describe('generateAttemptId', () => {
  it('starts with tatt-', () => {
    expect(generateAttemptId()).toMatch(/^tatt-/);
  });
});

// ── Submission tests ──────────────────────────────────────────────────────────

describe('getSubmissions', () => {
  it('returns empty array when store is empty', () => {
    expect(getSubmissions()).toEqual([]);
  });

  it('returns empty array on corrupted JSON', () => {
    store['zinsontleding_submissions_v1'] = 'bad';
    expect(getSubmissions()).toEqual([]);
  });
});

describe('saveSubmission', () => {
  it('inserts a new submission', () => {
    saveSubmission(makeSub({ id: 'tsub-001' }));
    expect(getSubmissions()).toHaveLength(1);
  });

  it('updates an existing submission (upsert)', () => {
    const sub = makeSub({ id: 'tsub-001' });
    saveSubmission(sub);
    saveSubmission({ ...sub, scoreCorrect: 10 });
    expect(getSubmissions()).toHaveLength(1);
    expect(getSubmissions()[0].scoreCorrect).toBe(10);
  });

  it('trims to 500 entries when limit exceeded', () => {
    for (let i = 0; i < 505; i++) {
      saveSubmission(makeSub({ id: `tsub-${i}` }));
    }
    expect(getSubmissions()).toHaveLength(500);
  });
});

describe('getSubmissionsForStudent', () => {
  it('returns only submissions for the given studentId', () => {
    saveSubmission(makeSub({ id: 'tsub-1', studentId: 'std-A' }));
    saveSubmission(makeSub({ id: 'tsub-2', studentId: 'std-B' }));
    expect(getSubmissionsForStudent('std-A')).toHaveLength(1);
  });

  it('returns empty array when no match', () => {
    saveSubmission(makeSub({ id: 'tsub-1', studentId: 'std-A' }));
    expect(getSubmissionsForStudent('std-X')).toHaveLength(0);
  });
});

describe('getSubmissionsForAssignment', () => {
  it('returns submissions for the given assignmentId', () => {
    saveSubmission(makeSub({ id: 'tsub-1', assignmentId: 'asgn-1', assignmentVersion: 1 }));
    saveSubmission(makeSub({ id: 'tsub-2', assignmentId: 'asgn-2', assignmentVersion: 1 }));
    expect(getSubmissionsForAssignment('asgn-1')).toHaveLength(1);
  });

  it('filters by version when provided', () => {
    saveSubmission(makeSub({ id: 'tsub-1', assignmentId: 'asgn-1', assignmentVersion: 1 }));
    saveSubmission(makeSub({ id: 'tsub-2', assignmentId: 'asgn-1', assignmentVersion: 2 }));
    expect(getSubmissionsForAssignment('asgn-1', 1)).toHaveLength(1);
    expect(getSubmissionsForAssignment('asgn-1')).toHaveLength(2);
  });
});

// ── Attempt tests ─────────────────────────────────────────────────────────────

describe('getAttempts', () => {
  it('returns empty array when store is empty', () => {
    expect(getAttempts()).toEqual([]);
  });
});

describe('saveAttempt', () => {
  it('inserts a new attempt', () => {
    saveAttempt(makeAttempt({ id: 'tatt-1' }));
    expect(getAttempts()).toHaveLength(1);
  });

  it('updates existing attempt (upsert)', () => {
    const att = makeAttempt({ id: 'tatt-1' });
    saveAttempt(att);
    saveAttempt({ ...att, scoreCorrect: 4 });
    expect(getAttempts()).toHaveLength(1);
    expect(getAttempts()[0].scoreCorrect).toBe(4);
  });

  it('trims to 2000 entries when limit exceeded', () => {
    for (let i = 0; i < 2005; i++) {
      saveAttempt(makeAttempt({ id: `tatt-${i}` }));
    }
    expect(getAttempts()).toHaveLength(2000);
  });
});

describe('getAttemptsForSubmission', () => {
  it('returns only attempts for the given submissionId', () => {
    saveAttempt(makeAttempt({ id: 'tatt-1', submissionId: 'tsub-A' }));
    saveAttempt(makeAttempt({ id: 'tatt-2', submissionId: 'tsub-B' }));
    expect(getAttemptsForSubmission('tsub-A')).toHaveLength(1);
  });
});
