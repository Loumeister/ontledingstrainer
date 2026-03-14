# Zinnencoverage-audit (alle niveaus)

Deze audit volgt de repo-inspectie/constraint-aanpak: eerst label- en annotatiemodel respecteren, daarna gaten in didactische focus bepalen.

## Samenvatting

- **Niveau 1** bevat relatief veel inversie-achtige zinnen en weinig pure `OW-PV-LV` basisvolgorde.
- **Niveau 2** heeft redelijke spreiding op `mv`, `vv` en `NG`, maar nog geen nevenschikking/bijzin (logisch voor niveau).
- **Niveau 3** bevat wel `vv` en `bijstelling`, maar vrijwel geen nevenschikking en bijna geen bijzin-als-zinsdeel.
- **Niveau 4 (expert)** is uitgebreid met nieuwe sets voor:
  - `onderwerp_op_afstand` (ID 204–207)
  - `werkwoordspelling_relevant_ontleden` (ID 208–211)
  - `vv_vs_bwb_minimaal_paar` (ID 212–215)

## Wat voor soort zinnen missen nog (bijgewerkte prioriteit)

1. **Niveau 1 – rechte basiszinnen zonder inversie**
   - Focus: `pv/ow/lv` in neutrale volgorde.
   - Doel: fundament zonder woordvolgorde-afleiding.

2. **Niveau 3 – gecontroleerde nevenschikking**
   - Focus: twee hoofdzinnen met `vw_neven` zonder extra bijzin.
   - Doel: zinsdeelgrens + tweede `pv/ow` herkennen.

3. **Niveau 4 – uitbreiding op relatieve bijzinnen als bijvoeglijke bepaling**
   - Er zijn voorbeelden, maar nog beperkte variatie met expliciete `bijvBepTarget` in langere naamwoordgroepen.

## Afgedekte focus (deze update)

- **Niveau 4 – onderwerp op afstand**: toegevoegd (204–207).
- **Niveau 4 – vv vs bwb minimale paren**: toegevoegd (212–215, twee paren).
- **Niveau 4 – werkwoordspelling-relevant ontleden**: toegevoegd (208–211).

## Niet toevoegen zonder expliciete keuze

- **Er-zinnen en passief met didactisch betwistbare onderwerpstatus** alleen opnemen met expliciete validatieregels, anders `REJECT` wegens dubbellezing.
- Idiomatische twijfelgevallen en vaste verbindingen met wisselende schoolanalyse vermijden.

## Didactische randvoorwaarde

Nieuwe zinnen moeten één hoofdvalkuil per item behouden en expliciet een korte `pv`- en `ow`-redenering krijgen voor feedbackkwaliteit.
