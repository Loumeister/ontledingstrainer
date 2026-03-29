/**
 * bwbTimeRefHeuristic.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Detecteert de tijdsreferentie van een Nederlandse bijwoordelijke bepaling (BWB)
 * op basis van de woorden in die chunk.
 *
 * Wordt gebruikt door de corpusGrouper om BWB-ChunkCards automatisch te annoteren
 * met timeRef: 'past' | 'present' | undefined. De Zinnenlab-validator gebruikt dit
 * om te controleren of de tijdsvorm van de PV overeenkomt met de BWB:
 *   - BWB.timeRef === 'past' + PV.verbTense === 'present' → fout (bijv. "gisteren leest")
 *   - BWB.timeRef === 'present' + PV.verbTense === 'past' → fout (bijv. "nu liep")
 *
 * Detectiestrategie:
 * - Kijk of één van de tokens overeenkomt met een bekende tijdsaanduiding
 * - Geeft undefined terug als geen tijdsreferentie herkend (bijv. plaats-BWBs zoals "thuis")
 *
 * Beperkingen:
 * - Geen syntactische parsing; puur lexicaal
 * - Sommige BWBs zijn temporeel ambigu ("toen" = vt maar ook redenering)
 *
 * Gebruik: corpusGrouper.ts → ChunkCard.timeRef
 */

/** BWB-woorden die verwijzen naar het verleden (vt-referentie) */
const PAST_TIME_WORDS = new Set([
  'gisteren', 'eergisteren',
  'vroeger', 'ooit', 'eens', 'destijds', 'indertijd', 'toentertijd',
  'toen', 'daarna', 'daarvoor', 'daartevoren', 'tevoren', 'voordien',
  'vorig', 'vorige', 'vorigen',        // "vorige week", "vorig jaar"
  'vorig jaar', 'gisternacht', 'gistermorgen', 'gistermiddag',
  'afgelopen', 'afgelopen week',
  'net', 'zojuist', 'al',             // "net gedaan" → vt-connotatie
  'onlangs', 'recentelijk', 'recent',
  'jaren', 'eeuwen',                   // "jaren geleden"
  'geleden',
  'in het verleden', 'in die tijd', 'in die periode',
  'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag',
  // maandnamen (worden meestal bij vt of toekomst gebruikt, maar overwegend vt in schoolcorpus)
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]);

/** BWB-woorden die verwijzen naar het heden (tt-referentie) */
const PRESENT_TIME_WORDS = new Set([
  'nu', 'momenteel', 'tegenwoordig', 'heden', 'thans',
  'vandaag', 'vandaag de dag', 'vanmorgen', 'vanmiddag', 'vanavond', 'vannacht',
  'deze week', 'dit jaar', 'dit moment', 'op dit moment',
  'nog', 'altijd', 'steeds',           // "nog steeds" → heden
  'altijd', 'dagelijks', 'wekelijks',  // frequentie-BWBs → tt
  'elke dag', 'iedere dag', 'elke week',
  'doorgaans', 'gewoonlijk', 'normaliter', 'normaal',
  'deze', 'dit',                        // "deze zomer", "dit jaar"
]);

/**
 * Detecteert de tijdsreferentie van een BWB-chunk.
 *
 * @param bwbTokenTexts - De teksten van de tokens in de BWB-chunk,
 *   bijv. ['gisteren'] of ['op', 'school'] of ['vandaag']
 * @returns 'past' als verleden-tijdsreferentie gevonden,
 *          'present' als heden-tijdsreferentie gevonden,
 *          undefined als geen tijdsreferentie herkend (bijv. plaatsbepaling)
 */
export function detectBwbTimeRef(bwbTokenTexts: string[]): 'past' | 'present' | undefined {
  const lowers = bwbTokenTexts.map(t => t.toLowerCase());

  // Controleer elk token individueel
  for (const w of lowers) {
    if (PAST_TIME_WORDS.has(w)) return 'past';
    if (PRESENT_TIME_WORDS.has(w)) return 'present';
  }

  // Controleer ook de samengevoegde string (voor meertokens-combinaties)
  const joined = lowers.join(' ');
  if (PAST_TIME_WORDS.has(joined)) return 'past';
  if (PRESENT_TIME_WORDS.has(joined)) return 'present';

  // Geen tijdsreferentie herkend → plaatsbepaling of andere BWB
  return undefined;
}
