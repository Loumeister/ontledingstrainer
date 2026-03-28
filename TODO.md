# TODO & Roadmap

Dit document bevat de toekomstplannen en ideeën voor Ontleedlab, gebaseerd op recent didactisch onderzoek (o.a. Chamalaun 2023, Steenbakkers, SLO-leerlijnen, 'Spelling en didactiek' 2024) en een uitgebreide code-review (maart 2025).

> **Context:** Dit is een eenpersoonsproject met LLM/agent-ondersteuning. Alle voorstellen zijn haalbaar in die context: kleine, onafhankelijke taken die goed door AI-agents uitgevoerd kunnen worden.

---

## ✅ Voltooid (maart 2026) — Domeinarchitectuur & Versioning

Deze items zijn volledig geïmplementeerd op branch `claude/architect-domain-versioning-40tFO`.

### Domeinlaag (fundament)
- **Nieuwe types** in `src/types.ts`: `Student`, `TrainerAssignment`, `TrainerSubmission`, `TrainerAttempt`, `TrainerActivityEvent` / `TrainerEventType`, `TeacherNote`
- Naamgevingsconventie: `Trainer`-prefix (parallel aan `Lab`-prefix op de sentence-builder-lab branch, merge-conflict-vrij)

### Nieuwe services
- `studentStore.ts` — stabiele student-identiteit (`std-...` UUID), migratie vanuit `student_info_v1`
- `trainerAssignmentStore.ts` — versiebare opdrachten (`id + version + contentHash`), migratie vanuit `custom-sentences`; `bumpVersion()` bij inhoudelijke wijziging
- `trainerSubmissionStore.ts` — sessie-inzendingen + per-zin pogingen; max 500/2000 entries
- `trainerActivityLog.ts` — append-only event-log, parallel aan bestaande `interactionLog`
- `teacherNoteStore.ts` — docentnotities, logisch gescheiden van student-telemetrie

### Nieuwe logica
- `analyticsHelpers.ts` — pure functies: `computeTrainerStudentProgress`, `computeTrainerClassProgress`, `computeRoleErrorPatterns`, `computeAssignmentParticipation`, `buildTrainerSubmissionFromReport` (compat-adapter)

### Integratie in bestaande flow
- `useTrainer.ts` — minimale aanpassing: twee refs (`submissionIdRef`, `studentIdRef`); domain-aanroepen in `startSession`, `startSharedSession`, `nextSessionSentence` (wrapped in try/catch zodat domain-fouten de sessie niet blokkeren)
- `SentenceEditorScreen.tsx` — "Publiceer als opdracht" knop: `createAssignment` of `bumpVersion`; toont versie, inzendingen, waarschuwing bij ongesynchroniseerde wijzigingen
- `ScoreScreen.tsx` — link "Bekijk je voortgang →" naar `#/mijn-voortgang`
- `App.tsx` — routes `#/mijn-voortgang` en `#/docent-dashboard`

### Nieuwe schermen
- `StudentDashboardScreen.tsx` (`#/mijn-voortgang`) — sessiecount, beste/gem. score, rolfouten-staafdiagram, recente sessies
- `TeacherDashboardScreen.tsx` (`#/docent-dashboard`) — klasfilter, studententabel, rolfouten-heatmap, opdrachtstatus; PIN-beveiligd

### Tests
- 239/239 tests groen (was 93 voor deze branch)
- Bugfix: `computeContentHash` trunceerde btoa-output waardoor `[1,2,3]` en `[1,2,4]` dezelfde hash kregen

### Migratieprincipes (gelden tot nader order)
- Alle legacy localStorage-sleutels blijven beschrijfbaar — geen breuk voor bestaande leerlingen
- `interactionLog` en `trainerActivityLog` worden gelijktijdig geschreven
- `SessionReport` / Google Drive sync blijft volledig werken
- `custom-sentences` wordt niet verwijderd; `trainerAssignmentStore` leest er eenmalig vanuit

---

## Aanbevolen volgende stap (domein)

> Voer dit uit nadat de sentence-builder-lab branch gemerged is.

