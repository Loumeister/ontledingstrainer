/**
 * studentStore — Stabiele student-identiteit voor Ontleedlab.
 *
 * Opslag: localStorage, key 'zinsontleding_students_v1'
 *
 * Elke student krijgt een stabiel id ('std-...') bij eerste gebruik,
 * zodat TrainerSubmissions en analyticsHelpers betrouwbaar per student
 * kunnen aggregeren — ook als de weergavenaam of klas later verandert.
 *
 * Migratie: getOrCreateStudent() leest bestaande student_info_v1 gegevens
 * en maakt zo nodig een Student-record aan. Beide keys bestaan tijdelijk
 * naast elkaar tijdens de migratie.
 *
 * Bewust weggelaten:
 * - Server-side opslag (toekomstige MVP)
 * - Inloggen / authenticatie (gescheiden concern)
 * - Bulk-import van klassenlijsten
 */

import type { Student } from '../types';

const STORAGE_KEY = 'zinsontleding_students_v1';
const STUDENT_INFO_LEGACY_KEY = 'student_info_v1';

// ── ID generator (consistent met generateSubmissionId in labSubmissionStore) ──

function generateStudentId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `std-${ts}-${rand}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ── Persistence helpers ───────────────────────────────────────────────────────

export function getStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Student[]) : [];
  } catch {
    return [];
  }
}

function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch {
    // localStorage may be unavailable
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getStudentById(id: string): Student | null {
  return getStudents().find(s => s.id === id) ?? null;
}

/**
 * Zoek een bestaande student op naam+klas (case-insensitief).
 * Als geen match gevonden, maak een nieuwe Student aan en sla op.
 * Gebruikt voor het koppelen van een sessie aan een stabiel student-id.
 */
export function getOrCreateStudent(
  name: string,
  initiaal: string,
  klas: string,
): Student {
  const normName = name.trim().toLowerCase();
  const normKlas = klas.trim().toLowerCase();

  if (!normName) {
    // Anonieme student — tijdelijk record, niet persistent
    return {
      id: generateStudentId(),
      name: '',
      initiaal: '',
      klas: '',
      createdAt: nowIso(),
    };
  }

  const students = getStudents();
  const existing = students.find(
    s =>
      s.name.trim().toLowerCase() === normName &&
      s.klas.trim().toLowerCase() === normKlas,
  );
  if (existing) return existing;

  const newStudent: Student = {
    id: generateStudentId(),
    name: name.trim(),
    initiaal: initiaal.trim().toUpperCase(),
    klas: normKlas,
    createdAt: nowIso(),
  };
  students.push(newStudent);
  saveStudents(students);
  return newStudent;
}

/** Update naam, initiaal of klas van een bestaande student. */
export function updateStudent(
  id: string,
  patch: Partial<Pick<Student, 'name' | 'initiaal' | 'klas'>>,
): Student | null {
  const students = getStudents();
  const idx = students.findIndex(s => s.id === id);
  if (idx < 0) return null;
  students[idx] = { ...students[idx], ...patch };
  saveStudents(students);
  return students[idx];
}

/**
 * Migreer student_info_v1 naar studentStore als er nog geen student-record is
 * voor de huidige naam+klas. Veilig om meerdere keren aan te roepen.
 * Geeft het (eventueel nieuw aangemaakte) Student-record terug, of null
 * als student_info_v1 leeg of ongeldig is.
 */
export function migrateFromStudentInfo(): Student | null {
  try {
    const raw = localStorage.getItem(STUDENT_INFO_LEGACY_KEY);
    if (!raw) return null;
    const info = JSON.parse(raw) as { name?: string; initiaal?: string; klas?: string };
    if (!info.name?.trim()) return null;
    return getOrCreateStudent(
      info.name ?? '',
      info.initiaal ?? '',
      info.klas ?? '',
    );
  } catch {
    return null;
  }
}
