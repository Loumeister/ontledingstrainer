import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encodeReport,
  decodeReport,
  buildReport,
  loadReports,
  saveReports,
  addReport,
  clearReports,
  renameStudent,
  computeAggregateStats,
  computeStudentStats,
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

  it('includes res, hint, dur when provided via extra', () => {
    const res = [{ sid: 1, ok: true }, { sid: 2, ok: false }];
    const report = buildReport('Lisa', 7, 10, {}, 2, [1, 2], 'V', '2ga', { res, hint: 1, dur: 120 });
    expect(report.res).toEqual(res);
    expect(report.hint).toBe(1);
    expect(report.dur).toBe(120);
  });

  it('omits hint when zero', () => {
    const report = buildReport('Lisa', 7, 10, {}, 2, [1, 2], undefined, undefined, { hint: 0 });
    expect(report.hint).toBeUndefined();
  });

  it('omits dur when zero', () => {
    const report = buildReport('Lisa', 7, 10, {}, 2, [1, 2], undefined, undefined, { dur: 0 });
    expect(report.dur).toBeUndefined();
  });

  it('round-trips new fields through encode/decode', () => {
    const res = [{ sid: 5, ok: true }];
    const report = buildReport('Jan', 9, 10, { pv: 1 }, 3, [5], 'D', '3vwo', { res, hint: 2, dur: 95 });
    const code = encodeReport(report);
    const decoded = decodeReport(code);
    expect(decoded?.res).toEqual(res);
    expect(decoded?.hint).toBe(2);
    expect(decoded?.dur).toBe(95);
  });

  it('decodes old reports without res/hint/dur (backward compat)', () => {
    const oldReport: SessionReport = { v: 1, name: 'Oud', ts: '2025-01-01T00:00:00Z', c: 5, t: 10, lvl: 1, err: {}, sids: [1] };
    const code = encodeReport(oldReport);
    const decoded = decodeReport(code);
    expect(decoded).toEqual(oldReport);
    expect(decoded?.res).toBeUndefined();
    expect(decoded?.hint).toBeUndefined();
    expect(decoded?.dur).toBeUndefined();
  });

  it('includes sols when provided via extra', () => {
    const sols = [{ sid: 1, sp: [2, 5], lb: { 's1w0': 'pv', 's1w2': 'ow' } }];
    const report = buildReport('Jan', 9, 10, {}, 2, [1], 'D', '2ga', { sols });
    expect(report.sols).toEqual(sols);
  });

  it('omits sols when not provided', () => {
    const report = buildReport('Jan', 9, 10, {}, 2, [1]);
    expect(report.sols).toBeUndefined();
  });

  it('omits sols when empty array', () => {
    const report = buildReport('Jan', 9, 10, {}, 2, [1], undefined, undefined, { sols: [] });
    expect(report.sols).toBeUndefined();
  });

  it('sols round-trips through encode/decode', () => {
    const sols = [{ sid: 3, sp: [1, 3], lb: { 's3w0': 'lv' } }];
    const report = buildReport('Jan', 9, 10, {}, 2, [3], undefined, undefined, { sols });
    const decoded = decodeReport(encodeReport(report));
    expect(decoded?.sols).toEqual(sols);
  });

  it('includes src when provided via extra', () => {
    const report = buildReport('Jan', 9, 10, {}, 2, [1], 'D', '2ga', { src: 'json' });
    expect(report.src).toBe('json');
  });

  it('omits src when not provided', () => {
    const report = buildReport('Jan', 9, 10, {}, 2, [1]);
    expect(report.src).toBeUndefined();
  });

  it('src round-trips through encode/decode', () => {
    const report = buildReport('Jan', 9, 10, {}, 2, [1], 'D', '2ga', { src: 'selected' });
    const decoded = decodeReport(encodeReport(report));
    expect(decoded?.src).toBe('selected');
  });

  it('decodes old reports without src (backward compat)', () => {
    const oldReport: SessionReport = { v: 1, name: 'Oud', ts: '2025-01-01T00:00:00Z', c: 5, t: 10, lvl: 1, err: {}, sids: [1] };
    const code = encodeReport(oldReport);
    const decoded = decodeReport(code);
    expect(decoded?.src).toBeUndefined();
  });
});