**Unificeer `Lab`- en `Trainer`-submissiemodellen** in één `activityStore` met een `domain: 'trainer' | 'lab'` discriminator. Dat stelt `analyticsHelpers` in staat om over beide oefentypen heen te aggregeren zonder twee aparte datastores te onderhouden. Aanpak:
1. Maak `src/services/activityStore.ts` met een unified `ActivityRecord<T>` type
2. Pas `trainerSubmissionStore` en `labSubmissionStore` aan als dunne wrappers
3. Pas `analyticsHelpers` aan zodat het `domain`-filter als parameter accepteert
4. Verwijder tijdelijke dubbeling in de dashboard-schermen

---

## Prioriteit 0: Directe Verbeteringen (Uit code-review)

Deze items komen voort uit een grondige review van de huidige codebase en zijn noodzakelijk om de basis solide te maken vóór verdere uitbreiding.

### 0a. "Snel Starten"-knop (Quick Start)
*Probleem: Het startscherm toont 20+ interactieve elementen. Leerlingen van 12-15 willen direct beginnen.*

De HomeScreen krijgt een prominente **"▶ Snel Starten"**-knop die met verstandige defaults (Niveau Basis, alle gezegdetypes, 5 zinnen) direct een sessie start. Geen configuratie nodig.

**Implementatie:**
*   Eén grote groene knop bovenaan HomeScreen, boven alle instellingen.
*   Defaults: `selectedLevel: 1`, `predicateMode: 'all'`, `customSessionCount: 5`, geen focusfilters.
*   Slaat `localStorage`-voorkeur op: als leerling eerder een niveau koos, gebruik dat.
*   De rest van het startscherm wordt een uitklapbaar paneel **"⚙ Geavanceerde instellingen"**.

### 0b. Tik-om-te-plaatsen (Tap-to-Place) als alternatief voor drag-and-drop
*Probleem: Drag-and-drop werkt slecht op tablets en touchscreens — precies de apparaten die in het voortgezet onderwijs worden gebruikt (Chromebooks, iPads).*

Een alternatieve interactiemodus naast drag-and-drop:
1.  Leerling **tikt** op een rolkaartje (WordChip) → kaartje wordt "geselecteerd" (glow-effect).
2.  Leerling **tikt** op het doelblok (DropZone) → label wordt geplaatst.
3.  Nogmaals tikken op een geplaatst label → label wordt verwijderd.

**Implementatie:**
*   Voeg `selectedRole: RoleKey | null` toe aan TrainerState.
*   WordChip krijgt `onClick` naast `onDragStart`: zet `selectedRole`.
*   DropZone krijgt `onClick`: als er een `selectedRole` actief is, plaats het label.
*   Visuele indicator: geselecteerd kaartje toont een pulserende rand (`animate-pulse ring-2`).
*   Bestaande drag-and-drop blijft volledig werken.

### 0c. Toetsenbordnavigatie (Keyboard Accessibility)
*Probleem: Kerninteracties (knippen, labels plaatsen) zijn niet bereikbaar met het toetsenbord. Vereist voor WCAG 2.1 Level A.*

**Implementatie:**
*   Schaartjes (split-toggles): voeg `tabIndex={0}`, `role="button"`, `onKeyDown` (Enter/Space) toe.
*   WordChips: maak focusbaar met `tabIndex={0}`, activeer met Enter.
*   DropZones: maak focusbaar, accepteer geactiveerde rol met Enter.
*   Zichtbare focus-ring: `focus-visible:ring-2 focus-visible:ring-blue-500` op alle interactieve elementen.
*   Skip-to-content link bovenaan de pagina.

### 0d. Aria-labels en Semantische Structuur
*Probleem: Iconknoppen (aA, Dy, 🌙, ?) hebben geen aria-labels; schermlezers kunnen ze niet benoemen.*

**Implementatie:**
*   Alle iconknoppen: `aria-label="Groot lettertype"`, `aria-label="Dyslexie-modus"`, etc.
*   ScoreRing: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
*   Modals: `role="dialog"`, `aria-modal="true"`, focus-trap bij openen.
*   Feedbackberichten: `role="alert"` of `aria-live="polite"` zodat schermlezers ze aankondigen.
*   Stappen-indicator: `aria-current="step"` op de actieve stap.

