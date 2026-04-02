# TODO & Roadmap

Dit document ordent de backlog van Ontleedlab volgens de huidige productscope en de shared-core-first volgorde.

Ontleedlab blijft in deze roadmap:
- het **parsinggerichte lokale product**
- de plek voor lokale parsing-UI, evaluatie, interactie en didactische verfijning
- een product dat later gedeelde content of gedeelde didactische kaders kan consumeren
- **niet** de vanzelfsprekende repo waarin de volledige toekomstige grammatica- en spellingketen runtime-technisch wordt ingebouwd

> **Context:** een eenpersoonsproject met LLM/agent-ondersteuning. Taken moeten klein, toetsbaar en uitvoerbaar blijven.

> **Coherentie-opmerking:** `SPEC.md` is leidend voor de lokale architectuurframing. Deze roadmap volgt dus het onderscheid tussen lokale productscope, gedeelde platformrichting en oudere repo-gecentreerde aannames.

---

## ✅ Reeds gerealiseerd: lokale productbasis

Deze onderdelen blijven zichtbaar in de roadmap omdat ze de huidige productrealiteit bepalen.

### Lokale basis: domeinarchitectuur, dashboards en versioning
- Nieuwe domeintypes in `src/types.ts`: `Student`, `TrainerAssignment`, `TrainerSubmission`, `TrainerAttempt`, `TrainerActivityEvent` / `TrainerEventType`, `TeacherNote`
- Nieuwe services zoals `studentStore.ts`, `trainerAssignmentStore.ts`, `trainerSubmissionStore.ts`, `trainerActivityLog.ts`, `teacherNoteStore.ts`
- `analyticsHelpers.ts` met progressie-, participatie- en foutpatroonfuncties
- Integratie in bestaande flow via `useTrainer.ts`, `SentenceEditorScreen.tsx`, `ScoreScreen.tsx`, `App.tsx`
- Nieuwe schermen voor leerling- en docentvoortgang
- Migratieprincipes rond localStorage, interaction log en compatibiliteit zijn al ingevoerd

### Lokale parsing- en zinnenbasis
- `sentences-level-0.json` toegevoegd met 25 instapzinnen
- Niveau 1 t/m 3 uitgebreid met NG-zinnen
- Google Sheet sync uitgebreid met per-zin resultaten, hintteller en sessieduur

### Lokale infrastructuur en beheer
- Gecentraliseerde login via `#/login`
- Feedback-editor in het eigenaar-admin-paneel
- Verbeteringen in `UsageLogScreen`
- App hernoemd naar **Ontleedlab**
- `activityStore` als lokale façade voor `trainer` en `lab`

### Reeds gebouwde lokale aanpalende module: Zinsdeellab
Zinsdeellab blijft een legitieme lokale productrealiteit binnen deze repo. Het is **geen** architecturale reden om toekomstige werkwoordspelling, foutentekst of andere brugtaken automatisch ook lokaal in deze repo onder te brengen.

Gebouwd en aanwezig:
- `constructionFrames.ts`, `chunkCards.ts`
- `constructionValidation.ts`
- `labFrameStore.ts`, `labChunkCardStore.ts`, `labExerciseStore.ts`, `labSubmissionStore.ts`, `labActivityLog.ts`
- `useZinsbouwlab.ts`
- `ZinsdeellabScreen.tsx`
- editor- en activiteitcomponenten voor het lab

---

## Nu: lokale productverbeteringen

Deze items zijn direct uitvoerbaar binnen de huidige Ontleedlab-productscope en moeten vooraan in de roadmap blijven.

## A. Interactie, toegankelijkheid en instap

### 0a. "Snel Starten"-knop (Quick Start)
*Probleem: het startscherm toont veel opties; leerlingen willen direct beginnen.*

**Implementatie:**
- één prominente knop bovenaan HomeScreen
- defaults: `selectedLevel: 1`, `predicateMode: 'all'`, `customSessionCount: 5`
- gebruik eerdere lokale voorkeuren waar beschikbaar
- verplaats overige instellingen naar een uitklapbaar paneel

