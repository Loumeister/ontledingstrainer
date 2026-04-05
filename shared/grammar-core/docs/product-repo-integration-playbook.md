# Product Repo Integration Playbook

## Doel
Dit document beschrijft stap voor stap hoe `grammar-core` geïntegreerd wordt in:
- Werkwoordlab
- ontledingstrainer / Ontleedlab

Het doel is om het grotere geïntegreerde geheel te ontwikkelen **zonder** de bestaande apps meteen te breken of te herschrijven.

Dit document bevat:
1. een begrijpelijk integratiepad
2. concrete beslismomenten
3. uitvoerbare markdown prompts voor Codex per fase

---

# Uitgangspunten

## Wat we wél willen
- één canonieke gedeelde bronlaag
- lokale zichtbaarheid voor Claude/Codex-agents
- geleidelijke integratie
- bestaande productrepo’s bruikbaar houden
- gedeelde didactiek, taxonomie, schemas en zinnenbank

## Wat we níét willen
- beide apps tegelijk groot refactoren
- een onbruikbare tussenfase creëren
- package-only afhankelijkheden gebruiken voor agentgovernance
- Ontleedlab of Werkwoordlab direct ombouwen tot één nieuwe app

## Kernregel
Integreer in deze volgorde:
1. **zichtbaarheid**
2. **governance**
3. **wrappers**
4. **content sync**
5. **kleine adapters**
6. pas daarna **runtime hergebruik**

---

# Fase 0 — Voorbereiding

## Doel
Zorg dat `grammar-core` stabiel genoeg is als gedeelde bronlaag voordat je de productrepo’s aanpast.

## Checklist
- [ ] `README.md` aanwezig
- [ ] didactische docs aanwezig
- [ ] agentbestanden aanwezig
- [ ] schemas aanwezig
- [ ] eerste taxonomy aanwezig
- [ ] eerste shared sentence seeds aanwezig

## Resultaat
`grammar-core` is bruikbaar als canonieke bron.

---

# Fase 1 — Neem grammar-core lokaal op in Werkwoordlab

## Doel
Maak `grammar-core` **fysiek zichtbaar** in Werkwoordlab, zodat Claude/Codex daar dezelfde bronlaag kunnen lezen.

## Aanpak
Gebruik bij voorkeur **git subtree** en plaats de gedeelde kern onder:

```text
shared/grammar-core/
```

## Waarom eerst Werkwoordlab?
- Werkwoordlab is al actief in ontwikkeling
- daar liggen nu al didactische docs en agents die moeten convergeren naar de gedeelde bron
- je kunt de wrapperstructuur daar eerst veilig testen

## Wat je nog niet doet
- nog geen runtime integratie
- nog geen contentoverschrijving
- nog geen evaluatorwijzigingen

## Definition of done
- `shared/grammar-core/` bestaat in Werkwoordlab
- de bestanden zijn lokaal zichtbaar
- bestaande appflow werkt nog gewoon

### Codex prompt — Fase 1
```text
You are working in the GitHub repository Loumeister/werkwoordlab.

Task
Prepare Werkwoordlab to consume the shared canonical repo `grammar-core` without changing product behavior yet.

Goal
Introduce a local visible shared-core location in this repo so Claude/Codex agents and future integration work can read canonical docs, agents, schemas, and shared content from:
- `shared/grammar-core/`

Important
Do NOT redesign the app.
Do NOT change runtime behavior.
Do NOT modify evaluator logic.
Do NOT migrate content yet.
This run is about safe structural preparation only.

Required reading
- `AGENTS.md`
- local docs currently used by Werkwoordlab
- all relevant files under `shared/grammar-core/` if already present

Implement
1. Ensure this repo has a dedicated visible location for the shared core:
   - `shared/grammar-core/`
2. If the subtree content is already present, do not duplicate it.
3. Add a short local integration note if needed, explaining that `shared/grammar-core/` is the canonical shared source.
4. Do not break any existing routes, tests, or content loading.

Constraints
- no app logic changes
- no UI changes
- no content migration
- no fake placeholder integration

Done when
- `shared/grammar-core/` is present and readable
- local product behavior is unchanged
- the repo is ready for wrapper updates in a later step

Return
- changed files
- short confirmation that product behavior was not changed
```

