import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getExercises,
  saveExercise,
  deleteExercise,
  bumpVersion,
  computeContentHashSync,
} from './labExerciseStore';
import type { ZinsdeellabExercise } from '../types';

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

function makeExercise(id: string, overrides: Partial<ZinsdeellabExercise> = {}): ZinsdeellabExercise {
  return {
    id,
    version: 1,
    contentHash: 'hash',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    exerciseType: 'remix',
    title: `Oefening ${id}`,
    level: 1,
    frameId: `frame-${id}`,
    ...overrides,
  };
}

describe('getExercises', () => {
  it('geeft lege array terug als storage leeg is', () => {
    expect(getExercises()).toEqual([]);
  });

  it('geeft opgeslagen oefeningen terug', () => {
    const ex = makeExercise('ex-001');
    store['zinsdeellab_exercises_v1'] = JSON.stringify([ex]);
    expect(getExercises()).toHaveLength(1);
    expect(getExercises()[0].id).toBe('ex-001');
  });

  it('geeft lege array terug bij ongeldig JSON', () => {
    store['zinsdeellab_exercises_v1'] = 'GEEN JSON{{{';
    expect(getExercises()).toEqual([]);
  });
});

describe('saveExercise', () => {
  it('voegt een nieuwe oefening toe', () => {
    saveExercise(makeExercise('ex-001'));
    expect(getExercises()).toHaveLength(1);
  });

  it('overschrijft een bestaande oefening (upsert)', () => {
    saveExercise(makeExercise('ex-001', { title: 'Oud' }));
    saveExercise(makeExercise('ex-001', { title: 'Nieuw' }));
    const exercises = getExercises();
    expect(exercises).toHaveLength(1);
    expect(exercises[0].title).toBe('Nieuw');
  });

  it('voegt meerdere oefeningen toe', () => {
    saveExercise(makeExercise('ex-001'));
    saveExercise(makeExercise('ex-002'));
    expect(getExercises()).toHaveLength(2);
  });
});

describe('deleteExercise', () => {
  it('verwijdert de opgegeven oefening', () => {
    saveExercise(makeExercise('ex-001'));
    saveExercise(makeExercise('ex-002'));
    deleteExercise('ex-001');
    const exercises = getExercises();
    expect(exercises).toHaveLength(1);
    expect(exercises[0].id).toBe('ex-002');
  });

  it('doet niets bij onbekend id', () => {
    saveExercise(makeExercise('ex-001'));
    deleteExercise('onbekend-id');
    expect(getExercises()).toHaveLength(1);
  });
});

describe('bumpVersion', () => {
  it('verhoogt het versienummer met 1', () => {
    saveExercise(makeExercise('ex-001', { version: 2 }));
    const updated = bumpVersion('ex-001');
    expect(updated?.version).toBe(3);
  });

  it('slaat de nieuwe versie op in storage', () => {
    saveExercise(makeExercise('ex-001', { version: 1 }));
    bumpVersion('ex-001');
    expect(getExercises()[0].version).toBe(2);
  });

  it('geeft null terug bij onbekend id', () => {
    expect(bumpVersion('onbekend-id')).toBeNull();
  });

  it('werkt updatedAt bij', () => {
    saveExercise(makeExercise('ex-001', { updatedAt: '2020-01-01T00:00:00.000Z' }));
    const updated = bumpVersion('ex-001');
    expect(updated?.updatedAt).not.toBe('2020-01-01T00:00:00.000Z');
  });

  it('berekent een contentHash', () => {
    saveExercise(makeExercise('ex-001', { contentHash: '' }));
    const updated = bumpVersion('ex-001');
    expect(updated?.contentHash).toBeTruthy();
  });
});

describe('computeContentHashSync', () => {
  it('geeft een niet-lege string terug', () => {
    const hash = computeContentHashSync(makeExercise('ex-001'));
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('geeft dezelfde hash voor identieke oefeningen', () => {
    const ex = makeExercise('ex-001');
    expect(computeContentHashSync(ex)).toBe(computeContentHashSync(ex));
  });

  it('geeft verschillende hashes voor oefeningen met andere title', () => {
    const a = makeExercise('ex-001', { title: 'A' });
    const b = makeExercise('ex-001', { title: 'B' });
    expect(computeContentHashSync(a)).not.toBe(computeContentHashSync(b));
  });
});
