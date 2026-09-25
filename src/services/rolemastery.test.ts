import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadRoleMastery, updateRoleMastery, practicedRoleOutcomes, rebuildRoleMastery,
  LEGACY_STORAGE_KEY, type SessionRoleEvidence,
} from './rolemastery';
import type { SessionHistoryEntry } from '../types';

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

const SAM = 'stu-1:B';
const KIM = 'stu-2:K';
const keyFor = (studentKey: string) => `zinsontleding_role_mastery_v2:${studentKey}`;

/** Sessie waarin OW, PV en LV elk één keer goed benoemd zijn. */
const CLEAN_OW_PV_LV: SessionRoleEvidence = {
  seen: { ow: 1, pv: 1, lv: 1 },
  correct: { ow: 1, pv: 1, lv: 1 },
};

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('loadRoleMastery', () => {
  it('geeft leeg object terug als storage leeg is', () => {
    expect(loadRoleMastery(SAM)).toEqual({});
  });

  it('geeft leeg object terug bij ongeldig JSON', () => {
    store[keyFor(SAM)] = 'GEEN JSON{';
    expect(loadRoleMastery(SAM)).toEqual({});
  });

  it('laadt opgeslagen mastery-data van deze leerling', () => {
    store[keyFor(SAM)] = JSON.stringify({ Onderwerp: { consecutiveClean: 2, mastered: false } });
    expect(loadRoleMastery(SAM).Onderwerp.consecutiveClean).toBe(2);
  });

  it('leest de oude browserbrede opslag niet meer', () => {
    store[LEGACY_STORAGE_KEY] = JSON.stringify({ Onderwerp: { consecutiveClean: 3, mastered: true } });
    expect(loadRoleMastery(SAM)).toEqual({});
  });

  it('geeft niets terug voor een anonieme leerling', () => {
    expect(loadRoleMastery(null)).toEqual({});
  });
});

describe('practicedRoleOutcomes', () => {
  it('laat rollen weg die niet geoefend zijn', () => {
    const outcomes = practicedRoleOutcomes({ seen: { ow: 1 }, correct: { ow: 1 } }, {});
    expect([...outcomes.keys()]).toEqual(['Onderwerp']);
  });

  it('telt een rol met een fout als geoefend, ook zonder beoordeeld zinsdeel', () => {
    const outcomes = practicedRoleOutcomes({ seen: {}, correct: {} }, { Onderwerp: 1 });
    expect(outcomes.get('Onderwerp')).toEqual({ clean: false });
  });

  it('is niet foutloos als niet alle zinsdelen van de rol goed waren', () => {
    const outcomes = practicedRoleOutcomes({ seen: { ow: 2 }, correct: { ow: 1 } }, {});
    expect(outcomes.get('Onderwerp')).toEqual({ clean: false });
  });
});

