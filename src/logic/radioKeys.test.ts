import { describe, it, expect } from 'vitest';
import { nextRadioIndex } from './radioKeys';

describe('nextRadioIndex', () => {
  it('pijltjes lopen rond door de opties', () => {
    expect(nextRadioIndex('ArrowRight', 5, 6)).toBe(0);
    expect(nextRadioIndex('ArrowDown', 1, 6)).toBe(2);
    expect(nextRadioIndex('ArrowLeft', 0, 6)).toBe(5);
    expect(nextRadioIndex('ArrowUp', 3, 6)).toBe(2);
  });

  it('Home en End gaan naar de eerste en laatste optie', () => {
    expect(nextRadioIndex('Home', 4, 6)).toBe(0);
    expect(nextRadioIndex('End', 0, 3)).toBe(2);
  });

  it('andere toetsen doen niets', () => {
    expect(nextRadioIndex('Tab', 1, 3)).toBeNull();
  });
});
