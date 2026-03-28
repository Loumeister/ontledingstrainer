import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStudents,
  getStudentById,
  getOrCreateStudent,
  updateStudent,
  migrateFromStudentInfo,
} from './studentStore';

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

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('getStudents', () => {
  it('returns empty array when store is empty', () => {
    expect(getStudents()).toEqual([]);
  });

  it('returns parsed students from localStorage', () => {
    const student = { id: 'std-1', name: 'Lisa', initiaal: 'V', klas: '1ga', createdAt: '2026-01-01T00:00:00.000Z' };
    store['zinsontleding_students_v1'] = JSON.stringify([student]);
    expect(getStudents()).toHaveLength(1);
    expect(getStudents()[0].name).toBe('Lisa');
  });

  it('returns empty array on corrupted JSON', () => {
    store['zinsontleding_students_v1'] = 'not-json';
    expect(getStudents()).toEqual([]);
  });
});

describe('getOrCreateStudent', () => {
  it('creates a new student and returns it', () => {
    const s = getOrCreateStudent('Emma', 'B', '2hv1');
    expect(s.id).toMatch(/^std-/);
    expect(s.name).toBe('Emma');
    expect(s.initiaal).toBe('B');
    expect(s.klas).toBe('2hv1');
    expect(getStudents()).toHaveLength(1);
  });

  it('returns existing student on second call with same name+klas', () => {
    const s1 = getOrCreateStudent('Emma', 'B', '2hv1');
    const s2 = getOrCreateStudent('Emma', 'B', '2hv1');
    expect(s1.id).toBe(s2.id);
    expect(getStudents()).toHaveLength(1);
  });

  it('is case-insensitive for name and klas matching', () => {
    const s1 = getOrCreateStudent('Emma', 'B', '2HV1');
    const s2 = getOrCreateStudent('emma', 'b', '2hv1');
    expect(s1.id).toBe(s2.id);
  });

  it('creates separate records for same name but different klas', () => {
    getOrCreateStudent('Emma', 'B', '2hv1');
    getOrCreateStudent('Emma', 'B', '2hv2');
    expect(getStudents()).toHaveLength(2);
  });

  it('normalises initiaal to uppercase', () => {
    const s = getOrCreateStudent('Tom', 'j', '1ga');
    expect(s.initiaal).toBe('J');
  });

  it('returns a temporary non-persistent record for empty name', () => {
    const s = getOrCreateStudent('', '', '');
    expect(s.id).toMatch(/^std-/);
    // Anonymous records are NOT saved
    expect(getStudents()).toHaveLength(0);
  });
});

describe('getStudentById', () => {
  it('returns null when no students exist', () => {
    expect(getStudentById('nonexistent')).toBeNull();
  });

  it('returns the correct student by id', () => {
    const s = getOrCreateStudent('Jan', 'P', '3vw2');
    const found = getStudentById(s.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Jan');
  });
});

describe('updateStudent', () => {
  it('returns null for unknown id', () => {
    expect(updateStudent('unknown', { name: 'X' })).toBeNull();
  });

  it('updates name and preserves other fields', () => {
    const s = getOrCreateStudent('Oud', 'O', '1ga');
    const updated = updateStudent(s.id, { name: 'Nieuw' });
    expect(updated!.name).toBe('Nieuw');
    expect(updated!.klas).toBe('1ga');
    expect(updated!.id).toBe(s.id);
  });

  it('persists update to localStorage', () => {
    const s = getOrCreateStudent('Test', 'T', '1ga');
    updateStudent(s.id, { klas: '1gb' });
    expect(getStudentById(s.id)!.klas).toBe('1gb');
  });
});

describe('migrateFromStudentInfo', () => {
  it('returns null when student_info_v1 is absent', () => {
    expect(migrateFromStudentInfo()).toBeNull();
  });

  it('returns null when name is empty', () => {
    store['student_info_v1'] = JSON.stringify({ name: '', initiaal: 'A', klas: '1ga' });
    expect(migrateFromStudentInfo()).toBeNull();
  });

  it('creates a student from student_info_v1 data', () => {
    store['student_info_v1'] = JSON.stringify({ name: 'Sofie', initiaal: 'D', klas: '2hv3' });
    const s = migrateFromStudentInfo();
    expect(s).not.toBeNull();
    expect(s!.name).toBe('Sofie');
    expect(getStudents()).toHaveLength(1);
  });

  it('is idempotent — does not create duplicates on repeated calls', () => {
    store['student_info_v1'] = JSON.stringify({ name: 'Sofie', initiaal: 'D', klas: '2hv3' });
    migrateFromStudentInfo();
    migrateFromStudentInfo();
    expect(getStudents()).toHaveLength(1);
  });
});
