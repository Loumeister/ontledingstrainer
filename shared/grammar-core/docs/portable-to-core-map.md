# Portable to core map

## 1. Purpose of this map

Dit document is een **operationeel migratiebeslisdocument** voor de overgang van didactische, governance-, agent-, skill- en contractelementen uit `Loumeister/ontledingstrainer` naar `Loumeister/grammar-core`.

Het doel is niet om een tweede auditverslag te zijn, maar om voor vervolgprompts en migratiewerk **helder vast te leggen wat nu al gedeeld canon kan worden, wat eerst aangepast moet worden, wat lokaal moet blijven, wat later gevalideerd moet worden, en wat expliciet buiten canonisering valt**.

Dit document is leidend voor beslissingen over:
- gedeelde didactische canon
- gedeelde governance- en agentlogica
- lokale wrapper-governance in productrepo’s
- latere adapter- en integratiestappen

## 2. How to read this document

Lees elk item strikt volgens deze volgorde:
1. **source file**: waar het materiaal nu feitelijk staat
2. **what it is**: didactisch principe, governanceprincipe, productspecifiek detail, of legacy-documentatie
3. **decision category**: één van de zes toegestane categorieën in dit document
4. **status of confidence**:
   - `vaststelbaar`: direct ondersteund door de huidige repo-inhoud
   - `waarschijnlijk`: inhoudelijk sterk, maar nog niet hard genoeg als gedeelde canon
   - `nog te valideren`: nog te weinig stabiel, te lokaal, of alleen roadmapmatig aanwezig
5. **concise justification**: waarom deze plaatsing nu het veiligst is
6. **migration risk if classified wrongly**: wat er misgaat als dit te vroeg of te laat wordt gedeeld
7. **recommended next action**: wat de eerstvolgende veilige stap is

Kernregel: **schijnbare generaliseerbaarheid telt niet**. Een element gaat alleen naar `grammar-core` als het ook buiten Ontleedlab didactisch en governance-technisch bruikbaar is, zonder Ontleedlab-annotatie, Ontleedlab-rendering of Ontleedlab-flow impliciet mee te nemen.

## 3. Promotion criteria

Een element mag alleen naar `grammar-core` onder `Promote now` als het:
- productoverstijgend didactisch geldig is
- niet afhankelijk is van Ontleedlab-specifieke UI of annotatievelden
- herbruikbaar is voor andere producten, brugtaken of gedeelde governance
- stabiel genoeg is om **nu** canonieke shared guidance te zijn

Een element blijft lokaal of gaat naar `Do-not-canonize` als het:
- gekoppeld is aan token- of chunkrendering
- gekoppeld is aan Ontleedlab-specifieke annotatieconventies
- zwaar leunt op de huidige parsingworkflow
- vooral een lokale UI-didactische of productflow-keuze is

Een element hoort onder `Candidate for later validation` als het:
- didactisch plausibel is
- mogelijk productoverstijgende waarde heeft
- maar nog te lokaal, te speculatief, te roadmapmatig of te weinig gevalideerd is om nu canon te worden

## 4. Promote now

