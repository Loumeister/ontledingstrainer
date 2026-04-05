# Parsingdidactiek — kaders voor grammar-core

## Status van dit document
Dit document legt de **canonieke parsingdidactiek** vast voor `grammar-core`.

Het beschrijft gedeelde didactische ontwerpprincipes voor:
- grammaticale analyse
- functiebepaling
- diagnostische feedback op ontleedfouten
- parsing als voorbereiding op latere werkwoordspelling
- gedeelde contentselectie voor parsinggerichte leerinhoud

Dit document canoniseert **didactische principes**. Het legt geen productspecifieke implementatie vast.

Daarom beschrijft dit document nadrukkelijk **niet**:
- lokale annotatievelden
- lokale JSON-shapes
- token-per-woord annotatie als platformnorm
- productspecifieke labelinventarissen
- renderer- of interactielogica
- lokale feedbackmatrixvormen

## Reikwijdte
Dit document beschrijft wat parsingdidactiek in de gedeelde kern moet bewaken.

Productspecifieke invulling blijft lokaal, bijvoorbeeld:
- welke termen of labels een product precies toont
- hoe een product interne analyses structureert
- welke visuele of interactieve stappen een product gebruikt
- hoe feedback technisch wordt opgeslagen of gepresenteerd

---

## Leidende didactische principes

### 1. Denkstappen vóór labeluitkomsten
Parsingonderwijs mag niet worden ingericht als een kale labeloefening.

De leerling moet niet alleen leren **welk label** ergens hoort, maar vooral:
- welke vraag of proef is uitgevoerd
- welke grammaticale functie daarmee is vastgesteld
- waarom naburige alternatieven niet kloppen

Operationele uitwerking:
- Een parsingtaak is didactisch sterker wanneer de onderliggende redeneerroute zichtbaar of herstelbaar is.
- Correcte uitkomst zonder relevante grammaticale denkstap is een zwakker leerdoel dan correcte uitkomst mét redeneerroute.

### 2. Eén hoofdvalkuil per zin
Een nieuwe zin mag niet tegelijk meerdere nieuwe didactische problemen introduceren als daardoor onduidelijk wordt wat precies geoefend wordt.

Operationele uitwerking:
- Elke nieuwe zin krijgt één centrale focus of hoofdvalkuil.
- Andere moeilijkheden mogen alleen aanwezig zijn als ze niet concurreren met de hoofdfocus.

Niet geschikt voor de gedeelde kern zijn bijvoorbeeld:
- zinnen die tegelijk een nieuw woordvolgordeprobleem, een nieuw gezegdeonderscheid en een nieuwe voorwerpverwarring als hoofddoel dragen
- zinnen waarbij de centrale denkstap niet duidelijk benoembaar is

### 3. Contrast vóór bulk
Parsinginhoud moet niet groeien door volume alleen.

Sterkere parsingdidactiek ontstaat wanneer leerlingen betekenisvolle contrasten oefenen, bijvoorbeeld:
- onderwerp versus lijdend voorwerp
- lijdend voorwerp versus meewerkend voorwerp
- vrije bepaling versus lexicaal gebonden aanvulling
- handeling versus toestand of eigenschap
- basisvolgorde versus verstorende woordvolgorde

Operationele uitwerking:
- Voeg liever een contrastrijk item toe dan meerdere quasi-gelijke voorbeelden.
- Bulk zonder nieuw denkwerk is didactisch zwak.

### 4. Natuurlijke Nederlandse zinnen met didactische scherpte
Parsinginhoud moet natuurlijk Nederlands blijven voor onderbouw VO, maar tegelijk didactisch scherp zijn.

Operationele uitwerking:
- Kies idiomatische, geloofwaardige zinnen.
- Laat rijke woordenschat toe als die idiomatisch en leeftijdsgeschikt blijft.
- Vermijd kunstmatig steriele zinnen als die de grammaticale focus niet verbeteren.
- Herschrijf niet alleen om neutraler te klinken; herschrijf alleen wanneer grammaticale eenduidigheid, didactische focus of geschiktheid aantoonbaar toeneemt.

### 5. Dubbelzinnige schoolanalyses afwijzen
Een parsingtaak is didactisch ongeschikt als twee schoolanalyses verdedigbaar blijven zonder expliciete keuze van analysemodel.

Operationele uitwerking:
- Voeg geen zin toe aan gedeelde parsinginhoud als de bedoelde schoolanalyse niet eenduidig herstelbaar is.
- Twijfelgevallen worden afgewezen of expliciet buiten de gedeelde kern gehouden.

Gedeelde parsinginhoud mag dus niet leunen op verborgen lokale conventies om eenduidig te lijken.

