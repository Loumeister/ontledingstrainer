/**
 * Pure sessie-flow helpers zonder React- of browser-afhankelijkheden.
 * Importeerbaar vanuit hooks, schermen én unit-tests.
 */

/**
 * Bepaalt of de "Volgende"-knop in sessiemodus getoond moet worden.
 * De knop is alleen zichtbaar als de huidige zin is gescoord én de modus 'session' is.
 *
 * Invariant: showAnswerMode impliceert hasBeenScored (handleShowAnswerRequest zet
 * hasBeenScored altijd op true vóór showAnswerMode), dus hasBeenScored dekt ook
 * de "antwoord getoond"-variant af.
 */
export function shouldShowSessionNextButton(
  mode: 'session' | 'free',
  hasBeenScored: boolean,
): boolean {
  return mode === 'session' && hasBeenScored;
}

/**
 * Bepaalt de volgende actie na het bevestigen van een antwoord in sessiemodus.
 * Geeft 'next' terug als er nog zinnen in de rij staan, anders 'finish'.
 *
 * Edge case: sessionLength === 0 geeft 'finish' (lege sessie eindigt direct).
 */
export function getSessionAdvanceAction(sessionIndex: number, sessionLength: number): 'next' | 'finish' {
  return sessionIndex + 1 < sessionLength ? 'next' : 'finish';
}
