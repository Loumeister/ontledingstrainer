import { describe, it, expect } from 'vitest';
import { alignWords } from './wordAlignment';

describe('alignWords', () => {
  it('koppelt gelijke woorden, ook als er woorden bij komen of af gaan', () => {
    const a = ['Wij', 'bleven', 'binnen', 'omdat', 'het', 'regende.'];
    const b = ['Gisteren', 'bleven', 'wij', 'binnen', 'omdat', 'het', 'hard', 'regende.'];
    expect([...alignWords(a, b)]).toEqual([[1, 1], [2, 3], [3, 4], [4, 5], [5, 7]]);
  });

  it('koppelt niets bij lege invoer', () => {
    expect(alignWords([], ['a']).size).toBe(0);
  });
});