### 0e. Zinnen-database Uitbreiden (Niveau 1)
*Probleem: Niveau 1 bevat slechts 26 zinnen. Bij sessies van 10 zinnen raakt een leerling na 3 sessies door het materiaal. Herhaling zonder variatie leidt tot schijnbeheersing.*

**Implementatie:**
*   Voeg **20+ nieuwe Basis-zinnen** toe aan `data/sentences-level-1.json`.
*   Varieer in:
    *   Zinsvolgorde (SVO, inversie, vraagzinnen)
    *   Gezegdetype (WG en NG gemengd)
    *   Thema's die aansluiten bij de leefwereld van 12-15-jarigen (sport, social media, school, muziek)
*   Gebruik de sentence-data instruction file als leidraad voor formaat.

### 0f. Prestatieoptimalisatie useTrainer
*Probleem: useTrainer.ts bevat 23 losse `useState`-aanroepen zonder `useCallback` of `useMemo`. Elke render maakt 30+ handler-functies opnieuw aan, wat op tragere apparaten (schoolchromebooks) tot merkbare vertraging leidt bij drag-operaties.*

**Implementatie (stapsgewijs, elke stap is een zelfstandige PR):**
1.  **Stap 1:** Wrap alle event handlers in `useCallback` met correcte dependency arrays.
2.  **Stap 2:** Memoize `getFilteredSentences()` (40 regels, bij elke render opnieuw berekend) met `useMemo`.
3.  **Stap 3:** Groepeer gerelateerde state in objecten:
    *   `splitState: { splitIndices, chunkLabels, subLabels }` (6 → 2 useState)
    *   `sessionState: { queue, index, stats, results }` (4 → 1 useState)
    *   `uiState: { darkMode, largeFont, dyslexiaMode, showHelp }` (4 → 1 useState)
4.  **Stap 4:** Voeg `React.memo()` toe aan `WordChip`, `DropZone`, `SentenceResultCard` (pure components die nu onnodig re-renderen).

---

## Prioriteit 1: Didactische Versterking (Korte termijn)

Deze functies zijn het meest urgent op basis van wetenschappelijke inzichten en verhogen de leerkwaliteit direct.

### 1. Gefaseerde Modus — "Rollenladder"
*Bron: Steenbakkers, cognitieve belastingtheorie, scaffolding-principe*

De huidige app biedt alle 13 zinsdelen tegelijk aan. De theorie benadrukt dat leerlingen beter presteren wanneer ze eerst één concept volledig beheersen voordat het volgende wordt geïntroduceerd.

**Nieuw concept — de "Rollenladder":**
In plaats van 4 vaste fasen (PV → PV+OW → kern → alles) implementeren we een adaptieve ladder die zich aanpast aan het prestatieniveau:

*   **Trede 1 - PV herkennen:** Leerling hoeft alleen de persoonsvorm te identificeren. Zinsdeelproef wordt overgeslagen; alleen benoemen. Validatie accepteert "rest" als niet-PV.
*   **Trede 2 - PV + OW:** Twee rollen actief. De toolbar toont alleen PV en OW; andere rollen zijn verborgen.
*   **Trede 3 - Kern:** PV, OW, LV, MV, BWB. De vijf basisrollen.
*   **Trede 4 - Uitgebreid:** + VV, WG/NG. Werkwoordelijk en naamwoordelijk gezegde.
*   **Trede 5 - Volledig:** Alle 13 rollen (huidige werking).
*   Per trede een **80%-beheersingscriterium** over 10 opeenvolgende zinnen.
*   Automatische detectie: als leerling 3x op rij <60% scoort, suggereer één trede lager.

**Implementatie:**
*   Nieuwe state: `rollenladderTrede: number` in useTrainer.
*   Filter `ROLES` array op basis van trede → toon alleen relevante rollen in toolbar.
*   Validatie in `validation.ts`: tokens met een rol buiten de huidige trede worden genegeerd (of als "rest" gevalideerd).
*   Visuele ladder-indicator in de UI die voortgang toont.
*   Naast de Rollenladder blijft de huidige "vrije modus" beschikbaar voor gevorderde leerlingen en docenten.

