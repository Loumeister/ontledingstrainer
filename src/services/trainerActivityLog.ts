/**
 * trainerActivityLog — Fijnkorrelig event-log voor Ontleedlab-trainer activiteit.
 *
 * Opslag: localStorage, key 'zinsontleding_trainer_activity_v1' (apart van interactionLog)
 * Events zijn gegroepeerd per submissionId.
 *
 * Parallel aan labActivityLog (Zinsdeellab) — zelfde structuur en opslagpatroon.
 * Coexisteert tijdelijk met interactionLog.ts; beide worden geschreven
 * tijdens de migratie. Op termijn vervangt deze log de interactionLog voor
 * trainer-specifieke events.
 *
 * Bewust weggelaten:
 * - Realtime sync
 * - Aggregatie / analyse (horen in analyticsHelpers)
 */

import type { TrainerActivityEvent } from '../types';

const ACTIVITY_KEY = 'zinsontleding_trainer_activity_v1';
const MAX_EVENTS = 2000;

/**
 * Laadt events uit het activiteitslog.
 *
 * Als `submissionId` wordt meegegeven, worden alleen events voor die sessie
 * teruggegeven. Zonder argument worden alle events teruggegeven.
 *
 * @param submissionId - (Optioneel) filter op een specifieke submission.
 * @returns Matching events, oudste eerst. Lege array bij ontbrekende of corrupte data.
 */
export function getTrainerEvents(submissionId?: string): TrainerActivityEvent[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const all = raw ? (JSON.parse(raw) as TrainerActivityEvent[]) : [];
    return submissionId ? all.filter(e => e.submissionId === submissionId) : all;
  } catch {
    return [];
  }
}

function saveTrainerEvents(events: TrainerActivityEvent[]): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(events));
  } catch {
    // localStorage may be unavailable
  }
}

/** Voeg een event toe aan het log. Trim tot MAX_EVENTS (oudste eerst). */
export function logTrainerEvent(event: TrainerActivityEvent): void {
  const events = getTrainerEvents();
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  saveTrainerEvents(events);
}

/**
 * Verwijdert alle events uit het activiteitslog.
 *
 * Gebruik alleen voor testopzet of handmatig resetten via een beheerpagina.
 * Wordt **niet** automatisch aangeroepen in productie-flows; events worden
 * alleen bijgesneden via de MAX_EVENTS-cap in `logTrainerEvent`.
 */
export function clearTrainerEvents(): void {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    // ignore
  }
}