### 6. Diagnostische feedback richt zich op de denkfout
Parsingfeedback moet uitleggen waarom de gemaakte keuze niet klopt.

Minimaal bruikbare parsingfeedback maakt duidelijk:
- welk onderscheid gemist is
- welke vraag of proef behulpzaam was geweest
- welke denkstap nu hersteld moet worden

Operationele uitwerking:
- Feedback mag niet blijven steken in “fout label”.
- Feedback is sterker wanneer ze herstelbaar is vanuit een denkhandeling of functiebepaling.

### 7. Parsing als voorwaarde voor latere werkwoordspelling
Parsing is geen los eiland binnen het grammaticaonderwijs.

Voor veel werkwoordspellingsproblemen moet de leerling eerst grammaticaal bepalen:
- wat de persoonsvorm is
- wat het onderwerp is
- welke functie een werkwoordsvorm heeft
- of een vorm als persoonsvorm, infinitief of deelwoord gelezen moet worden

Operationele uitwerking:
- Parsinginhoud met duidelijke transferwaarde richting werkwoordspelling heeft prioriteit boven parsinginhoud zonder vervolgwaarde.

### 8. Scaffolding van herkenning naar zelfstandig redeneren
Parsingtaken mogen ondersteuning bieden, maar die steun mag niet het leerdoel vervangen.

Operationele uitwerking:
- Ondersteuning is didactisch passend wanneer zij de grammaticale denkstap tijdelijk ondersteunt en later kan worden afgebouwd.
- Taakvormen waarbij leerlingen structureel de juiste uitkomst kunnen raden zonder relevante redeneerstap zijn didactisch zwak.

---

## Ontwerpregels voor parsinggerichte content

### Regel 1. Voeg alleen nieuwe inhoud toe bij aantoonbare didactische winst
Een nieuwe zin of taak is pas sterk genoeg voor de gedeelde kern wanneer die minstens één van deze functies vervult:
- een nieuw parsingcontrast introduceren
- een bestaande misconceptie zuiverder zichtbaar maken
- dezelfde denkstap in een betekenisvol andere context plaatsen
- parsing expliciet verbinden met latere spelling- of transfertaken

### Regel 2. De centrale denkstap moet benoembaar zijn
Bij elk parsingitem moet inhoudelijk duidelijk zijn:
- welke hoofdvalkuil centraal staat
- welke vraag, proef of redenering daarbij hoort
- welk naburig foutpad waarschijnlijk is

### Regel 3. Uitkomst zonder relevante redenering is didactisch zwak
Als een leerling een item correct kan oplossen zonder functiebepaling of relevante grammaticale redenering, is het item te zwak voor de gedeelde kern.

### Regel 4. Lokale productstructuur is geen criterium voor canonieke kwaliteit
Een item is pas geschikt voor de gedeelde kern wanneer de didactische kwaliteit overeind blijft zonder beroep op één specifieke lokale productstructuur.

---

## Feedbackregels voor parsinggerichte producten en brugtaken

### Minimaal gedeeld feedbackmodel
Een parsinggerichte interventie of feedbackreactie moet inhoudelijk kunnen aangeven:
1. welk onderscheid of welke denkstap gemist is
2. welke herstelvraag of proef passend is
3. waarom een naburige verwarring begrijpelijk maar onjuist is

### Niet canoniek op dit niveau
Niet canoniek in `grammar-core` zijn:
- lokale sleutelstructuren voor feedbackmatrices
- lokale JSON-vormen voor feedbackopslag
- productspecifieke koppelingen tussen foutparen en UI-componenten
- productspecifieke technische veldnamen voor waarschuwingen of correctielogica

---

## Grens tussen gedeelde canon en lokale productinvulling

### Canoniek in `grammar-core`
- didactische principes voor parsinginhoud
- gedeelde kwaliteitscriteria voor parsingzinnen
- gedeelde feedbackprincipes op denkfouten
- de regel dat gedeelde canon geen productspecifieke structuur veronderstelt

### Lokaal in productrepo’s
- terminologie- en labelkeuzes
- inhouds- of annotatiemodellen
- renderer- en interactiepatronen
- lokale progressionlogica
- lokale feedbackdatastructuren

## Niet toegestaan
- productspecifieke annotatievelden hernoemen tot abstracte platformtermen en alsnog canoniseren
- lokale parserstructuren presenteren als gedeelde schema-eis
- bulkmatige parsingcontent toevoegen zonder nieuw denkwerk of nieuw contrast
- dubbelzinnige schoolanalyse opnemen in de gedeelde kern
- parsinginhoud ontwerpen alsof labeluitkomst belangrijker is dan grammaticale redeneerstap