describe('renameStudent', () => {
  it('renames matching reports (case-insensitive)', () => {
    addReport(buildReport('Jan', 8, 10, {}, 1, [1]));
    addReport(buildReport('Piet', 7, 10, {}, 1, [2]));
    renameStudent('jan', 'Johannes');
    const reports = loadReports();
    expect(reports[0].name).toBe('Johannes');
    expect(reports[1].name).toBe('Piet');
  });

  it('is a no-op when old name not found', () => {
    addReport(buildReport('Jan', 8, 10, {}, 1, [1]));
    renameStudent('notexist', 'X');
    expect(loadReports()[0].name).toBe('Jan');
  });

  it('is a no-op when new name normalises the same as old', () => {
    addReport(buildReport('Jan', 8, 10, {}, 1, [1]));
    renameStudent('jan', 'jan');
    expect(loadReports()[0].name).toBe('Jan');
  });

  it('renames across multiple reports', () => {
    addReport(buildReport('jan', 8, 10, {}, 1, [1]));
    addReport(buildReport('JAN', 5, 10, {}, 1, [2]));
    renameStudent('jan', 'Johannes');
    const reports = loadReports();
    expect(reports[0].name).toBe('Johannes');
    expect(reports[1].name).toBe('Johannes');
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

describe('computeStudentStats', () => {
  const base: SessionReport = { v: 1, name: 'Sofia', klas: '1ga', ts: '2025-06-01T10:00:00Z', c: 8, t: 10, lvl: 1, err: { pv: 2 }, sids: [] };

  it('returns one entry per unique student', () => {
    const reports: SessionReport[] = [
      { ...base, name: 'Sofia', c: 8, t: 10 },
      { ...base, name: 'Lars',  c: 5, t: 10, err: {} },
    ];
    const stats = computeStudentStats(reports);
    expect(stats).toHaveLength(2);
    expect(stats.map(s => s.name.toLowerCase())).toContain('sofia');
    expect(stats.map(s => s.name.toLowerCase())).toContain('lars');
  });

  it('merges multiple sessions for the same student', () => {
    const reports: SessionReport[] = [
      { ...base, ts: '2025-06-01T10:00:00Z', c: 6, t: 10, err: { pv: 1 } },
      { ...base, ts: '2025-06-02T10:00:00Z', c: 9, t: 10, err: { ow: 1 } },
    ];
    const [s] = computeStudentStats(reports);
    expect(s.sessionCount).toBe(2);
    expect(s.avgScore).toBeCloseTo(75);
    expect(s.bestScore).toBeCloseTo(90);
    expect(s.latestScore).toBeCloseTo(90);
    expect(s.latestTs).toBe('2025-06-02T10:00:00Z');
    expect(s.topErrors).toHaveLength(2);
  });

  it('filters by class', () => {
    const reports: SessionReport[] = [
      { ...base, name: 'Sofia', klas: '1ga' },
      { ...base, name: 'Lars',  klas: '2hv' },
    ];
    const stats = computeStudentStats(reports, '1ga');
    expect(stats).toHaveLength(1);
    expect(stats[0].name.toLowerCase()).toBe('sofia');
  });

  it('is case-insensitive for class name', () => {
    const reports: SessionReport[] = [
      { ...base, name: 'Sofia', klas: '1GA' },
    ];
    const stats = computeStudentStats(reports, '1ga');
    expect(stats).toHaveLength(1);
  });

  it('skips reports with empty name', () => {
    const reports: SessionReport[] = [
      { ...base, name: '' },
      { ...base, name: 'Sofia' },
    ];
    const stats = computeStudentStats(reports);
    expect(stats).toHaveLength(1);
  });

  it('sorts students alphabetically', () => {
    const reports: SessionReport[] = [
      { ...base, name: 'Zoë' },
      { ...base, name: 'Anna' },
      { ...base, name: 'Lars' },
    ];
    const names = computeStudentStats(reports).map(s => s.name);
    expect(names[0]).toBe('Anna');
    expect(names[names.length - 1]).toBe('Zoë');
  });
});
