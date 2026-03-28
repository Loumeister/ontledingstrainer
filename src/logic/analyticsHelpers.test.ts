import { describe, it, expect } from 'vitest';
import {
  computeTrainerStudentProgress,
  computeTrainerClassProgress,
  computeRoleErrorPatterns,
  computeAssignmentParticipation,
  buildTrainerSubmissionFromReport,
} from './analyticsHelpers';
import type { TrainerSubmission } from '../types';
import type { SessionReport } from '../services/sessionReport';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSub(overrides: Partial<TrainerSubmission> = {}): TrainerSubmission {
  return {
    id: 'tsub-1',
    studentId: 'std-A',
    studentName: 'Emma',
    studentKlas: '2hv1',
    assignmentId: null,
    assignmentVersion: null,
    startedAt: '2026-01-01T10:00:00.000Z',
    completedAt: '2026-01-01T10:15:00.000Z',
    scoreCorrect: 8,
    scoreTotal: 10,
    levelPlayed: 2,
    showAnswerCount: 0,
    durationSeconds: 900,
    mistakeStats: { ow: 2, bwb: 1 },
    ...overrides,
  };
}

function makeReport(overrides: Partial<SessionReport> = {}): SessionReport {
  return {
    v: 1,
    name: 'Test',
    klas: '1ga',
    ts: '2026-01-15T09:00:00.000Z',
    c: 7,
    t: 10,
    lvl: 2,
    err: { pv: 2, ow: 1 },
    sids: [1, 2, 3],
    ...overrides,
  };
}

// ── computeTrainerStudentProgress ─────────────────────────────────────────────

describe('computeTrainerStudentProgress', () => {
  it('returns zero-summary for student with no submissions', () => {
    const result = computeTrainerStudentProgress([], 'std-X');
    expect(result.sessionCount).toBe(0);
    expect(result.avgScore).toBe(0);
    expect(result.scoreHistory).toHaveLength(0);
  });

  it('ignores incomplete (no completedAt) submissions', () => {
    const sub = makeSub({ id: 'tsub-1', studentId: 'std-A', completedAt: undefined });
    const result = computeTrainerStudentProgress([sub], 'std-A');
    expect(result.sessionCount).toBe(0);
  });

  it('calculates correct avgScore', () => {
    const subs = [
      makeSub({ id: 'tsub-1', studentId: 'std-A', scoreCorrect: 8, scoreTotal: 10 }),
      makeSub({ id: 'tsub-2', studentId: 'std-A', scoreCorrect: 6, scoreTotal: 10 }),
    ];
    const result = computeTrainerStudentProgress(subs, 'std-A');
    expect(result.avgScore).toBeCloseTo(70);
  });

  it('returns bestScore and latestScore correctly', () => {
    const subs = [
      makeSub({ id: 'tsub-1', studentId: 'std-A', scoreCorrect: 6, scoreTotal: 10, startedAt: '2026-01-01T08:00:00.000Z', completedAt: '2026-01-01T08:10:00.000Z' }),
      makeSub({ id: 'tsub-2', studentId: 'std-A', scoreCorrect: 9, scoreTotal: 10, startedAt: '2026-01-02T08:00:00.000Z', completedAt: '2026-01-02T08:10:00.000Z' }),
    ];
    const result = computeTrainerStudentProgress(subs, 'std-A');
    expect(result.bestScore).toBeCloseTo(90);
    expect(result.latestScore).toBeCloseTo(90);
  });

  it('aggregates topErrors from mistakeStats', () => {
    const subs = [
      makeSub({ id: 'tsub-1', studentId: 'std-A', mistakeStats: { ow: 3 } }),
      makeSub({ id: 'tsub-2', studentId: 'std-A', mistakeStats: { ow: 2, bwb: 4 } }),
    ];
    const result = computeTrainerStudentProgress(subs, 'std-A');
    const owEntry = result.topErrors.find(e => e.role === 'ow');
    const bwbEntry = result.topErrors.find(e => e.role === 'bwb');
    expect(owEntry?.count).toBe(5);
    expect(bwbEntry?.count).toBe(4);
  });

  it('only includes own submissions (not other students)', () => {
    const subs = [
      makeSub({ id: 'tsub-1', studentId: 'std-A' }),
      makeSub({ id: 'tsub-2', studentId: 'std-B' }),
    ];
    const result = computeTrainerStudentProgress(subs, 'std-A');
    expect(result.sessionCount).toBe(1);
  });
});

// ── computeTrainerClassProgress ───────────────────────────────────────────────

describe('computeTrainerClassProgress', () => {
  it('returns zero-summary for empty submissions', () => {
    const result = computeTrainerClassProgress([], '2hv1');
    expect(result.sessionCount).toBe(0);
    expect(result.avgScore).toBe(0);
  });

  it('filters by klas case-insensitively', () => {
    const subs = [
      makeSub({ id: 'tsub-1', studentKlas: '2HV1' }),
      makeSub({ id: 'tsub-2', studentKlas: '3vw2' }),
    ];
    const result = computeTrainerClassProgress(subs, '2hv1');
    expect(result.sessionCount).toBe(1);
  });

  it('calculates participationRate with knownStudentIds', () => {
    const subs = [
      makeSub({ id: 'tsub-1', studentId: 'std-A', studentKlas: '1ga' }),
    ];
    const result = computeTrainerClassProgress(subs, '1ga', ['std-A', 'std-B', 'std-C']);
    expect(result.participationRate).toBeCloseTo(1 / 3);
  });

  it('participationRate is 1 when no knownStudentIds given and all submitted', () => {
    const subs = [
      makeSub({ id: 'tsub-1', studentId: 'std-A', studentKlas: '1ga' }),
    ];
    const result = computeTrainerClassProgress(subs, '1ga');
    expect(result.participationRate).toBe(1);
  });
});

