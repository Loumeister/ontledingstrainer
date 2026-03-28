import type { ConstructionFrame } from '../types';

export const CONSTRUCTION_FRAMES: ConstructionFrame[] = [
  {
    id: 'wg-ow-pv-lv',
    label: 'OW + PV + LV',
    level: 1,
    predicateType: 'WG',
    slots: ['ow', 'pv', 'lv'],
    families: ['transitief_sg', 'transitief_pl'],
    wordOrders: ['ow-pv-lv', 'bwb-pv-ow-lv'],
    prompt: 'Bouw een zin met een onderwerp, persoonsvorm en lijdend voorwerp.',
  },
  {
    id: 'wg-ow-pv-lv-bwb',
    label: 'OW + PV + LV + BWB',
    level: 1,
    predicateType: 'WG',
    slots: ['ow', 'pv', 'lv', 'bwb'],
    families: ['transitief_sg', 'transitief_pl'],
    wordOrders: ['ow-pv-lv-bwb', 'bwb-pv-ow-lv'],
    prompt: 'Bouw een zin met een onderwerp, persoonsvorm, lijdend voorwerp en bijwoordelijke bepaling.',
  },
  {
    id: 'wg-ow-pv-mv-lv',
    label: 'OW + PV + MV + LV',
    level: 2,
    predicateType: 'WG',
    slots: ['ow', 'pv', 'mv', 'lv'],
    families: ['geven_sg'],
    wordOrders: ['ow-pv-mv-lv', 'bwb-pv-ow-mv-lv'],
    prompt: 'Bouw een zin met een onderwerp, persoonsvorm, meewerkend voorwerp en lijdend voorwerp.',
  },
  {
    id: 'ng-ow-pv-nwd-bwb',
    label: 'OW + PV + NWD + BWB',
    level: 2,
    predicateType: 'NG',
    slots: ['ow', 'pv', 'nwd', 'bwb'],
    families: ['ng_eigenschap_sg'],
    wordOrders: ['ow-pv-nwd', 'ow-pv-nwd-bwb', 'bwb-pv-ow-nwd'],
    prompt: 'Bouw een naamwoordelijk gezegde: onderwerp, koppelwerkwoord, naamwoordelijk deel.',
  },
];
