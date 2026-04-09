import { describe, it, expect } from 'vitest';
import { PLACEHOLDER_URL, shouldAutoSendReport } from './googleDriveSync';

describe('shouldAutoSendReport', () => {
  const student = { name: 'Leerling', initiaal: 'L', klas: '2a' };

  it('triggert alleen bij volledige leerlinginfo en echte script-url', () => {
    expect(shouldAutoSendReport(student, 'https://script.google.com/macros/s/abc/exec')).toBe(true);
  });

  it('triggert niet zonder configuratie of met placeholder', () => {
    expect(shouldAutoSendReport(student, '')).toBe(false);
    expect(shouldAutoSendReport(student, PLACEHOLDER_URL)).toBe(false);
  });

  it('triggert niet bij url bestaand uit alleen witruimte of placeholder met witruimte', () => {
    expect(shouldAutoSendReport(student, '   ')).toBe(false);
    expect(shouldAutoSendReport(student, `  ${PLACEHOLDER_URL}  `)).toBe(false);
  });

  it('triggert niet zonder volledige leerlinginfo', () => {
    expect(shouldAutoSendReport({ ...student, name: '' }, 'https://script.google.com/macros/s/abc/exec')).toBe(false);
    expect(shouldAutoSendReport({ ...student, initiaal: '' }, 'https://script.google.com/macros/s/abc/exec')).toBe(false);
    expect(shouldAutoSendReport({ ...student, klas: '' }, 'https://script.google.com/macros/s/abc/exec')).toBe(false);
  });
});
