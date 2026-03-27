import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAliases,
  setKlasAlias,
  clearKlasAlias,
  setStudentAlias,
  clearStudentAlias,
  applyAliases,
} from './nameAliases';
import type { SessionReport } from './sessionReport';

// Mock localStorage
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

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('setKlasAlias / getAliases', () => {
  it('stores and retrieves a klas alias', () => {
    setKlasAlias('1g/a', '1ga');
    expect(getAliases().klas['1g/a']).toBe('1ga');
  });

  it('normalises keys to lowercase', () => {
    setKlasAlias('1G/A', '1GA');
    expect(getAliases().klas['1g/a']).toBe('1ga');
  });

  it('is a no-op when old and new normalise the same', () => {
    setKlasAlias('1ga', '1ga');
    expect(getAliases().klas['1ga']).toBeUndefined();
  });

  it('is a no-op when either is empty', () => {
    setKlasAlias('', '1ga');
    setKlasAlias('1ga', '');
    expect(Object.keys(getAliases().klas)).toHaveLength(0);
  });
});

describe('clearKlasAlias', () => {
  it('removes the alias', () => {
    setKlasAlias('1g/a', '1ga');
    clearKlasAlias('1g/a');
    expect(getAliases().klas['1g/a']).toBeUndefined();
  });

  it('is a no-op when alias does not exist', () => {
    clearKlasAlias('notexist');
    expect(Object.keys(getAliases().klas)).toHaveLength(0);
  });
});

describe('setStudentAlias / getAliases', () => {
  it('stores and retrieves a student alias', () => {
    setStudentAlias('jan', 'Johannes');
    expect(getAliases().student['jan']).toBe('Johannes');
  });

  it('normalises the old name key to lowercase', () => {
    setStudentAlias('JAN', 'Johannes');
    expect(getAliases().student['jan']).toBe('Johannes');
  });

  it('is a no-op when old name is empty', () => {
    setStudentAlias('', 'Johannes');
    expect(Object.keys(getAliases().student)).toHaveLength(0);
  });
});

describe('clearStudentAlias', () => {
  it('removes the alias', () => {
    setStudentAlias('jan', 'Johannes');
    clearStudentAlias('jan');
    expect(getAliases().student['jan']).toBeUndefined();
  });
});

describe('applyAliases', () => {
  it('renames klas field using stored alias', () => {
    setKlasAlias('1g/a', '1ga');
    const report: SessionReport = { v: 1, name: 'Jan', ts: '', c: 5, t: 10, lvl: 1, err: {}, sids: [], klas: '1g/a' };
    applyAliases(report);
    expect(report.klas).toBe('1ga');
  });

  it('renames student name using stored alias', () => {
    setStudentAlias('jan', 'Johannes');
    const report: SessionReport = { v: 1, name: 'jan', ts: '', c: 5, t: 10, lvl: 1, err: {}, sids: [] };
    applyAliases(report);
    expect(report.name).toBe('Johannes');
  });

  it('is case-insensitive for klas lookup', () => {
    setKlasAlias('1g/a', '1ga');
    const report: SessionReport = { v: 1, name: 'Jan', ts: '', c: 5, t: 10, lvl: 1, err: {}, sids: [], klas: '1G/A' };
    applyAliases(report);
    expect(report.klas).toBe('1ga');
  });

  it('is case-insensitive for student name lookup', () => {
    setStudentAlias('jan', 'Johannes');
    const report: SessionReport = { v: 1, name: 'JAN', ts: '', c: 5, t: 10, lvl: 1, err: {}, sids: [] };
    applyAliases(report);
    expect(report.name).toBe('Johannes');
  });

  it('leaves report unchanged when no alias matches', () => {
    const report: SessionReport = { v: 1, name: 'Piet', ts: '', c: 5, t: 10, lvl: 1, err: {}, sids: [], klas: '2a' };
    applyAliases(report);
    expect(report.name).toBe('Piet');
    expect(report.klas).toBe('2a');
  });

  it('handles report without klas field', () => {
    setKlasAlias('1ga', '1ga-nieuw');
    const report: SessionReport = { v: 1, name: 'Piet', ts: '', c: 5, t: 10, lvl: 1, err: {}, sids: [] };
    expect(() => applyAliases(report)).not.toThrow();
    expect(report.klas).toBeUndefined();
  });

  it('applies both klas and student alias in one call', () => {
    setKlasAlias('1g/a', '1ga');
    setStudentAlias('jan', 'Johannes');
    const report: SessionReport = { v: 1, name: 'jan', ts: '', c: 5, t: 10, lvl: 1, err: {}, sids: [], klas: '1g/a' };
    applyAliases(report);
    expect(report.klas).toBe('1ga');
    expect(report.name).toBe('Johannes');
  });
});