| source file | what it is | decision category | status of confidence | concise justification | migration risk if classified wrongly | recommended next action |
|---|---|---|---|---|---|---|
| `.codex/skills/grammar-coach/SKILL.md` | **Didactisch principe:** diagnostische feedback moet uitleggen waarom iets fout is, niet alleen dát het fout is; gebruik van algoritmische vraagladdertaal; focus op herkenbare misconcepties; scaffolding van herkenning naar zelfstandig redeneren | Promote now | vaststelbaar | De kern van dit skillbestand is productoverstijgend didactisch geldig en sluit direct aan op bestaande `grammar-core`-principes rond function-first reasoning, diagnostische feedback en natuurlijke, doelgerichte variatie. De promoteerbare kern zit in de didactische principes, niet in de lokale repo-checklist. | Als dit lokaal blijft, gaan parsing- en werkwoordspellingsproducten uiteenlopen in feedbacklogica, herstelvragen en leerlinggerichte taal. | Neem deze principes op in een gedeeld didactisch agent- of skillbestand in `grammar-core`, los van Ontleedlab-bestandsverwijzingen. |
| `.codex/skills/zinsontleding-constraint-sentence-author/SKILL.md` | **Didactisch/content-governanceprincipe:** één hoofdvalkuil per zin; natuurlijke maar didactisch gecontroleerde zinnen; geen dubbele schoolanalyse; expliciete PV/OW-verantwoording; neutraliteit niet als doel op zich | Promote now | vaststelbaar | Dit is sterke gedeelde content governance. De regels zijn niet afhankelijk van Ontleedlab-rendering of lokale annotatievelden en zijn bruikbaar voor parsing, brugtaken en later ook spellinggerelateerde contentselectie. | Als dit niet canoniek wordt, ontstaat drift in wat verschillende repo’s als een “didactisch goede” zin beschouwen. | Veranker deze principes in `grammar-core` als gedeelde content-authoring guidance. |
| `.codex/skills/zinsontleding-repo-inspector/SKILL.md` | **Governanceprincipe:** inspecteer altijd eerst het lokale repo-contract en de lokale constraints vóórdat content, feedback, evaluatie of validatie wordt aangepast | Promote now | vaststelbaar | Niet de huidige Ontleedlab-uitvoering, maar het onderliggende governanceprincipe is gedeeld bruikbaar. Dit voorkomt dat agents shared guidance verwarren met lokaal productgedrag. | Zonder dit principe gaan agents te snel genereren of migreren op basis van gedeelde aannames in plaats van lokale repo-realiteit. | Voeg in `grammar-core` een generiek governanceprincipe toe: eerst shared core lezen, daarna lokaal repo-contract inspecteren, dan pas wijzigen. |

## 5. Adapt before promotion

| source file | what it is | decision category | status of confidence | concise justification | migration risk if classified wrongly | recommended next action |
|---|---|---|---|---|---|---|
| `.codex/skills/grammar-coach/SKILL.md` | **Skill/wrapperlaag:** de huidige review-checklist verwijst naar `constants.ts`, `data/sentences-level-*.json` en lokale feedbackstructuren | Adapt before promotion | vaststelbaar | De didactische kern is gedeeld bruikbaar, maar de huidige vorm is nog te veel op Ontleedlab-bestandsnamen en lokale structuren geschreven. | Onbewerkte promotie zou Ontleedlab-bestandsstructuren impliciet tot platformverwachting maken. | Splits dit skillbestand in gedeelde kernprincipes en lokale Ontleedlab-wrapperinstructies. |
| `.codex/skills/zinsontleding-constraint-sentence-author/SKILL.md` | **Skill/wrapperlaag:** de huidige workflow verwijst naar repo-compatibel formaat, lokale templates en Ontleedlab-specifieke outputverwachtingen | Adapt before promotion | vaststelbaar | De authoringprincipes zijn sterk, maar de implementatielaag is nog te lokaal. Vooral de verwijzingen naar repo-compatibele output, templates en Ontleedlab-formaten mogen niet canoniek worden. | Onbewerkte promotie zou lokale sentence-outputvormen en repo-aannames smokkelen naar `grammar-core`. | Herschrijf dit tot een shared authoring-skill die alleen gedeelde kwaliteits- en governancecriteria bevat. |
| `.codex/skills/zinsontleding-repo-inspector/references/repo-contract.md` | **Governance-template:** compact contract met kopjes als label inventory, annotation model, supported phenomena, feedback hooks, risks/ambiguities | Adapt before promotion | vaststelbaar | Het **format** is bruikbaar als gedeelde template voor lokale productcontracten. De huidige **inhoud** is Ontleedlab-specifiek en bovendien deels verouderd. | Als de inhoud mee wordt gecanoniseerd, worden lokale Ontleedlab-labels en annotatiekeuzes onterecht gedeelde waarheid. | Maak in `grammar-core` een lege of voorbeeldmatige product-contracttemplate die geen Ontleedlab-inhoud normaliseert. |
| `.codex/skills/zinsontleding-repo-inspector/SKILL.md` | **Governance-skill in huidige vorm:** concrete inspectiestappen voor `src/types.ts`, `src/constants.ts`, sentence JSON en Ontleedlab-velden | Adapt before promotion | vaststelbaar | De huidige uitvoering is te repo-specifiek, maar wel een goede basis voor een gedeelde governance-skill die eerst shared-core leest en daarna het lokale productcontract. | Te snelle promotie maakt Ontleedlab’s inspectieroute normatief voor alle producten. | Maak in `grammar-core` een generieke inspectievolgorde en laat productrepo’s daar lokale wrappers bovenop zetten. |

## 6. Candidate for later validation