### 2. Interactieve Beslisboom / Stappenplan — "Ontleedhulp"
*Bron: algoritmische werkwijze als controlemechanisme*

Een visueel, permanent beschikbaar hulpmiddel (uitklapbaar paneel, niet een modal) dat de leerling stap voor stap door de ontleding begeleidt.

**Vernieuwing t.o.v. oorspronkelijk plan:**
De beslisboom is niet statisch maar **interactief**: de leerling klikt de stap aan die hij uitvoert, en de boom markeert die stap als "gedaan". Dit traint metacognitie — bewust nadenken over je eigen denkproces.

**Stappen:**
1.  🔍 Zoek de persoonsvorm → *Tijdsproef: verander de zin van tijd. Welk woord verandert mee?*
2.  👤 Zoek het onderwerp → *Wie of wat + PV?*
3.  📝 Bepaal het gezegde → *Is het een koppelwerkwoord (zijn/worden/blijven)? → NG. Anders → WG.*
4.  🎯 Bepaal overige zinsdelen:
    *   LV: *Wie of wat + gezegde + OW?*
    *   MV: *Aan/voor wie + gezegde + OW + LV?*
    *   BWB: *Waar/wanneer/hoe/waarom?*
5.  🔗 Bijzinnen → *Staat er een onderschikkend voegwoord (dat, omdat, als, toen...)?*

**Implementatie:**
*   Nieuw component: `components/DecisionTree.tsx` — uitklapbaar paneel rechts of onderaan.
*   State per stap: `checked: boolean` (lokaal in component, reset per zin).
*   Optioneel: koppel aan huidige zinsdeel-selectie (als leerling PV heeft geplaatst → stap 1 auto-afvinken).

### 3. Kwalitatieve Foutenanalyse — Automatische Classificatie
*Bron: 'Spelling en didactiek' (2024), kwalitatieve foutenanalyse*

De huidige `mistakeStats` telt alleen *welk zinsdeel* fout is. De theorie onderscheidt drie fouttypen die elk een andere interventie vragen:

| Fouttype | Definitie | Voorbeeld | Automatische detectie |
|----------|-----------|-----------|----------------------|
| **Analysefout** | Grammaticale status verkeerd bepaald | PV niet herkend | Chunk bevat PV-tokens maar geen PV-label toegekend |
| **Toepassingsfout** | Regel bekend, verkeerd uitgevoerd | OW en LV verwisseld | Correct gesplitst, maar labels verwisseld (FEEDBACK_MATRIX swap) |
| **Inprentfout** | Verkeerd patroon ingeslepen | Steeds BWB i.p.v. VV | Dezelfde foutcombinatie >3x in sessiehistorie |

**Vernieuwing:** Voeg `errorType: 'analyse' | 'toepassing' | 'inprenting'` toe aan `SentenceUsageData` en classificeer automatisch:
*   **Analyse:** Splits incorrect OF de rol van de PV/OW niet herkend.
*   **Toepassing:** Splits correct, maar een verwisselingsfout (LV↔MV, BWB↔VV).
*   **Inprenting:** Dezelfde specifieke fout (bijv. BWB→VV) komt >3x voor over sessies heen.

**Implementatie:**
*   Uitbreid `SentenceResult` in `types.ts` met `errorClassifications: ErrorClassification[]`.
*   Detectielogica in `validation.ts` als post-processing stap na `validateAnswer()`.
*   ScoreScreen toont foutverdeling als een eenvoudig staafdiagram ("3 analysefouten, 1 toepassingsfout").
*   Koppel interventie-suggestie: "Je maakt vaak analysefouten bij de PV. Tip: gebruik de tijdsproef (verander de zin van tijd)."

### 4. Theorie-tooltips (Taalbeschouwing) — "ZinsdeelInfo"
*Bron: taalbeschouwelijke insteek, vaktermen als denkinstrument*

**Status: Deels geïmplementeerd** via `ZinsdeelHelpModal.tsx`. Verbetering:

