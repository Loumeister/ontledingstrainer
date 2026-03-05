import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadUsageData,
  saveUsageData,
  getOrCreate,
  recordAttempt,
  recordShowAnswer,
  updateTeacherData,
  clearUsageData,
} from './usageData';
import type { SentenceUsageData } from './types';

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

describe('loadUsageData', () => {
  it('returns empty object when localStorage is empty', () => {
    expect(loadUsageData()).toEqual({});
  });

  it('returns parsed data from localStorage', () => {
    const data = { 1: { attempts: 5, perfectCount: 2, showAnswerCount: 1, roleErrors: {}, splitErrors: 0, flagged: false, note: '', lastAttempted: '' } };
    store['zinsontleding_usage_v1'] = JSON.stringify(data);
    expect(loadUsageData()).toEqual(data);
  });

  it('returns empty object on parse error', () => {
    store['zinsontleding_usage_v1'] = 'not-json';
    expect(loadUsageData()).toEqual({});
  });
});

describe('saveUsageData', () => {
  it('saves data to localStorage', () => {
    const data = { 42: { attempts: 1, perfectCount: 0, showAnswerCount: 0, roleErrors: {}, splitErrors: 0, flagged: false, note: '', lastAttempted: '' } };
    saveUsageData(data as Record<number, SentenceUsageData>);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('zinsontleding_usage_v1', JSON.stringify(data));
  });
});

describe('getOrCreate', () => {
  it('creates a new entry when sentenceId is not in store', () => {
    const storeData: Record<number, SentenceUsageData> = {};
    const entry = getOrCreate(storeData, 100);
    expect(entry.attempts).toBe(0);
    expect(entry.perfectCount).toBe(0);
    expect(entry.showAnswerCount).toBe(0);
    expect(entry.roleErrors).toEqual({});
    expect(entry.splitErrors).toBe(0);
    expect(entry.flagged).toBe(false);
    expect(entry.note).toBe('');
    expect(entry.lastAttempted).toBe('');
  });

  it('returns existing entry when sentenceId is present', () => {
    const storeData: Record<number, SentenceUsageData> = {
      100: { attempts: 3, perfectCount: 1, showAnswerCount: 0, roleErrors: { 'PV': 2 }, splitErrors: 1, flagged: true, note: 'test', lastAttempted: '2025-01-01' },
    };
    const entry = getOrCreate(storeData, 100);
    expect(entry.attempts).toBe(3);
    expect(entry.flagged).toBe(true);
  });
});

describe('recordAttempt', () => {
  it('increments attempts and records role errors', () => {
    recordAttempt(1, false, { 'Onderwerp': 1, 'Persoonsvorm': 2 }, 1);
    const data = loadUsageData();
    expect(data[1].attempts).toBe(1);
    expect(data[1].perfectCount).toBe(0);
    expect(data[1].roleErrors['Onderwerp']).toBe(1);
    expect(data[1].roleErrors['Persoonsvorm']).toBe(2);
    expect(data[1].splitErrors).toBe(1);
    expect(data[1].lastAttempted).toBeTruthy();
  });

  it('increments perfectCount when isPerfect', () => {
    recordAttempt(2, true, {}, 0);
    const data = loadUsageData();
    expect(data[2].perfectCount).toBe(1);
  });

  it('accumulates over multiple calls', () => {
    recordAttempt(3, false, { 'Onderwerp': 1 }, 1);
    recordAttempt(3, true, { 'Onderwerp': 2 }, 0);
    const data = loadUsageData();
    expect(data[3].attempts).toBe(2);
    expect(data[3].perfectCount).toBe(1);
    expect(data[3].roleErrors['Onderwerp']).toBe(3);
    expect(data[3].splitErrors).toBe(1);
  });
});

describe('recordShowAnswer', () => {
  it('increments showAnswerCount', () => {
    recordShowAnswer(10);
    recordShowAnswer(10);
    const data = loadUsageData();
    expect(data[10].showAnswerCount).toBe(2);
    expect(data[10].lastAttempted).toBeTruthy();
  });
});

describe('updateTeacherData', () => {
  it('patches flagged and note fields', () => {
    recordAttempt(20, true, {}, 0);
    updateTeacherData(20, { flagged: true, note: 'Moeilijke zin' });
    const data = loadUsageData();
    expect(data[20].flagged).toBe(true);
    expect(data[20].note).toBe('Moeilijke zin');
    // Should not reset other fields
    expect(data[20].attempts).toBe(1);
  });

  it('creates entry if not existing', () => {
    updateTeacherData(99, { flagged: true });
    const data = loadUsageData();
    expect(data[99].flagged).toBe(true);
    expect(data[99].attempts).toBe(0);
  });
});

describe('clearUsageData', () => {
  it('removes usage data from localStorage', () => {
    recordAttempt(1, true, {}, 0);
    clearUsageData();
    expect(loadUsageData()).toEqual({});
  });
});