| source file | what it is | decision category | status of confidence | concise justification | migration risk if classified wrongly | recommended next action |
|---|---|---|---|---|---|---|
| `.codex/skills/zinsontleding-constraint-sentence-author/references/focus-ladder.md` | **Mogelijke gedeelde focustaxonomie:** basisvolgorde, inversie, PV vinden, OW vinden, NG, VV, bijzin als zinsdeel, werkwoordspelling-relevant ontleden | Candidate for later validation | waarschijnlijk | Dit document bevat bruikbare didactische focuscategorieën, maar de huidige ladder is nog te veel Ontleedlab-taal, Ontleedlab-volgorde en lokale moeilijkheidsmapping. | Te vroege canonisering maakt een lokale focusladder schijnbaar universeel en kan latere bridge-taxonomie verstarren. | Valideer eerst welke focuscategorieën echt cross-product bruikbaar zijn en leg pas daarna een gedeelde focustaxonomie vast. |
| `TODO.md` en `SPEC.md` | **Rollenladder-principe:** rollen stapsgewijs introduceren met afbouw van steun en beheersingsdrempels | Candidate for later validation | waarschijnlijk | Het didactische idee is sterk en plausibel productoverstijgend, maar de huidige trede-indeling, rolmapping, percentages en window-sizes zijn nog productspecifieke ontwerpvoorstellen. | Te vroege canonisering zet Ontleedlab’s huidige progression design vast als platformnorm. | Eerst als gedeeld principe beschrijven zonder tredeconfiguraties; pas later eventueel een canonieke progression guide formuleren. |
| `TODO.md` en `SPEC.md` | **Kwalitatieve foutenanalyse:** onderscheid tussen analysefout, toepassingsfout en inprentfout | Candidate for later validation | waarschijnlijk | Inhoudelijk kansrijk voor gedeelde diagnosegovernance, maar momenteel nog vooral roadmap- en specmateriaal. Detectieregels, drempels en herstelpaden zijn nog niet stabiel genoeg. | Te vroege canonisering leidt tot schijnprecisie in gedeelde taxonomie en kan lokale detectie-heuristieken onterecht normatief maken. | Eerst toetsen of deze driedeling echt beter aansluit op gedeelde misconceptiegovernance en meerdere productmodi. |
| `TODO.md` en `SPEC.md` | **Contrastieve ondersteuningsvormen** zoals contrastparen en metacognitieve prompts | Candidate for later validation | nog te valideren | Didactisch plausibel, maar in de huidige repo nog vooral ontworpen als productfeatures in Ontleedlab. Niet scherp genoeg afgebakend als gedeelde canon. | Te snelle promotie verplaatst productfeature-ideeën naar shared core zonder genoeg bewijs van herbruikbaarheid. | Alleen doorzetten wanneer ze als productoverstijgende didactische ontwerpprincipes kunnen worden geformuleerd, los van UI-vorm. |

## 7. Keep local to ontledingstrainer

