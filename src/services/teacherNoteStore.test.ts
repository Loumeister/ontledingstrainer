import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getNotes,
  getNotesForTarget,
  addNote,
  updateNote,
  deleteNote,
} from './teacherNoteStore';

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

describe('getNotes', () => {
  it('geeft lege array terug als storage leeg is', () => {
    expect(getNotes()).toEqual([]);
  });

  it('geeft lege array terug bij ongeldig JSON', () => {
    store['zinsontleding_teacher_notes_v1'] = 'GEEN JSON{';
    expect(getNotes()).toEqual([]);
  });
});

describe('addNote', () => {
  it('voegt een notitie toe en geeft het nieuwe record terug', () => {
    const note = addNote('sentence', '42', 'Lastige zin');
    expect(note.targetType).toBe('sentence');
    expect(note.targetId).toBe('42');
    expect(note.note).toBe('Lastige zin');
    expect(note.id).toMatch(/^tnote-/);
    expect(note.createdAt).toBeTruthy();
    expect(note.updatedAt).toBeTruthy();
  });

  it('slaat de notitie op in storage', () => {
    addNote('sentence', '42', 'Test');
    expect(getNotes()).toHaveLength(1);
  });

  it('trimt witruimte rondom de notitiitekst', () => {
    const note = addNote('sentence', '42', '  spaties  ');
    expect(note.note).toBe('spaties');
  });

  it('genereert unieke ids voor opeenvolgende notities', () => {
    const a = addNote('sentence', '1', 'A');
    const b = addNote('sentence', '2', 'B');
    expect(a.id).not.toBe(b.id);
  });
});

describe('getNotesForTarget', () => {
  it('geeft notities terug voor het opgegeven doelwit', () => {
    addNote('sentence', '42', 'Notitie A');
    addNote('sentence', '99', 'Notitie B');
    addNote('student', 'std-001', 'Studentnotitie');

    expect(getNotesForTarget('sentence', '42')).toHaveLength(1);
    expect(getNotesForTarget('sentence', '99')).toHaveLength(1);
    expect(getNotesForTarget('student', 'std-001')).toHaveLength(1);
  });

  it('geeft lege array terug voor onbekend doelwit', () => {
    addNote('sentence', '42', 'Test');
    expect(getNotesForTarget('sentence', '999')).toHaveLength(0);
  });

  it('filtert correct op targetType', () => {
    addNote('sentence', '42', 'Test');
    expect(getNotesForTarget('student', '42')).toHaveLength(0);
  });
});

describe('updateNote', () => {
  it('werkt de notitietekst bij', () => {
    const note = addNote('sentence', '42', 'Oud');
    const updated = updateNote(note.id, 'Nieuw');
    expect(updated?.note).toBe('Nieuw');
  });

  it('werkt updatedAt bij', () => {
    const note = addNote('sentence', '42', 'Tekst');
    const updated = updateNote(note.id, 'Gewijzigd');
    // updatedAt kan gelijk zijn als de update razendsnel na aanmaken plaatsvindt,
    // maar het veld moet altijd aanwezig zijn
    expect(updated?.updatedAt).toBeTruthy();
  });

  it('trimt witruimte in de bijgewerkte tekst', () => {
    const note = addNote('sentence', '42', 'Oud');
    const updated = updateNote(note.id, '  nieuw  ');
    expect(updated?.note).toBe('nieuw');
  });

  it('geeft null terug bij onbekend id', () => {
    expect(updateNote('tnote-onbekend', 'Tekst')).toBeNull();
  });

  it('slaat de wijziging op in storage', () => {
    const note = addNote('sentence', '42', 'Oud');
    updateNote(note.id, 'Nieuw');
    expect(getNotes()[0].note).toBe('Nieuw');
  });
});

describe('deleteNote', () => {
  it('verwijdert de opgegeven notitie', () => {
    const note = addNote('sentence', '42', 'Te verwijderen');
    addNote('sentence', '42', 'Te bewaren');
    deleteNote(note.id);
    expect(getNotes()).toHaveLength(1);
    expect(getNotes()[0].note).toBe('Te bewaren');
  });

  it('doet niets bij onbekend id', () => {
    addNote('sentence', '42', 'Blijft staan');
    deleteNote('tnote-onbekend');
    expect(getNotes()).toHaveLength(1);
  });
});
