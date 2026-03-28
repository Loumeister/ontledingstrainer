/**
 * trainerAssignmentStore — Versiebare docentopdrachten voor Ontleedlab.
 *
 * Opslag: localStorage, key 'zinsontleding_assignments_v1'
 *
 * Parallel aan labExerciseStore (Zinsdeellab) — zelfde versioning-patroon:
 *   id (stabiel) + version (incrementeel) + contentHash (btoa).
 *
 * TrainerSubmissions refereren aan assignmentId + assignmentVersion, zodat
 * historische resultaten correct blijven als een opdracht later wordt bewerkt.
 * Bij inhoudelijke wijziging roep bumpVersion() aan in plaats van direct te overschrijven.
 *
 * Migratie: migrateFromCustomSentences() wraps bestaande 'custom-sentences'
 * als een TrainerAssignment v1 de eerste keer dat de store wordt gebruikt.
 * De oude 'custom-sentences' key blijft leesbaar voor achterwaartse compatibiliteit.
 *
 * Bewust weggelaten:
 * - Volledige versie-history (alleen huidige versie per opdracht opgeslagen)
 * - Server-side opslag / sync (toekomstige MVP)
 */

import type { TrainerAssignment } from '../types';

const STORAGE_KEY = 'zinsontleding_assignments_v1';
const CUSTOM_SENTENCES_LEGACY_KEY = 'custom-sentences';

// ── ID generator (consistent met labSubmissionStore patroon) ──────────────────

function generateAssignmentId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `asgn-${ts}-${rand}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ── Content hash (parallel aan labExerciseStore.computeContentHashSync) ───────

/**
 * Bereken een deterministische hash van de sentenceIds-snapshot.
 * Gebruikt btoa-encoding — geen cryptografische garanties, alleen voor attributie.
 */
export function computeContentHash(sentenceIds: number[]): string {
  const content = JSON.stringify({ sentenceIds: [...sentenceIds].sort((a, b) => a - b) });
  try {
    return btoa(encodeURIComponent(content));
  } catch {
    return String(content.length);
  }
}

// ── Persistence helpers ───────────────────────────────────────────────────────

export function getAssignments(): TrainerAssignment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrainerAssignment[]) : [];
  } catch {
    return [];
  }
}

function saveAssignments(assignments: TrainerAssignment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch {
    // localStorage may be unavailable
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getAssignmentById(id: string): TrainerAssignment | null {
  return getAssignments().find(a => a.id === id) ?? null;
}

/** Upsert: voeg toe of overschrijf op basis van id. */
export function saveAssignment(assignment: TrainerAssignment): void {
  const assignments = getAssignments();
  const idx = assignments.findIndex(a => a.id === assignment.id);
  if (idx >= 0) {
    assignments[idx] = assignment;
  } else {
    assignments.push(assignment);
  }
  saveAssignments(assignments);
}

/**
 * Maak een nieuwe TrainerAssignment aan met versie 1.
 * Gebruik dit wanneer een docent een nieuw zinnenset publiceert.
 */
export function createAssignment(
  title: string,
  sentenceIds: number[],
  id?: string,
): TrainerAssignment {
  const now = nowIso();
  const assignment: TrainerAssignment = {
    id: id ?? generateAssignmentId(),
    title,
    version: 1,
    contentHash: computeContentHash(sentenceIds),
    createdAt: now,
    updatedAt: now,
    sentenceIds: [...sentenceIds],
  };
  saveAssignment(assignment);
  return assignment;
}

/**
 * Verhoog version met 1 en update sentenceIds + contentHash + updatedAt.
 * Geeft de bijgewerkte assignment terug, of null als id niet gevonden.
 * Parallel aan labExerciseStore.bumpVersion().
 */
export function bumpVersion(
  id: string,
  newSentenceIds: number[],
): TrainerAssignment | null {
  const assignments = getAssignments();
  const idx = assignments.findIndex(a => a.id === id);
  if (idx < 0) return null;

  const updated: TrainerAssignment = {
    ...assignments[idx],
    version: assignments[idx].version + 1,
    contentHash: computeContentHash(newSentenceIds),
    updatedAt: nowIso(),
    sentenceIds: [...newSentenceIds],
  };
  assignments[idx] = updated;
  saveAssignments(assignments);
  return updated;
}

export function deleteAssignment(id: string): void {
  saveAssignments(getAssignments().filter(a => a.id !== id));
}

/**
 * Migreer 'custom-sentences' naar een TrainerAssignment als die nog niet bestaat.
 * Veilig om meerdere keren aan te roepen (idempotent).
 * Geeft het aangemaakte of bestaande assignment terug, of null als er geen
 * custom sentences zijn.
 */
export function migrateFromCustomSentences(): TrainerAssignment | null {
  try {
    const raw = localStorage.getItem(CUSTOM_SENTENCES_LEGACY_KEY);
    if (!raw) return null;

    const sentences = JSON.parse(raw) as Array<{ id: number }>;
    if (!Array.isArray(sentences) || sentences.length === 0) return null;

    // Als 'default' opdracht al bestaat, niet opnieuw aanmaken
    const existing = getAssignmentById('default');
    if (existing) return existing;

    const sentenceIds = sentences.map(s => s.id);
    return createAssignment('Aangepaste zinnen', sentenceIds, 'default');
  } catch {
    return null;
  }
}