| source file | what it is | decision category | status of confidence | concise justification | migration risk if classified wrongly | recommended next action |
|---|---|---|---|---|---|---|
| `src/types.ts` | **Productspecifiek implementatiecontract:** `Token`, `Sentence`, `RoleKey`, `PredicateType`, `DifficultyLevel` en de parsegerelateerde velden in de Ontleedlab-datalaag | Keep local to ontledingstrainer | vaststelbaar | Dit is het lokale parse- en annotatiecontract van Ontleedlab. Het is direct gekoppeld aan de huidige ontleedworkflow en niet geschikt als platformnorm. | Canonisering zou `grammar-core` vervuilen met een lokale parserrepresentatie. | Behoud lokaal; later eventueel alleen expliciete adaptercontracten maken richting shared content. |
| `src/constants.ts` | **Productspecifieke label- en UI-laag:** `ROLES`, `ROLES_PER_LEVEL`, `LEVEL_TOOLTIPS`, lokale rolpresentatie en lokale progressie per niveau | Keep local to ontledingstrainer | vaststelbaar | Deze laag is sterk verweven met Ontleedlab’s toolbar, progression en lokale labelkeuzes. | Te vroege promotie maakt lokale label- en progressionkeuzes schijnbaar algemeen. | Behoud lokaal; laat latere shared taxonomie niet automatisch terugmappen op deze set. |
| `src/constants.ts` | **Lokale feedbacklaag:** `FEEDBACK_MATRIX`, `FEEDBACK_STRUCTURE`, `HINTS`, `FEEDBACK_BIJZIN_FUNCTIE`, `FEEDBACK_SWAP` | Keep local to ontledingstrainer | vaststelbaar | De vorm en koppeling van deze feedback is sterk afhankelijk van lokale labels, lokale fouttypen en lokale UI-flow. Alleen de onderliggende didactische principes zijn portable, niet deze concrete matrices. | Onbewerkte promotie zou lokale feedbackstructuren verstoppen in abstracte shared termen. | Lokaal houden; later alleen conceptueel afleiden welke principes gedeeld kunnen worden. |
| `.codex/skills/zinsontleding-repo-inspector/SKILL.md` | **Lokale Ontleedlab-wrapper** voor inspectie van precies deze repo | Keep local to ontledingstrainer | vaststelbaar | Ook nadat een gedeelde governance-variant bestaat, blijft Ontleedlab een lokale wrapper nodig hebben vanwege zijn eigen parsecontracten. | Zonder lokale wrapper gaan agents lokale annotatie- en feedbackdetails missen. | Na gedeelde governance-migratie herschrijven tot lokale wrapper bovenop `grammar-core`. |
| `README.md`, `TODO.md`, `SPEC.md` | **Productrepo-documentatie en productroadmap** voor Ontleedlab | Keep local to ontledingstrainer | vaststelbaar | Ondanks inhoudelijke overlap blijft de productdocumentatie lokaal eigendom van Ontleedlab. Alleen gedeelde principes moeten eruit gelicht worden. | Te brede extractie maakt `grammar-core` tot duplicaat van een productrepo. | Alleen gedeelde principes of governance-inzichten eruit halen; productflow en lokale roadmaps lokaal laten. |
| `.codex/skills/frontend-developer/SKILL.md`, `.codex/skills/test-engineer/SKILL.md`, `.codex/skills/technical-writer/SKILL.md`, `.codex/skills/accessibility-auditor/SKILL.md`, `.codex/skills/whimsy-injector/SKILL.md` | **Generieke engineering- en UX-skills** | Keep local to ontledingstrainer | vaststelbaar | Dit zijn geen grammatica- of governancecanonieke bestanden maar generieke repo-tooling. | Verplaatsen naar `grammar-core` zou de repo vervuilen met niet-domeinspecifieke skilllagen. | Alleen delen als ooit een aparte algemene toolinglaag gewenst is; niet via `grammar-core`. |

## 8. Archive, rewrite, or mark legacy

| source file | what it is | decision category | status of confidence | concise justification | migration risk if classified wrongly | recommended next action |
|---|---|---|---|---|---|---|
| `README.md` | **Deels verouderde productdocumentatie** over niveaus, zinnenbestanden en ID-reeksen | Archive, rewrite, or mark legacy | vaststelbaar | Relevante delen zijn aantoonbaar uit sync met de huidige repo-inhoud. Dit is vooral belangrijk omdat foutieve documentatie later migratiebeslissingen kan vertekenen. | Verouderde README-aannames kunnen door agents of migratieprompts voor feitelijke repo-waarheid worden gehouden. | Later herschrijven nadat shared governance en lokale wrappervolgorde helder zijn. |
| `.codex/skills/zinsontleding-repo-inspector/references/repo-contract.md` | **Lokale referentie met inhoudelijke drift** ten opzichte van de huidige labelinventaris | Archive, rewrite, or mark legacy | vaststelbaar | De templatevorm is bruikbaar, maar de huidige inhoud bevat aantoonbare veroudering. | Een stale repo-contract maakt inspectie- en authoringwerk onbetrouwbaar. | Lokale versie in Ontleedlab actualiseren nadat de gedeelde contracttemplate in `grammar-core` bestaat. |
| `SPEC.md` | **Gemengde productspec + platformspec + verouderde architectuurclaims** | Archive, rewrite, or mark legacy | vaststelbaar | Dit document beschrijft deels een geïntegreerd platform binnen de Ontleedlab-repo, wat niet meer past bij de nieuwe shared-core architectuur. | Te lang laten staan als actieve waarheid houdt parallelle platformcanon in stand. | Later opsplitsen: gedeelde principes naar `grammar-core`, productspecifieke resten naar een lokale Ontleedlab-spec. |
| `TODO.md` | **Gemengde productbacklog + platformambities** | Archive, rewrite, or mark legacy | waarschijnlijk | Het document bevat bruikbare producttaken, maar ook platformbrede didactische en modulaire ambities die niet meer primair in Ontleedlab thuishoren. | Zonder markering blijven toekomstige prompts brede platformontwikkeling in de verkeerde repo initiëren. | Markeer de platformdelen als legacy of verplaats ze later naar `grammar-core`-governance- of planningsdocumenten. |
| `AGENTS.md` | **Lokale agentinstap zonder shared-core precedentie** | Archive, rewrite, or mark legacy | vaststelbaar | Voor migratiegovernance is dit relevant: de huidige instaplaag behandelt Ontleedlab nog als autonome bron en niet als productrepo met shared-core-first volgorde. | Zolang dit zo blijft, blijft shared governance in de praktijk zwakker dan de lokale repo-instructies. | Later herschrijven naar een lokale wrapper die expliciet eerst `shared/grammar-core/` leest. |

