import { DifficultyLevel, Sentence } from '../types';

export type PredicateMode = 'ALL' | 'WG' | 'NG';

export interface SentenceFilterConfig {
  predicateMode: PredicateMode;
  selectedLevel: DifficultyLevel | null;
  focusLV: boolean;
  focusMV: boolean;
  focusVV: boolean;
  focusBijzin: boolean;
  /** Zinnen met een voorzetselvoorwerp mogen meedoen (en moeten dan benoemd worden). */
  includeVV: boolean;
  /** Rollenladder-filter; vervangt niveau- en vz.vw-filter als het is gezet. */
  ladderFilter?: (s: Sentence) => boolean;
}

/** Vz.vw staat standaard aan vanaf Hoog; bij Instap t/m Middel en 'Alles' uit. */
export function defaultIncludeVV(level: DifficultyLevel | null): boolean {
  return level === 3 || level === 4;
}

export function filterSentences(sentences: Sentence[], cfg: SentenceFilterConfig): Sentence[] {
  return sentences.filter(s => {
    const isCompound = s.level === 4;
    if (isCompound && !cfg.focusBijzin && cfg.selectedLevel !== 4) return false;

    if (cfg.predicateMode === 'WG' && s.predicateType !== 'WG') return false;
    if (cfg.predicateMode === 'NG' && s.predicateType !== 'NG') return false;

    const hasRole = (role: string) => s.tokens.some(t => t.role === role);

    if (cfg.focusLV || cfg.focusMV || cfg.focusVV) {
      const matchesFocus =
        (cfg.focusLV && hasRole('lv')) ||
        (cfg.focusMV && hasRole('mv')) ||
        (cfg.focusVV && hasRole('vv')) ||
        (cfg.focusBijzin && isCompound);
      if (!matchesFocus) return false;
    } else if (cfg.focusBijzin && !isCompound) {
      return false;
    }

    // Bijstellingen horen pas bij Hoog en Samengesteld, ook in docentzinnen.
    if (s.level < 3 && hasRole('bijst')) return false;

    // De Rollenladder bepaalt zelf welke rollen meedoen.
    if (cfg.ladderFilter) return cfg.ladderFilter(s);

    if (!cfg.includeVV && !cfg.focusVV && hasRole('vv')) return false;
    if (cfg.selectedLevel !== null && s.level !== cfg.selectedLevel) return false;

    return true;
  });
}
