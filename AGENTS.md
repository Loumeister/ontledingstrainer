# AGENTS.md

## Doel
Dit bestand is de **lokale wrapperlaag** voor Ontleedlab.

Ontleedlab is geen passieve consumer van shared canon, maar een product met:
- eigen didactische UI-logica
- eigen parsecontracten
- eigen annotatie- en structuurconventies
- eigen safeguards tegen dubbellezing en ongewenste generalisatie

Shared canon uit `grammar-core` **kadert** het werk, maar overschrijft de lokale productlogica niet.

## Precedentievolgorde
Werk altijd in deze volgorde:

1. **Lees `AGENTS.md`** — dit bestand — voor de leesvolgorde, grensbewaking en precedentieregels.
2. **Lees shared canon in `shared/grammar-core/`** voor gedeelde didactische en governancekaders. De map is lokaal aanwezig als git subtree.
3. **Lees de lokale Ontleedlab-contractlaag** voor productspecifieke realiteit.
4. **Lees pas daarna de taakprompt** en voer het werk uit binnen die grenzen.

Als deze drie lagen botsen, geldt:
- shared canon is leidend voor **gedeelde didactische principes en governance**
- lokale contracten zijn leidend voor **productspecifieke inhoud, evaluatielogica, annotatiegedrag, adaptermappings, parsinguitkomsten en UI-gebonden didactiek**
- de taakprompt mag het werk **focussen of begrenzen**, maar mag die twee bovenliggende lagen niet overrulen

## 1. Eerst lezen: shared canon in `shared/grammar-core/`
`shared/grammar-core/` is lokaal aanwezig als git subtree. Lees bij parsing- en governancewerk:

- `shared/grammar-core/README.md` — contextueel (oriëntatie: scope en doel van de gedeelde laag)
- `shared/grammar-core/docs/grammar-platform-principles.md` — **gezaghebbend** voor platformgrenzen en architectuurverantwoordelijkheden; beschrijft zowel **huidige gedeelde realiteit** als **toekomstige integratierichting** — lees als governance-context, niet als lijst van huidige platformmogelijkheden of lokale implementatievereisten voor dit product
- `shared/grammar-core/docs/parsing-didactics-kaders.md` — **gezaghebbend** (gedeelde parsingdidactische principes)
- `shared/grammar-core/docs/taxonomy-governance.md` — **gezaghebbend** (rollen, labels, taxonomie-governance); zie vier-laags model hieronder
- `shared/grammar-core/docs/content-authoring-rules.md` — **gezaghebbend** voor herbruikbare authoringprincipes; lokaal aangevuld en deels lokaal gekwalificeerd — zie opmerking hieronder
- `shared/grammar-core/docs/repo-sync-strategy.md` — contextueel (syncmodel en updateproces)
- `shared/grammar-core/docs/product-repo-contract-template.md` — contextueel (sjabloon voor productcontracten; lokaal ingevuld via `repo-contract.md`)
- `shared/grammar-core/docs/werkwoordspellingsdidactiek-kaders.md` — contextueel, **niet bindend** voor Ontleedlab; adoptie vereist expliciete lokale keuze die wordt gedocumenteerd in het lokale productcontract

De bestanden `shared/grammar-core/.claude/agents/parsing-didactic-architect.md`, `shared/grammar-core/docs/agent-catalog.md` en `shared/grammar-core/.codex/skills/parsing-content-governance/SKILL.md` zijn bevestigd aanwezig en canonical in grammar-core. Raadpleeg `agent-catalog.md` voor het volledige overzicht van canonical agents en skills.

### Vier-laags taxonomiemodel

`taxonomy-governance.md` hanteert vier lagen: canonical label / display label / alias / product-local short label.

De lokale runtime-sleutels van Ontleedlab (`pv`, `ow`, `lv`, `mv`, `bwb`, `vv`, `bijst`, `wg`, `ng`, `bijzin`, `vw_neven`, `bijv_bep`, `vw_onder`, `wwd`, `nwd`) vallen in de **product-local short label**-laag. Zij zijn:
- correct en stabiel als lokale runtime-sleutels
- **niet** de shared canonical labels (die heten bijv. `persoonsvorm`, `onderwerp`, `lijdend_voorwerp`)
- **niet** verplicht te hernoemen om met de shared canonieke laag overeen te komen

De mapping in `taxonomy-governance.md` (§1.2) is **informatief**. Het hernoemen van lokale sleutels naar shared canonical labels is **geen vereiste** vanuit de gedeelde governance.

### Lokale interpretatie van content-authoring-rules.md

De shared `content-authoring-rules.md` is gezaghebbend voor het gedeelde contentwerk in `grammar-core`. Voor lokaal Ontleedlab-materiaal gelden twee kwalificaties:

- **Regel 1** (didactische waarde boven volume): geldt als **initieel ontwerpprincipe** voor nieuw lokaal materiaal — het is goed als een nieuw item een nieuwe misconceptiedoelstelling of contrasterelatie toevoegt, maar het is **geen permanente verbodsbepaling** op meerdere items van hetzelfde type. Herhaling van een oefentype is lokaal toegestaan waar didactisch nuttig.
- **Regel 6** (leeftijds- en onderbouwgeschiktheid): geldt voor de **gedeelde zinnenbank** in `grammar-core`, maar is **geen harde lokale eis** voor Ontleedlab-eigenmateriaal. Lokale zinnen mogen uitdagender zijn dan de gedeelde onderbouwnorm waar de lokale didactische context dat rechtvaardigt.