*   Huidige modal toont per rol een definitie, vraagmethode en veelgemaakte fouten.
*   **Vernieuwing:** Maak dit een **inline tooltip** (hover/klik op het ?-icoontje naast elke WordChip in de toolbar), niet een aparte modal.
*   Voeg toe:
    *   **Minimale voorbeeldzin** per rol (bv. "*De hond* is het onderwerp in: De hond blaft.")
    *   **Verwanttip** (bv. "LV lijkt op OW. Verschil: het OW staat voor de PV, het LV staat erachter.")
    *   **Link naar Rollenladder:** "Wil je dit oefenen? Start een sessie op trede 3."

### 5. Metacognitieve Denkstap-prompt ("Heb je de proef gedaan?")
*Bron: metacognitieve strategieën, zelfregulatie bij grammaticaonderwijs (Chamalaun 2023)*

**Nieuw voorstel.** Voordat de leerling op "Controleren" klikt, toont de app een korte metacognitieve check:

> "🤔 Heb je de tijdsproef gebruikt voor de PV? Heb je 'wie of wat + gezegde' gevraagd voor het OW?"

Dit is een **eenmalige, wegklikbare prompt** (niet blokkerend) die de leerling herinnert aan de ontleedmethode. De prompt past zich aan de actieve rollen aan:
*   Bij trede 1-2: alleen PV-gerelateerde check.
*   Bij trede 3+: PV + OW + LV-checks.
*   Na 10 succesvolle zinnen wordt de prompt minder frequent (fading scaffolding).

**Implementatie:**
*   Nieuw component: `components/MetacognitivePrompt.tsx`.
*   Trigger: `handleCheck()` toont prompt als `metacognitivePromptEnabled && !hasSeenPromptThisSession`.
*   Frequentie afbouwend: `promptFrequency` gebaseerd op streak-lengte in `localStorage`.
*   Configureerbaar: docent kan dit uitzetten via HomeScreen-instellingen.

### 6. Contrastieve Oefenparen ("Vergelijk twee zinnen")
*Bron: contrastieve analyse, focus-on-form didactiek*

**Nieuw voorstel.** Na een fout toont de app twee zinnen naast elkaar: één die het verwarrende concept illustreert, en één die het contrast toont.

Voorbeeld bij LV/MV-verwisseling:
> **Zin A:** "Jan geeft *Maria* een boek." → MV (aan wie?)
> **Zin B:** "Jan leest *het boek*." → LV (wie of wat + GZ + OW?)
> "Zie je het verschil? Bij een MV kun je 'aan wie' of 'voor wie' vragen."

**Implementatie:**
*   Voeg `contrastPairs: Record<string, { zinA: string, zinB: string, uitleg: string }>` toe aan `constants.ts`.
*   Trigger: na een fout in `validateAnswer()`, als de foutcombinatie een bekende verwarringspaar is.
*   UI: een uitklapbaar paneel onder de feedback ("📖 Vergelijk twee zinnen").
*   Eerste versie: 5-8 veelvoorkomende verwarringsparen (PV↔WG, LV↔MV, LV↔OW, BWB↔VV, OW↔LV).

---

## Prioriteit 2: Gamification & Motivatie (Korte termijn)

### 7. Confetti & Visuele Beloning ✅ (Deels geïmplementeerd)
*   **Confetti-effect** bij foutloze zin of sessie. → ✅ Aanwezig via `canvas-confetti`.
*   **Streak-systeem:** Dagen achter elkaar geoefend. → ✅ Basis aanwezig in ScoreScreen.
*   **Badges:** "PV Meester" (10x PV goed), "Ontleedkampioen" (sessie 100%), etc. → ✅ Basis aanwezig.

**Verbetering:**
*   Voeg **"mini-confetti"** toe per individuele correcte zin (niet alleen bij sessie-einde).
*   Bewaar badges permanent in `localStorage` en toon ze op het startscherm als motivatie.
*   Voeg badge-progress indicators toe ("Nog 3 zinnen tot PV Meester!").

### 8. "Kijk terug"-functie (Reflectie) — Uitgebreid met Foutenrapport
*Bron: revisiefase, spellingbewustzijn*

**Status: Deels geïmplementeerd** via SentenceResultCard op ScoreScreen.

