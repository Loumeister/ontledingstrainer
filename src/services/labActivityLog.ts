/**
 * labActivityLog — Fijnkorrelig event-log voor Zinsdeellab-activiteit.
 *
 * Opslag: localStorage, key 'zinsdeellab_activity_v1' (apart van interactionLog)
 * Events zijn gegroepeerd per submissionId.
 *
 * Toekomstige MVPs kunnen hier bovenop:
 * - Tijdlijn per leerling per oefening
 * - Patroonanalyse (b.v. hoeveel kaarten worden omgewisseld vóór submit?)
 * - Sync naar backend voor klassikale analyse
 *
 * Bewust weggelaten:
 * - Realtime sync
 * - Aggregatie / analyse (dat hoort in een aparte analytics-laag)
 */

import type { LabActivityEvent } from '../types';

const ACTIVITY_KEY = 'zinsdeellab_activity_v1';
const MAX_EVENTS = 2000;

export function getLabEvents(submissionId?: string): LabActivityEvent[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const all = raw ? (JSON.parse(raw) as LabActivityEvent[]) : [];
    return submissionId ? all.filter(e => e.submissionId === submissionId) : all;
  } catch {
    return [];
  }
}

function saveLabEvents(events: LabActivityEvent[]): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(events));
  } catch {
    // localStorage may be unavailable
  }
}

export function logLabEvent(event: LabActivityEvent): void {
  const events = getLabEvents();
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  saveLabEvents(events);
}

export function clearLabEvents(): void {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    // ignore
  }
}
