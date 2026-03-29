/**
 * pvTenseHeuristic.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Detecteert de werkwoordstijd (tegenwoordige tijd vs. verleden tijd) van een
 * Nederlandse persoonsvorm op basis van spellingpatronen.
 *
 * Wordt gebruikt door de corpusGrouper om ChunkCards automatisch te annoteren
 * zodat de Zinnenlab-validator kan controleren of de tijdsvorm van de PV
 * overeenkomt met temporele BWB-kaarten (bijv. "gisteren" vereist vt).
 *
 * Detectiestrategie (in volgorde):
 * 1. Opzoeken in de lijst van sterke werkwoorden (onregelmatige vt-vormen)
 * 2. Patroonherkenning: zwakke werkwoorden eindigen op -de/-te/-den/-ten (vt)
 * 3. Overige gevallen → tegenwoordige tijd (meest frequent in schoolcorpus)
 *
 * Beperkingen:
 * - Heuristic: kan fouten maken bij homoniemen (bijv. "was" = vt zijn / "was" = zn.)
 * - Geen volledige morfologische analyse; goed genoeg voor schoolcorpusniveau
 *
 * Gebruik in andere modules: corpusGrouper.ts → poolToCards via ChunkCard.verbTense
 *
 * Toekomstige uitbreiding: overschrijf per zin via Sentence.pvTense (ingesteld
 * door de docent in SentenceEditorScreen of via labSentencePools annotaties).
 */

/**
 * Bekende sterke (onregelmatige) verleden-tijdsvormen op schoolcorpusniveau.
 * Alleen enkelvoud + meervoud-vormen die niet eindigen op -de/-te zijn opgenomen —
 * die worden al door het patroon gevangen.
 *
 * Bron: Algemeen Nederlands woordenschat onderbouw havo/vwo
 */
const STRONG_PAST_FORMS = new Set([
  // zijn / was / waren
  'was', 'waren',
  // hebben / had / hadden
  'had', 'hadden',
  // gaan / ging / gingen
  'ging', 'gingen',
  // komen / kwam / kwamen
  'kwam', 'kwamen',
  // zien / zag / zagen
  'zag', 'zagen',
  // doen / deed / deden
  'deed', 'deden',
  // staan / stond / stonden
  'stond', 'stonden',
  // liggen / lag / lagen
  'lag', 'lagen',
  // zitten / zat / zaten
  'zat', 'zaten',
  // rijden / reed / reden
  'reed', 'reden',
  // schrijven / schreef / schreven
  'schreef', 'schreven',
  // lezen / las / lazen
  'las', 'lazen',
  // lopen / liep / liepen
  'liep', 'liepen',
  // lopen / liep / liepen (dubbel voor zekerheid)
  // krijgen / kreeg / kregen
  'kreeg', 'kregen',
  // geven / gaf / gaven
  'gaf', 'gaven',
  // nemen / nam / namen
  'nam', 'namen',
  // vinden / vond / vonden
  'vond', 'vonden',
  // denken / dacht / dachten
  'dacht', 'dachten',
  // brengen / bracht / brachten
  'bracht', 'brachten',
  // kopen / kocht / kochten
  'kocht', 'kochten',
  // zoeken / zocht / zochten
  'zocht', 'zochten',
  // werken / werkte maar: weten / wist / wisten
  'wist', 'wisten',
  // rijzen / rees / rezen
  'rees', 'rezen',
  // laten / liet / lieten
  'liet', 'lieten',
  // vallen / viel / vielen
  'viel', 'vielen',
  // houden / hield / hielden
  'hield', 'hielden',
  // lopen → al gedaan
  // slaan / sloeg / sloegen
  'sloeg', 'sloegen',
  // groeien → regelmatig, maar:
  // bleven / bleven (blijven)
  'bleef', 'bleven',
  // zwemmen / zwom / zwommen
  'zwom', 'zwommen',
  // pakken is regelmatig (pakte), maar: spreken / sprak / spraken
  'sprak', 'spraken',
  // helpen / hielp / hielpen
  'hielp', 'hielpen',
  // sturen → regelmatig; begrijpen / begreep / begrepen
  'begreep', 'begrepen',
  // vertrekken / vertrok / vertrokken (samengesteld — hoofdwerkwoord 'trok')
  'vertrok', 'vertrokken',
  // eten / at / aten
  'at', 'aten',
  // dragen / droeg / droegen
  'droeg', 'droegen',
  // vragen / vroeg / vroegen
  'vroeg', 'vroegen',
]);

/**
 * Detecteert de werkwoordstijd van een persoonsvorm.
 *
 * @param pvText - De tekst van de PV-token (bijv. "leest", "kochten", "was")
 * @returns 'past' als verleden tijd gedetecteerd, 'present' anders
 */
export function detectPvTense(pvText: string): 'present' | 'past' {
  const lower = pvText.toLowerCase();

  // 1. Directe match met bekende sterke vt-vormen
  if (STRONG_PAST_FORMS.has(lower)) {
    return 'past';
  }

  // 2. Zwakke werkwoorden: verleden tijd eindigt op -de, -te, -den, -ten
  //    Minimale lengte: "at" is maar 2 tekens en valt onder sterk (at = eten vt)
  if (lower.length >= 4) {
    if (lower.endsWith('den') || lower.endsWith('ten')) return 'past';
    if (lower.endsWith('de') || lower.endsWith('te')) return 'past';
  }

  // 3. Fallback: tegenwoordige tijd
  return 'present';
}