**Vernieuwing:** Voeg een **"Oefenplan"**-knop toe aan ScoreScreen:
*   Genereert automatisch een mini-sessie van 5 zinnen die specifiek de rollen bevatten waar de leerling fouten maakte.
*   Linkt terug naar de Rollenladder als het foutpatroon wijst op een te hoge trede.
*   Optioneel: exporteer het foutenrapport als tekst (voor de docent) of deel het via rapportcode.

---

## Prioriteit 3: UX & Toegankelijkheid (Korte termijn)

### 9. Dyslexie-modus ✅ (Geïmplementeerd)
Een schakelaar voor een dyslexie-vriendelijk font met extra spatiëring. → ✅ Aanwezig als "Dy"-knop.

**Verbetering:**
*   Voeg `letter-spacing: 0.05em` en `line-height: 1.8` toe in dyslexie-modus.
*   Test met de doelgroep of OpenDyslexic werkelijk helpt of dat een schreefloos font met extra spatiëring beter leest.

### 10. Dark Mode ✅ (Geïmplementeerd)
Dark mode is volledig geïmplementeerd via class-toggle. → ✅ Compleet.

**Verbetering:**
*   Voeg `prefers-reduced-motion` media query toe: schakel confetti en animaties uit voor leerlingen met bewegingsgevoeligheid.
*   Controleer WCAG AA-contrast voor alle dark mode kleurcombinaties (met name lichtgrijze tekst op donkergrijze achtergrond).

### 11. Responsief Ontwerp voor Tablets
*Probleem: Nederlandse scholen gebruiken massaal Chromebooks en iPads. De huidige 3-kolom layout op het startscherm veroorzaakt horizontal scrolling op tablet-portrait.*

**Implementatie:**
*   HomeScreen: 1 kolom op mobiel, 2 op tablet, 3 op desktop.
*   TrainerScreen: toolbar onder de zin op smalle schermen (i.p.v. ernaast).
*   Touch targets minimaal 44x44px (WCAG 2.5.5).

### 12. Rondleiding voor Eerste Gebruik ("Onboarding Tour")
*Probleem: Er is geen begeleiding voor nieuwe leerlingen. Ze landen op een scherm met 20+ opties.*

**Implementatie:**
*   Bij eerste bezoek (check `localStorage` flag `hasSeenTour`): toon een 3-staps overlay:
    1.  "Welkom! Klik op '▶ Snel Starten' om direct te beginnen."
    2.  "Knip de zin in stukjes door op de schaartjes ✂️ te klikken."
    3.  "Sleep de gekleurde kaartjes naar het juiste zinsdeel."
*   Simpele tooltip-pijlen die naar het relevante UI-element wijzen.
*   "Sla over"-knop altijd beschikbaar.
*   Implementeerbaar als lichtgewicht overlay-component (geen externe tour-library nodig).

---

## Prioriteit 4: Nieuwe Modules (Middellange termijn)

### 13. Werkwoordspelling-module
*Bron: integrale benadering grammatica-spelling, Chamalaun (2023)*

Een aparte module die voortbouwt op de grammaticakennis uit Ontleedlab. De zinsontleding is de **voorwaarde** voor correcte werkwoordspelling.

**Submodules (modulair, niet lineair):**
*   **PV in tegenwoordige tijd:** stam + t-regel, met analogie-hulp ("denk aan lopen")
*   **Homofoon-training:** wordt/word, vind/vindt met visuele waarschuwingen
*   **Verleden tijd:** zwakke werkwoorden met 't kofschip
*   **Voltooid deelwoord:** ge- + stam + d/t
*   **Alles samen:** integrale oefening

**Didactische principes:**
*   Expliciete Directe Instructie (EDI): worked examples bij nieuwe concepten
*   Homofoondominantie tegengaan: extra herhaling van de minder-frequente vorm
*   Adaptieve herhaling: foutieve items komen terug
*   100%-beheersingscriterium per submodule

Zie `SPEC.md` voor volledige technische specificatie.

### 14. Foutentekst-modus (Transfer naar schrijven)
*Bron: transfer naar schrijfvaardigheid, revisiefase*

