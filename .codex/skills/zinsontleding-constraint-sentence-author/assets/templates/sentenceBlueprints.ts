export type Blueprint = {
  focus: string;
  pattern: string;
  constraints: string[];
};

export const sentenceBlueprints: Blueprint[] = [
  {
    focus: 'inversie',
    pattern: '[BWB_tijd|plaats] [PV] [OW] [LV]',
    constraints: [
      'Plaats OW na PV',
      'Houd zin natuurlijk voor onderbouw',
      'Maak PV eenduidig met tijdproef'
    ]
  },
  {
    focus: 'mv_vs_lv',
    pattern: '[OW] [PV] [MV] [LV]',
    constraints: [
      'LV beantwoordt wie/wat + gezegde + onderwerp',
      'MV beantwoordt aan/voor wie',
      'Geen voorzetselgroep als schijn-MV'
    ]
  },
  {
    focus: 'vv_vs_bwb',
    pattern: '[OW] [PV] [VZ-groep]',
    constraints: [
      'Maak expliciet of voorzetsel geëist wordt door ww/bn',
      'Vermijd gevallen met dubbele lezing',
      'Schrijf contrastpaar voor feedback'
    ]
  }
];
