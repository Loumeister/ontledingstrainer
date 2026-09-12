import { describe, expect, it } from 'vitest';
import { isRollenladderRoute } from './appRoute';

describe('isRollenladderRoute', () => {
  it('activeert de ladder alleen op de verborgen route', () => {
    expect(isRollenladderRoute('#/rollenladder')).toBe(true);
    expect(isRollenladderRoute('')).toBe(false);
    expect(isRollenladderRoute('#/usage')).toBe(false);
  });
});
