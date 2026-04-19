import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSubmissions,
  saveSubmission,
  getSubmissionsForExercise,
  getSubmissionsForStudent,
  generateSubmissionId,
} from './labSubmissionStore';
import type { LabSubmission } from '../types';

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

const KEY = 'zinsdeellab_submissions_v1';

function makeSub(id: string, overrides: Partial<LabSubmission> = {}): LabSubmission {
  return {
    domain: 'lab',
    id,
    exerciseId: 'ex-001',
    exerciseVersion: 1,
    studentName: 'Piet',
    studentKlas: '2A',
    startedAt: '2026-01-01T10:00:00.000Z',
    constructionValid: true,
    builtSentence: 'De leerling leest.',
    usedHint: false,
    ...overrides,
  };
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('getSubmissions', () => {
  it('geeft lege array terug als storage leeg is', () => {
    expect(getSubmissions()).toEqual([]);
  });

  it('normaliseert records zonder domain-veld', () => {
    const raw = makeSub('sub-1');
    // @ts-expect-error simuleer legacy record
    delete raw.domain;
    store[KEY] = JSON.stringify([raw]);
    expect(getSubmissions()[0].domain).toBe('lab');
  });

  it('geeft lege array terug bij ongeldig JSON', () => {
    store[KEY] = 'GEEN JSON{';
    expect(getSubmissions()).toEqual([]);
  });
});

describe('saveSubmission', () => {
  it('voegt een nieuwe submission toe', () => {
    saveSubmission(makeSub('sub-1'));
    expect(getSubmissions()).toHaveLength(1);
  });

  it('overschrijft een bestaande submission op id (upsert)', () => {
    saveSubmission(makeSub('sub-1', { studentName: 'Oud' }));
    saveSubmission(makeSub('sub-1', { studentName: 'Nieuw' }));
    expect(getSubmissions()).toHaveLength(1);
    expect(getSubmissions()[0].studentName).toBe('Nieuw');
  });

  it('zorgt altijd dat domain: lab aanwezig is', () => {
    const sub = makeSub('sub-1');
    // @ts-expect-error verwijder domain om migratie te testen
    delete sub.domain;
    saveSubmission(sub as LabSubmission);
    expect(getSubmissions()[0].domain).toBe('lab');
  });

  it('trimt tot 500 submissions bij overschrijding', () => {
    const subs = Array.from({ length: 500 }, (_, i) => makeSub(`sub-${i}`));
    store[KEY] = JSON.stringify(subs);
    saveSubmission(makeSub('sub-nieuw'));
    expect(getSubmissions()).toHaveLength(500);
  });
});

describe('getSubmissionsForExercise', () => {
  it('filtert op exerciseId', () => {
    saveSubmission(makeSub('sub-1', { exerciseId: 'ex-001' }));
    saveSubmission(makeSub('sub-2', { exerciseId: 'ex-002' }));
    expect(getSubmissionsForExercise('ex-001')).toHaveLength(1);
    expect(getSubmissionsForExercise('ex-002')).toHaveLength(1);
  });

  it('geeft lege array voor onbekend exerciseId', () => {
    saveSubmission(makeSub('sub-1', { exerciseId: 'ex-001' }));
    expect(getSubmissionsForExercise('ex-999')).toHaveLength(0);
  });
});

describe('getSubmissionsForStudent', () => {
  it('filtert op studentName (case-insensitief)', () => {
    saveSubmission(makeSub('sub-1', { studentName: 'Piet' }));
    saveSubmission(makeSub('sub-2', { studentName: 'Jan' }));
    expect(getSubmissionsForStudent('piet')).toHaveLength(1);
    expect(getSubmissionsForStudent('PIET')).toHaveLength(1);
  });

  it('trim whitespace in studentName', () => {
    saveSubmission(makeSub('sub-1', { studentName: 'Piet' }));
    expect(getSubmissionsForStudent('  Piet  ')).toHaveLength(1);
  });
});

describe('generateSubmissionId', () => {
  it('geeft een string terug die begint met "sub-"', () => {
    expect(generateSubmissionId()).toMatch(/^sub-/);
  });

  it('genereert unieke ids', () => {
    const a = generateSubmissionId();
    const b = generateSubmissionId();
    expect(a).not.toBe(b);
  });
});
