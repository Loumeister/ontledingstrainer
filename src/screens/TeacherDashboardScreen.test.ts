/**
 * Tests voor TeacherDashboardScreen — pure hulpfuncties en dataverwerkingslogica.
 *
 * TeacherDashboardScreen.tsx bevat:
 *   - scoreColor: kleurcode op basis van score-percentage
 *   - klassen-extractie: unieke klasnamen uit submissions
 *   - visibleSubmissions-filter: filter op geselecteerde klas
 *   - studentProgresses-sortering: studenten alfabetisch gesorteerd
 *   - studentSubs-filter: voltooide submissions per student gesorteerd
 *
 * Geen DOM of React-rendering nodig.
 */
import { describe, it, expect } from 'vitest';
import type { TrainerSubmission } from '../types';

// ── Pure functies (gespiegeld vanuit TeacherDashboardScreen.tsx) ──────────────

function scoreColor(pct: number): string {
  if (pct >= 90) return 'text-green-600 dark:text-green-400';
  if (pct >= 75) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function extractKlassen(submissions: TrainerSubmission[]): string[] {
  const seen = new Set<string>();
  for (const s of submissions) {
    if (s.studentKlas) seen.add(s.studentKlas.trim().toLowerCase());
  }
  return [...seen].sort();
}

function filterByKlas(
  submissions: TrainerSubmission[],
  selectedKlas: string | null,
): TrainerSubmission[] {
  if (!selectedKlas) return submissions;
  return submissions.filter(s => s.studentKlas.trim().toLowerCase() === selectedKlas);
}

function getStudentSubsSorted(
  submissions: TrainerSubmission[],
  studentId: string,
): TrainerSubmission[] {
  return submissions
    .filter(s => s.studentId === studentId && s.completedAt)
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
    scoreCorrect: 7,
    scoreTotal: 10,
    levelPlayed: 1,
    showAnswerCount: 0,
    durationSeconds: null,
    mistakeStats: {},
    ...overrides,
  };
}

// ── Tests: scoreColor ─────────────────────────────────────────────────────────

describe('scoreColor', () => {
  it('retourneert groen bij score ≥ 90', () => {
    expect(scoreColor(90)).toContain('green');
    expect(scoreColor(100)).toContain('green');
  });

  it('retourneert geel bij score ≥ 75 maar < 90', () => {
    expect(scoreColor(75)).toContain('yellow');
    expect(scoreColor(89)).toContain('yellow');
  });

  it('retourneert rood bij score < 75', () => {
    expect(scoreColor(74)).toContain('red');
    expect(scoreColor(0)).toContain('red');
  });

  it('exacte grenswaarden: 90 is groen', () => {
    expect(scoreColor(90)).toContain('green');
  });

  it('exacte grenswaarden: 75 is geel', () => {
    expect(scoreColor(75)).toContain('yellow');
  });

  it('retourneert Tailwind CSS klasse-string', () => {
    const result = scoreColor(80);
    expect(result).toMatch(/^text-/);
  });
});

// ── Tests: extractKlassen ─────────────────────────────────────────────────────

