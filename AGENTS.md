# AGENTS.md — Ontleedlab

## Doel

Ontleedlab is een lokaal parsingproduct met eigen:

- learner-flow en UI-logica;
- parse-, evaluatie- en feedbackcontracten;
- annotatie- en chunkconventies;
- safeguards tegen dubbellezing en ongewenste generalisatie.

`shared/grammar-core/` levert gedeelde didactische en governancecanon. Die canon kadert het werk, maar maakt lokale runtimeconstructies niet automatisch platformbreed.

## Waarheids- en leesvolgorde

Werk in deze volgorde:

1. Lees `AGENTS.md`.
2. Lees alleen de taakrelevante shared canon onder `shared/grammar-core/`.
3. Lees `.agents/skills/zinsontleding-repo-inspector/references/repo-contract.md` wanneer de taak parsingcontent, evaluatie, feedback, adapters of annotatie raakt.
4. Inspecteer de relevante lokale runtime in `src/`.
5. Pas daarna de taakprompt toe.

Voor feitelijk huidig repogedrag gaat runtimewaarheid boven beschrijvende documentatie. Corrigeer of markeer de documentatiedrift; verander runtime niet stilzwijgend om een document waar te maken.

Normatieve shared didactiek en governance blijven gezaghebbend binnen hun eigen scope. Als runtime daarvan lijkt af te wijken, rapporteer het conflict en behandel een gedragswijziging als expliciete producttaak.

## Relevante shared canon

| Onderwerp | Lees |
|---|---|
| Platform- en repogrenzen | `shared/grammar-core/docs/grammar-platform-principles.md` |
| Parsingdidactiek | `shared/grammar-core/docs/parsing-didactics-kaders.md` |
| Canonieke labels en taxonomie | `shared/grammar-core/docs/taxonomy-governance.md` |
| Herbruikbare authoringregels | `shared/grammar-core/docs/content-authoring-rules.md` |
| Lokaal contractformat | `shared/grammar-core/docs/product-repo-contract-template.md` |
| Subtree- en wrappermodel | `shared/grammar-core/docs/repo-sync-strategy.md` |
| Shared agentcatalogus | `shared/grammar-core/docs/agent-catalog.md` |

De lokale korte sleutels zoals `pv`, `ow`, `lv` en `bwb` zijn productlokale runtimekeuzes. Behandel ze niet als shared canonical labels. Lokale kwalificaties op shared authoringregels staan in het repo-contract.

## Lokale skills

Lokale skills staan uitsluitend onder `.agents/skills/`. Kies de skill die de productspecifieke werkstroom dekt:

| Werkstroom | Skill |
|---|---|
| Lokaal parsecontract inspecteren | `zinsontleding-repo-inspector` |
| Oefenzinnen maken of herformuleren | `zinsontleding-constraint-sentence-author` |
| Zinnen en annotaties vrijgaveklaar beoordelen | `zinsontleding-content-quality-gate` |
| Diagnostische feedback en hints | `zinsontleding-feedback-didactiek` |
| Leerlingflow en productspecifieke UI-interactie | `ontleedlab-learner-flow-ui` |
| Leerdata, aggregaties en docentinzichten | `ontleedlab-learning-analytics` |
| Grens tussen shared parsingcanon en lokaal contract | `parsing-content-governance` |
| Shared content via een lokale adapter consumeren | `shared-content-integration` |
| Beperkte docs/auto-sync-automatisering | `documentation-sync-guardian` |
| Grammar-core-subtree bijwerken | `grammar-core-sync` |

Gebruik bij nieuwe of gewijzigde zinnen eerst de inspector en author en sluit af met de content-quality-gate. Gebruik geen lokale skill als de taak buiten zijn trigger en grenzen valt.

De portable grammar-core-skills migreren upstream van `.codex/skills/` naar `.agents/skills/`. Claim die shared ownership en de nieuwe paden pas nadat de grammar-core-wijziging is gemerged en deze productsubtree opnieuw is gesynchroniseerd. Tot die tijd zijn uitsluitend de lokale `.agents/skills/` hierboven de productdiscovery-interface; verwijderde repo-lokale `.codex/skills/*` zijn niet bruikbaar.

## Algemene proces- en designskills

Deze repository bundelt de globale proces- en designskills niet. Installeer ze in de user-level/global skillcatalogus van de agent voordat een taak ze vereist:

- Matt Pocock-processkills uit `mattpocock/skills`;
- `frontend-design` uit `anthropics/skills`;
- `web-design-guidelines` uit `vercel-labs/agent-skills`.

Controleer daarna in de actieve skillcatalogus of de vereiste namen beschikbaar zijn. Kopieer deze globale skills niet naar de repository. Als een globale proces-skill ontbreekt, gebruik dan de deterministische delivery gates hieronder en rapporteer de fallback; claim een vereiste UI-audit niet als `web-design-guidelines` ontbreekt.

- Gebruik de globale Matt Pocock-skills voor planning, implementatie, TDD, diagnose en review.
- Gebruik bij visueel ontwerp of UI-bouw de globale `frontend-design`-skill samen met `ontleedlab-learner-flow-ui`.
- Gebruik de globale `web-design-guidelines` als afsluitende UI-, UX- en toegankelijkheidsaudit.
- Laat design- en domeinskills geen eigen Git-, TDD-, review- of projectmanagementworkflow starten.

Dupliceer algemene frontend-, test-, documentatie-, Git- of planningsmethodiek niet in lokale skills.

## Delivery discipline

- Anchor non-trivial work to an issue or numbered plan step, and state its scope.
- Before editing, select an installed global process skill appropriate to the task and any applicable local domain skill. If no matching global process skill is installed, follow the deterministic scope, validation, range-review, and reporting gates in this file and report that fallback.
- Decide the test and validation evidence before implementation.
- Before claiming completion, resolve the target base and review `git diff <base>...HEAD`; also review `git diff --cached` for staged work and `git diff` for remaining unstaged work.
- Report commands, results, and failures honestly.
- Do not claim work is done until applicable checks and required review pass.

## Productgrenzen

- Houd lokale parseuitkomsten, `RoleKey`, JSON-shapes, chunkconventies, evaluatorlogica en feedbackflows lokaal.
- Wijzig geen bestaande zinsinterpretatie, chunking, annotatie, route of learner-flow zonder expliciete opdracht.
- Hardcode geen oefenzinnen in UI-code.
- Laat shared canon geen excuus zijn om lokale Ontleedlab-logica door abstracte platformtaal te vervangen.
- Voeg geen speculatieve werkwoordspellingmodule toe; werkwoordspelling is alleen relevant na een expliciete lokale productkeuze.
- Behandel sentence-content met twee verdedigbare schoolanalyses als risico en accepteer die niet stilzwijgend via `alternativeRole`.

## Grammar-core-wijzigingen

Bewerk `shared/grammar-core/` niet als lokale bron.

Bij een echte canonfix:

1. werk in de aparte checkout van `grammar-core`;
2. maak een branch vanaf de geverifieerde defaultbranch;
3. implementeer en valideer de fix daar;
4. draai `claude plugin validate .` wanneer de pluginstructuur is geraakt;
5. commit, push en open alleen een draft PR wanneer de opdracht dat autoriseert;
6. voer na merge `grammar-core-sync` uit in de productrepo's.

Gebruik geen blanket conflictstrategie bij subtree-syncs en gooi nooit lokaal gebruikerswerk weg.
