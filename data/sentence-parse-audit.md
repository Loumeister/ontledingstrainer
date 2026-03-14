# Sentence parse audit (update na PR66)

Deze controle volgt de workflow van `zinsontleding-repo-inspector` en `zinsontleding-constraint-sentence-author`, opnieuw uitgevoerd na de recente datasetwijzigingen (PR66-reeks).

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

- Verouderde review-opmerking over zin 49 verwijderd uit `data/sentences-review.json` omdat die zin in de huidige dataset niet meer overeenkomt met de oude reviewvariant.
- 5 bevelzinnen zonder expliciet onderwerp zijn herschreven naar didactisch eenduidige varianten met expliciete `ow` (zinnen 121, 122, 123, 161, 162).

## Parse correctness check

Automatische controles op alle 204 zinnen:

- geldig rolgebruik (`role`, `subRole`, `bijzinFunctie`)
- unieke en consistente token-id's (`s<zinId>t<tokenIndex>`)
- niveauconsistentie (`sentence.level` == bestandsniveau)
- aanwezigheid van expliciete `pv` en `ow`

Resultaat: **alle 204 zinnen slagen**.

## Numerieke ordening

- Binnen elk niveaubestand staan zinnen in oplopende `id`.
- Voor docenten is een nieuw overzicht toegevoegd met numeriek gesorteerde zin-ID's per subskill: `TEACHERS_SENTENCE_OVERVIEW.md`.