### 0b. Tik-om-te-plaatsen (Tap-to-Place)
*Probleem: drag-and-drop werkt zwak op tablets en touchscreens.*

**Implementatie:**
- voeg `selectedRole: RoleKey | null` toe aan TrainerState
- `WordChip` krijgt `onClick` naast `onDragStart`
- `DropZone` accepteert plaatsing via klik
- visuele selectie-indicator op het actieve kaartje
- drag-and-drop blijft volledig bestaan

### 0c. Toetsenbordnavigatie
*Probleem: kerninteracties zijn niet volledig toetsbaar met het toetsenbord.*

**Implementatie:**
- split-toggles focusbaar maken en Enter/Space ondersteunen
- WordChips focusbaar maken en activeerbaar met Enter
- DropZones focusbaar maken en roltoewijzing via Enter ondersteunen
- zichtbare focus-ring op alle interactieve elementen
- skip-to-content link toevoegen

### 0d. Aria-labels en semantische structuur
*Probleem: iconknoppen en dynamische feedback zijn niet overal schermlezer-vriendelijk.*

**Implementatie:**
- aria-labels op iconknoppen
- `ScoreRing` als progressbar annoteren
- modals correct als dialog annoteren
- feedbackberichten via `role="alert"` of `aria-live`
- stappenindicator voorzien van `aria-current`

### 11. Responsief ontwerp voor tablets
*Probleem: huidige layout is niet optimaal op Chromebooks en iPads.*

**Implementatie:**
- HomeScreen naar 1/2/3 kolommen per viewport
- toolbar onder de zin op smallere schermen
- touch targets minimaal 44x44 px

### 12. Rondleiding voor eerste gebruik
*Probleem: geen begeleiding voor nieuwe leerlingen.*

**Implementatie:**
- driedelige overlay bij eerste bezoek
- focus op snel starten, knippen en labels plaatsen
- altijd overslaan mogelijk
- lichtgewicht eigen overlay, geen extra tour-library

### 19. Module-navigatie zichtbaar maken
**Status:** router is aanwezig, maar de modulekeuze is nog niet goed zichtbaar voor leerlingen.

**Implementatie:**
- zichtbare keuze-UI op `#/`
- knoppen of tabs voor `Ontleden` en `Zinnen bouwen`
- geen nieuwe architectuur nodig; alleen heldere lokale navigatie

## B. Parsingdidactische versterking

### 1. Rollenladder
*Bron: scaffolding, cognitieve belastingtheorie, veel kennis van weinig.*

**Doel:** rollen stapsgewijs introduceren en cognitieve belasting verlagen.

**Lokale uitwerking:**
- trede 1: PV
- trede 2: PV + OW
- trede 3: PV + OW + LV/MV/BWB
- trede 4: + VV, WG/NG
- trede 5: volledig
- 80%-beheersingscriterium over 10 zinnen
- suggestie tot lagere trede bij herhaald lage scores

**Implementatie:**
- `rollenladderTrede` in useTrainer
- toolbar filteren op trede
- validatie buiten actieve trede als rest of niet-fout behandelen
- voortgang visueel tonen

### 2. Interactieve beslisboom / Ontleedhulp
*Bron: algoritmische werkwijze als controlemechanisme.*

**Doel:** denkstappen expliciet en herstelbaar maken.

**Implementatie:**
- uitklapbaar paneel met stappen voor PV, OW, gezegde, overige zinsdelen en bijzinnen
- stappen lokaal afvinkbaar
- optioneel koppelen aan reeds geplaatste labels

### 3. Kwalitatieve foutenanalyse
*Bron: kwalitatieve foutenanalyse en gerichte interventie.*

**Doel:** onderscheid maken tussen analysefouten, toepassingsfouten en ingesleten foutpatronen.

**Implementatie:**
- `errorType` of soortgelijke classificatie toevoegen aan resultaatdata
- detectielogica na validatie
- foutverdeling in ScoreScreen
- gerichte interventies per fouttype

