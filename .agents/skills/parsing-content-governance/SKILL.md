---
name: parsing-content-governance
description: Pas de gedeelde grammar-core-governance toe op parsingcontent, taxonomie, productmappings en portable didactische regels in Ontleedlab. Gebruik wanneer werk de grens tussen shared canon en lokale parsecontracten raakt; niet voor uitsluitend lokale UI-styling of een geïsoleerde bug zonder canonimpact.
---

# Pas parsingcontent-governance lokaal toe

## Verplichte leesvolgorde

1. Lees `shared/grammar-core/.codex/skills/parsing-content-governance/SKILL.md`.
2. Lees de shared documenten waarnaar die skill verwijst, voor zover de taak ze raakt.
3. Lees `.agents/skills/zinsontleding-repo-inspector/references/repo-contract.md`.
4. Inspecteer daarna de relevante lokale runtime.

## Lokale toepassing

- Gebruik shared canon voor parsingdidactische principes, canonieke labels, contentgovernance en repogrenzen.
- Gebruik het lokale contract en de runtime voor `RoleKey`, JSON-vorm, chunks, evaluatie, feedback, progressie en UI.
- Houd een mapping expliciet: canoniek concept → lokale sleutel → eventuele leerlingterm.
- Routeer een echt cross-product principe eerst naar grammar-core; wijzig de subtree niet als lokale bron.
- Laat een productspecifieke uitzondering lokaal en motiveer haar in het productcontract.
- Behandel runtimewijziging als aparte, expliciete scope. Governancewerk geeft daarvoor geen stilzwijgende toestemming.

## Beslisvragen

1. Is dit principe toepasbaar in meer dan één product?
2. Leunt het nog op lokale velden, routes, labels of evaluatielogica?
3. Is een canonieke taxonomie- of misconceptiewijziging nodig?
4. Kan een dunne adapter de grens zichtbaar houden?
5. Welke bestaande lokale invarianten mogen niet veranderen?

## Outputcontract

Noem:

1. de voorgestelde didactische of governancekeuze;
2. het dragende shared principe en bronpad;
3. de gecontroleerde lokale contractpunten;
4. wat canoniek, adaptergedrag en productlokaal blijft;
5. of een grammar-core-PR vóór de productwijziging nodig is;
6. welke runtimeonderdelen expliciet ongemoeid blijven.

## Voltooiingscriteria

- Shared en lokaal eigenaarschap zijn per artefact benoemd.
- Geen lokale runtimeconstructie is als canon gepresenteerd.
- Eventuele upstreamvolgorde is expliciet.
- De subtree bevat geen lokale handmatige canonwijziging.
