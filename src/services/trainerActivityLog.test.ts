import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTrainerEvents, logTrainerEvent, clearTrainerEvents } from './trainerActivityLog';
import type { TrainerActivityEvent } from '../types';

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

const KEY = 'zinsontleding_trainer_activity_v1';

function makeEvent(submissionId: string, type: TrainerActivityEvent['type'] = 'sentence_start'): TrainerActivityEvent {
  return { submissionId, type, timestamp: new Date().toISOString() };
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('getTrainerEvents', () => {
  it('geeft lege array terug als log leeg is', () => {
    expect(getTrainerEvents()).toEqual([]);
  });

  it('geeft alle events terug zonder filter', () => {
    store[KEY] = JSON.stringify([makeEvent('sub-1'), makeEvent('sub-2')]);
    expect(getTrainerEvents()).toHaveLength(2);
  });

  it('filtert op submissionId als opgegeven', () => {
    store[KEY] = JSON.stringify([makeEvent('sub-1'), makeEvent('sub-2'), makeEvent('sub-1')]);
    expect(getTrainerEvents('sub-1')).toHaveLength(2);
    expect(getTrainerEvents('sub-2')).toHaveLength(1);
  });

  it('geeft lege array terug bij ongeldig JSON', () => {
    store[KEY] = 'GEEN JSON{';
    expect(getTrainerEvents()).toEqual([]);
  });
});

describe('logTrainerEvent', () => {
  it('voegt een event toe', () => {
    logTrainerEvent(makeEvent('sub-1'));
    expect(getTrainerEvents()).toHaveLength(1);
  });

  it('voegt meerdere events toe', () => {
    logTrainerEvent(makeEvent('sub-1'));
    logTrainerEvent(makeEvent('sub-1'));
    expect(getTrainerEvents()).toHaveLength(2);
  });

  it('trimt tot 2000 events bij overschrijding', () => {
    const events: TrainerActivityEvent[] = Array.from({ length: 2001 }, (_, i) =>
      makeEvent(`sub-${i}`),
    );
    store[KEY] = JSON.stringify(events.slice(0, 2000));
    logTrainerEvent(makeEvent('sub-nieuw'));
    expect(getTrainerEvents()).toHaveLength(2000);
  });
});

describe('clearTrainerEvents', () => {
  it('verwijdert alle events', () => {
    store[KEY] = JSON.stringify([makeEvent('sub-1')]);
    clearTrainerEvents();
    expect(getTrainerEvents()).toEqual([]);
  });
});