describe('extractKlassen', () => {
  it('extraheert unieke klasnamen', () => {
    const subs = [makeSub({ studentKlas: '2a' }), makeSub({ studentKlas: '3b' })];
    const klassen = extractKlassen(subs);
    expect(klassen).toContain('2a');
    expect(klassen).toContain('3b');
    expect(klassen).toHaveLength(2);
  });

  it('dedupliceer dubbele klassen', () => {
    const subs = [makeSub({ studentKlas: '2a' }), makeSub({ studentKlas: '2a' })];
    const klassen = extractKlassen(subs);
    expect(klassen).toHaveLength(1);
    expect(klassen[0]).toBe('2a');
  });

  it('normaliseert klasnamen naar lowercase', () => {
    const subs = [makeSub({ studentKlas: '2A' }), makeSub({ studentKlas: '2a' })];
    const klassen = extractKlassen(subs);
    expect(klassen).toHaveLength(1);
    expect(klassen[0]).toBe('2a');
  });

  it('trimt witruimte bij deduplicatie', () => {
    const subs = [makeSub({ studentKlas: ' 2a ' }), makeSub({ studentKlas: '2a' })];
    const klassen = extractKlassen(subs);
    expect(klassen).toHaveLength(1);
  });

  it('sorteert klasnamen alfabetisch', () => {
    const subs = [makeSub({ studentKlas: '3b' }), makeSub({ studentKlas: '2a' }), makeSub({ studentKlas: '2b' })];
    const klassen = extractKlassen(subs);
    expect(klassen).toEqual(['2a', '2b', '3b']);
  });

  it('retourneert lege array bij lege invoer', () => {
    expect(extractKlassen([])).toHaveLength(0);
  });

  it('slaat lege klasnamen over', () => {
    const subs = [makeSub({ studentKlas: '' }), makeSub({ studentKlas: '2a' })];
    const klassen = extractKlassen(subs);
    expect(klassen).not.toContain('');
    expect(klassen).toContain('2a');
  });
});

// ── Tests: filterByKlas ───────────────────────────────────────────────────────

describe('filterByKlas', () => {
  const sub2a = makeSub({ id: 'sub-2a', studentKlas: '2a' });
  const sub3b = makeSub({ id: 'sub-3b', studentKlas: '3b' });
  const subs = [sub2a, sub3b];

  it('retourneert alle submissions als geen klas geselecteerd', () => {
    const result = filterByKlas(subs, null);
    expect(result).toHaveLength(2);
  });

  it('filtert op geselecteerde klas', () => {
    const result = filterByKlas(subs, '2a');
    expect(result).toContain(sub2a);
    expect(result).not.toContain(sub3b);
  });

  it('normaliseert klasnaam bij vergelijking', () => {
    const subUpper = makeSub({ id: 'sub-upper', studentKlas: '2A' });
    const result = filterByKlas([subUpper], '2a');
    expect(result).toContain(subUpper);
  });

  it('retourneert lege array als geen matches', () => {
    const result = filterByKlas(subs, '4c');
    expect(result).toHaveLength(0);
  });
});

// ── Tests: getStudentSubsSorted ───────────────────────────────────────────────

describe('getStudentSubsSorted', () => {
  it('filtert op studentId', () => {
    const sub1 = makeSub({ id: 'sub1', studentId: 'std-a', completedAt: '2026-01-01T00:00:00.000Z' });
    const sub2 = makeSub({ id: 'sub2', studentId: 'std-b', completedAt: '2026-01-02T00:00:00.000Z' });
    const result = getStudentSubsSorted([sub1, sub2], 'std-a');
    expect(result).toContain(sub1);
    expect(result).not.toContain(sub2);
  });

  it('filtert onvoltooide sessies uit', () => {
    const voltooid = makeSub({ id: 'v', studentId: 'std-a', completedAt: '2026-01-01T00:00:00.000Z' });
    const open = makeSub({ id: 'o', studentId: 'std-a', completedAt: undefined });
    const result = getStudentSubsSorted([voltooid, open], 'std-a');
    expect(result).toContain(voltooid);
    expect(result).not.toContain(open);
  });

  it('sorteert nieuwste sessies eerst', () => {
    const oud = makeSub({ id: 'oud', studentId: 'std-a', completedAt: '2026-01-01T00:00:00.000Z' });
    const nieuw = makeSub({ id: 'nieuw', studentId: 'std-a', completedAt: '2026-03-01T00:00:00.000Z' });
    const result = getStudentSubsSorted([oud, nieuw], 'std-a');
    expect(result[0].id).toBe('nieuw');
    expect(result[1].id).toBe('oud');
  });

  it('retourneert lege array als geen voltooide sessies voor student', () => {
    const sub = makeSub({ studentId: 'std-a', completedAt: undefined });
    expect(getStudentSubsSorted([sub], 'std-a')).toHaveLength(0);
  });
});
