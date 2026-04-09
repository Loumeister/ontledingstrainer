import { describe, it, expect } from 'vitest';
import { getSessionAdvanceAction } from './useTrainer';

describe('getSessionAdvanceAction', () => {
  it('gaat naar volgende zin als er nog zinnen over zijn', () => {
    expect(getSessionAdvanceAction(0, 3)).toBe('next');
    expect(getSessionAdvanceAction(1, 3)).toBe('next');
  });

  it('gaat naar resultatenscherm op de laatste sessiezin', () => {
    expect(getSessionAdvanceAction(2, 3)).toBe('finish');
    expect(getSessionAdvanceAction(0, 1)).toBe('finish');
  });
});
