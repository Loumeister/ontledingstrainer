/**
 * owNumberHeuristic.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Detecteert het getal (enkelvoud/meervoud) van een Nederlandse OW-chunk
 * op basis van de woorden in die chunk.
 *
 * Wordt gebruikt door de corpusGrouper om ChunkCards automatisch te annoteren
 * zodat de Zinnenlab-validator kan controleren of OW en PV congruent zijn
 * (bijv. "de kinderen" (mv) + "leest" (ev) → fout).
 *
 * Detectiestrategie (in volgorde, eerste match wint):
 * 1. Bekende meervoudsindicatoren: bepaalde meervoudsartikelen, voornaamwoorden
 *    en pronomina die altijd/vrijwel altijd meervoud zijn
 * 2. Bekende enkelvoudsindicatoren: bepaald lidwoord "de/het", onbep. "een",
 *    persoonlijke voornaamwoorden enkelvoud
 * 3. Morfologisch patroon: token eindigt op -en, -s → meervoud
 * 4. Fallback: enkelvoud (meest frequent in schoolcorpus)
 *
 * Beperkingen:
 * - "de" is zowel ev als mv → heuristiek kijkt naar andere tokens voor context
 * - Eigennamen worden correct als enkelvoud behandeld (geen meervoudsmatch)
 *
 * Gebruik: corpusGrouper.ts → ChunkCard.number
 *
 * Toekomstige uitbreiding: overschrijf per zin via Sentence.owNumber
 *   (ingesteld door docent in SentenceEditorScreen).
 */

/**
 * Tokens die altijd/vrijwel altijd een meervoud OW aanduiden.
 * 'de' is NIET opgenomen want dat is ambigu (ev+mv).
 */
const MV_INDICATORS = new Set([
  // Persoonlijke voornaamwoorden mv
  'we', 'wij', 'jullie', 'ze', 'zij',
  // Onbepaald voornaamwoord mv
  'sommige', 'sommigen', 'anderen', 'velen', 'enkelen', 'beiden',
  'alle', 'allen', 'beide',
  // Telwoorden → twee of meer = mv
  'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien',
  'veel', 'weinig', 'meerdere', 'diverse', 'verscheidene', 'talloze',
  // Bezittelijk voornaamwoord mv (komt zelden voor maar voor volledigheid)
  'onze', 'hun',
]);

/**
 * Tokens die altijd enkelvoud OW aanduiden.
 */
const SG_INDICATORS = new Set([
  // Persoonlijk voornaamwoord ev
  'ik', 'jij', 'je', 'hij', 'hem', 'zij', 'ze', 'haar', 'het', 'u',
  // Onbepaald lidwoord → altijd enkelvoud
  'een',
  // 'het' als lidwoord is ev (maar als pronomen ook ev)
]);

/**
 * Detecteert het getal van een OW-chunk.
 *
 * @param owTokenTexts - De teksten van de tokens in de OW-chunk,
 *   bijv. ['De', 'leerlingen'] of ['Mijn', 'broer']
 * @returns 'pl' als meervoud gedetecteerd, 'sg' anders
 */
export function detectOwNumber(owTokenTexts: string[]): 'sg' | 'pl' {
  const lowers = owTokenTexts.map(t => t.toLowerCase());

  // 1. Expliciete meervoudsindicatoren
  for (const w of lowers) {
    if (MV_INDICATORS.has(w)) return 'pl';
  }

  // 2. Expliciete enkelvoudsindicatoren
  for (const w of lowers) {
    if (SG_INDICATORS.has(w)) return 'sg';
  }

  // 3. Morfologisch patroon op het zelfstandig naamwoord (laatste token van de OW-chunk,
  //    of elk token):
  //    - Eindigt op -en (veruit meest frequent meervoud in NL): leerlingen, docenten
  //    - Eindigt op -s  (tweede meervoudsuitgang): meisjes, jongens
  //    Let op: uitzonderingen bestaan (bijv. "kunnen" is werkwoord), maar in OW-context
  //    is een token op -en vrijwel altijd een mv-zelfstandig naamwoord.
  const lastToken = lowers[lowers.length - 1];
  if (lastToken && lastToken.length >= 4) {
    if (lastToken.endsWith('en') || lastToken.endsWith('s')) return 'pl';
  }

  // 4. Fallback: enkelvoud
  return 'sg';
}