Andere afwijkingen van shared authoring-regels worden gedocumenteerd in `.codex/skills/zinsontleding-repo-inspector/references/repo-contract.md`.

Gebruik shared canon voor:
- parsingdidactische principes
- gedeelde contentgovernance
- begrenzing tussen shared canon en productlokale logica
- wrappers die naar shared tool-native paden moeten verwijzen

Gebruik shared canon **niet** als excuus om lokale Ontleedlab-logica te vervangen door abstracte platformtaal.

## 2. Daarna lezen: lokale Ontleedlab-contractlaag
Lees vervolgens de lokale laag die vastlegt hoe Ontleedlab **hier en nu** werkt.

Voor parsing- en contentwerk zijn in elk geval relevant:
- `.codex/skills/zinsontleding-repo-inspector/SKILL.md`
- `.codex/skills/zinsontleding-repo-inspector/references/repo-contract.md`
- `.codex/skills/zinsontleding-constraint-sentence-author/SKILL.md`
- `.codex/skills/grammar-coach/SKILL.md`

Gebruik de lokale laag zodra het werk gaat over:
- productspecifieke content
- evaluatielogica
- annotatiegedrag
- adaptermappings
- parsinguitkomsten
- UI-gebonden didactiek
- lokale ambiguïteitssafeguards

Voor andere taken gebruik je daarnaast de passende lokale skill, bijvoorbeeld:
- `frontend-developer`
- `test-engineer`
- `technical-writer`
- `accessibility-auditor`
- `whimsy-injector`

## 3. Pas daarna: taakprompt
Laat de taakprompt pas sturen nadat de hogere lagen zijn gelezen: eerst shared canon in `shared/grammar-core/`, dan de lokale contractlaag.

De taakprompt mag dus niet stilzwijgend:
- lokale parseuitkomsten herdefiniëren
- lokale annotatieconventies vervangen
- lokale UI-didactiek afvlakken
- runtimegedrag wijzigen zonder expliciete opdracht

De taakprompt mag wel:
- de opdracht afbakenen in scope, volgorde of oplevervorm
- keuzes maken binnen de grenzen van shared canon en lokale contracten

## Wat shared canon hier wel en niet doet
Shared canon doet hier wél:
- parsingdidactiek disciplineren
- bewaken dat werk niet alleen over labelcorrectheid gaat, maar ook over diagnostische denkstappen, vraagvolgorde, didactische focus, zorgvuldig gekozen contrasten en beheersbare cognitieve belasting
- duidelijk maken wat gedeeld kan worden en wat lokaal moet blijven

Shared canon doet hier níét:
- Ontleedlab-data of parsecontracten canoniseren
- lokale productlogica stilzwijgend overschrijven
- productspecifieke aannames presenteren als platformwaarheid

## Runtimegedrag niet impliciet wijzigen
Tenzij de opdracht dat expliciet vraagt, mag werk aan de instructielaag **niet** leiden tot wijzigingen in:
- parsingresultaten
- zinsinterpretatie
- chunkinggedrag
- structuurgedrag
- annotatiegedrag
- feedbackflow
- routes
- UI-flow
- productlogica

## Niet doen
- Behandel lokale annotatievelden niet als gedeelde waarheid.
- Herinterpreteer bestaande zinnen niet semantisch zonder expliciete opdracht.
- Wijzig chunking- of structuurgedrag niet zonder expliciete opdracht.
- Canoniseer lokale feedbackflows niet.
- Gebruik shared didactic guidance niet als excuus om productlokale parsinglogica te overschrijven.
- Verzin geen gedeelde waarheid rond lokale RoleKeys, JSON-shapes, chunkconventies of evaluatielogica.
- Eis geen volledige repo-inspectie voor triviale taken; inspecteer het lokale contract gericht zodra het werk productspecifieke content, evaluatielogica of adaptermappings raakt.

## Synchronisatie-opmerking
Lokale contractbestanden moeten inhoudelijk synchroon blijven met de werkelijke repo.

Als `.codex/skills/zinsontleding-repo-inspector/references/repo-contract.md` deels verouderd of onvolledig blijkt, markeer dat expliciet en behandel herziening daarvan als **aparte gerichte stap**.
Herstel zulke drift niet stilzwijgend via algemene aannames in deze wrapperlaag.

## Subtree-updatepraktijk

De map `shared/grammar-core/` is toegevoegd als git subtree vanuit `Loumeister/grammar-core`. Om toekomstige upstream-wijzigingen op te halen:

```bash
git subtree pull --prefix=shared/grammar-core https://github.com/Loumeister/grammar-core main --squash
```

Na elke pull:
1. Controleer of gewijzigde shared docs de gezagsniveaus in dit bestand (`AGENTS.md`) nog steeds correct weergeven.
2. Controleer of lokale kwalificaties in `repo-contract.md` nog actueel zijn ten opzichte van de bijgewerkte shared docs.
3. Als de upstream-wijziging een lokale afwijking raakt, documenteer die afwijking dan **expliciet** in `repo-contract.md` — stilzwijgende adoptie of stilzwijgende divergentie zijn beide niet geldig.

Upstream-wijzigingen worden **niet automatisch lokaal bindend**. Dit product beslist zelf wat het adopteert.