### 4. Theorie-tooltips / ZinsdeelInfo verbeteren
**Status:** deels aanwezig via `ZinsdeelHelpModal.tsx`.

**Verbetering:**
- inline tooltip naast rolkaartjes
- minimale voorbeeldzin per rol
- verwanttip bij naburige verwarringen
- verwijzing naar passende Rollenladder-trede

### 5. Metacognitieve denkstap-prompt
*Bron: metacognitie en zelfregulatie.*

**Doel:** leerling vooraf herinneren aan de ontleedmethode.

**Implementatie:**
- prompt vóór controleren
- aanpasbaar aan actieve rollen
- fading scaffolding na successen
- configureerbaar voor docent

### 6. Contrastieve oefenparen
*Bron: contrastieve analyse.*

**Doel:** verwisselbare rollen scherper onderscheiden via contrastrijke voorbeelden.

**Implementatie:**
- lokale set contrastparen
- trigger na bekende verwisselfouten
- uitklapbaar feedbackpaneel met vergelijking en uitleg

### 21. Spaced repetition voor zwakke rollen
*Bron: vergeetcurve, adaptief leren.*

**Doel:** zwakke rollen vaker terug laten komen zonder volledige nieuwe modulelogica.

**Implementatie:**
- confidence-score per rol
- zinnen selecteren op zwakke rollen
- sterke rollen minder vaak tonen
- gewogen random selectie volstaat

## C. Lokale content- en productkwaliteit

### 0e. Zinnen-database verder uitbreiden
**Status:** deels gedaan.

**Nog openstaand:**
- niveau 2 en 3 verder uitbreiden met gevarieerde NG-zinnen
- meer inversie en vraagzinnen in niveau 1-2
- parsingdidactisch sterke contrasten doelgerichter spreiden

### 8. "Kijk terug"-functie / oefenplan
**Status:** deels aanwezig via `SentenceResultCard`.

**Verbetering:**
- knop voor mini-sessie op basis van gemaakte fouten
- koppeling naar Rollenladder bij te hoge moeilijkheid
- optionele export als docentrapport

### 9. Dyslexie-modus verbeteren
**Status:** aanwezig.

**Verbetering:**
- extra spatiëring en regelhoogte
- toetsen met doelgroep welk lettertype echt helpt

### 10. Dark mode verfijnen
**Status:** aanwezig.

**Verbetering:**
- `prefers-reduced-motion`
- contrastcontrole op WCAG AA-niveau

### 23. Leerling-profiel Dashboard
**Status:** inhoudelijk passend als lokale productverbetering.

**Implementatie:**
- radardiagram of alternatief overzicht van rolbeheersing
- trendlijn van sessiescores
- aanbeveling op basis van voortgang
- hergebruik van bestaande lokale voortgangsdata

## D. Lokale codekwaliteit en stabiliteit

### 0f. Prestatieoptimalisatie useTrainer
**Implementatie:**
1. handlers wrappen in `useCallback`
2. filtering memoizen met `useMemo`
3. state logisch groeperen
4. pure componenten memoizen

### 16. State management vereenvoudigen
**Gefaseerde aanpak:**
- Fase A: callbacks en memoization
- Fase B: state groeperen
- Fase C: zo nodig `useReducer`

### 17. Testdekking uitbreiden
**Status:** 374 tests groen, 16 testbestanden.

**Nog openstaand:**
- `handleCheck()` beter afdekken
- sessieflow testen
- snapshot- of integriteitschecks voor `constants.ts`
- realistisch streven: circa 60% dekking

### 18. Zinnen-validatiescript
**Doel:** lokale kwaliteitsborging van sentence-data.

**Controlepunten:**
- unieke ID’s
- geldige role keys
- token-ID-formaat
- `newChunk`-consistentie
- minimaal één PV-token per zin

