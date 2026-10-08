import { describe, expect, it } from 'vitest';
import {
  canShowSessionNextButton,
  getSessionAdvanceAction,
  shouldTriggerAutoSend,
} from './sessionFlow';

describe('canShowSessionNextButton', () => {
  it('shows next button in session mode after scoring', () => {
    expect(canShowSessionNextButton('session', true)).toBe(true);
  });

  it('keeps next button visible after extra interaction cleared validationResult', () => {
    expect(canShowSessionNextButton('session', true)).toBe(true);
  });

  it('hides next button before first score', () => {
    expect(canShowSessionNextButton('session', false)).toBe(false);
  });

  it('never shows next button in free mode', () => {
    expect(canShowSessionNextButton('free', true)).toBe(false);
  });
});

describe('getSessionAdvanceAction', () => {
  it('advances to the next sentence when there are sentences left', () => {
    expect(getSessionAdvanceAction(0, 3)).toBe('next_sentence');
  });

  it('finishes session on the last sentence', () => {
    expect(getSessionAdvanceAction(2, 3)).toBe('finish_session');
  });
});

describe('shouldTriggerAutoSend', () => {
  it('triggers autosend only when student info and script URL are configured', () => {
    expect(
      shouldTriggerAutoSend({
        name: 'Emma',
        initiaal: 'E',
        klas: '2a',
        scriptUrl: 'https://script.google.com/macros/s/example/exec',
      }),
    ).toBe(true);
  });

  it('does not trigger autosend when script URL is missing', () => {
    expect(
      shouldTriggerAutoSend({
        name: 'Emma',
        initiaal: 'E',
        klas: '2a',
        scriptUrl: '',
      }),
    ).toBe(false);
  });

  it('does not trigger autosend when student info is incomplete', () => {
    expect(
      shouldTriggerAutoSend({
        name: '  ',
        initiaal: 'E',
        klas: '2a',
        scriptUrl: 'https://script.google.com/macros/s/example/exec',
      }),
    ).toBe(false);
  });

  it('does not trigger autosend for placeholder script URL', () => {
    expect(
      shouldTriggerAutoSend({
        name: 'Emma',
        initiaal: 'E',
        klas: '2a',
        scriptUrl: 'PLACEHOLDER',
      }),
    ).toBe(false);
  });
});
