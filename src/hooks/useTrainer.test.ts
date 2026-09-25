/**
 * Tests voor useTrainer — getest via de onderliggende pure functies.
 *
 * useTrainer zelf is een complexe React hook met 23+ useState-aanroepen en
 * side effects. We testen hier de extracteerbare pure logica:
 *   - loadStudentInfo: localStorage-reader met fallback
 *   - setStudentInfo transformaties: trim / capitalize / lowercase
 *   - filteredSentences logica: filter op level, predicateType, focusfilters
 *   - allLabeled berekening: bepaal of alle chunks een label hebben
 *
 * Geen DOM of React-rendering nodig; zelfde patroon als useZinsbouwlab.test.ts.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Sentence, Token, DifficultyLevel } from '../types';
import level0 from '../data/sentences-level-0.json';
import level1 from '../data/sentences-level-1.json';
import level2 from '../data/sentences-level-2.json';
import { getLadderSentenceFilter } from '../logic/rollenladder';
import { filterSentences, defaultIncludeVV, getFocusAvailability, type SentenceFilterConfig } from '../logic/sentenceFilter';

// ── localStorage mock ─────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
};
vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => localStorageMock.clear());

// ── Hulpfuncties (gespiegeld vanuit useTrainer.ts) ────────────────────────────

const STUDENT_INFO_KEY = 'student_info_v1';

function loadStudentInfo(): { name: string; initiaal: string; klas: string } {
  try {
    const raw = localStorage.getItem(STUDENT_INFO_KEY);
    if (!raw) return { name: '', initiaal: '', klas: '' };
    const parsed = JSON.parse(raw) as { name?: string; initiaal?: string; klas?: string };
    return { name: parsed.name || '', initiaal: parsed.initiaal || '', klas: parsed.klas || '' };
  } catch {
    return { name: '', initiaal: '', klas: '' };
  }
}

function applyStudentInfoTransform(name: string, initiaal: string, klas: string) {
  return {
    name: name.trim(),
    initiaal: initiaal.trim().charAt(0).toUpperCase(),
    klas: klas.trim().toLowerCase(),
  };
}

// ── Testdata hulpfuncties ─────────────────────────────────────────────────────

function makeToken(role: string, overrides: Partial<Token> = {}): Token {
  return {
    id: `s1w${Math.random()}`,
    text: 'woord',
    role: role as Token['role'],
    ...overrides,
  };
}

function makeSentence(overrides: Partial<Sentence> & { level: DifficultyLevel; predicateType: 'WG' | 'NG' }): Sentence {
  return {
    id: Math.floor(Math.random() * 10000),
    label: 'Testzin',
    tokens: [makeToken('pv'), makeToken('ow')],
    ...overrides,
  };
}

const defaultCfg: SentenceFilterConfig = {
  predicateMode: 'ALL',
  selectedLevel: null,
  focusLV: false,
  focusMV: false,
  focusVV: false,
  focusBijzin: false,
  includeVV: false,
};

// ── Tests: loadStudentInfo ────────────────────────────────────────────────────

describe('loadStudentInfo', () => {
  it('retourneert lege strings als localStorage leeg is', () => {
    const result = loadStudentInfo();
    expect(result).toEqual({ name: '', initiaal: '', klas: '' });
  });

  it('laadt opgeslagen studentgegevens correct', () => {
    localStorage.setItem(STUDENT_INFO_KEY, JSON.stringify({ name: 'Jan', initiaal: 'J', klas: '2a' }));
    const result = loadStudentInfo();
    expect(result.name).toBe('Jan');
    expect(result.initiaal).toBe('J');
    expect(result.klas).toBe('2a');
  });

  it('retourneert lege strings bij ongeldige JSON', () => {
    localStorage.setItem(STUDENT_INFO_KEY, 'geen-json{{{');
    const result = loadStudentInfo();
    expect(result).toEqual({ name: '', initiaal: '', klas: '' });
  });

  it('vult ontbrekende velden aan met lege string', () => {
    localStorage.setItem(STUDENT_INFO_KEY, JSON.stringify({ name: 'Lisa' }));
    const result = loadStudentInfo();
    expect(result.name).toBe('Lisa');
    expect(result.initiaal).toBe('');
    expect(result.klas).toBe('');
  });
});

// ── Tests: setStudentInfo transformaties ─────────────────────────────────────

describe('setStudentInfo transformaties', () => {
  it('trimt witruimte van naam', () => {
    const { name } = applyStudentInfoTransform('  Jan  ', 'J', '2a');
    expect(name).toBe('Jan');
  });

  it('pakt eerste letter van initiaal en maakt het hoofdletter', () => {
    const { initiaal } = applyStudentInfoTransform('Jan', 'jan', '2a');
    expect(initiaal).toBe('J');
  });

  it('initiaal van meerdere letters wordt ingekort naar eerste karakter', () => {
    const { initiaal } = applyStudentInfoTransform('Anna', 'anna', '2b');
    expect(initiaal).toBe('A');
  });

  it('maakt klasnaam kleine letters', () => {
    const { klas } = applyStudentInfoTransform('Jan', 'J', '2A');
    expect(klas).toBe('2a');
  });

  it('trimt witruimte van klas', () => {
    const { klas } = applyStudentInfoTransform('Jan', 'J', '  2a  ');
    expect(klas).toBe('2a');
  });

  it('lege initiaal geeft lege string terug', () => {
    const { initiaal } = applyStudentInfoTransform('Jan', '', '2a');
    expect(initiaal).toBe('');
  });
});

// ── Tests: filterSentences — predicateMode ────────────────────────────────────

describe('filterSentences — predicateMode', () => {
  const wgZin = makeSentence({ level: 1, predicateType: 'WG' });
  const ngZin = makeSentence({ level: 1, predicateType: 'NG' });
  const sentences = [wgZin, ngZin];

  it('ALL laat WG én NG door', () => {
    const result = filterSentences(sentences, { ...defaultCfg, selectedLevel: 1 });
    expect(result).toContain(wgZin);
    expect(result).toContain(ngZin);
  });

  it('WG filtert NG-zinnen uit', () => {
    const result = filterSentences(sentences, { ...defaultCfg, predicateMode: 'WG', selectedLevel: 1 });
    expect(result).toContain(wgZin);
    expect(result).not.toContain(ngZin);
  });

  it('NG filtert WG-zinnen uit', () => {
    const result = filterSentences(sentences, { ...defaultCfg, predicateMode: 'NG', selectedLevel: 1 });
    expect(result).toContain(ngZin);
    expect(result).not.toContain(wgZin);
  });
});

// ── Tests: filterSentences — level ───────────────────────────────────────────

describe('filterSentences — niveaufilter', () => {
  const niveau1 = makeSentence({ level: 1, predicateType: 'WG' });
  const niveau2 = makeSentence({ level: 2, predicateType: 'WG' });
  const niveau3 = makeSentence({ level: 3, predicateType: 'WG' });
  const sentences = [niveau1, niveau2, niveau3];

  it('selectedLevel null laat alle niveaus door', () => {
    const result = filterSentences(sentences, defaultCfg);
    expect(result).toHaveLength(3);
  });

  it('selectedLevel 1 laat alleen niveau-1-zinnen door', () => {
    const result = filterSentences(sentences, { ...defaultCfg, selectedLevel: 1 });
    expect(result).toEqual([niveau1]);
  });

  it('selectedLevel 2 laat alleen niveau-2-zinnen door', () => {
    const result = filterSentences(sentences, { ...defaultCfg, selectedLevel: 2 });
    expect(result).toEqual([niveau2]);
  });
});

// ── Tests: filterSentences — samengestelde zinnen (niveau 4) ─────────────────

describe('filterSentences — samengestelde zinnen (niveau 4)', () => {
  const enkelvoudig = makeSentence({ level: 1, predicateType: 'WG' });
  const samengesteld = makeSentence({ level: 4, predicateType: 'WG' });
  const sentences = [enkelvoudig, samengesteld];

  it('samengestelde zinnen worden uitgefilterd zonder focusBijzin of level 4', () => {
    const result = filterSentences(sentences, defaultCfg);
    expect(result).not.toContain(samengesteld);
    expect(result).toContain(enkelvoudig);
  });

  it('focusBijzin=true laat samengestelde zinnen door', () => {
    const result = filterSentences(sentences, { ...defaultCfg, focusBijzin: true });
    expect(result).toContain(samengesteld);
  });

  it('focusBijzin=true filtert enkelvoudige zinnen uit', () => {
    const result = filterSentences(sentences, { ...defaultCfg, focusBijzin: true });
    expect(result).not.toContain(enkelvoudig);
  });

  it('selectedLevel 4 laat samengestelde zinnen door zonder focusBijzin', () => {
    const result = filterSentences(sentences, { ...defaultCfg, selectedLevel: 4 });
    expect(result).toContain(samengesteld);
  });
});

// ── Tests: filterSentences — focusfilters (LV, MV, VV) ───────────────────────

describe('filterSentences — focusfilters', () => {
  const metLV = makeSentence({ level: 1, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('lv')] });
  const metMV = makeSentence({ level: 1, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('mv')] });
  const metVV = makeSentence({ level: 1, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('vv')] });
  const basisZin = makeSentence({ level: 1, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('ow')] });
  const sentences = [metLV, metMV, metVV, basisZin];

  it('focusLV laat alleen zinnen met LV door', () => {
    const result = filterSentences(sentences, { ...defaultCfg, selectedLevel: 1, focusLV: true });
    expect(result).toContain(metLV);
    expect(result).not.toContain(metMV);
    expect(result).not.toContain(basisZin);
  });

  it('focusMV laat alleen zinnen met MV door', () => {
    const result = filterSentences(sentences, { ...defaultCfg, selectedLevel: 1, focusMV: true });
    expect(result).toContain(metMV);
    expect(result).not.toContain(metLV);
    expect(result).not.toContain(basisZin);
  });

  it('focusVV laat alleen zinnen met VV door', () => {
    const result = filterSentences(sentences, { ...defaultCfg, selectedLevel: 1, focusVV: true });
    expect(result).toContain(metVV);
    expect(result).not.toContain(metLV);
  });

  it('focusNG laat alleen zinnen met een naamwoordelijk gezegde door', () => {
    const ng = makeSentence({ level: 1, predicateType: 'NG' });
    const result = filterSentences([...sentences, ng], { ...defaultCfg, selectedLevel: 1, focusNG: true });
    expect(result).toEqual([ng]);
  });

  it('focusBB laat alleen zinnen met een bijvoeglijke bepaling door', () => {
    const metBB = makeSentence({ level: 1, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('ow', { subRole: 'bijv_bep' })] });
    const result = filterSentences([...sentences, metBB], { ...defaultCfg, selectedLevel: 1, focusBB: true });
    expect(result).toEqual([metBB]);
  });

  it('focusBB telt een bijzin als bijv. bepaling alleen waar die functie gevraagd wordt', () => {
    const laag = makeSentence({ level: 3, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('bijzin', { bijzinFunctie: 'bijv_bep' })] });
    const hoog = makeSentence({ level: 4, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('bijzin', { bijzinFunctie: 'bijv_bep' })] });
    expect(filterSentences([laag], { ...defaultCfg, selectedLevel: 3, focusBB: true })).toHaveLength(0);
    expect(filterSentences([hoog], { ...defaultCfg, selectedLevel: 4, focusBB: true })).toContain(hoog);
  });

  it('meerdere focusfilters actief: OR-logica', () => {
    const result = filterSentences(sentences, { ...defaultCfg, selectedLevel: 1, focusLV: true, focusMV: true });
    expect(result).toContain(metLV);
    expect(result).toContain(metMV);
    expect(result).not.toContain(basisZin);
  });
});

// ── Tests: filterSentences — bijstelling en voorzetselvoorwerp ─────────────

describe('filterSentences — bijst en vv', () => {
  const metBijst = makeSentence({ level: 3, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('bijst')] });
  const metVV = makeSentence({ level: 2, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('vv')] });
  const basisZin = makeSentence({ level: 2, predicateType: 'WG' });

  it('bijst-zinnen doen mee vanaf Hoog', () => {
    expect(filterSentences([metBijst], { ...defaultCfg, selectedLevel: 3 })).toContain(metBijst);
  });

  it('bijst-zinnen op een laag niveau (bijv. docentzinnen) vallen altijd weg', () => {
    const laagMetBijst = makeSentence({ level: 1, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('bijst')] });
    expect(filterSentences([laagMetBijst], { ...defaultCfg, selectedLevel: 1 })).toHaveLength(0);
    expect(filterSentences([laagMetBijst], defaultCfg)).toHaveLength(0);
  });

  it('ingebouwde zinnen van Instap t/m Middel bevatten geen bijstelling', () => {
    for (const data of [level0, level1, level2]) {
      const metBijstelling = (data as Sentence[]).filter(z => z.tokens.some(t => t.role === 'bijst' || t.subRole === 'bijst'));
      expect(metBijstelling.map(z => z.id)).toEqual([]);
    }
  });

  it('vv-zinnen vallen weg als includeVV uit staat, ook bij Middel en Alles', () => {
    expect(filterSentences([metVV, basisZin], { ...defaultCfg, selectedLevel: 2 })).toEqual([basisZin]);
    expect(filterSentences([metVV], defaultCfg)).toHaveLength(0);
  });

  it('vv-zinnen doen mee als includeVV aan staat', () => {
    expect(filterSentences([metVV], { ...defaultCfg, selectedLevel: 2, includeVV: true })).toContain(metVV);
  });

  it('vv-zinnen worden toegelaten bij focusVV', () => {
    expect(filterSentences([metVV], { ...defaultCfg, selectedLevel: 2, focusVV: true })).toContain(metVV);
  });

  it('de Rollenladder laat samengestelde zinnen toe als de trede dat doet', () => {
    const samengesteld = makeSentence({ level: 4, predicateType: 'WG' });
    expect(filterSentences([samengesteld], { ...defaultCfg, ladderFilter: getLadderSentenceFilter(8) })).toContain(samengesteld);
    expect(filterSentences([samengesteld], { ...defaultCfg, ladderFilter: getLadderSentenceFilter(1) })).toHaveLength(0);
  });

  it('de Rollenladder negeert de oefenmodus', () => {
    const wg = makeSentence({ level: 0, predicateType: 'WG' });
    const result = filterSentences([wg], { ...defaultCfg, focusNG: true, focusLV: true, ladderFilter: getLadderSentenceFilter(1) });
    expect(result).toContain(wg);
  });

  it('de Rollenladder negeert de vz.vw-schakelaar', () => {
    const result = filterSentences([metVV], { ...defaultCfg, ladderFilter: () => true });
    expect(result).toContain(metVV);
  });

  it('vz.vw staat standaard alleen aan bij Hoog en Samengesteld', () => {
    expect([null, 0, 1, 2, 3, 4].map(l => defaultIncludeVV(l as DifficultyLevel | null)))
      .toEqual([false, false, false, false, true, true]);
  });
});

// ── Tests: getFocusAvailability ──────────────────────────────────────────────

describe('getFocusAvailability', () => {
  const basisWG = makeSentence({ level: 1, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('lv')] });
  const basisNG = makeSentence({ level: 1, predicateType: 'NG', tokens: [makeToken('pv'), makeToken('ow')] });
  const middelVV = makeSentence({ level: 2, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('vv')] });
  const zinnen = [basisWG, basisNG, middelVV];

  it('vz.vw is niet beschikbaar op Basis, wel op Middel (ook met de vz.vw-schakelaar uit)', () => {
    expect(getFocusAvailability(zinnen, { predicateMode: 'ALL', selectedLevel: 1, includeVV: false }).vv.count).toBe(0);
    expect(getFocusAvailability(zinnen, { predicateMode: 'ALL', selectedLevel: 2, includeVV: false }).vv.count).toBe(1);
  });

  it('NG telt 0 bij Alleen WG, maar wel mee ongeacht het gezegde', () => {
    const ng = getFocusAvailability(zinnen, { predicateMode: 'WG', selectedLevel: 1, includeVV: false }).ng;
    expect(ng).toEqual({ count: 0, countAnyPredicate: 1 });
  });
});

// ── Tests: filterSentences — lege set ────────────────────────────────────────

describe('filterSentences — randgevallen', () => {
  it('lege invoer geeft lege uitvoer', () => {
    expect(filterSentences([], defaultCfg)).toHaveLength(0);
  });

  it('alle zinnen door bij permissieve configuratie', () => {
    const zinnen = [
      makeSentence({ level: 1, predicateType: 'WG' }),
      makeSentence({ level: 2, predicateType: 'NG' }),
      makeSentence({ level: 3, predicateType: 'WG' }),
    ];
    const result = filterSentences(zinnen, defaultCfg);
    expect(result).toHaveLength(3);
  });
});
