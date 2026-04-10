import { describe, it, expect } from 'vitest';
import { shouldShowSessionNextButton, getSessionAdvanceAction } from './sessionFlow';

describe('shouldShowSessionNextButton', () => {
  it('laat doorgaan toe zodra een zin is gescoord in sessiemodus', () => {
    expect(shouldShowSessionNextButton('session', true)).toBe(true);
  });

  it('toont geen doorgaan in vrije modus of zonder score', () => {
    expect(shouldShowSessionNextButton('free', true)).toBe(false);
    expect(shouldShowSessionNextButton('session', false)).toBe(false);
  });
});

describe('getSessionAdvanceAction', () => {
  it('gaat naar volgende zin als er nog zinnen over zijn', () => {
    expect(getSessionAdvanceAction(0, 3)).toBe('next');
    expect(getSessionAdvanceAction(1, 3)).toBe('next');
  });

  it('gaat naar resultatenscherm op de laatste sessiezin', () => {
    expect(getSessionAdvanceAction(2, 3)).toBe('finish');
    expect(getSessionAdvanceAction(0, 1)).toBe('finish');
  });

  it('lege sessie (length 0) eindigt direct', () => {
    expect(getSessionAdvanceAction(0, 0)).toBe('finish');
  });
});