## 9. Do-not-canonize

| source file | what it is | decision category | status of confidence | concise justification | migration risk if classified wrongly | recommended next action |
|---|---|---|---|---|---|---|
| `src/types.ts`, `src/data/sentences-level-*.json` | `newChunk` | Do-not-canonize | vaststelbaar | Expliciet lokale Ontleedlab-annotatie voor chunkgrenzen. Geen gedeeld schema-element. | Canonisering zou een lokale parseheuristiek verbergen als platformcontract. | Altijd lokaal houden; alleen adaptermatig behandelen indien nodig. |
| `src/types.ts`, `src/data/sentences-level-*.json` | `alternativeRole` | Do-not-canonize | vaststelbaar | Lokale manier om ambiguïteit in Ontleedlab-data te modelleren. | Te vroege canonisering zou lokale analysecompromissen als gedeelde norm legitimeren. | Lokaal houden; later alleen bespreken als expliciet gedeeld ambiguitybeleid nodig blijkt. |
| `src/types.ts`, `src/data/sentences-level-*.json` | `bijzinFunctie` | Do-not-canonize | vaststelbaar | Lokale parseannotatie gekoppeld aan Ontleedlab’s behandeling van bijzinnen. | Zou bijsmokkelen dat Ontleedlab’s bijzinrepresentatie platformbreed is. | Lokaal houden. |
| `src/types.ts`, `src/data/sentences-level-*.json` | `bijvBepTarget` | Do-not-canonize | vaststelbaar | Lokale target-linking voor Ontleedlab-annotatie. Geen gedeelde canon. | Zou lokale woord-targeting verheffen tot algemene grammaticale datastructuur. | Lokaal houden. |
| `src/data/sentences-level-*.json` | Lokale sentence JSON-shapes | Do-not-canonize | vaststelbaar | Dit zijn Ontleedlab-contentformaten, geen gedeelde contentnorm. | Gedeelde content zou dan onterecht langs een lokaal productformaat moeten lopen. | Alleen later met expliciete adapters koppelen aan shared content. |
| `src/data/sentences-level-*.json` | Token-per-woord annotatie als platformnorm | Do-not-canonize | vaststelbaar | Voor Ontleedlab functioneel, maar niet automatisch een gedeelde platformnorm. | Zou toekomstige producten dwingen tot een te specifieke annotatiestrategie. | Niet canoniseren; alleen lokaal gebruiken. |
| `src/types.ts`, `README.md`, `src/data/sentences-level-*.json` | Numerieke levelvelden en lokale sentence-ID-reeksen | Do-not-canonize | vaststelbaar | Lokale productorganisatie, geen gedeelde didactische canon. | Zou shared governance onnodig koppelen aan lokale nummerlogica. | Lokaal houden. |
| `src/types.ts`, `src/constants.ts` | Lokale `RoleKey`-quirks | Do-not-canonize | vaststelbaar | De huidige rolset en haar quirks zijn niet bewezen als gedeelde taxonomie. | Zou `grammar-core` reduceren tot een hernoemde Ontleedlab-labellaag. | Alleen later taxonomisch abstraheren waar echt nodig. |
| `src/types.ts`, `src/constants.ts` | Lokale subrole-systematiek | Do-not-canonize | vaststelbaar | Sterk gekoppeld aan Ontleedlab’s parse- en feedbackmodel. | Zou lokale analysegranulariteit smokkelen in de gedeelde canon. | Lokaal houden. |
| `src/constants.ts`, `TODO.md`, `SPEC.md` | Ontleedlab renderer-, toolbar-, drag/drop-, tap-to-place- en interactielogica | Do-not-canonize | vaststelbaar | Dit zijn productspecifieke renderer- en workflowkeuzes. | Canonisering zou mode-specifieke interactie als shared platformlogica vermommen. | Lokaal houden. |
| `src/constants.ts` | Productlokale `FEEDBACK_MATRIX`- en `FEEDBACK_STRUCTURE`-vormen | Do-not-canonize | vaststelbaar | De matrixvorm, sleutelstructuur en granulariteit zijn lokaal. Alleen de onderliggende didactische feedbackprincipes zijn portable. | Een abstracte hernoeming zou lokale Ontleedlab-structuur alsnog insmokkelen in `grammar-core`. | Altijd scheiden tussen feedbackprincipes en feedbackdatastructuren. |

