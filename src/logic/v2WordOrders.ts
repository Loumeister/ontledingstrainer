import type { FrameSlotKey } from '../types';

/**
 * Genereert alle geldige Nederlandse V2-volgordes voor een gegeven slotlijst.
 *
 * V2-regel: de persoonsvorm (PV) staat altijd op positie 2 in een mededelende zin.
 * Elk ander zinsdeel kan op positie 1 staan (inversie). De overige zinsdelen
 * volgen in de basisvolgorde (de volgorde van `slots` minus de naar voren
 * geplaatste constituent en de PV).
 *
 * Voorbeeld: ['ow','pv','lv','bwb'] →
 *   'ow-pv-lv-bwb'   (OW op positie 1, normale volgorde)
 *   'lv-pv-ow-bwb'   (LV op positie 1, inversie)
 *   'bwb-pv-ow-lv'   (BWB op positie 1, inversie)
 *
 * Als er geen PV in de slotlijst zit, wordt alleen de basisvolgorde teruggegeven.
 */
export function v2WordOrders(slots: FrameSlotKey[]): string[] {
  if (!slots.includes('pv')) {
    return [slots.join('-')];
  }

  const others = slots.filter(s => s !== 'pv');
  return others.map(front => {
    const rest = others.filter(s => s !== front);
    return [front, 'pv', ...rest].join('-');
  });
}
