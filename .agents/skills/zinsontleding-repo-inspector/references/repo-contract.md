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

---

## Positie in de shared taxonomy governance

`shared/grammar-core/docs/taxonomy-governance.md` definieert een vier-laags model:
**canonical label / display label / alias / product-local short label**

De lokale `RoleKey`-waarden in dit repo vallen in de **product-local short label**-laag:

| Lokale sleutel | Shared canonical label |
|---|---|
| `pv` | `persoonsvorm` |
| `ow` | `onderwerp` |
| `lv` | `lijdend_voorwerp` |
| `mv` | `meewerkend_voorwerp` |
| `bwb` | `bijwoordelijke_bepaling` |
| `vv` | `voorzetselvoorwerp` |
| `bijst` | `bijstelling` |
| `wg` | `werkwoordelijk_gezegde` |
| `ng` | `naamwoordelijk_gezegde` (canoniek topniveau-label; niet in shorthand-mapping §1.2 — zie opmerking) |
| `bijzin` | `bijzin` |
| `vw_neven` | `nevenschikkend_voegwoord` |
| `bijv_bep` | `bijvoeglijke_bepaling` |
| `vw_onder` | `onderschikkend_voegwoord` |
| `wwd` | `werkwoordelijk_deel` (canoniek deellabel; niet in shorthand-mapping §1.2 — zie opmerking) |
| `nwd` | `naamwoordelijk_deel` (canoniek deellabel; wél in shorthand-mapping §1.2) |

> **Opmerking over ontbrekende vermeldingen in §1.2 van taxonomy-governance.md:**
> `naamwoordelijk_gezegde` en `werkwoordelijk_deel` zijn erkende canonieke concepten in de Nederlandse schoolgrammatica maar zijn op dit moment niet opgenomen in de shorthand-mapping-tabel van `taxonomy-governance.md` §1.2. De lokale sleutels `ng` en `wwd` mappen conceptueel op die labels. De shorthand-mapping-tabel in de shared canon heeft een upstream aanvulling nodig om deze twee mappings te bevestigen.

Deze lokale sleutels zijn:
- **correct** als lokale runtime-sleutels
- **niet** de shared canonical labels
- **niet** verplicht te hernoemen om met de shared laag overeen te komen

De mapping is informatief. Hernoemen van lokale sleutels naar canonical labels is geen vereiste.

---

## Lokale interpretatie van shared content-authoring-rules.md

`shared/grammar-core/docs/content-authoring-rules.md` is gezaghebbend voor de **gedeelde** zinnenbank. Voor lokaal Ontleedlab-materiaal gelden twee expliciete kwalificaties:

**Regel 1** (didactische waarde boven volume):
Geldt als initieel ontwerpprincipe — een nieuw item toevoegen aan een bestaand oefentype is lokaal toegestaan als dat didactisch nuttig is. Het is **geen permanente verbodsbepaling** op herhaling van een oefentype.

**Regel 6** (leeftijds- en onderbouwgeschiktheid):
Geldt voor de gedeelde zinnenbank in `grammar-core`. Voor lokaal Ontleedlab-materiaal is dit **geen harde eis** — lokale zinnen mogen uitdagender zijn dan de gedeelde onderbouwnorm waar de lokale didactische context dat rechtvaardigt.

Overige shared authoring-regels (2–5) worden lokaal als gezaghebbende richtlijnen gevolgd, tenzij hier expliciet anders gedocumenteerd.
