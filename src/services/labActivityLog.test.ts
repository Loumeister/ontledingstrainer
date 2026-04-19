import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLabEvents, logLabEvent, clearLabEvents } from './labActivityLog';
import type { LabActivityEvent } from '../types';

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

const KEY = 'zinsdeellab_activity_v1';

function makeEvent(submissionId: string, type: LabActivityEvent['type'] = 'card_placed'): LabActivityEvent {
  return { submissionId, type, timestamp: new Date().toISOString() };
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('getLabEvents', () => {
  it('geeft lege array terug als log leeg is', () => {
    expect(getLabEvents()).toEqual([]);
  });

  it('geeft alle events terug zonder filter', () => {
    store[KEY] = JSON.stringify([makeEvent('sub-1'), makeEvent('sub-2')]);
    expect(getLabEvents()).toHaveLength(2);
  });

  it('filtert op submissionId als opgegeven', () => {
    store[KEY] = JSON.stringify([makeEvent('sub-1'), makeEvent('sub-2'), makeEvent('sub-1')]);
    expect(getLabEvents('sub-1')).toHaveLength(2);
    expect(getLabEvents('sub-2')).toHaveLength(1);
  });

  it('geeft lege array terug bij ongeldig JSON', () => {
    store[KEY] = 'GEEN JSON{';
    expect(getLabEvents()).toEqual([]);
  });
});

describe('logLabEvent', () => {
  it('voegt een event toe', () => {
    logLabEvent(makeEvent('sub-1'));
    expect(getLabEvents()).toHaveLength(1);
  });

  it('trimt tot 2000 events bij overschrijding', () => {
    const events: LabActivityEvent[] = Array.from({ length: 2000 }, (_, i) =>
      makeEvent(`sub-${i}`),
    );
    store[KEY] = JSON.stringify(events);
    logLabEvent(makeEvent('sub-nieuw'));
    expect(getLabEvents()).toHaveLength(2000);
  });
});

describe('clearLabEvents', () => {
  it('verwijdert alle events', () => {
    store[KEY] = JSON.stringify([makeEvent('sub-1')]);
    clearLabEvents();
    expect(getLabEvents()).toEqual([]);
  });
});
