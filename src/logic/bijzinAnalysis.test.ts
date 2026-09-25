import { describe, it, expect } from 'vitest';
import { buildBijzinSentence, checkBijzinAnalyse, getBijzinTokenGroups, isBijzinAnalyseAsked, isBijzinUnlocked } from './bijzinAnalysis';
import { HINTS } from '../constants';
import { validateAnswer, computeCorrectSplits } from './validation';
import type { Sentence, Token } from '../types';

// "Ik weet dat hij morgen komt." — LV-bijzin
const tokens: Token[] = [
  { id: 't1', text: 'Ik', role: 'ow' },
  { id: 't2', text: 'weet', role: 'pv' },
  { id: 't3', text: 'dat', role: 'bijzin', subRole: 'vw_onder', bijzinFunctie: 'lv', bijzinAnalyse: { role: 'vw_onder' } },
  { id: 't4', text: 'hij', role: 'bijzin', bijzinAnalyse: { role: 'ow' } },
  { id: 't5', text: 'morgen', role: 'bijzin', bijzinAnalyse: { role: 'bwb' } },
  { id: 't6', text: 'komt.', role: 'bijzin', bijzinAnalyse: { role: 'pv' } },
];
const sentence: Sentence = { id: 1, label: 'Test', level: 3, predicateType: 'WG', tokens };
const bijzin = getBijzinTokenGroups(sentence)[0];

describe('buildBijzinSentence', () => {
  it('maakt van de bijzin een eigen zin die validateAnswer kan nakijken', () => {
    const derived = buildBijzinSentence(sentence, bijzin)!;
    expect(derived.tokens.map(t => t.role)).toEqual(['vw_onder', 'ow', 'bwb', 'pv']);
    const splits = computeCorrectSplits(derived.tokens);
    const good = validateAnswer(derived, splits, { t3: 'vw_onder', t4: 'ow', t5: 'bwb', t6: 'pv' }, {}, false);
    expect(good.result.isPerfect).toBe(true);
    const wrong = validateAnswer(derived, splits, { t3: 'bwb', t4: 'ow', t5: 'bwb', t6: 'pv' }, {}, false);
    expect(wrong.result.chunkStatus[0]).toBe('incorrect-role');
  });

  describe('verbindingswoord (die, dat, waar …)', () => {
    const rel: Token[] = [
      { id: 'r1', text: 'die', role: 'bijzin', bijzinAnalyse: { role: 'ow', verbindingswoord: true } },
      { id: 'r2', text: 'slaapt', role: 'bijzin', bijzinAnalyse: { role: 'pv' } },
    ];

    it('laat het onder het hoogste niveau weg', () => {
      expect(buildBijzinSentence({ ...sentence, level: 3 }, rel)!.tokens.map(t => t.text)).toEqual(['slaapt']);
    });

    it('vraagt het op het hoogste niveau als eigen zinsdeel met zijn functie', () => {
      const derived = buildBijzinSentence({ ...sentence, level: 4 }, rel)!;
      expect(derived.tokens.map(t => `${t.text}:${t.role}`)).toEqual(['die:ow', 'slaapt:pv']);
      const splits = computeCorrectSplits(derived.tokens);
      expect(checkBijzinAnalyse(derived, rel, splits, { r1: 'ow', r2: 'pv' }).result.isPerfect).toBe(true);
    });

    it('wijst bij "onderschikkend voegwoord" op de eigen functie in de bijzin', () => {
      const derived = buildBijzinSentence({ ...sentence, level: 4 }, rel)!;
      const { result } = checkBijzinAnalyse(derived, rel, computeCorrectSplits(derived.tokens), { r1: 'vw_onder', r2: 'pv' });
      expect(result.chunkStatus[0]).toBe('incorrect-role');
      expect(result.chunkFeedback[0]).toBe(HINTS.VERBINDINGSWOORD_HAS_FUNCTIE('die'));
    });
  });

  it('geeft null voor een bijzin zonder annotatie', () => {
    const bare = bijzin.map(({ bijzinAnalyse: _b, ...t }) => t);
    expect(buildBijzinSentence(sentence, bare)).toBeNull();
  });
});

describe('isBijzinUnlocked', () => {
  const splits = new Set([0, 1]);
  it('opent pas als de hele hoofdzin gelabeld is en de bijzin zelf klopt', () => {
    expect(isBijzinUnlocked(sentence, bijzin, splits, { t1: 'ow', t2: 'pv', t3: 'bijzin' }, { t3: 'lv' }, false)).toBe(true);
    expect(isBijzinUnlocked(sentence, bijzin, splits, { t2: 'pv', t3: 'bijzin' }, { t3: 'lv' }, false)).toBe(false);
    expect(isBijzinUnlocked(sentence, bijzin, splits, { t1: 'ow', t2: 'pv', t3: 'bijzin' }, { t3: 'bwb' }, false)).toBe(false);
    expect(isBijzinUnlocked(sentence, bijzin, new Set([0, 1, 3]), { t1: 'ow', t2: 'pv', t3: 'bijzin', t5: 'bijzin' }, { t3: 'lv' }, false)).toBe(false);
  });

  it('laat een fout elders in de hoofdzin de bijzin niet blokkeren', () => {
    expect(isBijzinUnlocked(sentence, bijzin, splits, { t1: 'lv', t2: 'pv', t3: 'bijzin' }, { t3: 'lv' }, false)).toBe(true);
  });
});

describe('isBijzinAnalyseAsked', () => {
  it('ontleedt een betrekkelijke bijzin alleen op het hoogste niveau', () => {
    const rel: Token[] = [{ id: 'r1', text: 'die', role: 'bijzin', bijzinFunctie: 'bijv_bep' }];
    expect(isBijzinAnalyseAsked({ ...sentence, level: 4 }, rel)).toBe(true);
    expect(isBijzinAnalyseAsked({ ...sentence, level: 3 }, rel)).toBe(false);
    expect(isBijzinAnalyseAsked({ ...sentence, level: 3 }, bijzin)).toBe(true);
  });
});
