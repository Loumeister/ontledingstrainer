/**
 * Tests voor ScoreScreen — pure hulpfuncties en berekeningslogica.
 *
 * ScoreScreen.tsx bevat meerdere pure berekeningen die onafhankelijk van
 * React-rendering getest kunnen worden:
 *   - SCORE_THRESHOLDS: drempelwaarden per niveau
 *   - effectiveThresholds: gewogen gemiddelde voor gemengde sessies
 *   - scorePercentage: afrondingslogica
 *   - scoreColor: kleurcode op basis van drempel
 *   - recommendation: actie-aanbeveling op basis van score
 *   - encouragement tier: selectie van aanmoedigingstekst
 *   - masteredRoles: rollen die in vorige sessie fout waren maar nu goed
 *
 * Geen DOM of React-rendering nodig.
 */
import { describe, it, expect } from 'vitest';
import type { Sentence } from '../types';

// ── Constanten (gespiegeld vanuit ScoreScreen.tsx) ────────────────────────────

const SCORE_THRESHOLDS: Record<number, [number, number, number]> = {
  1: [90, 80, 65],
  2: [90, 75, 60],
  3: [90, 75, 55],
  4: [85, 70, 50],
};

// ── Pure functies (gespiegeld vanuit ScoreScreen.tsx) ─────────────────────────

