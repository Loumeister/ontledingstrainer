# Teachers sentence overview

Dit overzicht is automatisch samengesteld uit de actuele zinnenbestanden (niveau 1–4).

- Totaal aantal zinnen: **248**.
- Controle: elke zin bevat expliciet een **PV** en **OW** (bevelzinnen uitgezonderd).
- ID-reeksen na hernummering: **N1 1–60, N2 61–161, N3 300–341, N4 400–444**.

> **Let op:** de ID-verwijzingen hieronder weerspiegelen de staat vóór de hernummering van maart 2026.
> Gebruik `data/sentence-parse-audit.md` of zoek in de JSON-bestanden op de huidige ID's.

## Niveau 4 – nieuwe zinnen (uitbreiding)

| Subskill | Nieuwe zin-ID's | Opmerking |
|---|---:|---|
| `onderwerp_op_afstand` | 204, 205, 206, 207 | Onderwerp staat niet direct naast de PV door vooropgeplaatste zinsdelen/inversie. |
| `werkwoordspelling_relevant_ontleden` | 208, 209, 210, 211 | Oefent onderscheid tussen PV en andere werkwoordsvormen in samengestelde vormen. |
| `vv_vs_bwb_minimaal_paar` | 212–213, 214–215 | Twee minimale paren met identieke voorzetselgroep, maar andere functie (VV vs BWB). |

## Minimale paren `vv_vs_bwb_minimaal_paar`

- **Paar 1:** 212 (VV) ↔ 213 (BWB)
- **Paar 2:** 214 (VV) ↔ 215 (BWB)
## Subskilllijsten

### Niveau 1
- **basisvolgorde (OW-PV-LV)**
  - Nieuwe set toegevoegd in `data/sentences-level-1.json`: **zin 198 t/m 207**.
  - Contexten: school (huiswerk, sommen, presentatie, boek), thuis (lunch, tafel dekken, wassen), sport (bal, tennisracket, teamshirt).
  - Beperkingen per zin: geen bijzin/nevenschikking, maximaal één hoofdvalkuil.
- **object-voorop (LV-PV-OW)**
  - Behouden als duidelijke, idiomatische voorbeelden: **zin 144**, **zin 160**, **zin 170**.
  - Minder onderscheidend item verwijderd: **zin 161**.

### Niveau 1 – patroonverdeling na opschoning

| Patroon | Aantal zinnen |
|---|---:|
| basisvolgorde | 23 |
| inversie | 24 |
| object-voorop | 12 |

> Niveau 1 behoudt hiermee expliciete variatie tussen basisvolgorde, inversie en object-voorop.

- **inversie BWB-voorop + PV-OW-LV (opgeschoond)**
  - Startselectie geclusterd op didactisch profiel; overlap verminderd met **5 verwijderde zinnen**: 153, 158, 164, 166, 168.
  - **Cluster A** (start: 147/159/164/168/172) → overgebleven: **147, 159, 172** (3 voorbeelden).
  - **Cluster B** (start: 149/150/153/158/167) → overgebleven: **149, 150, 167** (3 voorbeelden).
  - **Cluster C** (start: 143/156/166) → overgebleven: **143, 156** (2 voorbeelden).
  - Totaal niveau 1 aangepast van **66 → 61** zinnen.

## Matrix (dekking per subskill)

| Niveau | Subskill | Status | Bronnen / zinnen |
|---|---|---|---|
| 1 | basisvolgorde (OW-PV-LV) | **Uitgebreid** | 196, 198–207 |
| 2 | basisvolgorde met variatie | Ongewijzigd | `data/sentences-level-2.json` |
| 3 | nevenschikking_zonder_bijzin | Gap blijft open | `data/sentences-review.json` |
| 4 | onderwerp_op_afstand | Gap blijft open | `data/sentences-review.json` |
| 4 | vv_vs_bwb_minimaal_paar | Gap blijft open | `data/sentences-review.json` |
| 4 | werkwoordspelling_relevant_ontleden | Gap blijft open | `data/sentences-review.json` |

## Notitie didactiek

Voor de nieuwe niveau-1-zinnen is de volgorde telkens **onderwerp → persoonsvorm → lijdend voorwerp** als basispatroon gebruikt, met alleen lichte variatie via één extra bijwoordelijke bepaling of één bijvoeglijke bepaling.
