import { describe, expect, it } from 'vitest';
import { isRollenladderRoute, shouldResetTrainerOnRouteChange } from './appRoute';

describe('isRollenladderRoute', () => {
  it('activeert de ladder alleen op de verborgen route', () => {
    expect(isRollenladderRoute('#/rollenladder')).toBe(true);
    expect(isRollenladderRoute('')).toBe(false);
    expect(isRollenladderRoute('#/usage')).toBe(false);
  });
});

describe('shouldResetTrainerOnRouteChange', () => {
  it('reset de sessie bij het in- en uitschakelen van de ladderroute', () => {
    expect(shouldResetTrainerOnRouteChange('', '#/rollenladder')).toBe(true);
    expect(shouldResetTrainerOnRouteChange('#/rollenladder', '')).toBe(true);
    expect(shouldResetTrainerOnRouteChange('#/rollenladder', '#/usage')).toBe(true);
    expect(shouldResetTrainerOnRouteChange('#/usage', '#/editor')).toBe(false);
  });
});