Een module waarin leerlingen een tekst krijgen met grammaticafouten en deze moeten markeren/corrigeren. Dit traint het spellingbewustzijn in de context van schrijven, niet als geïsoleerde invuloefening.

### 15. Peer-review Modus
*Bron: peer-response als werkvorm*

Leerlingen controleren elkaars ontledingen. Doordat ze zich niet hoeven te concentreren op de inhoud (die staat er al), kunnen ze al hun cognitieve capaciteit inzetten voor de grammaticale analyse.

---

## Prioriteit 5: Architectuur & Codekwaliteit

### 16. State Management Vereenvoudigen
Het huidige `useTrainer.ts` (825 regels, 23 `useState`-aanroepen) is het hart van de applicatie maar wordt onbeheersbaar.

**Gefaseerde aanpak:**
1.  **Fase A — useCallback/useMemo:** Wrap alle 30+ handlers in `useCallback`. Memoize `getFilteredSentences`. (~2 uur met LLM-agent)
2.  **Fase B — State groeperen:** Combineer gerelateerde state in objecten (split/label/bijzin → 1 state, session → 1 state, ui → 1 state). (~3 uur)
3.  **Fase C — useReducer overweging:** Als Fase B niet voldoende stabiliteit biedt, migreer naar `useReducer` met expliciete actions. Dit maakt state-transities testbaar en voorkomt inconsistente state.

### 17. Testdekking Uitbreiden
Huidige dekking: `validation.ts` 100%, `usageData.ts/interactionLog.ts/sessionReport.ts` goed. Maar: **0% testdekking op useTrainer.ts, alle screens en alle components**.

**Aanpak per LLM-taak:**
*   **Taak 1:** Unit tests voor `getFilteredSentences()` — isoleerbare pure functie.
*   **Taak 2:** Unit tests voor `handleCheck()` — complexe logica met meerdere state-updates.
*   **Taak 3:** Unit tests voor session flow (start → split → label → check → score → next).
*   **Taak 4:** Snapshot tests voor `constants.ts` data-integriteit (alle rollen, feedback matrix completeness).
*   Streef naar **60% dekking** als realistisch doel voor een eenmansteam.

### 18. Zinnen-validatiescript
Een automatisch script dat alle `sentences-level-*.json` bestanden valideert op:
*   Unieke ID's (geen duplicaten over bestanden heen)
*   Geldige role keys
*   Correct token ID-formaat (`s{id}w{index}`)
*   `newChunk`-consistentie (niet op eerste token van een zin)
*   Minimaal 1 PV-token per zin

**Implementatie:** Vitest test file `sentenceData.test.ts` die alle JSON-bestanden importeert en valideert.

### 19. Module-router (Voorbereiding op Prioriteit 4)
Een eenvoudige hash-based module-router om te kiezen tussen:
*   `#/` → Zinsontleding (huidige app)
*   `#/werkwoordspelling` → Werkwoordspelling (nieuwe module)
*   `#/foutentekst` → Foutentekst (nieuwe module)

**Implementatie:** Uitbreiding van bestaand hash-routing in `App.tsx`. Geen externe router-library nodig.

### 20. Samengestelde Zinnen (Complexe Zinnen)
De datastructuur evolueert van `Sentence -> Tokens[]` naar `Sentence -> Clause[] -> Tokens[]`.

```typescript
interface Clause {
  id: string;
  type: 'hoofdzin' | 'bijzin';
  tokens: Token[];
}

interface ComplexSentence extends Sentence {
  clauses: Clause[];
  conjunctions: Token[];
}
```

**UI Wijzigingen:**
1.  **Stap 0 (Nieuw)**: Zin splitsen in deelzinnen.
2.  **Stap 1 & 2**: Zinsdeelproef en benoemen per clause.

### 21. Spaced Repetition voor Zwakke Rollen
*Bron: Ebbinghaus vergeetcurve, adaptief leren*

**Nieuw voorstel.** In plaats van willekeurige zinsselectie: een eenvoudig spaced-repetition algoritme dat zinnen prioriteert op basis van de rollen waar de leerling moeite mee heeft.

