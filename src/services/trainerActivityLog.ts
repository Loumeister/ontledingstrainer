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

export function clearTrainerEvents(): void {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    // ignore
  }
}
