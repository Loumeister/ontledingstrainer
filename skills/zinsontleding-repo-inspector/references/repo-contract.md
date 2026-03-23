# Repo contract (ontledingstrainer)

## Label inventory

Bronnen: `src/types.ts`, `src/constants.ts`.

- Hoofdrollen in data: `pv`, `ow`, `lv`, `mv`, `bwb`, `vv`, `wg`, `nwd`, `bijst`, `bijzin`, `vw_neven`, `vw_onder`.
- Extra type-union in code: `ng` bestaat in `RoleKey`, maar staat niet als aparte rol in `ROLES`.
- Subrol-specifiek: `bijv_bep` (en `vw_onder` is in `ROLES` als `isSubOnly` gemarkeerd).

## Annotation model

Bronnen: `src/types.ts`, `src/data/sentences-level-1.json`.

- Niveau: token-per-woord annotatie.
- Kernvelden per token: `id`, `text`, `role`.
- Optioneel: `subRole`, `newChunk`, `alternativeRole`, `bijzinFunctie`, `bijvBepTarget`.
- Chunking: op basis van aaneengesloten `role` + expliciete grens met `newChunk: true`.
- Zinsobject: `{ id, label, tokens, predicateType, level }`.

## Supported phenomena

Bronnen: `src/constants.ts`, dataset.

- Redekundige kern: persoonsvorm, onderwerp, voorwerpen, bepalingen.
- Gezegde: werkwoordelijk (`wg`) en naamwoordelijk deel (`nwd`), zinstype via `predicateType: WG|NG`.
- Bijzinondersteuning: `bijzin` + functie in hoofdzin via `bijzinFunctie`.
- Verbindingswoorden: neven- en onderschikkend voegwoord.

## Feedback hooks

Bron: `src/constants.ts`.

- Foutuitleg per verwisseling via `FEEDBACK_MATRIX`.
- Structuurfeedback bij foutief knippen via `FEEDBACK_STRUCTURE`.
- Bijzinspecifieke opvolgvraag via `FEEDBACK_BIJZIN_FUNCTIE`.
- Rolspecifieke hints via `HINTS`.

## Risks / ambiguities to avoid

- Vermijd zinnen die alleen kloppen met `alternativeRole` tenzij dat expliciet beoogd is.
- Vermijd constructies met schoolgrammaticale dubbellezing (zeker bij vv/bwb en passief/er-zinnen).
- Vermijd lexicaal bizarre inhoud; houd context herkenbaar voor 12-16 jaar.