**Implementatie:**
*   Per rol een `confidence` score bijhouden in `usageData` (0.0–1.0), gebaseerd op recente prestaties.
*   Bij sessie-start: sorteer beschikbare zinnen op de aanwezigheid van rollen met lage confidence.
*   Zinnen met rollen waar de leerling >80% op scoort worden minder vaak aangeboden.
*   Zinnen met rollen <50% worden vaker aangeboden.
*   Geen extern algoritme nodig — een gewogen random selectie op basis van de confidence-scores volstaat.

---

## Prioriteit 6: Lange Termijn

### 22. Backend & Integratie
*   Koppeling met ELO's (Magister/SOM) via LTI.
*   Centrale database voor voortgangsanalyse door docenten.
*   Datamonitoring: docent ziet direct struikelblokken per leerling.

### 23. Leerling-profiel Dashboard
*Nieuw voorstel.* Een visueel dashboard (bereikbaar via ScoreScreen) dat de voortgang over tijd toont:
*   Radardiagram met beheersing per rol (13 assen).
*   Trendlijn van sessie-scores.
*   Aanbeveling: "Je bent klaar voor trede 4!" of "Oefen nog 5 zinnen met LV."
*   Data uit bestaande `sessionHistory` en `usageData` in `localStorage`.

---

## Wetenschappelijke Referenties

| Bron | Relevant inzicht | Gebruikt in |
|------|-----------------|-------------|
| Chamalaun (2023) | Grammaticakennis essentieel voor homofone werkwoordsvormen | §1, §5, §13 |
| Chamalaun et al. (2022) | Expliciete link grammatica-spelling = minder fouten | §13 |
| 'Spelling en didactiek' (2024) | Kwalitatieve foutenanalyse, vaktermen als denkinstrument | §3, §4 |
| Steenbakkers - Diploma werkwoordspelling | "Veel kennis van weinig", computersturing, niveaus | §1, §13 |
| De Staat van het Onderwijs 2025 | 20% scholen onvoldoende, didactisch handelen tekortschiet | Motivatie project |
| SLO referentieniveaus | 2F = einde onderbouw vo, volledige werkwoordspelling | SPEC.md |
| Cognitieve belastingtheorie | Werkgeheugen overbelast bij schrijven → automatisering nodig | §0a, §1, §5 |
| Methode Blink | Spiekbriefje als hulpmiddel, functioneel inzetten van kennis | §2 |
| Ebbinghaus (1885) | Vergeetcurve, spaced repetition | §21 |
| Sweller (2011) | Cognitive Load Theory, split-attention effect | §0b, §1 |
| Flavell (1979) | Metacognitie en zelfregulatie bij leren | §5 |
| Nassaji & Fotos (2011) | Focus-on-form, contrastieve analyse in taaldidactiek | §6 |

---

## Implementatievolgorde (Aanbevolen voor 1-persoonsteam + LLM)

| Sprint | Items | Geschatte effort | LLM-geschikt? |
|--------|-------|-----------------|----------------|
| **Sprint 1** | 0a (Quick Start), 0c (Keyboard), 0d (Aria) | 1 dag | ✅ Ja, zelfstandige taken |
| **Sprint 2** | 0b (Tap-to-Place), 0e (Meer zinnen), 18 (Validatiescript) | 1-2 dagen | ✅ Ja |
| **Sprint 3** | 1 (Rollenladder), 4 (Tooltips verbeteren) | 2-3 dagen | ⚠️ Deels, didactisch ontwerp is mensenwerk |
| **Sprint 4** | 2 (Beslisboom), 5 (Metacognitieve prompt) | 1-2 dagen | ✅ Ja |
| **Sprint 5** | 3 (Foutenanalyse), 6 (Contrastparen), 8 (Oefenplan) | 2-3 dagen | ✅ Ja |
| **Sprint 6** | 0f (Performance), 16 (State refactor), 17 (Tests) | 2-3 dagen | ✅ Ja, ideaal voor LLM |
| **Sprint 7** | 12 (Onboarding), 11 (Responsive), 7 (Badges) | 1-2 dagen | ✅ Ja |
| **Sprint 8+** | 13-15 (Nieuwe modules), 19-23 (Architectuur) | Doorlopend | ⚠️ Deels |
