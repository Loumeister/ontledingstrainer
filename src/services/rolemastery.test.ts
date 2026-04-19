import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadRoleMastery, updateRoleMastery } from './rolemastery';

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

const KEY = 'zinsontleding_role_mastery_v1';
const ALL_ROLES = ['Onderwerp', 'Persoonsvorm', 'Lijdend voorwerp'];

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('loadRoleMastery', () => {
  it('geeft leeg object terug als storage leeg is', () => {
    expect(loadRoleMastery()).toEqual({});
  });

  it('geeft lege object terug bij ongeldig JSON', () => {
    store[KEY] = 'GEEN JSON{';
    expect(loadRoleMastery()).toEqual({});
  });

  it('laadt opgeslagen mastery-data correct', () => {
    store[KEY] = JSON.stringify({ Onderwerp: { consecutiveClean: 2, mastered: false } });
    const result = loadRoleMastery();
    expect(result.Onderwerp.consecutiveClean).toBe(2);
  });
});

describe('updateRoleMastery', () => {
  it('verhoogt consecutiveClean voor een rol zonder fouten', () => {
    const { store: s } = updateRoleMastery(ALL_ROLES, {});
    expect(s['Onderwerp'].consecutiveClean).toBe(1);
    expect(s['Persoonsvorm'].consecutiveClean).toBe(1);
  });

  it('reset consecutiveClean naar 0 bij een fout', () => {
    const { store: s } = updateRoleMastery(ALL_ROLES, { Onderwerp: 2 });
    expect(s['Onderwerp'].consecutiveClean).toBe(0);
  });

  it('markeert een rol als beheerst na 3 aaneengesloten foutloze sessies', () => {
    store[KEY] = JSON.stringify({
      Onderwerp: { consecutiveClean: 2, mastered: false },
    });
    const { store: s, newlyMastered } = updateRoleMastery(ALL_ROLES, {});
    expect(s['Onderwerp'].mastered).toBe(true);
    expect(newlyMastered).toContain('Onderwerp');
  });

  it('behoudt mastered: true ook als er daarna fouten zijn', () => {
    store[KEY] = JSON.stringify({
      Onderwerp: { consecutiveClean: 3, mastered: true, achievedAt: '2026-01-01' },
    });
    const { store: s } = updateRoleMastery(['Onderwerp'], { Onderwerp: 1 });
    expect(s['Onderwerp'].mastered).toBe(true);
  });

  it('geeft newlyMastered terug voor alle rollen die deze sessie beheerst zijn', () => {
    store[KEY] = JSON.stringify({
      Onderwerp: { consecutiveClean: 2, mastered: false },
      Persoonsvorm: { consecutiveClean: 2, mastered: false },
    });
    const { newlyMastered } = updateRoleMastery(ALL_ROLES, {});
    expect(newlyMastered).toContain('Onderwerp');
    expect(newlyMastered).toContain('Persoonsvorm');
  });

  it('geeft een lege newlyMastered terug als niets nieuw beheerst is', () => {
    const { newlyMastered } = updateRoleMastery(ALL_ROLES, {});
    expect(newlyMastered).toEqual([]);
  });

  it('stelt achievedAt in bij eerste keer beheersen', () => {
    store[KEY] = JSON.stringify({
      Onderwerp: { consecutiveClean: 2, mastered: false },
    });
    const { store: s } = updateRoleMastery(['Onderwerp'], {});
    expect(s['Onderwerp'].achievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('slaat de bijgewerkte mastery op in localStorage', () => {
    updateRoleMastery(ALL_ROLES, {});
    const stored = JSON.parse(store[KEY]);
    expect(stored['Onderwerp']).toBeDefined();
  });
});
