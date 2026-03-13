---
name: zinsontleding-constraint-sentence-author
description: Maak didactisch bruikbare, eenduidig ontleedbare Nederlandse oefenzinnen voor de zinsontledingstrainer met een constraint-based aanpak (blueprints, validatie, uitleg en moeilijkheidsopbouw). Gebruik na repo-inspectie wanneer nieuwe oefenitems, sentenceBlueprints, difficultyModel of validatieregels nodig zijn.
---

# Constraint-based authoring workflow

Gebruik deze workflow na `zinsontleding-repo-inspector`.

1. Kies één focuscategorie per zin (één hoofdvalkuil).
2. Selecteer een blueprint uit `references/focus-ladder.md`.
3. Vul blueprint met natuurlijke contextwoorden (school, sport, thuis, media, vrienden).
4. Genereer volledig item in repo-compatibel formaat.
5. Valideer met checklist hieronder; faalt één check, dan zin weggooien.

## Verplichte validatiechecklist per zin

- Zin is grammaticaal correct Nederlands.
- Zin klinkt idiomatisch en leeftijdsgeschikt (12-16).
- `pv` en `ow` zijn eenduidig.
- Maximaal één hoofdvalkuil.
- Alle gebruikte labels bestaan in repo.
- Geen constructie met twee verdedigbare schoolanalyses.
- Uitleg bevat minimaal:
  - hoe `pv` gevonden is (tijdproef/ja-neevraag)
  - hoe `ow` gecontroleerd is (congruentie)
  - korte motivatie voor focusonderscheid (bijv. `vv` vs `bwb`)

## Outputformaat

Gebruik het template in `assets/templates/exerciseItem.ts`.

- Maak `tokens` verplicht.
- Gebruik `spans` alleen als de doelrepo dat echt ondersteunt.
- Voeg `distractorRisk` toe voor adaptieve feedback.

## Verboden categorieën

- Archaïsch/boekig taalgebruik.
- Ellipsen en onvolledige zinnen.
- Idiomen met betwiste ontleding.
- Tangconstructies zonder didactische meerwaarde.
- Exotische inhoud die alleen voor syntaxis is bedacht.

## Implementatiebestanden

Bij codewerk gebruik templates in `assets/templates/`:

- `sentenceBlueprints.ts`
- `validation.ts`
- `difficultyModel.ts`

Pas namen/typen aan op de doelrepo, maar behoud constraint-based structuur.
