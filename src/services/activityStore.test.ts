import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TrainerSubmission, LabSubmission } from '../types';

// ── Mock de onderliggende stores ─────────────────────────────────────────────

const mockTrainerSubs: TrainerSubmission[] = [];
const mockLabSubs: LabSubmission[] = [];

vi.mock('./trainerSubmissionStore', () => ({
  getSubmissions: () => mockTrainerSubs,
}));

vi.mock('./labSubmissionStore', () => ({
  getSubmissions: () => mockLabSubs,
}));

// Import NA de mocks zodat vi.mock al actief is
const { getAllSubmissions, getTrainerSubmissions, getLabSubmissions, getAllSubmissionsForStudent, getAllSubmissionsForKlas } =
  await import('./activityStore');

// ── Factory helpers ──────────────────────────────────────────────────────────

function makeTrainer(overrides: Partial<TrainerSubmission> = {}): TrainerSubmission {
  return {
    domain: 'trainer',
    id: `tsub-${Math.random()}`,
    studentId: 'std-001',
    studentName: 'Piet',
    studentKlas: '2A',
    assignmentId: null,
    assignmentVersion: null,
    startedAt: '2026-01-01T10:00:00.000Z',
    scoreCorrect: 7,
    scoreTotal: 10,
    levelPlayed: 1,
    showAnswerCount: 0,
    durationSeconds: 120,
    mistakeStats: {},
    ...overrides,
  };
}

function makeLab(overrides: Partial<LabSubmission> = {}): LabSubmission {
  return {
    domain: 'lab',
    id: `lsub-${Math.random()}`,
    exerciseId: 'ex-001',
    exerciseVersion: 1,
    studentName: 'Piet',
    studentKlas: '2A',
    startedAt: '2026-01-02T10:00:00.000Z',
    constructionValid: true,
    builtSentence: 'De leerling leest het boek.',
    usedHint: false,
    ...overrides,
  };
}

beforeEach(() => {
  mockTrainerSubs.length = 0;
  mockLabSubs.length = 0;
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('getTrainerSubmissions', () => {
  it('geeft trainer-submissions terug met domain: trainer', () => {
    mockTrainerSubs.push(makeTrainer());
    const result = getTrainerSubmissions();
    expect(result).toHaveLength(1);
    expect(result[0].domain).toBe('trainer');
  });

  it('normaliseert records zonder domain-veld', () => {
    const raw = makeTrainer();
    // @ts-expect-error simuleer legacy record zonder domain
    delete raw.domain;
    mockTrainerSubs.push(raw);
    expect(getTrainerSubmissions()[0].domain).toBe('trainer');
  });
});

describe('getLabSubmissions', () => {
  it('geeft lab-submissions terug met domain: lab', () => {
    mockLabSubs.push(makeLab());
    const result = getLabSubmissions();
    expect(result).toHaveLength(1);
    expect(result[0].domain).toBe('lab');
  });

  it('normaliseert records zonder domain-veld', () => {
    const raw = makeLab();
    // @ts-expect-error simuleer legacy record zonder domain
    delete raw.domain;
    mockLabSubs.push(raw);
    expect(getLabSubmissions()[0].domain).toBe('lab');
  });
});

describe('getAllSubmissions', () => {
  it('combineert trainer en lab submissions', () => {
    mockTrainerSubs.push(makeTrainer());
    mockLabSubs.push(makeLab());
    expect(getAllSubmissions()).toHaveLength(2);
  });

  it('sorteert op startedAt (oudste eerst)', () => {
    mockTrainerSubs.push(makeTrainer({ startedAt: '2026-01-03T00:00:00.000Z' }));
    mockLabSubs.push(makeLab({ startedAt: '2026-01-01T00:00:00.000Z' }));
    const result = getAllSubmissions();
    expect(result[0].startedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result[1].startedAt).toBe('2026-01-03T00:00:00.000Z');
  });

  it('geeft lege array als beide stores leeg zijn', () => {
    expect(getAllSubmissions()).toHaveLength(0);
  });
});

describe('getAllSubmissionsForStudent', () => {
  it('filtert op studentId bij trainer-submissions', () => {
    mockTrainerSubs.push(makeTrainer({ studentId: 'std-001', studentName: 'Piet' }));
    mockTrainerSubs.push(makeTrainer({ studentId: 'std-002', studentName: 'Jan' }));
    const result = getAllSubmissionsForStudent('std-001');
    expect(result).toHaveLength(1);
  });

  it('filtert op naam (case-insensitief) als fallback bij trainer', () => {
    mockTrainerSubs.push(makeTrainer({ studentName: 'PIET' }));
    expect(getAllSubmissionsForStudent('piet')).toHaveLength(1);
  });

  it('filtert lab-submissions op naam', () => {
    mockLabSubs.push(makeLab({ studentName: 'Piet' }));
    mockLabSubs.push(makeLab({ studentName: 'Jan' }));
    expect(getAllSubmissionsForStudent('piet')).toHaveLength(1);
  });

  it('trim whitespace in naam', () => {
    mockLabSubs.push(makeLab({ studentName: 'Piet' }));
    expect(getAllSubmissionsForStudent('  Piet  ')).toHaveLength(1);
  });
});

describe('getAllSubmissionsForKlas', () => {
  it('filtert op klasnaam (case-insensitief)', () => {
    mockTrainerSubs.push(makeTrainer({ studentKlas: '2A' }));
    mockLabSubs.push(makeLab({ studentKlas: '2A' }));
    mockTrainerSubs.push(makeTrainer({ studentKlas: '3B' }));
    const result = getAllSubmissionsForKlas('2a');
    expect(result).toHaveLength(2);
  });

  it('geeft lege array voor onbekende klas', () => {
    mockTrainerSubs.push(makeTrainer({ studentKlas: '2A' }));
    expect(getAllSubmissionsForKlas('9Z')).toHaveLength(0);
  });
});