describe('updateRoleMastery', () => {
  it('verhoogt consecutiveClean voor een foutloos geoefende rol', () => {
    const { store: s } = updateRoleMastery(SAM, CLEAN_OW_PV_LV, {});
    expect(s['Onderwerp'].consecutiveClean).toBe(1);
    expect(s['Persoonsvorm'].consecutiveClean).toBe(1);
  });

  it('reset consecutiveClean naar 0 bij een fout', () => {
    store[keyFor(SAM)] = JSON.stringify({ Onderwerp: { consecutiveClean: 2, mastered: false } });
    const { store: s } = updateRoleMastery(SAM, CLEAN_OW_PV_LV, { Onderwerp: 2 });
    expect(s['Onderwerp'].consecutiveClean).toBe(0);
  });

  // Regressie: vroeger telde elke rol uit ROLES als "foutloos" als hij geen fout had,
  // ook als hij in geen enkele zin voorkwam.
  it('kent geen voortgang toe aan rollen die niet geoefend zijn', () => {
    const { store: s } = updateRoleMastery(SAM, { seen: { ow: 1 }, correct: { ow: 1 } }, {});
    expect(Object.keys(s)).toEqual(['Onderwerp']);
    expect(s['Meewerkend Voorwerp']).toBeUndefined();
  });

  it('maakt een ongeoefende rol niet beheerst na 3 sessies', () => {
    const onlyPv: SessionRoleEvidence = { seen: { pv: 1 }, correct: { pv: 1 } };
    let last = updateRoleMastery(SAM, onlyPv, {});
    last = updateRoleMastery(SAM, onlyPv, {});
    last = updateRoleMastery(SAM, onlyPv, {});
    expect(last.newlyMastered).toEqual(['Persoonsvorm']);
    expect(last.store['Lijdend Voorwerp']).toBeUndefined();
  });

  it('laat de reeks van een niet-geoefende rol ongemoeid', () => {
    store[keyFor(SAM)] = JSON.stringify({ Onderwerp: { consecutiveClean: 2, mastered: false } });
    const { store: s } = updateRoleMastery(SAM, { seen: { pv: 1 }, correct: { pv: 1 } }, {});
    expect(s['Onderwerp']).toEqual({ consecutiveClean: 2, mastered: false });
  });

  it('markeert een rol als beheerst na 3 aaneengesloten foutloze sessies', () => {
    store[keyFor(SAM)] = JSON.stringify({ Onderwerp: { consecutiveClean: 2, mastered: false } });
    const { store: s, newlyMastered } = updateRoleMastery(SAM, CLEAN_OW_PV_LV, {});
    expect(s['Onderwerp'].mastered).toBe(true);
    expect(s['Onderwerp'].achievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(newlyMastered).toEqual(['Onderwerp']);
  });

  it('behoudt mastered: true ook als er daarna fouten zijn', () => {
    store[keyFor(SAM)] = JSON.stringify({
      Onderwerp: { consecutiveClean: 3, mastered: true, achievedAt: '2026-01-01' },
    });
    const { store: s } = updateRoleMastery(SAM, CLEAN_OW_PV_LV, { Onderwerp: 1 });
    expect(s['Onderwerp'].mastered).toBe(true);
  });

  it('geeft een lege newlyMastered terug als niets nieuw beheerst is', () => {
    expect(updateRoleMastery(SAM, CLEAN_OW_PV_LV, {}).newlyMastered).toEqual([]);
  });

  // Regressie: op een gedeelde laptop deelden alle leerlingen één opslagsleutel.
  it('houdt beheersing per leerling gescheiden', () => {
    for (let i = 0; i < 3; i++) updateRoleMastery(SAM, CLEAN_OW_PV_LV, {});
    const kim = updateRoleMastery(KIM, CLEAN_OW_PV_LV, {});
    expect(kim.newlyMastered).toEqual([]);
    expect(kim.store['Onderwerp']).toEqual({ consecutiveClean: 1, mastered: false, achievedAt: undefined });
    expect(loadRoleMastery(SAM)['Onderwerp'].mastered).toBe(true);
  });

  it('slaat niets op voor een anonieme leerling', () => {
    const result = updateRoleMastery(null, CLEAN_OW_PV_LV, {});
    expect(result).toEqual({ store: {}, newlyMastered: [] });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('slaat de bijgewerkte mastery op onder de sleutel van de leerling', () => {
    updateRoleMastery(SAM, CLEAN_OW_PV_LV, {});
    expect(JSON.parse(store[keyFor(SAM)])['Onderwerp']).toBeDefined();
    expect(store[LEGACY_STORAGE_KEY]).toBeUndefined();
  });
});

/** Sessie uit de geschiedenis in het huidige formaat (met telling per rol). */
function session(
  date: string,
  studentId: string | undefined,
  evidence: SessionRoleEvidence,
  mistakeStats: Record<string, number> = {},
  extra: Partial<SessionHistoryEntry> = {},
): SessionHistoryEntry {
  return {
    date: `${date}T10:00:00.000Z`, scorePercentage: 100, correct: 1, total: 1,
    mistakeStats, sentenceCount: 1, studentId,
    roleSeen: evidence.seen, roleCorrect: evidence.correct, ...extra,
  };
}

const ONLY_OW: SessionRoleEvidence = { seen: { ow: 1 }, correct: { ow: 1 } };

describe('rebuildRoleMastery', () => {
  it('herleidt beheersing uit 3 foutloze eigen sessies, met de datum van de derde', () => {
    const s = rebuildRoleMastery([
      session('2026-09-01', SAM, ONLY_OW),
      session('2026-09-02', SAM, ONLY_OW),
      session('2026-09-03', SAM, ONLY_OW),
    ], SAM);
    expect(s['Onderwerp']).toEqual({ consecutiveClean: 3, mastered: true, achievedAt: '2026-09-03' });
    expect(s['Persoonsvorm']).toBeUndefined();
  });

  it('negeert sessies van andere leerlingen en van de Rollenladder', () => {
    const s = rebuildRoleMastery([
      session('2026-09-01', SAM, ONLY_OW),
      session('2026-09-02', KIM, ONLY_OW),
      session('2026-09-03', SAM, ONLY_OW, {}, { adaptiveExcluded: true }),
    ], SAM);
    expect(s['Onderwerp']).toEqual({ consecutiveClean: 1, mastered: false, achievedAt: undefined });
  });

  it('laat een oude sessie zonder telling de reeks alleen breken via een fout', () => {
    const legacy = (date: string, mistakes: Record<string, number>) =>
      session(date, SAM, ONLY_OW, mistakes, { roleSeen: undefined, roleCorrect: undefined });
    const s = rebuildRoleMastery([
      session('2026-09-01', SAM, ONLY_OW),
      legacy('2026-09-02', {}),                 // verlengt niet
      session('2026-09-03', SAM, ONLY_OW),
      legacy('2026-09-04', { Onderwerp: 1 }),   // breekt wel
    ], SAM);
    expect(s['Onderwerp'].consecutiveClean).toBe(0);
    expect(s['Onderwerp'].mastered).toBe(false);
  });
});

describe('updateRoleMastery met eerdere geschiedenis', () => {
  const prior = [
    session('2026-09-01', SAM, ONLY_OW),
    session('2026-09-02', SAM, ONLY_OW),
  ];

  it('bouwt bij de eerste keer voort op de herberekende reeks', () => {
    const { store: s, newlyMastered } = updateRoleMastery(SAM, ONLY_OW, {}, prior);
    expect(s['Onderwerp'].mastered).toBe(true);
    expect(newlyMastered).toEqual(['Onderwerp']);
  });

  it('herberekent niet opnieuw als er al opgeslagen beheersing is', () => {
    store[keyFor(SAM)] = JSON.stringify({});
    const { store: s } = updateRoleMastery(SAM, ONLY_OW, {}, prior);
    expect(s['Onderwerp'].consecutiveClean).toBe(1);
  });
});
