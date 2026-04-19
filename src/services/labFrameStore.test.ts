import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCustomFrames,
  saveCustomFrame,
  deleteCustomFrame,
  generateFrameId,
} from './labFrameStore';
import type { ConstructionFrame } from '../types';

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

function makeFrame(id: string, overrides: Partial<ConstructionFrame> = {}): ConstructionFrame {
  return {
    id,
    label: `Frame ${id}`,
    level: 1,
    predicateType: 'WG',
    slots: ['ow', 'pv', 'lv'],
    families: [id],
    wordOrders: ['ow-pv-lv'],
    prompt: 'Bouw een zin.',
    ...overrides,
  };
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});

describe('getCustomFrames', () => {
  it('geeft lege array terug als storage leeg is', () => {
    expect(getCustomFrames()).toEqual([]);
  });

  it('geeft lege array terug bij ongeldig JSON', () => {
    store['zinsdeellab_frames_v1'] = 'GEEN JSON{';
    expect(getCustomFrames()).toEqual([]);
  });
});

describe('saveCustomFrame', () => {
  it('voegt een nieuw frame toe', () => {
    saveCustomFrame(makeFrame('f-001'));
    expect(getCustomFrames()).toHaveLength(1);
  });

  it('overschrijft een bestaand frame op id (upsert)', () => {
    saveCustomFrame(makeFrame('f-001', { label: 'Oud' }));
    saveCustomFrame(makeFrame('f-001', { label: 'Nieuw' }));
    expect(getCustomFrames()).toHaveLength(1);
    expect(getCustomFrames()[0].label).toBe('Nieuw');
  });

  it('bewaart meerdere frames', () => {
    saveCustomFrame(makeFrame('f-001'));
    saveCustomFrame(makeFrame('f-002'));
    expect(getCustomFrames()).toHaveLength(2);
  });
});

describe('deleteCustomFrame', () => {
  it('verwijdert het opgegeven frame', () => {
    saveCustomFrame(makeFrame('f-001'));
    saveCustomFrame(makeFrame('f-002'));
    deleteCustomFrame('f-001');
    expect(getCustomFrames()).toHaveLength(1);
    expect(getCustomFrames()[0].id).toBe('f-002');
  });

  it('doet niets bij onbekend id', () => {
    saveCustomFrame(makeFrame('f-001'));
    deleteCustomFrame('onbekend');
    expect(getCustomFrames()).toHaveLength(1);
  });
});

describe('generateFrameId', () => {
  it('genereert een id op basis van het label', () => {
    const id = generateFrameId('Mijn Frame', []);
    expect(id).toBe('custom-mijn-frame');
  });

  it('voegt een nummersuffix toe als het id al bestaat', () => {
    const id = generateFrameId('Mijn Frame', ['custom-mijn-frame']);
    expect(id).toBe('custom-mijn-frame-2');
  });

  it('verhoogt het nummersuffix verder als dat ook al bestaat', () => {
    const id = generateFrameId('Mijn Frame', ['custom-mijn-frame', 'custom-mijn-frame-2']);
    expect(id).toBe('custom-mijn-frame-3');
  });

  it('verwijdert speciale tekens uit het label', () => {
    const id = generateFrameId('OW + PV + LV!', []);
    expect(id).toBe('custom-ow-pv-lv');
  });

  it('begrenst de id-lengte', () => {
    const longLabel = 'a'.repeat(50);
    const id = generateFrameId(longLabel, []);
    expect(id.length).toBeLessThanOrEqual(40); // 'custom-' + 30 chars
  });
});
