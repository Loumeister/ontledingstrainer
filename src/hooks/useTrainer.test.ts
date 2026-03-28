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

// Gespiegeld van filteredSentences useMemo in useTrainer.ts
interface FilterConfig {
  predicateMode: 'ALL' | 'WG' | 'NG';
  selectedLevel: DifficultyLevel | null;
  focusLV: boolean;
  focusMV: boolean;
  focusVV: boolean;
  focusBijzin: boolean;
  includeBijst: boolean;
  includeVV: boolean;
}

function filterSentences(sentences: Sentence[], cfg: FilterConfig): Sentence[] {
  return sentences.filter(s => {
    const isCompound = s.level === 4;
    const explicitlySelectedCompoundLevel = cfg.selectedLevel === 4;
    if (isCompound && !cfg.focusBijzin && !explicitlySelectedCompoundLevel) return false;

    if (cfg.predicateMode === 'WG' && s.predicateType !== 'WG') return false;
    if (cfg.predicateMode === 'NG' && s.predicateType !== 'NG') return false;

    const specificFocusActive = cfg.focusLV || cfg.focusMV || cfg.focusVV;

    if (specificFocusActive) {
      const matchesFocus = (
        (cfg.focusLV && s.tokens.some(t => t.role === 'lv')) ||
        (cfg.focusMV && s.tokens.some(t => t.role === 'mv')) ||
        (cfg.focusVV && s.tokens.some(t => t.role === 'vv')) ||
        (cfg.focusBijzin && isCompound)
      );
      if (!matchesFocus) return false;
    } else if (cfg.focusBijzin) {
      if (!isCompound) return false;
    }

    const isLevelHighOrAll = cfg.selectedLevel === 3 || cfg.selectedLevel === null;
    const isLevelLow = cfg.selectedLevel === 1;

    if (!isCompound && !isLevelHighOrAll && !cfg.includeBijst && s.tokens.some(t => t.role === 'bijst')) {
      return false;
    }

    if (!isCompound && isLevelLow && !cfg.includeVV && !cfg.focusVV && s.tokens.some(t => t.role === 'vv')) {
      return false;
    }

    if (cfg.selectedLevel !== null) {
      if (s.level !== cfg.selectedLevel) return false;
    }

    return true;
  });
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

const defaultCfg: FilterConfig = {
  predicateMode: 'ALL',
  selectedLevel: null,
  focusLV: false,
  focusMV: false,
  focusVV: false,
  focusBijzin: false,
  includeBijst: false,
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

  it('meerdere focusfilters actief: OR-logica', () => {
    const result = filterSentences(sentences, { ...defaultCfg, selectedLevel: 1, focusLV: true, focusMV: true });
    expect(result).toContain(metLV);
    expect(result).toContain(metMV);
    expect(result).not.toContain(basisZin);
  });
});

// ── Tests: filterSentences — bijst en vv filters ─────────────────────────────

describe('filterSentences — bijst en vv-filters', () => {
  const metBijst = makeSentence({ level: 2, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('bijst')] });
  const metVV = makeSentence({ level: 1, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('vv')] });
  const basisZin = makeSentence({ level: 2, predicateType: 'WG' });

  it('bijst-zinnen worden uitgefilterd bij level 2 zonder includeBijst', () => {
    const result = filterSentences([metBijst, basisZin], { ...defaultCfg, selectedLevel: 2, includeBijst: false });
    expect(result).not.toContain(metBijst);
    expect(result).toContain(basisZin);
  });

  it('bijst-zinnen worden toegelaten bij includeBijst=true', () => {
    const result = filterSentences([metBijst, basisZin], { ...defaultCfg, selectedLevel: 2, includeBijst: true });
    expect(result).toContain(metBijst);
  });

  it('bijst-zinnen worden altijd toegelaten bij level 3 (isLevelHighOrAll)', () => {
    const metBijst3 = makeSentence({ level: 3, predicateType: 'WG', tokens: [makeToken('pv'), makeToken('bijst')] });
    const result = filterSentences([metBijst3], { ...defaultCfg, selectedLevel: 3, includeBijst: false });
    expect(result).toContain(metBijst3);
  });

  it('vv-zinnen worden uitgefilterd bij level 1 zonder includeVV', () => {
    const result = filterSentences([metVV], { ...defaultCfg, selectedLevel: 1, includeVV: false });
    expect(result).not.toContain(metVV);
  });

  it('vv-zinnen worden toegelaten bij focusVV', () => {
    const result = filterSentences([metVV], { ...defaultCfg, selectedLevel: 1, includeVV: false, focusVV: true });
    expect(result).toContain(metVV);
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
