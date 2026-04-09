import { describe, it, expect } from 'vitest';
import { shouldShowSessionNextButton } from './TrainerScreen';

describe('shouldShowSessionNextButton', () => {
  it('laat doorgaan toe zodra een zin is gescoord in sessiemodus', () => {
    expect(shouldShowSessionNextButton('session', true)).toBe(true);
  });

  it('toont geen doorgaan in vrije modus of zonder score', () => {
    expect(shouldShowSessionNextButton('free', true)).toBe(false);
    expect(shouldShowSessionNextButton('session', false)).toBe(false);
  });
});
