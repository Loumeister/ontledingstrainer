/**
 * Bewakers voor sessie-UI-gedrag: pure helpers zonder React- of browser-afhankelijkheden,
 * zodat ze zowel in TrainerScreen als in unit-tests importeerbaar zijn.
 */

/**
 * Bepaalt of de "Volgende"-knop in sessiemodus getoond moet worden.
 * De knop is alleen zichtbaar als de huidige zin is gescoord én de modus 'session' is.
 */
export function shouldShowSessionNextButton(
  mode: 'session' | 'free',
  hasBeenScored: boolean,
): boolean {
  return mode === 'session' && hasBeenScored;
}
