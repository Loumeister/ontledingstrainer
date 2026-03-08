import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encodeReport,
  decodeReport,
  buildReport,
  loadReports,
  saveReports,
  addReport,
  clearReports,
  computeAggregateStats,
  SessionReport,
} from './sessionReport';

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

describe('encodeReport / decodeReport', () => {
  it('round-trips a valid report', () => {
    const report: SessionReport = {
      v: 1,
      name: 'Jan',
      ts: '2025-06-01T10:00:00Z',
      c: 8,
      t: 10,
      lvl: 2,
      err: { pv: 1, ow: 1 },
      sids: [101, 102, 103],
    };
    const code = encodeReport(report);
    expect(code.startsWith('v1:')).toBe(true);
    const decoded = decodeReport(code);
    expect(decoded).toEqual(report);
  });

  it('round-trips a report with unicode name', () => {
    const report: SessionReport = {
      v: 1,
      name: 'Ëmma van der Bérg',
      ts: '2025-06-01T10:00:00Z',
      c: 5,
      t: 5,
      lvl: 1,
      err: {},
      sids: [200],
    };
    const code = encodeReport(report);
    const decoded = decodeReport(code);
    expect(decoded).toEqual(report);
  });

  it('returns null for invalid code', () => {
    expect(decodeReport('garbage')).toBeNull();
    expect(decodeReport('v1:notbase64!!!')).toBeNull();
    expect(decodeReport('')).toBeNull();
  });

  it('returns null for wrong version', () => {
    const report = { v: 99, name: 'X', ts: '', c: 0, t: 0, lvl: null, err: {}, sids: [] };
    const base64 = btoa(JSON.stringify(report));
    expect(decodeReport(`v1:${base64}`)).toBeNull();
  });

  it('returns null for missing required fields', () => {
    const partial = { v: 1, name: 'X' }; // missing c and t
    const base64 = btoa(JSON.stringify(partial));
    expect(decodeReport(`v1:${base64}`)).toBeNull();
  });
});

describe('buildReport', () => {
  it('creates a report with correct structure', () => {
    const report = buildReport('Lisa', 7, 10, { pv: 2, ow: 0, lv: 1 }, 3, [1, 2, 3]);
    expect(report.v).toBe(1);
    expect(report.name).toBe('Lisa');
    expect(report.c).toBe(7);
    expect(report.t).toBe(10);
    expect(report.lvl).toBe(3);
    expect(report.err).toEqual({ pv: 2, lv: 1 }); // ow: 0 excluded
    expect(report.sids).toEqual([1, 2, 3]);
    expect(report.ts).toBeTruthy();
  });

  it('omits zero-count errors', () => {
    const report = buildReport('Test', 5, 5, { pv: 0, ow: 0 }, 1, []);
    expect(report.err).toEqual({});
  });
});

describe('loadReports / saveReports / addReport / clearReports', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(loadReports()).toEqual([]);
  });

  it('saves and loads reports', () => {
    const reports: SessionReport[] = [
      { v: 1, name: 'A', ts: '2025-01-01T00:00:00Z', c: 3, t: 5, lvl: 1, err: {}, sids: [] },
    ];
    saveReports(reports);
    expect(loadReports()).toEqual(reports);
  });

  it('addReport appends to existing reports', () => {
    const r1: SessionReport = { v: 1, name: 'A', ts: '2025-01-01T00:00:00Z', c: 3, t: 5, lvl: 1, err: {}, sids: [] };
    const r2: SessionReport = { v: 1, name: 'B', ts: '2025-01-02T00:00:00Z', c: 4, t: 5, lvl: 2, err: { pv: 1 }, sids: [1] };
    addReport(r1);
    addReport(r2);
    const loaded = loadReports();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].name).toBe('A');
    expect(loaded[1].name).toBe('B');
  });

  it('clearReports removes all data', () => {
    addReport({ v: 1, name: 'A', ts: '', c: 0, t: 0, lvl: null, err: {}, sids: [] });
    clearReports();
    expect(loadReports()).toEqual([]);
  });

  it('returns empty array on parse error', () => {
    store['zinsontleding_reports_v1'] = '{invalid';
    expect(loadReports()).toEqual([]);
  });
});

describe('computeAggregateStats', () => {
  it('returns zero stats for empty reports', () => {
    const stats = computeAggregateStats([]);
    expect(stats.totalReports).toBe(0);
    expect(stats.uniqueStudents).toBe(0);
    expect(stats.totalCorrect).toBe(0);
    expect(stats.totalChunks).toBe(0);
    expect(stats.avgScore).toBe(0);
  });

  it('computes correct aggregates from multiple reports', () => {
    const reports: SessionReport[] = [
      { v: 1, name: 'Jan', ts: '2025-06-01T10:00:00Z', c: 8, t: 10, lvl: 2, err: { pv: 1, ow: 1 }, sids: [1, 2] },
      { v: 1, name: 'Lisa', ts: '2025-06-01T14:00:00Z', c: 9, t: 10, lvl: 2, err: { pv: 2 }, sids: [3, 4] },
      { v: 1, name: 'Jan', ts: '2025-06-02T10:00:00Z', c: 10, t: 10, lvl: 3, err: {}, sids: [5, 6] },
    ];
    const stats = computeAggregateStats(reports);
    expect(stats.totalReports).toBe(3);
    expect(stats.uniqueStudents).toBe(2); // Jan + Lisa
    expect(stats.totalCorrect).toBe(27);
    expect(stats.totalChunks).toBe(30);
    expect(stats.avgScore).toBeCloseTo(90.0);
    expect(stats.globalRoleErrors).toEqual({ pv: 3, ow: 1 });
    expect(stats.levelDistribution).toEqual({ 2: 2, 3: 1 });
    expect(stats.reportsPerDay).toEqual({ '2025-06-01': 2, '2025-06-02': 1 });
    expect(stats.studentNames).toEqual(['jan', 'lisa']);
  });

  it('handles reports with empty names', () => {
    const reports: SessionReport[] = [
      { v: 1, name: '', ts: '2025-06-01T10:00:00Z', c: 5, t: 5, lvl: 1, err: {}, sids: [] },
    ];
    const stats = computeAggregateStats(reports);
    expect(stats.uniqueStudents).toBe(0); // empty name not counted
    expect(stats.totalReports).toBe(1);
  });

  it('deduplicates student names case-insensitively', () => {
    const reports: SessionReport[] = [
      { v: 1, name: 'Jan', ts: '2025-06-01T10:00:00Z', c: 5, t: 5, lvl: 1, err: {}, sids: [] },
      { v: 1, name: 'jan', ts: '2025-06-02T10:00:00Z', c: 5, t: 5, lvl: 1, err: {}, sids: [] },
      { v: 1, name: ' Jan ', ts: '2025-06-03T10:00:00Z', c: 5, t: 5, lvl: 1, err: {}, sids: [] },
    ];
    const stats = computeAggregateStats(reports);
    expect(stats.uniqueStudents).toBe(1);
  });
});
