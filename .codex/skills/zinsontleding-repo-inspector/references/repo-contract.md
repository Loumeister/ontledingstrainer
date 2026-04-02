# Repo contract (ontledingstrainer)

Dit is een **lokaal productcontract** voor Ontleedlab. Het beschrijft alleen de huidige repo-realiteit en is geen gedeeld canoniek schema.

## Label inventory

Bronnen: `src/types.ts`, `src/constants.ts`, `src/data/sentences-level-0.json`, `src/data/sentences-level-4.json`.

- Huidige rol-definities in `ROLES`: `pv`, `ow`, `lv`, `mv`, `bwb`, `vv`, `bijst`, `wg`, `wwd`, `ng`, `nwd`, `bijzin`, `vw_neven`, `bijv_bep`, `vw_onder`.
- In de huidige `ROLES` zijn `wwd`, `nwd`, `bijv_bep` en `vw_onder` gemarkeerd als `isSubOnly`.
- `RoleKey` in `src/types.ts` bevat daarnaast ook `wd`, maar daarvoor is in de huidige `ROLES` geen aparte `RoleDefinition` zichtbaar.
- `ng` is in de huidige repo wél een expliciete hoofdrol in `ROLES`.

## Annotation model

Bronnen: `src/types.ts`, `src/data/sentences-level-0.json`, `src/data/sentences-level-4.json`.

- Het lokale model is **token-per-woord annotatie**.
- Een `Sentence` bevat minimaal: `id`, `label`, `tokens`, `predicateType`, `level`.
- Een `Sentence` kan daarnaast lokaal ook `owNumber` en `pvTense` bevatten.
- Een `Token` bevat minimaal: `id`, `text`, `role`.
- Optionele tokenvelden in het huidige model: `subRole`, `newChunk`, `alternativeRole`, `bijzinFunctie`, `bijvBepTarget`.
- Chunkgrenzen volgen opeenvolgende tokens en kunnen expliciet worden afgedwongen met `newChunk: true`, ook als de hoofdrol gelijk blijft.
- `subRole` markeert interne rolinformatie binnen een hoofdlabel.
- `bijzinFunctie` koppelt een bijzin aan zijn functie in de hoofdzin.
- `bijvBepTarget` koppelt een bijvoeglijke bepaling of bijvoeglijke bijzin aan een doeltoken.

## Supported phenomena

Bronnen: `src/types.ts`, `src/constants.ts`, `src/data/sentences-level-0.json`, `src/data/sentences-level-4.json`.

- Moeilijkheidsniveaus `0` t/m `4`.
- Zinnen met `predicateType` `WG` en `NG`.
- Redekundige kernrollen: `pv`, `ow`, `lv`, `mv`, `bwb`, `vv`, `bijst`.
- Gezegde-ondersteuning via hoofdrollen `wg` en `ng`, met interne markering via `wwd` en `nwd`.
- Bijzinondersteuning via hoofdrol `bijzin`, met functiekoppeling via `bijzinFunctie`.
- In de huidige data zijn voor `bijzinFunctie` in elk geval `bwb`, `lv`, `mv` en `bijv_bep` zichtbaar.
- Nevenschikking via `vw_neven`.
- Onderschikking wordt in de huidige data gemarkeerd via `subRole: vw_onder` binnen een `bijzin`.
- Bijvoeglijke bepaling op woordniveau via `subRole: bijv_bep` en `bijvBepTarget`.

## Feedback hooks

Bron: `src/constants.ts`.

- `FEEDBACK_MATRIX` voor rolverwisselingen en herstelvragen.
- `FEEDBACK_STRUCTURE` voor knip- en structuurfeedback.
- `FEEDBACK_BIJZIN_FUNCTIE` voor vervolgfeedback bij goed gevonden bijzinnen met functiekeuze.
- `FEEDBACK_SWAP` voor gevallen waarin een bijzin wel een functie heeft maar als vorm anders beoordeeld moet worden.
- `HINTS` voor ontbrekende rollen, deelrollen en generieke herstelstappen.
- `FEEDBACK_SHORT_LABELS` voor compacte feedbacklabels in de UI.

## Risks / ambiguities to avoid

- Behandel dit contract als lokaal Ontleedlab-contract, niet als gedeeld schema.
- Gebruik alleen actuele lokale rol-definities uit `ROLES`; leid niet automatisch af dat elke `RoleKey` ook een actieve productrol is.
- Respecteer het lokale token-per-woord model en expliciete chunkgrenzen via `newChunk`.
- Vermijd zinnen die alleen werken doordat `alternativeRole` een dubbellezing opvangt, tenzij dat expliciet beoogd is.
- Vermijd constructies met twee verdedigbare schoolanalyses, vooral bij `vv`/`bwb` en bijzinfuncties.
- Herinterpreteer bestaande zinnen niet stilzwijgend op semantisch of structureel niveau.
