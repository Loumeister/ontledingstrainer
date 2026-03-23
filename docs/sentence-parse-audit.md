# Sentence parse audit (maart 2026)

Deze controle volgt de workflow van `zinsontleding-repo-inspector` en `zinsontleding-constraint-sentence-author`, opnieuw uitgevoerd op de actuele dataset.

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

Automatische controles op alle 248 zinnen:

- geldig rolgebruik (`role`, `subRole`, `bijzinFunctie`)
- unieke en consistente token-id's (`s<zinId>t<tokenIndex>`)
- niveauconsistentie (`sentence.level` == bestandsniveau)
- aanwezigheid van expliciete `pv` en `ow`

Resultaat: **alle 248 zinnen slagen**. Vijf bevelzinnen zonder expliciet onderwerp geven een waarschuwing (geen fout): id 125, 126, 127, 315, 316.

## Numerieke ordening

- Binnen elk niveaubestand staan zinnen in oplopende `id`.
- ID-reeksen per niveau: **N1 1–60, N2 61–161, N3 300–341, N4 400–444**.
- Voor docenten is een numeriek overzicht per subskill beschikbaar in `TEACHERS_SENTENCE_OVERVIEW.md`.
