import { describe, expect, it } from 'vitest';
import {
  isRollenladderRoute,
  shouldClearSelectedLevelOnLadderToggle,
  shouldResetTrainerOnRouteChange,
} from './appRoute';

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

describe('shouldClearSelectedLevelOnLadderToggle', () => {
  it('wist geselecteerd niveau bij wissel van laddermodus', () => {
    expect(shouldClearSelectedLevelOnLadderToggle(false, true)).toBe(true);
    expect(shouldClearSelectedLevelOnLadderToggle(true, false)).toBe(true);
  });

  it('wist niet bij routes zonder laddertoggle', () => {
    expect(shouldClearSelectedLevelOnLadderToggle(false, false)).toBe(false);
    expect(shouldClearSelectedLevelOnLadderToggle(true, true)).toBe(false);
  });
});
