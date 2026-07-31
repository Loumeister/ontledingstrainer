---
name: shared-content-integration
description: Integreer canonieke grammar-core-content via een expliciete, dunne Ontleedlab-adapter zonder de shared bron te herschrijven of lokale schema's als canon te behandelen. Gebruik bij imports, adapters, mappings en synchronisatie van gedeelde zinnen; niet voor uitsluitend lokale zinnenbankedits.
---

# Integreer shared content in Ontleedlab

## Lees eerst

1. Lees `shared/grammar-core/.codex/skills/shared-content-integration/SKILL.md`.
2. Lees `shared/grammar-core/docs/content-authoring-rules.md`, `taxonomy-governance.md` en de taakrelevante shared schema- of contentbestanden.
3. Lees `.agents/skills/zinsontleding-repo-inspector/references/repo-contract.md`.
4. Inspecteer `src/types.ts`, `src/data/sentenceLoader.ts` en de bestaande adapter- of consumptieroute.

## Integratiecontract

- `shared/grammar-core/` blijft de ongewijzigde canonieke bron.
- Vertaal shared objecten in één zichtbare adapter naar lokale `Sentence`- en `Token`-vormen.
- Leg iedere labelmapping expliciet vast; productlokale korte labels blijven lokaal.
- Valideer vereiste velden, ID-strategie, niveau, chunks, bijzinfunctie en niet-ondersteunde constructies aan de grens.
- Faal duidelijk bij ontbrekende of niet-mappende data; gebruik geen stille defaults die betekenis veranderen.
- Houd bestaande lokale contentpaden actief zolang migratie niet expliciet anders vraagt.
- Bewaar bron- of versieattributie wanneer gedeelde content naar lokale sessies of rapportage stroomt.

## Werkwijze

1. Inventariseer bronshape en lokale doelshape.
2. Schrijf een veld- en taxonomiemapping met afwijzingsgevallen.
3. Implementeer de kleinste pure adapter.
4. Test een geldige mapping en iedere betekenisvolle foutgrens.
5. Laat geïntegreerde zinnen door `zinsontleding-content-quality-gate` lopen.
6. Documenteer welke bron wordt geconsumeerd en wat nog niet wordt ondersteund.

## Grenzen

- Bewerk geen bestand onder `shared/grammar-core/` als productspecifieke oplossing.
- Kopieer shared content niet handmatig naar lokale JSON zonder expliciete provenance en migratiekeuze.
- Verander geen lokale evaluator of UI om een ongeldige mapping te verbergen.
- Breid de shared taxonomie niet uit vanuit een productlokale sleutel.

## Outputcontract

Lever:

- bronbestand en versie/provenance;
- veld- en labelmapping;
- expliciete afwijzingsgevallen;
- gewijzigde lokale adapter- en testbestanden;
- validatie-uitvoer;
- resterende verschillen tussen shared en lokaal.

## Voltooiingscriteria

- De shared bron blijft onaangeroerd.
- De adaptergrens is klein, puur en getest.
- Niet-ondersteunde data faalt zichtbaar.
- Lokale content en runtime blijven buiten de gevraagde migratiescope werken.
