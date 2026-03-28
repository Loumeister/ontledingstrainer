/**
 * teacherNoteStore — Docentnotities bij zinnen, studenten en opdrachten.
 *
 * Opslag: localStorage, key 'zinsontleding_teacher_notes_v1'
 *
 * Logisch gescheiden van student-telemetrie (TrainerSubmission, TrainerAttempt,
 * TrainerActivityEvent). Docenten schrijven notities; studenten lezen ze niet.
 *
 * Vervangt op termijn SentenceUsageData.note en .flagged.
 * Tijdens de migratie bestaan beide naast elkaar.
 *
 * Bewust weggelaten:
 * - Zichtbaarheid voor studenten
 * - Sync naar Google Drive (aparte concern)
 */

import type { TeacherNote } from '../types';

const STORAGE_KEY = 'zinsontleding_teacher_notes_v1';

function generateNoteId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `tnote-${ts}-${rand}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ── Persistence helpers ───────────────────────────────────────────────────────

/**
 * Laadt alle opgeslagen TeacherNotes uit localStorage.
 *
 * @returns Alle notities, gesorteerd op volgorde van aanmaken. Lege array bij ontbrekende data.
 */
export function getNotes(): TeacherNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TeacherNote[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: TeacherNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // localStorage may be unavailable
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Geeft alle notities terug voor een specifiek doelwit.
 *
 * Mogelijke doelwit-combinaties:
 * - `('sentence', '42')` — aantekening bij zin met id 42
 * - `('student', 'std-...')` — aantekening bij een student
 * - `('assignment', 'asgn-...')` — aantekening bij een opdracht
 *
 * @param targetType - Type doelwit: 'sentence', 'student', of 'assignment'.
 * @param targetId   - ID van het doelwit (als string, ook voor numerieke zin-IDs).
 * @returns Matching notities, oudste eerst.
 */
export function getNotesForTarget(
  targetType: TeacherNote['targetType'],
  targetId: string,
): TeacherNote[] {
  return getNotes().filter(
    n => n.targetType === targetType && n.targetId === targetId,
  );
}

/**
 * Voegt een nieuwe notitie toe aan het gegeven doelwit.
 *
 * Witruimte rondom de notitietekst wordt bijgesneden voor opslag.
 *
 * @param targetType - Type doelwit: 'sentence', 'student', of 'assignment'.
 * @param targetId   - ID van het doelwit.
 * @param note       - De tekst van de notitie.
 * @returns Het nieuw aangemaakte TeacherNote-record inclusief gegenereerd id.
 */
export function addNote(
  targetType: TeacherNote['targetType'],
  targetId: string,
  note: string,
): TeacherNote {
  const now = nowIso();
  const newNote: TeacherNote = {
    id: generateNoteId(),
    targetType,
    targetId,
    note: note.trim(),
    createdAt: now,
    updatedAt: now,
  };
  const notes = getNotes();
  notes.push(newNote);
  saveNotes(notes);
  return newNote;
}

/**
 * Werkt de tekst van een bestaande notitie bij en stelt `updatedAt` in.
 *
 * @param id   - Het `TeacherNote.id` van de te bewerken notitie.
 * @param note - De nieuwe notitietekst (witruimte wordt bijgesneden).
 * @returns De bijgewerkte notitie, of `null` als het id niet bestaat.
 */
export function updateNote(id: string, note: string): TeacherNote | null {
  const notes = getNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx < 0) return null;
  notes[idx] = { ...notes[idx], note: note.trim(), updatedAt: nowIso() };
  saveNotes(notes);
  return notes[idx];
}

/**
 * Verwijdert een notitie permanent.
 *
 * @param id - Het `TeacherNote.id` van de te verwijderen notitie.
 */
export function deleteNote(id: string): void {
  saveNotes(getNotes().filter(n => n.id !== id));
}
