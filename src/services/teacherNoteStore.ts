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

export function getNotesForTarget(
  targetType: TeacherNote['targetType'],
  targetId: string,
): TeacherNote[] {
  return getNotes().filter(
    n => n.targetType === targetType && n.targetId === targetId,
  );
}

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

export function updateNote(id: string, note: string): TeacherNote | null {
  const notes = getNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx < 0) return null;
  notes[idx] = { ...notes[idx], note: note.trim(), updatedAt: nowIso() };
  saveNotes(notes);
  return notes[idx];
}

export function deleteNote(id: string): void {
  saveNotes(getNotes().filter(n => n.id !== id));
}
