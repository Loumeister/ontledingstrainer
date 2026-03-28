/**
 * Tests voor StudentDashboardScreen — pure hulpfuncties en dataverwerkingslogica.
 *
 * StudentDashboardScreen.tsx heeft geen eigen business-logica — het delegeert
 * berekeningen aan analyticsHelpers. Wél bevat het scherm:
 *   - LEVEL_LABELS: mapping van DifficultyLevel naar weergavenaam
 *   - sessie-percentage berekening (scoreCorrect / scoreTotal)
 *   - completedSubs filtering en sortering op completedAt
 *
 * Geen DOM of React-rendering nodig.
 */
import { describe, it, expect } from 'vitest';
import type { TrainerSubmission } from '../types';

// ── Constanten (gespiegeld vanuit StudentDashboardScreen.tsx) ─────────────────

const LEVEL_LABELS: Record<number, string> = {
  0: 'Instap', 1: 'Basis', 2: 'Middel', 3: 'Hoog', 4: 'Expert',
};

// ── Pure functies (gespiegeld vanuit StudentDashboardScreen.tsx) ──────────────

function computeSessionPct(scoreCorrect: number, scoreTotal: number): number {
  return scoreTotal > 0 ? Math.round((scoreCorrect / scoreTotal) * 100) : 0;
}

function getCompletedSubsSorted(submissions: TrainerSubmission[]): TrainerSubmission[] {
  return submissions
    .filter(s => s.completedAt)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
}

// ── Testdata hulpfunctie ──────────────────────────────────────────────────────

function makeSub(overrides: Partial<TrainerSubmission> = {}): TrainerSubmission {
  return {
    domain: 'trainer',
    id: `tsub-${Math.random()}`,
    studentId: 'std-test',
    studentName: 'Test Leerling',
    studentKlas: '2a',
    assignmentId: null,
    assignmentVersion: null,
    startedAt: '2026-01-01T10:00:00.000Z',
    completedAt: undefined,
    scoreCorrect: 0,
    scoreTotal: 5,
    levelPlayed: 1,
    showAnswerCount: 0,
    durationSeconds: null,
    mistakeStats: {},
    ...overrides,
  };
}

// ── Tests: LEVEL_LABELS ───────────────────────────────────────────────────────

describe('LEVEL_LABELS', () => {
  it('bevat alle 5 niveaus (0 t/m 4)', () => {
    for (let i = 0; i <= 4; i++) {
      expect(LEVEL_LABELS[i]).toBeDefined();
      expect(typeof LEVEL_LABELS[i]).toBe('string');
      expect(LEVEL_LABELS[i].length).toBeGreaterThan(0);
    }
  });

  it('niveau 0 heet Instap', () => {
    expect(LEVEL_LABELS[0]).toBe('Instap');
  });

  it('niveau 1 heet Basis', () => {
    expect(LEVEL_LABELS[1]).toBe('Basis');
  });

  it('niveau 4 heet Expert', () => {
    expect(LEVEL_LABELS[4]).toBe('Expert');
  });
});

// ── Tests: computeSessionPct ─────────────────────────────────────────────────

describe('computeSessionPct', () => {
  it('berekent percentage correct', () => {
    expect(computeSessionPct(4, 5)).toBe(80);
  });

  it('retourneert 0 als total 0 is', () => {
    expect(computeSessionPct(0, 0)).toBe(0);
  });

  it('retourneert 100 bij volledig correct', () => {
    expect(computeSessionPct(10, 10)).toBe(100);
  });

  it('rondt af naar het dichtstbijzijnde geheel getal', () => {
    expect(computeSessionPct(1, 3)).toBe(33);
    expect(computeSessionPct(2, 3)).toBe(67);
  });

  it('retourneert 0 bij score 0 van totaal > 0', () => {
    expect(computeSessionPct(0, 8)).toBe(0);
  });
});

// ── Tests: getCompletedSubsSorted ────────────────────────────────────────────

describe('getCompletedSubsSorted', () => {
  it('filtert onvoltooide sessies uit', () => {
    const open = makeSub({ completedAt: undefined });
    const voltooid = makeSub({ completedAt: '2026-01-10T12:00:00.000Z' });
    const result = getCompletedSubsSorted([open, voltooid]);
    expect(result).not.toContain(open);
    expect(result).toContain(voltooid);
  });

  it('sorteert nieuwste sessies eerst', () => {
    const oud = makeSub({ id: 'oud', completedAt: '2026-01-01T10:00:00.000Z' });
    const nieuw = makeSub({ id: 'nieuw', completedAt: '2026-02-01T10:00:00.000Z' });
    const result = getCompletedSubsSorted([oud, nieuw]);
    expect(result[0].id).toBe('nieuw');
    expect(result[1].id).toBe('oud');
  });

  it('retourneert lege array bij enkel onvoltooide sessies', () => {
    const open1 = makeSub();
    const open2 = makeSub();
    expect(getCompletedSubsSorted([open1, open2])).toHaveLength(0);
  });

  it('retourneert lege array bij lege invoer', () => {
    expect(getCompletedSubsSorted([])).toHaveLength(0);
  });

  it('drie sessies op correcte volgorde', () => {
    const s1 = makeSub({ id: 's1', completedAt: '2026-01-01T00:00:00.000Z' });
    const s2 = makeSub({ id: 's2', completedAt: '2026-03-01T00:00:00.000Z' });
    const s3 = makeSub({ id: 's3', completedAt: '2026-02-01T00:00:00.000Z' });
    const result = getCompletedSubsSorted([s1, s2, s3]);
    expect(result.map(s => s.id)).toEqual(['s2', 's3', 's1']);
  });

  it('voltooide sessie met completedAt null wordt uitgefilterd', () => {
    const metNull = makeSub({ completedAt: null as unknown as string });
    expect(getCompletedSubsSorted([metNull])).toHaveLength(0);
  });
});