// ── computeRoleErrorPatterns ──────────────────────────────────────────────────

describe('computeRoleErrorPatterns', () => {
  it('returns empty array for no submissions', () => {
    expect(computeRoleErrorPatterns([])).toEqual([]);
  });

  it('aggregates errors across submissions', () => {
    const subs = [
      makeSub({ id: 'tsub-1', studentId: 'std-A', mistakeStats: { ow: 3, pv: 1 } }),
      makeSub({ id: 'tsub-2', studentId: 'std-B', mistakeStats: { ow: 2 } }),
    ];
    const result = computeRoleErrorPatterns(subs);
    const ow = result.find(r => r.role === 'ow');
    expect(ow?.totalErrors).toBe(5);
    expect(ow?.affectedStudents).toBe(2);
  });

  it('sorts by totalErrors descending', () => {
    const subs = [
      makeSub({ id: 'tsub-1', mistakeStats: { bwb: 1, ow: 5 } }),
    ];
    const result = computeRoleErrorPatterns(subs);
    expect(result[0].role).toBe('ow');
  });
});

// ── computeAssignmentParticipation ────────────────────────────────────────────

describe('computeAssignmentParticipation', () => {
  it('returns zeros for empty submissions', () => {
    const result = computeAssignmentParticipation('asgn-1', 1, []);
    expect(result.submissionCount).toBe(0);
    expect(result.uniqueStudents).toBe(0);
  });

  it('filters by assignmentId and version', () => {
    const subs = [
      makeSub({ id: 'tsub-1', assignmentId: 'asgn-1', assignmentVersion: 1 }),
      makeSub({ id: 'tsub-2', assignmentId: 'asgn-1', assignmentVersion: 2 }),
      makeSub({ id: 'tsub-3', assignmentId: 'asgn-2', assignmentVersion: 1 }),
    ];
    const result = computeAssignmentParticipation('asgn-1', 1, subs);
    expect(result.submissionCount).toBe(1);
  });

  it('calculates completionRate correctly', () => {
    const subs = [
      makeSub({ id: 'tsub-1', assignmentId: 'asgn-1', assignmentVersion: 1, completedAt: '2026-01-01T10:15:00.000Z' }),
      makeSub({ id: 'tsub-2', assignmentId: 'asgn-1', assignmentVersion: 1, completedAt: undefined }),
    ];
    const result = computeAssignmentParticipation('asgn-1', 1, subs);
    expect(result.completionRate).toBeCloseTo(0.5);
  });

  it('counts unique students', () => {
    const subs = [
      makeSub({ id: 'tsub-1', studentId: 'std-A', assignmentId: 'asgn-1', assignmentVersion: 1 }),
      makeSub({ id: 'tsub-2', studentId: 'std-A', assignmentId: 'asgn-1', assignmentVersion: 1 }),
      makeSub({ id: 'tsub-3', studentId: 'std-B', assignmentId: 'asgn-1', assignmentVersion: 1 }),
    ];
    const result = computeAssignmentParticipation('asgn-1', 1, subs);
    expect(result.uniqueStudents).toBe(2);
  });
});

// ── buildTrainerSubmissionFromReport ─────────────────────────────────────────

describe('buildTrainerSubmissionFromReport', () => {
  it('maps basic fields correctly', () => {
    const report = makeReport({ name: 'Lisa', klas: '1ga', c: 7, t: 10 });
    const sub = buildTrainerSubmissionFromReport(report);
    expect(sub.studentName).toBe('Lisa');
    expect(sub.studentKlas).toBe('1ga');
    expect(sub.scoreCorrect).toBe(7);
    expect(sub.scoreTotal).toBe(10);
  });

  it('maps err to mistakeStats', () => {
    const report = makeReport({ err: { ow: 2, pv: 1 } });
    const sub = buildTrainerSubmissionFromReport(report);
    expect(sub.mistakeStats).toEqual({ ow: 2, pv: 1 });
  });

  it('maps dur to durationSeconds', () => {
    const report = makeReport({ dur: 600 });
    const sub = buildTrainerSubmissionFromReport(report);
    expect(sub.durationSeconds).toBe(600);
  });

  it('generates a legacy id from timestamp', () => {
    const report = makeReport({ ts: '2026-01-15T09:00:00.000Z' });
    const sub = buildTrainerSubmissionFromReport(report);
    expect(sub.id).toMatch(/^legacy-/);
  });

  it('handles missing optional fields gracefully', () => {
    const report = makeReport({ hint: undefined, dur: undefined, klas: undefined });
    const sub = buildTrainerSubmissionFromReport(report);
    expect(sub.showAnswerCount).toBe(0);
    expect(sub.durationSeconds).toBeNull();
    expect(sub.studentKlas).toBe('');
  });
});
