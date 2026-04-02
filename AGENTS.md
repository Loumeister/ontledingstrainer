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

1. **Lees shared canon in `shared/grammar-core/` zodra die map lokaal aanwezig is** voor gedeelde didactische en governancekaders.
2. **Lees de lokale Ontleedlab-contractlaag** voor productspecifieke realiteit (nu al verplicht, en leidend zolang shared-core lokaal nog ontbreekt).
3. **Lees pas daarna de taakprompt** en voer het werk uit binnen die grenzen.

Als deze drie lagen botsen, geldt:
- shared canon is leidend voor **gedeelde didactische principes en governance**
- lokale contracten zijn leidend voor **productspecifieke inhoud, evaluatielogica, annotatiegedrag, adaptermappings, parsinguitkomsten en UI-gebonden didactiek**
- de taakprompt mag het werk **focussen of begrenzen**, maar mag die twee bovenliggende lagen niet overrulen

## 1. Eerst lezen: shared canon in `shared/grammar-core/`
Dit blok is **actief zodra `shared/grammar-core/` lokaal aanwezig is**.

Lees bij parsing- en governancewerk in elk geval:
- `shared/grammar-core/.claude/agents/parsing-didactic-architect.md`
- `shared/grammar-core/.codex/skills/parsing-content-governance/SKILL.md`
- `shared/grammar-core/docs/parsing-didactics-kaders.md`
- `shared/grammar-core/docs/product-repo-contract-template.md`
- `shared/grammar-core/docs/agent-catalog.md`

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
Laat de taakprompt pas sturen nadat de beschikbare hogere lagen zijn gelezen: shared canon (als lokaal aanwezig) en anders de lokale contractlaag.

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