function computeScorePercentage(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function computeEffectiveThresholds(
  selectedLevel: number | null,
  sessionQueue: Pick<Sentence, 'level'>[],
): [number, number, number] {
  if (selectedLevel && selectedLevel >= 1 && selectedLevel <= 4) {
    return SCORE_THRESHOLDS[selectedLevel];
  }
  const counts: Record<number, number> = {};
  for (const s of sessionQueue) {
    counts[s.level] = (counts[s.level] || 0) + 1;
  }
  const total = sessionQueue.length;
  if (total === 0) return [90, 75, 55];
  let green = 0, yellow = 0, orange = 0;
  for (const [lvlStr, count] of Object.entries(counts)) {
    const lvl = Number(lvlStr);
    const [g, y, o] = SCORE_THRESHOLDS[lvl] ?? [90, 75, 55];
    const w = count / total;
    green += g * w;
    yellow += y * w;
    orange += o * w;
  }
  return [Math.round(green), Math.round(yellow), Math.round(orange)];
}

function computeRecommendation(
  scorePercentage: number,
  thresholds: [number, number, number],
  weakestRole: string | null,
): { text: string; buttonText: string } {
  const [tGreen, , tOrange] = thresholds;
  if (scorePercentage >= tGreen) {
    return { text: 'Klaar voor een nieuwe uitdaging! Probeer een nieuwe set zinnen.', buttonText: 'Nieuwe sessie' };
  }
  if (scorePercentage >= tOrange) {
    return {
      text: weakestRole ? `Focus op ${weakestRole} en probeer het nog een keer.` : 'Probeer het nog een keer.',
      buttonText: 'Nog een keer',
    };
  }
  return { text: 'Probeer dezelfde zinnen opnieuw om je score te verbeteren.', buttonText: 'Opnieuw proberen' };
}

function computeEncouragementTier(scorePercentage: number, thresholds: [number, number, number]): number {
  const [g, y, o] = thresholds;
  return scorePercentage >= g ? 3 : scorePercentage >= y ? 2 : scorePercentage >= o ? 1 : 0;
}

function computeMasteredRoles(
  previousMistakeRoles: Set<string>,
  currentMistakeStats: Record<string, number>,
): string[] {
  const currentErrorRoles = new Set(Object.keys(currentMistakeStats));
  return [...previousMistakeRoles].filter(r => !currentErrorRoles.has(r));
}

// ── Hulpfunctie ───────────────────────────────────────────────────────────────

function makeQueueEntry(level: number): Pick<Sentence, 'level'> {
  return { level: level as Sentence['level'] };
}

// ── Tests: SCORE_THRESHOLDS data-integriteit ──────────────────────────────────

describe('SCORE_THRESHOLDS', () => {
  it('bevat drempelwaarden voor niveaus 1 t/m 4', () => {
    expect(SCORE_THRESHOLDS[1]).toBeDefined();
    expect(SCORE_THRESHOLDS[2]).toBeDefined();
    expect(SCORE_THRESHOLDS[3]).toBeDefined();
    expect(SCORE_THRESHOLDS[4]).toBeDefined();
  });

  it('elke drempel is een tuple van 3 getallen', () => {
    for (const lvl of [1, 2, 3, 4]) {
      expect(SCORE_THRESHOLDS[lvl]).toHaveLength(3);
      for (const v of SCORE_THRESHOLDS[lvl]) {
        expect(typeof v).toBe('number');
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it('groene drempel is ≥ gele drempel voor elk niveau', () => {
    for (const lvl of [1, 2, 3, 4]) {
      const [green, yellow] = SCORE_THRESHOLDS[lvl];
      expect(green).toBeGreaterThanOrEqual(yellow);
    }
  });

  it('gele drempel is ≥ oranje drempel voor elk niveau', () => {
    for (const lvl of [1, 2, 3, 4]) {
      const [, yellow, orange] = SCORE_THRESHOLDS[lvl];
      expect(yellow).toBeGreaterThanOrEqual(orange);
    }
  });
});

// ── Tests: computeScorePercentage ─────────────────────────────────────────────

describe('computeScorePercentage', () => {
  it('berekent percentage correct', () => {
    expect(computeScorePercentage(8, 10)).toBe(80);
  });

  it('rondt af naar het dichtstbijzijnde geheel getal', () => {
    expect(computeScorePercentage(1, 3)).toBe(33); // 33.33...
    expect(computeScorePercentage(2, 3)).toBe(67); // 66.66...
  });

  it('retourneert 0 als total 0 is (geen deling door nul)', () => {
    expect(computeScorePercentage(0, 0)).toBe(0);
  });

  it('retourneert 100 bij alle correct', () => {
    expect(computeScorePercentage(5, 5)).toBe(100);
  });

  it('retourneert 0 bij geen correct', () => {
    expect(computeScorePercentage(0, 5)).toBe(0);
  });
});

// ── Tests: computeEffectiveThresholds ─────────────────────────────────────────

describe('computeEffectiveThresholds', () => {
  it('retourneert directe niveau-drempel voor niveau 1', () => {
    expect(computeEffectiveThresholds(1, [])).toEqual([90, 80, 65]);
  });

  it('retourneert directe niveau-drempel voor niveau 2', () => {
    expect(computeEffectiveThresholds(2, [])).toEqual([90, 75, 60]);
  });

  it('retourneert directe niveau-drempel voor niveau 3', () => {
    expect(computeEffectiveThresholds(3, [])).toEqual([90, 75, 55]);
  });

  it('retourneert directe niveau-drempel voor niveau 4', () => {
    expect(computeEffectiveThresholds(4, [])).toEqual([85, 70, 50]);
  });

  it('retourneert fallback-drempel bij null selectedLevel en lege wachtrij', () => {
    expect(computeEffectiveThresholds(null, [])).toEqual([90, 75, 55]);
  });

  it('berekent gewogen gemiddelde voor gemengde niveaus', () => {
    // 50% niveau 1 [90,80,65] + 50% niveau 2 [90,75,60]
    // green = 0.5*90 + 0.5*90 = 90, yellow = 0.5*80 + 0.5*75 = 77.5 → 78, orange = 0.5*65 + 0.5*60 = 62.5 → 63
    const queue = [makeQueueEntry(1), makeQueueEntry(2)];
    const [green, yellow, orange] = computeEffectiveThresholds(null, queue);
    expect(green).toBe(90);
    expect(yellow).toBe(78);
    expect(orange).toBe(63);
  });

  it('retourneert niveau-drempel voor enkelvoudige wachtrij', () => {
    const queue = [makeQueueEntry(1), makeQueueEntry(1), makeQueueEntry(1)];
    expect(computeEffectiveThresholds(null, queue)).toEqual([90, 80, 65]);
  });
});

// ── Tests: computeRecommendation ──────────────────────────────────────────────

describe('computeRecommendation', () => {
  const thresholds: [number, number, number] = [90, 75, 55];

  it('adviseert nieuwe sessie bij score ≥ groene drempel', () => {
    const rec = computeRecommendation(95, thresholds, null);
    expect(rec.buttonText).toBe('Nieuwe sessie');
  });

  it('adviseert exacte groene drempel als nieuwe sessie', () => {
    const rec = computeRecommendation(90, thresholds, null);
    expect(rec.buttonText).toBe('Nieuwe sessie');
  });

  it('adviseert herhalen met rolnaam bij score tussen oranje en groen', () => {
    const rec = computeRecommendation(70, thresholds, 'PV');
    expect(rec.buttonText).toBe('Nog een keer');
    expect(rec.text).toContain('PV');
  });

  it('adviseert herhalen zonder rolnaam als geen zwakste rol beschikbaar', () => {
    const rec = computeRecommendation(70, thresholds, null);
    expect(rec.buttonText).toBe('Nog een keer');
    expect(rec.text).toBe('Probeer het nog een keer.');
  });

  it('adviseert opnieuw proberen bij score onder oranje drempel', () => {
    const rec = computeRecommendation(40, thresholds, null);
    expect(rec.buttonText).toBe('Opnieuw proberen');
  });

  it('score precies op oranje drempel adviseert herhalen', () => {
    const rec = computeRecommendation(55, thresholds, null);
    expect(rec.buttonText).toBe('Nog een keer');
  });
});

// ── Tests: computeEncouragementTier ──────────────────────────────────────────

describe('computeEncouragementTier', () => {
  const thresholds: [number, number, number] = [90, 75, 55];

  it('tier 3 bij score ≥ groene drempel', () => {
    expect(computeEncouragementTier(90, thresholds)).toBe(3);
    expect(computeEncouragementTier(100, thresholds)).toBe(3);
  });

  it('tier 2 bij score tussen geel en groen', () => {
    expect(computeEncouragementTier(80, thresholds)).toBe(2);
    expect(computeEncouragementTier(75, thresholds)).toBe(2);
  });

  it('tier 1 bij score tussen oranje en geel', () => {
    expect(computeEncouragementTier(60, thresholds)).toBe(1);
    expect(computeEncouragementTier(55, thresholds)).toBe(1);
  });

  it('tier 0 bij score onder oranje drempel', () => {
    expect(computeEncouragementTier(40, thresholds)).toBe(0);
    expect(computeEncouragementTier(0, thresholds)).toBe(0);
  });
});

// ── Tests: computeMasteredRoles ───────────────────────────────────────────────

describe('computeMasteredRoles', () => {
  it('retourneert rollen die vorige sessie fout waren maar nu goed zijn', () => {
    const prev = new Set(['PV', 'OW', 'LV']);
    const current = { OW: 1 }; // OW nog steeds fout
    const mastered = computeMasteredRoles(prev, current);
    expect(mastered).toContain('PV');
    expect(mastered).toContain('LV');
    expect(mastered).not.toContain('OW');
  });

  it('retourneert lege array als geen nieuwe rollen beheerst', () => {
    const prev = new Set(['PV', 'OW']);
    const current = { PV: 2, OW: 1 };
    expect(computeMasteredRoles(prev, current)).toHaveLength(0);
  });

  it('retourneert lege array als er geen vorige fouten waren', () => {
    expect(computeMasteredRoles(new Set(), { PV: 1 })).toHaveLength(0);
  });

  it('retourneert alle vorige fout-rollen als current leeg is', () => {
    const prev = new Set(['PV', 'LV']);
    const mastered = computeMasteredRoles(prev, {});
    expect(mastered).toContain('PV');
    expect(mastered).toContain('LV');
    expect(mastered).toHaveLength(2);
  });
});
