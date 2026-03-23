---
name: zinsontleding-repo-inspector
description: Inspecteer de zinsontledingstrainer-repo op labelset, annotatieformaat, chunk-conventies en feedbackstructuur vóórdat nieuwe oefeningen of generatorlogica worden toegevoegd. Gebruik bij elke taak die nieuwe zinnen, validatie of feedbackregels wil maken of aanpassen.
---

# Repo-inspectie workflow (verplicht eerst)

Voer deze stappen in volgorde uit.

1. Lees `src/types.ts` en leg vast:
   - alle `RoleKey` waarden
   - `Sentence`/`Token` structuur
   - velden die ambiguïteit toestaan (`alternativeRole`)
2. Lees `src/constants.ts` en leg vast:
   - actuele `ROLES` inclusief sub-only rollen
   - hints/feedbackmatrices die beïnvloeden hoe fouten uitgelegd worden
3. Lees minimaal één bronbestand uit `src/data/sentences-level-*.json` en controleer:
   - token-per-woord annotatie
   - chunkgrenzen via `newChunk`
   - bijzinfunctie via `bijzinFunctie`
4. Controleer of de app redekundig model + gezegde/bijzin ondersteunt.
5. Vat bevindingen samen voordat je ook maar één nieuwe zin of generatorregel maakt.

## Harde regels

- Gebruik uitsluitend bestaande labelnamen uit de repo.
- Voeg geen nieuwe rol toe zonder expliciete gebruikersvraag.
- Respecteer token-per-woord model; leid chunks af via opeenvolgende tokens + `newChunk`.
- Markeer zinnen met mogelijk dubbele schoolanalyse als `REJECT` in je werknotities.
- Schrijf bij elke voorgestelde zin een korte redenering voor `pv` en `ow`.


## Extra beoordelingscheck bij sentence-edits

Controleer bij herformuleringen expliciet of de wijziging:
- didactische eenduidigheid verhoogt (of minstens behoudt), en
- **niet** alleen gemotiveerd is door algemene neutralisering van woordkeuze.

Flag in je samenvatting wanneer een wijziging primair stilistisch/neutraliserend is zonder grammaticale winst.

## Outputcontract voor inspectie

Lever een compact contract met deze kopjes:

- `Label inventory`
- `Annotation model`
- `Supported phenomena`
- `Feedback hooks`
- `Risks / ambiguities to avoid`

Gebruik `references/repo-contract.md` als sjabloon en werk het bij wanneer de repo verandert.