## 10. Main migration risks

1. **Schijnbare generaliseerbaarheid**
   - Grootste risico: Ontleedlab-structuren lijken abstract genoeg, maar zijn in feite lokaal parser- en UI-gebonden.
   - Gevolg: `grammar-core` wordt ongemerkt een hernoemde Ontleedlab-kern.

2. **Shared guidance zonder lokale inspectiestap**
   - Groot risico: agents gaan gedeelde canon direct toepassen zonder lokale repo-contracten te lezen.
   - Gevolg: foute patches, foutieve contentgeneratie, en verlies van intentionele productlogica.

3. **Te vroege taxonomische canonisering**
   - Focusladder, rollenladder en foutenanalyse ogen veelbelovend, maar zijn nog niet stabiel genoeg als gedeelde canon.
   - Gevolg: te vroege verstarring van lokale ontwerpkeuzes.

4. **Lokale feedbackvormen vermommen als gedeelde feedbackcanon**
   - De feedbackprincipes zijn portable, maar de matrixvormen niet.
   - Gevolg: lokale Ontleedlab-structuren worden via abstracte taal alsnog het gedeelde model.

5. **Parallelle waarheid in documentatie en agents**
   - Zolang `grammar-core` canoniek wil zijn maar lokale `AGENTS.md` en legacy docs nog autonomie uitstralen, blijft governance dubbel.
   - Gevolg: vervolgprompts lezen verschillende “waarheden” afhankelijk van repo-context.

## 11. Recommended execution order

Deze volgorde is gebaseerd op **migratieveiligheid**, niet op gemak.

1. **Decision clarity**
   - Gebruik dit document eerst als vaste beslislaag voor vervolgwerk.
   - Geen verdere migratie zonder expliciet besluit per elementcategorie.

2. **Shared didactic canon**
   - Promoteer eerst de duidelijk portable didactische kern:
     - diagnostische feedbackprincipes
     - constraint-based sentence-authoring principes
   - Nog zonder Ontleedlab-outputvormen of lokale checklistpaden.

3. **Shared governance agents**
   - Bouw daarna in `grammar-core` de gedeelde governance-laag:
     - inspecteer eerst lokaal repo-contract
     - shared core eerst, productcontract daarna
   - Gebruik géén Ontleedlab-specifieke veldnamen of bestandsverwachtingen in deze laag.

4. **Local wrapper governance**
   - Pas daarna lokale wrappers in `ontledingstrainer` aan:
     - `AGENTS.md`
     - lokale skills
     - lokale repo-contractverwijzingen
   - Doel: shared-core-first, daarna lokale Ontleedlab-constraints.

5. **Local adapter contracts**
   - Pas nadat de governancehiërarchie goed staat, ontwerp je expliciete adaptercontracten tussen shared content en Ontleedlab.
   - Niet eerder.

6. **Documentation cleanup and technical preparation**
   - Pas daarna verouderde lokale docs en legacyplanning opruimen of herschrijven:
     - `README.md`
     - `SPEC.md`
     - `TODO.md`
     - lokale stale repo-contractinhoud
   - Documenthygiëne volgt dus op beslisduidelijkheid en governance, niet andersom.

7. **Later validation track**
   - Valideer daarna pas de twijfelgevallen:
     - focusladder
     - rollenladder-principe
     - kwalitatieve foutenanalyse
   - Alleen promoveren als ze echt productoverstijgend en schema-onafhankelijk te formuleren zijn.
