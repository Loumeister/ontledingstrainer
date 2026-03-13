export type FocusDifficulty = {
  focus: string;
  difficulty: 1 | 2 | 3 | 4;
  rationale: string;
};

export const difficultyModel: FocusDifficulty[] = [
  { focus: 'basisvolgorde', difficulty: 1, rationale: 'Rechte woordvolgorde met pv/ow/lv.' },
  { focus: 'inversie', difficulty: 1, rationale: 'OW staat niet op plek 1.' },
  { focus: 'mv_vs_lv', difficulty: 2, rationale: 'Twee objecten onderscheiden.' },
  { focus: 'ng_vs_wg', difficulty: 2, rationale: 'Koppelwerkwoord vs handeling.' },
  { focus: 'vv_vs_bwb', difficulty: 3, rationale: 'Semantisch onderscheid met voorzetselgroep.' },
  { focus: 'samengestelde_tijden', difficulty: 3, rationale: 'PV onderscheiden van volledige gezegde.' },
  { focus: 'bijzin_als_zinsdeel', difficulty: 3, rationale: 'Zinsdeelgrens over langere eenheid.' },
  { focus: 'onderwerp_op_afstand', difficulty: 4, rationale: 'Nabijheidsfout actief voorkomen.' },
  { focus: 'verwarrende_woordvolgorde', difficulty: 4, rationale: 'Meerdere verplaatsingen zonder ambiguïteit.' },
  { focus: 'werkwoordspelling_relevant', difficulty: 4, rationale: 'Ontleding koppelen aan correcte werkwoordsvorm.' }
];
