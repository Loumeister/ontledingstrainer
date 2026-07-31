---
name: zinsontleding-repo-inspector
description: Inspecteer het actuele lokale Ontleedlab-contract voor rollen, zinsannotaties, chunks, evaluatie en feedback. Gebruik vóór wijzigingen aan oefenzinnen, parsingcontent, evaluatorlogica, feedbackregels of adapters; niet voor triviale documentatie- of stylingtaken.
---

# Inspecteer het Ontleedlab-contract

## Leesvolgorde

1. Lees `shared/grammar-core/docs/parsing-didactics-kaders.md` en `shared/grammar-core/docs/taxonomy-governance.md` voor gedeelde kaders.
2. Lees `references/repo-contract.md` als compact lokaal startpunt.
3. Controleer alleen de relevante runtimebronnen:
   - `src/types.ts` voor `RoleKey`, `Sentence`, `Token` en feedbacktypen;
   - `src/constants.ts` voor `ROLES`, hints en feedbackmatrices;
   - minimaal één representatief `src/data/sentences-level-*.json`;
   - evaluator- of adapterbestanden die de taak daadwerkelijk raakt.
4. Laat runtimewaarheid voorgaan op beschrijvende documentatie. Markeer drift en werk het contract alleen bij wanneer de taak dat contract aantoonbaar raakt.

## Inspectieprocedure

1. Leg vast welke lokale `RoleKey`-waarden actief zijn in `ROLES`; behandel het TypeScript-uniontype niet automatisch als actieve producttaxonomie.
2. Leg het token-per-woordmodel vast, inclusief `subRole`, `newChunk`, `alternativeRole`, `bijzinFunctie` en `bijvBepTarget` voor zover relevant.
3. Controleer hoe opeenvolgende tokens tot chunks worden samengevoegd en wanneer `newChunk: true` vereist is.
4. Traceer de relevante evaluatie- en feedbackroute van bronannotatie naar leerlingweergave.
5. Controleer ondersteunde niveaus, gezegdetypen en constructies tegen echte data.
6. Benoem gevallen met twee verdedigbare schoolanalyses als risico; normaliseer ze niet stilzwijgend.

## Grenzen

- Behandel lokale korte labels als productlokale sleutels, niet als gedeelde canonieke labels.
- Voeg geen rol, annotatieveld, chunkregel of alternatieve analyse toe zonder expliciete productscope.
- Verander geen bestaande zinsinterpretatie om haar passend te maken bij shared canon.
- Eis geen volledige repo-inspectie wanneer een gerichte inspectie voldoende is.
- Herformuleer content alleen voor aantoonbare grammaticale, didactische of eenduidigheidswinst; algemene neutralisering is geen zelfstandig doel.

## Outputcontract

Lever vóór inhoudelijke wijzigingen een compacte inspectiesamenvatting met:

- `Label inventory`
- `Annotation model`
- `Supported phenomena`
- `Evaluation and feedback hooks`
- `Risks / ambiguities to avoid`
- `Files verified`

Noteer per afwijking of de runtime, `references/repo-contract.md` of een gedeeld document moet worden aangepast. Presenteer lokale bevindingen nooit als platformwaarheid.

## Voltooiingscriteria

- Alle taakrelevante aannames zijn aan runtimebronnen gekoppeld.
- Shared canon en lokaal contract zijn zichtbaar van elkaar gescheiden.
- Eventuele documentatiedrift is expliciet gemaakt.
- Er is nog geen runtime- of contentwijziging uitgevoerd als de taak alleen om inspectie vroeg.