### 20. Samengestelde zinnen
**Opmerking:** dit is nog geen kleine onderhoudstaak, maar wel een legitieme lokale parsinguitbreiding zolang de scope parsinggericht blijft.

**Vervolgvragen vóór implementatie:**
- blijft token-per-woord annotatie leidend?
- hoe verhoudt clause-structuur zich tot huidige evaluatielogica?
- welke parsingstappen worden lokaal toegevoegd zonder bestaande zinnen te breken?

---

## Eerst: shared-core zichtbaarheid en alignment

Deze fase komt vóór diepere cross-product uitbreiding, maar hoeft lokale productverbeteringen niet stil te zetten.

### E. Shared-core zichtbaar maken in de repo
**Doel:** de gedeelde canon fysiek beschikbaar maken als eerste leeslaag voor wrappers en agents.

**Taken:**
- `shared/grammar-core/` als subtree of vergelijkbare lokale sync toevoegen
- zorgen dat de paden uit `AGENTS.md` ook echt lokaal leesbaar worden
- sync-afspraken vastleggen voor updates van die subtree

### F. Lokale wrappers en contracten synchroon houden
**Doel:** gedeelde canon eerst laten lezen, zonder lokale Ontleedlab-logica kwijt te raken.

**Taken:**
- controleren of lokale skills nog kloppen met `AGENTS.md`
- lokale contractbestanden synchroon houden met de werkelijke repo
- voorkomen dat oudere repo-gecentreerde aannames terugsluipen in wrappers of contracten

### G. Lokale documentcoherentie bewaken
**Doel:** lokale docs moeten niet uiteenlopen in productscope of architectuurtaal.

**Taken:**
- na subtree-sync controleren of lokale docs nog coherent verwijzen naar shared canon
- verouderde repo-gecentreerde formuleringen gericht herstellen
- parsingrijke details lokaal houden en niet alsnog veralgemeniseren

**Opmerking:** dit alignmentwerk verandert niet automatisch runtimegedrag. Het maakt vooral toekomstige Claude/Codex-uitvoering veiliger.

---

## Daarna: kleine shared-content adapters

Pas oppakken nadat shared-core zichtbaar is en de wrapperlaag betrouwbaar werkt.

### H. Expliciete adapters voor herbruikbare zinnen of metadata
**Doel:** kleine, expliciete vertaallagen maken tussen gedeelde content en lokale Ontleedlab-structuren.

**Voorwaarden:**
- pas na shared subtree-sync
- pas na contract- en wrappercoherentie
- geen stilzwijgende gelijkstelling van lokale JSON-shapes aan gedeelde schema’s

**Mogelijke taken:**
- bepalen welke zinnen of focusclusters veilig gedeeld kunnen worden
- expliciete mapping documenteren van shared metadata naar lokale Ontleedlab-velden
- valideren dat lokale parsingeenduidigheid overeind blijft

### I. Kleine import/export- of syncproeven
**Doel:** voorzichtig testen of gedeelde contentlagen bruikbaar zijn zonder lokale productlogica te breken.

**Randvoorwaarden:**
- klein van schaal
- expliciet adaptermatig
- geen verborgen schemafusie

---

## Later: bridge tasks en bredere platformfeatures

Deze richtingen blijven inhoudelijk relevant, maar zijn pas aan de beurt ná lokale productverbeteringen en shared-core alignment.

### J. Werkwoordspelling
**Nieuwe positionering:**
- geen automatische lokale module-uitbouw
- wel een sterke gedeelde platformrichting in dezelfde leerlijn
- mogelijk later apart product, brugdomein of expliciete lokale verkenning

**Inhoudelijk waardevol blijft:**
- PV in tegenwoordige tijd
- homofoon-training
- verleden tijd
- voltooid deelwoord
- integrale oefening
- expliciete koppeling tussen parsingvoorkennis en spellingbeslissing

### K. Foutentekst / transfer
**Nieuwe positionering:**
- geen automatische lokale volgende module
- wel sterke transfergerichte vervolgrichting
- mogelijk later gedeelde platformmodus of lokaal experiment

