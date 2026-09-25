/**
 * Toetsenbordgedrag van een ARIA-radiogroep: pijltjes gaan naar de vorige of
 * volgende optie (rondlopend), Home/End naar de eerste of laatste.
 * Geeft null bij een andere toets.
 */
export function nextRadioIndex(key: string, index: number, count: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
