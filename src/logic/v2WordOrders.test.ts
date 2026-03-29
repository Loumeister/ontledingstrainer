import { describe, it, expect } from 'vitest';
import { v2WordOrders } from './v2WordOrders';
import type { FrameSlotKey } from '../types';

describe('v2WordOrders', () => {
  it('geeft één volgorde voor een 3-slot frame (OW+PV+LV)', () => {
    const slots: FrameSlotKey[] = ['ow', 'pv', 'lv'];
    const result = v2WordOrders(slots);
    expect(result).toHaveLength(2);
    expect(result).toContain('ow-pv-lv');
    expect(result).toContain('lv-pv-ow');
  });

  it('geeft drie volgordes voor een 4-slot frame (OW+PV+LV+BWB)', () => {
    const slots: FrameSlotKey[] = ['ow', 'pv', 'lv', 'bwb'];
    const result = v2WordOrders(slots);
    expect(result).toHaveLength(3);
    expect(result).toContain('ow-pv-lv-bwb');   // normale volgorde
    expect(result).toContain('lv-pv-ow-bwb');   // LV-inversie
    expect(result).toContain('bwb-pv-ow-lv');   // BWB-inversie
  });

  it('geeft drie volgordes voor OW+PV+MV+LV', () => {
    const slots: FrameSlotKey[] = ['ow', 'pv', 'mv', 'lv'];
    const result = v2WordOrders(slots);
    expect(result).toHaveLength(3);
    expect(result).toContain('ow-pv-mv-lv');
    expect(result).toContain('mv-pv-ow-lv');
    expect(result).toContain('lv-pv-ow-mv');
  });

  it('geeft vier volgordes voor een 5-slot frame', () => {
    const slots: FrameSlotKey[] = ['ow', 'pv', 'mv', 'lv', 'bwb'];
    const result = v2WordOrders(slots);
    expect(result).toHaveLength(4);
    expect(result).toContain('ow-pv-mv-lv-bwb');
    expect(result).toContain('mv-pv-ow-lv-bwb');
    expect(result).toContain('lv-pv-ow-mv-bwb');
    expect(result).toContain('bwb-pv-ow-mv-lv');
  });

  it('geeft één volgorde als er geen PV in de slots zit', () => {
    const slots: FrameSlotKey[] = ['ow', 'lv', 'bwb'];
    const result = v2WordOrders(slots);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('ow-lv-bwb');
  });

  it('PV staat altijd op positie 2 in elke gegenereerde volgorde', () => {
    const slots: FrameSlotKey[] = ['ow', 'pv', 'lv', 'bwb'];
    const result = v2WordOrders(slots);
    for (const order of result) {
      const parts = order.split('-');
      expect(parts[1]).toBe('pv');
    }
  });

  it('elk niet-PV slot komt precies één keer op positie 1 voor', () => {
    const slots: FrameSlotKey[] = ['ow', 'pv', 'lv', 'bwb'];
    const result = v2WordOrders(slots);
    const frontSlots = result.map(o => o.split('-')[0]);
    expect(frontSlots).toContain('ow');
    expect(frontSlots).toContain('lv');
    expect(frontSlots).toContain('bwb');
    expect(frontSlots).not.toContain('pv');
  });
});