---

# Fase 2 — Pas lokale Claude/Codex wrappers aan in Werkwoordlab

## Doel
Laat de lokale agents eerst de gedeelde kern lezen, en pas daarna lokale repo-regels toepassen.

## Kernprincipe
De hiërarchie wordt:
1. `shared/grammar-core/`
2. lokale repo-contracten
3. taakprompt

## Te wijzigen soorten bestanden
- `.claude/agents/*`
- `.agents/skills/*`
- eventueel `AGENTS.md` waar nodig

## Wat de wrappers moeten doen
- expliciet verwijzen naar `shared/grammar-core/docs/...`
- expliciet verwijzen naar `shared/grammar-core/agents/...`
- duidelijk maken wat canoniek gedeeld is en wat lokaal productspecifiek blijft

## Wat je nog niet doet
- nog geen contentmigratie
- nog geen unit herschrijven
- nog geen adapterruntime bouwen

## Definition of done
- lokale agents verwijzen eerst naar de gedeelde bron
- lokale agents blijven productspecifieke aanvullingen bevatten
- er is geen contradictie tussen lokale en gedeelde regels

### Codex prompt — Fase 2
```text
You are working in the GitHub repository Loumeister/werkwoordlab.

Task
Update the local Claude and Codex instruction layer so it treats `shared/grammar-core/` as the first canonical shared source.

Goal
Make local wrappers read the shared core first, then apply Werkwoordlab-specific constraints.

Required reading
- `AGENTS.md`
- local `.claude/agents/*`
- local `.agents/skills/*`
- `shared/grammar-core/docs/*`
- `shared/grammar-core/agents/*`

Implement
1. Update local Claude agent files so they explicitly read the relevant files under `shared/grammar-core/` first.
2. Update local Codex skill files so they explicitly read the relevant files under `shared/grammar-core/` first.
3. Keep local repo-specific rules that are genuinely product-specific.
4. Remove or reduce duplicated canonical guidance when possible.
5. If useful, add one short section in `AGENTS.md` stating that shared canonical guidance lives under `shared/grammar-core/`.

Constraints
- do not change runtime app behavior
- do not change content JSON yet
- do not rewrite the whole instruction layer from scratch
- preserve useful local constraints

Done when
- local Claude/Codex wrappers point to `shared/grammar-core/`
- shared canonical guidance is clearly first in precedence
- local instructions remain useful and product-specific

Return
- changed files
- which shared-core files are now read first
- any contradictions removed
```

---

# Fase 3 — Herhaal Fase 1 en 2 in Ontleedlab

## Doel
Breng dezelfde structuur ook aan in ontledingstrainer / Ontleedlab.

## Belangrijk
Ontleedlab moet voorlopig **bruikbaar blijven zoals het nu is**.

Daarom geldt hier nog sterker:
- geen grote runtimewijzigingen
- geen UX-omslag
- eerst zichtbaarheid en governance

## Definition of done
- `shared/grammar-core/` lokaal zichtbaar in Ontleedlab
- lokale wrappers lezen eerst gedeelde kern
- huidige Ontleedlab-functionaliteit blijft intact

### Codex prompt — Fase 3A (subtree/visible shared core)
```text
You are working in the GitHub repository Loumeister/ontledingstrainer.

Task
Prepare Ontleedlab / ontledingstrainer to consume the shared canonical repo `grammar-core` without changing product behavior yet.

Goal
Introduce a local visible shared-core location in this repo so Claude/Codex agents and future integration work can read canonical docs, agents, schemas, and shared content from:
- `shared/grammar-core/`

Important
Do NOT redesign the app.
Do NOT change runtime behavior.
Do NOT alter the existing learner flow.
This run is about safe structural preparation only.

Implement
1. Ensure this repo has a dedicated visible location for the shared core:
   - `shared/grammar-core/`
2. If the subtree content is already present, do not duplicate it.
3. Add a short local integration note if needed, explaining that `shared/grammar-core/` is the canonical shared source.
4. Keep current app behavior intact.

Done when
- `shared/grammar-core/` is present and readable
- local product behavior is unchanged

Return
- changed files
- short confirmation that Ontleedlab behavior was not changed
```

### Codex prompt — Fase 3B (wrapper update)
```text
You are working in the GitHub repository Loumeister/ontledingstrainer.

Task
Update the local Claude and Codex instruction layer so it treats `shared/grammar-core/` as the first canonical shared source.

Goal
Make local wrappers read the shared core first, then apply Ontleedlab-specific constraints.

Required reading
- local agent and skill files
- local repo contract files
- `shared/grammar-core/docs/*`
- `shared/grammar-core/agents/*`

Implement
1. Update local Claude agent files so they explicitly read the relevant files under `shared/grammar-core/` first.
2. Update local Codex skill files so they explicitly read the relevant files under `shared/grammar-core/` first.
3. Preserve Ontleedlab-specific rules for parsing UI, role labeling, and local progression.
4. Remove duplicated canonical guidance where possible.

Constraints
- do not change runtime app behavior
- do not rewrite parsing logic
- keep Ontleedlab usable as it currently is

Done when
- local wrappers now prioritize `shared/grammar-core/`
- Ontleedlab-specific guidance remains local
- no runtime behavior changed

Return
- changed files
- which shared-core files are now read first
- any contradictions removed
```

---

# Fase 4 — Introduceer de eerste gedeelde content-consumptie in Werkwoordlab

## Doel
Laat Werkwoordlab als eerste productrepo een klein stuk gedeelde content consumeren.

## Belangrijk
Begin klein.

Niet:
- alle units migreren
- complete runtime switch

Wel:
- één kleine adapter
- één kleine seedset
- expliciete mapping

## Beste eerste kandidaat
Gebruik:
- `content/shared-sentences/seed-unit-01.json`
- en/of `seed-unit-02.json`

Map daaruit enkele zinnen expliciet naar Werkwoordlab-items.

## Definition of done
- Werkwoordlab kan minstens een klein deel van gedeelde zinnen gebruiken
- bestaande contentstructuur blijft voorlopig werken
- de integratie is expliciet en omkeerbaar

### Codex prompt — Fase 4
```text
You are working in the GitHub repository Loumeister/werkwoordlab.

Task
Implement the first small shared-content consumption path from `shared/grammar-core/` into Werkwoordlab.

Goal
Consume a small part of the shared canonical sentence layer without rewriting the whole content system.

Required reading
- local content model and loaders
- `shared/grammar-core/content/shared-sentences/*`
- `shared/grammar-core/adapters/werkwoordlab.md`
- local didactic/content docs

Implement
1. Add a lightweight adapter that can read one small shared sentence seed file.
2. Map the shared sentence objects explicitly into Werkwoordlab-compatible structures.
3. Keep the mapping small and explicit.
4. Do not replace the whole unit content pipeline yet.
5. Preserve current behavior for all unaffected content.

Constraints
- no hidden fallback magic
- no broad migration
- no schema drift
- no silent taxonomy rewriting

Done when
- a small shared sentence seed is consumable in Werkwoordlab
- the adapter is explicit and readable
- unaffected existing content still works

Return
- changed files
- which shared seed file is consumed
- how the mapping works
- what the next safe migration step would be
```

---

# Fase 5 — Introduceer de eerste gedeelde content-consumptie in Ontleedlab

## Doel
Laat ook Ontleedlab een kleine gedeelde seedset consumeren.

## Waarom pas nu?
Eerst governance en eerste Werkwoordlab-consumptie stabiliseren. Dan pas dezelfde stap in Ontleedlab.

## Definition of done
- Ontleedlab consumeert minimaal één klein shared seedbestand
- bestaande productflow blijft intact
- mapping blijft expliciet

### Codex prompt — Fase 5
```text
You are working in the GitHub repository Loumeister/ontledingstrainer.

Task
Implement the first small shared-content consumption path from `shared/grammar-core/` into Ontleedlab.

Goal
Consume a small part of the shared canonical sentence layer without rewriting the current parsing system.

Required reading
- local sentence/challenge model
- `shared/grammar-core/content/shared-sentences/*`
- `shared/grammar-core/adapters/ontledingstrainer.md`
- local parsing-related repo files

Implement
1. Add a lightweight adapter that can read one small shared sentence seed file.
2. Map the shared sentence objects explicitly into Ontleedlab-compatible sentence/challenge structures.
3. Keep the integration small and explicit.
4. Preserve current app behavior for unaffected areas.

Constraints
- no large parsing-system rewrite
- no broad migration of all sentence sources
- no schema drift
- no hidden shared-content magic

Done when
- a small shared sentence seed is consumable in Ontleedlab
- the adapter is explicit and readable
- unaffected existing content still works

Return
- changed files
- which shared seed file is consumed
- how the mapping works
- what the next safe migration step would be
```

---

# Fase 6 — Bouw pas daarna brugtaken en cross-routing

## Doel
Pas als beide repo’s:
- de gedeelde kern lokaal zien
- gedeelde wrappers gebruiken
- minimaal één seedset consumeren

kun je de eerste echte didactische brug bouwen.

## Eerste brugidee
Van Werkwoordlab naar Ontleedlab-logica:
- leerling faalt op `word/wordt`
- systeem routeert eerst naar mini-analyse:
  - vind de persoonsvorm
  - vind het onderwerp
  - zie je inversie?
- daarna terug naar spelling

## Nog niet prioriteren vóór deze fase
- gecombineerd dashboard
- volledig gedeeld leerlingmodel
- monorepo-migratie
- complete contentmigratie

### Codex prompt — Fase 6
```text
You are working in the GitHub repository Loumeister/werkwoordlab.

Task
Design and implement the first minimal bridge task from verb spelling back to grammatical analysis, using the shared grammar-core model as the conceptual basis.

Goal
When a learner fails on a suitable spelling item, offer a very small analysis-first recovery step before returning to the spelling decision.

Important
Keep this first bridge small.
Do NOT attempt a full cross-repo runtime integration.
Do NOT redesign the app.

Required reading
- `shared/grammar-core/docs/werkwoordspellingsdidactiek-kaders.md`
- `shared/grammar-core/docs/grammar-platform-principles.md`
- local learner flow files
- local evaluator/feedback flow

Implement
1. Choose one safe, high-value case such as inversion with jij.
2. Add a minimal recovery step that asks the learner to identify one or two prerequisite grammar facts.
3. Return the learner to the spelling decision afterward.
4. Keep the feature local to Werkwoordlab for now.
5. Make the logic explicit and didactically justified.

Constraints
- no full cross-app runtime dependency
- no broad adaptive routing engine yet
- no dashboard expansion yet

Done when
- one bridge task flow exists
- it is clearly tied to a prerequisite analysis bottleneck
- it remains small and understandable

Return
- changed files
- what case was chosen
- what prerequisite analysis step was added
- why this was the safest first bridge
```

---

# Praktische beslisregels

## Als je twijfelt of iets nu moet
Stel deze vraag:

### Verbetert dit nu vooral...
1. zichtbaarheid?
2. governance?
3. kleine expliciete integratie?

Dan mag het.

### Of probeert dit nu al...
1. beide apps tegelijk te herschrijven?
2. alle content te migreren?
3. runtime-koppeling te forceren?
4. dashboards samen te trekken?

Dan is het te vroeg.

---

# Aanbevolen echte volgorde vanaf vandaag
1. `grammar-core` vullen en stabiliseren
2. subtree sync naar Werkwoordlab
3. wrappers in Werkwoordlab aanpassen
4. subtree sync naar Ontleedlab
5. wrappers in Ontleedlab aanpassen
6. kleine shared-content adapter in Werkwoordlab
7. kleine shared-content adapter in Ontleedlab
8. eerste bridge task

---

# Kortste veilige samenvatting
Je houdt het grotere geheel beheersbaar door:
- bestaande apps bruikbaar te laten
- eerst gedeelde zichtbaarheid te regelen
- daarna governance te centraliseren
- daarna kleine adapters te bouwen
- en pas daarna nieuwe didactische bruggen toe te voegen

Niet in één sprong. Wel in een strak gecontroleerde volgorde.
