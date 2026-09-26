# Sentence parse audit (maart 2026)

> **Historische audit.** Dit verslag beschrijft de dataset van maart 2026 (248 zinnen) en wordt niet bijgewerkt. Actuele aantallen staan in het gegenereerde `TEACHERS_SENTENCE_OVERVIEW.md`; de actuele automatische controles staan in `src/data/sentenceData.test.ts`.

Deze controle volgde de workflow van `zinsontleding-repo-inspector` en `zinsontleding-constraint-sentence-author`, uitgevoerd op de dataset van dat moment.

## Label inventory

Gebruikte labels in de dataset sluiten aan op `types.ts` en `constants.ts`: `pv`, `ow`, `lv`, `mv`, `bwb`, `vv`, `wg`, `ng`, `nwd`, `wwd`, `bijst`, `bijzin`, `vw_neven`, `vw_onder`, plus `subRole: bijv_bep`.

## Annotation model

- Token-per-woord annotatie in alle niveaubestanden.
- Chunks via opeenvolgende rollen en `newChunk` waar nodig.
- `predicateType` wordt consistent gebruikt (`WG` of `NG`).

## Supported phenomena

- Kernzinnen met `pv/ow/lv/mv/bwb`.
- VZV-zinnen (`vv`) op meerdere niveaus.
- NG/WG-onderscheid met `nwd`/`wwd`.
- Samengestelde zinnen met `bijzin`, `vw_neven` en `vw_onder`.

## Feedback hooks

De gecontroleerde zinnen gebruiken alleen rollen die door bestaande feedback/hints worden ondersteund in `constants.ts`.

## Risks / ambiguities to avoid

- Vermijd schoolgrammaticale dubbellezing zonder expliciete fallback via `alternativeRole`.
- Houd één hoofdvalkuil per nieuwe zin om feedback scherp te houden.

## Parse correctness check

Automatische controles op de toenmalige 248 zinnen, met het inmiddels verwijderde script `scripts/regenerate_sentence_docs_and_validate.cjs`:

- geldig rolgebruik (`role`, `subRole`, `bijzinFunctie`)
- unieke en consistente token-id's (`s<zinId>t<tokenIndex>`)
- niveauconsistentie (`sentence.level` == bestandsniveau)
- aanwezigheid van expliciete `pv` en `ow` (een ontbrekend `ow` gaf alleen een waarschuwing, nooit een fout)

Resultaat: **alle 248 zinnen slagen**. Vijf bevelzinnen zonder expliciet onderwerp geven een waarschuwing (geen fout): id 125, 126, 127, 315, 316.

## Numerieke ordening

- Actuele aantallen, ID's en zinsdeelpatronen per niveau: zie `TEACHERS_SENTENCE_OVERVIEW.md` (`npm run docs:zinnen`).
