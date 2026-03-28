/**
 * activityStore — Uniforme leeslaag over alle student-submissions.
 *
 * Combineert TrainerSubmissions (ontledingsoefeningen) en LabSubmissions
 * (Zinsdeellab-oefeningen) in één AnySubmission-stroom. De `domain`-discriminator
 * op elk record maakt het mogelijk om in analyticsHelpers te filteren op type
 * zonder aparte codepaden te onderhouden.
 *
 * Dit is bewust een read-only façade: schrijven blijft via de domein-specifieke
 * stores (trainerSubmissionStore, labSubmissionStore), zodat de schrijflogica
 * simpel en testbaar blijft.
 *
 * Opslag-keys (via de onderliggende stores):
 *   'zinsontleding_submissions_v1' → TrainerSubmission[]
 *   'zinsdeellab_submissions_v1'   → LabSubmission[]
 *
 * Migratie: records zonder `domain`-veld worden door de respectieve stores
 * genormaliseerd vóórdat ze hier binnenkomen, zodat callers altijd een
 * volledig AnySubmission ontvangen.
 */

import type { AnySubmission, TrainerSubmission, LabSubmission } from '../types';
import {
  getSubmissions as getRawTrainerSubmissions,
} from './trainerSubmissionStore';
import {
  getSubmissions as getRawLabSubmissions,
} from './labSubmissionStore';

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Geeft alle submissions terug uit beide domeinen, gesorteerd op `startedAt`
 * (oudste eerst) voor consistente aggregatie.
 *
 * @returns Gecombineerde lijst van TrainerSubmissions en LabSubmissions.
 */
export function getAllSubmissions(): AnySubmission[] {
  const trainer = getTrainerSubmissions();
  const lab = getLabSubmissions();
  return [...trainer, ...lab].sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt),
  );
}

/**
 * Geeft alleen TrainerSubmissions terug (domein: ontledingsoefening).
 * Normaliseert ontbrekende `domain`-velden voor backwards-compat.
 *
 * @returns Genormaliseerde TrainerSubmissions, oudste eerst.
 */
export function getTrainerSubmissions(): TrainerSubmission[] {
  return getRawTrainerSubmissions().map(normalizeTrainer);
}

/**
 * Geeft alleen LabSubmissions terug (domein: Zinsdeellab-oefening).
 * Normaliseert ontbrekende `domain`-velden voor backwards-compat.
 *
 * @returns Genormaliseerde LabSubmissions, oudste eerst.
 */
export function getLabSubmissions(): LabSubmission[] {
  return getRawLabSubmissions().map(normalizeLab);
}

/**
 * Filtert submissions op student (naam of studentId).
 *
 * - TrainerSubmissions: match op `studentId` (stabiel) of `studentName` (fallback).
 * - LabSubmissions: match op `studentName` (case-insensitief), want LabSubmission
 *   heeft nog geen stabiel studentId.
 *
 * @param nameOrId - Naam of `Student.id` van de student.
 * @returns Alle submissions van deze student over beide domeinen.
 */
export function getAllSubmissionsForStudent(nameOrId: string): AnySubmission[] {
  const norm = nameOrId.trim().toLowerCase();
  return getAllSubmissions().filter(s => {
    if (s.domain === 'trainer') {
      return (
        s.studentId === nameOrId ||
        s.studentName.trim().toLowerCase() === norm
      );
    }
    // lab: alleen naam-match
    return s.studentName.trim().toLowerCase() === norm;
  });
}

/**
 * Filtert submissions op klas (case-insensitief) over beide domeinen.
 *
 * @param klas - Klasnaam, bijv. '2B'.
 * @returns Alle submissions van studenten in deze klas.
 */
export function getAllSubmissionsForKlas(klas: string): AnySubmission[] {
  const norm = klas.trim().toLowerCase();
  return getAllSubmissions().filter(
    s => s.studentKlas.trim().toLowerCase() === norm,
  );
}

// ── Normalisatie (migration guards) ──────────────────────────────────────────

/**
 * Voegt `domain: 'trainer'` toe aan records die zijn opgeslagen vóór de
 * introductie van het discriminator-veld. Muteert het originele object niet.
 */
function normalizeTrainer(raw: TrainerSubmission): TrainerSubmission {
  if (raw.domain === 'trainer') return raw;
  return { ...raw, domain: 'trainer' };
}

/**
 * Voegt `domain: 'lab'` toe aan records die zijn opgeslagen vóór de
 * introductie van het discriminator-veld. Muteert het originele object niet.
 */
function normalizeLab(raw: LabSubmission): LabSubmission {
  if (raw.domain === 'lab') return raw;
  return { ...raw, domain: 'lab' };
}