### L. Peer-review
**Nieuwe positionering:**
- geen vanzelfsprekende lokale runtime-route
- mogelijk latere brugtaak of platformfunctie
- vraagt waarschijnlijk om synchronisatie of backendlogica

### M. Backend & integratie
**Nieuwe positionering:**
- niet vóór shared-core zichtbaarheid en kleine adapters
- pas later relevant voor LTI, centrale analyse of gedeelde sessies

**Voorbeelden:**
- ELO-koppelingen
- centrale voortgangsanalyse
- gezamenlijke of gedeelde sessies

---

## Wetenschappelijke referenties

| Bron | Relevant inzicht | Gebruikt in |
|------|------------------|-------------|
| Chamalaun (2023) | Grammaticakennis essentieel voor homofone werkwoordsvormen | parsingdidactiek, werkwoordspelling, metacognitie |
| Chamalaun et al. (2022) | Expliciete link grammatica-spelling verlaagt fouten | platformrichting werkwoordspelling |
| 'Spelling en didactiek' (2024) | Kwalitatieve foutenanalyse, vaktermen als denkinstrument | foutenanalyse, tooltips |
| Steenbakkers | "Veel kennis van weinig", niveaus en computersturing | Rollenladder, parsingdidactiek |
| Cognitieve belastingtheorie / Sweller | dosering en split-attention | Quick Start, Rollenladder, touch/UX |
| Flavell (1979) | metacognitie en zelfregulatie | denkstap-prompts |
| Nassaji & Fotos (2011) | contrastieve analyse, focus-on-form | contrastparen |
| Ebbinghaus (1885) | spaced repetition | zwakke rollen vaker terug |
| SLO referentieniveaus | parsing als basis voor verdere taalvaardigheid | productscope en transfer |

---

## Aanbevolen eerstvolgende stap

### Direct lokaal productwerk
**Module-navigatie zichtbaar maken voor leerlingen**
- zichtbare keuze tussen `Ontleden` en `Zinnen bouwen`
- kleine UI-wijziging zonder architectuurgevolgen
- direct merkbare verbetering voor leerlingen

### Eerst vóór diepere platformuitbouw
**shared/grammar-core fysiek toevoegen en zichtbaar maken**
- nodig om de nieuwe wrapperhiërarchie ook echt operationeel te maken
- voorkomt dat latere alignment- of adaptertaken op niet-bestaande paden leunen

---

## Geordende implementatievolgorde

| Fase | Type werk | Items |
|------|-----------|-------|
| **Nu lokaal** | snelle productimpact | 0a Quick Start, 0b Tap-to-Place, 19 zichtbare module-navigatie |
| **Nu lokaal** | toegankelijkheid | 0c Keyboard, 0d Aria, 11 Responsief, 12 Onboarding |
| **Nu lokaal** | parsingdidactiek | 1 Rollenladder, 4 Tooltips, 2 Beslisboom, 5 Metacognitie |
| **Nu lokaal** | verdieping | 3 Foutenanalyse, 6 Contrastparen, 8 Oefenplan, 21 Spaced repetition |
| **Nu lokaal** | codekwaliteit | 0f Performance, 16 State, 17 Tests, 18 Validatiescript |
| **Eerst alignment** | shared-core zichtbaarheid | shared subtree toevoegen, wrappers en contractsync controleren |
| **Daarna adapters** | kleine shared-content stappen | expliciete zinnen-/metadata-adapters, kleine syncproeven |
| **Later** | bridge tasks / platformrichtingen | werkwoordspelling, foutentekst, peer-review, backend/integratie |

---

## Legacy-framing die niet meer leidend is

De volgende oude roadmap-aanname is niet meer leidend:
- werkwoordspelling, foutentekst en peer-review als vanzelfsprekende lokale modulevolgorde in deze repo

De inhoudelijke waarde van die richtingen blijft bestaan, maar hun **architectonische plaats** is nu later, voorwaardelijk en shared-core-afhankelijk.
