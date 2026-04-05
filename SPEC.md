# Specificatie: Ontleedlab als parsinggericht product

Dit document beschrijft **Ontleedlab / ontledingstrainer** als parsinggericht product binnen een bredere richting voor grammatica, werkwoordspelling en transfer.

Dit document maakt daarom expliciet onderscheid tussen:
- **Lokale productscope**: wat in Ontleedlab zelf hoort en nu of later lokaal productwerk kan zijn
- **Gedeelde platformrichting**: wat inhoudelijk waardevol is over meerdere producten heen, maar niet automatisch in deze repo hoeft te landen
- **Legacy-aanname**: oudere repo-gecentreerde architectuur waarin de volledige toekomstige grammatica- en spellingketen als lokale module-uitbouw van Ontleedlab werd voorgesteld

*Laatste herpositionering: april 2026, op basis van de huidige shared-core architectuurrichting en de lokale repo-realiteit.*

---

## 1. Positionering

### Lokale productscope
Ontleedlab is het parsinggerichte product. Deze repo is bedoeld voor:
- parsinggerichte leerlingflow
- lokale parsing-UI en interactie
- lokale annotatie- en evaluatieconventies
- lokale zins- en structuurconventies
- parsingdidactische verfijning binnen de huidige productvorm

### Gedeelde platformrichting
De bredere keten **grammaticale analyse → functiebepaling → regelkeuze → spellingtoepassing → revisie en schrijfttransfer** is inhoudelijk belangrijk, maar valt niet automatisch samen met de lokale runtime van Ontleedlab.

Die bredere richting hoort conceptueel bij:
- gedeelde didactische governance
- gedeelde contentgovernance
- gedeelde taxonomie en diagnoseprincipes
- gedeelde zinnen- en schemalagen
- expliciete samenwerking tussen productrepo’s en eventuele brugtaken

*Gedeelde bron van waarheid: `shared/grammar-core/docs/grammar-platform-principles.md`.*

### Niet de bedoeling van dit document
Dit document beschrijft Ontleedlab **niet** als de ene repo waarin de volledige toekomstige grammatica- en spellingomgeving vanzelf zal worden ondergebracht.

---

## 2. Visie

Ontleedlab helpt leerlingen in de onderbouw van havo/vwo om zinnen grammaticaal te analyseren en daarmee een stevige basis te leggen voor latere taalvaardigheid, waaronder werkwoordspelling en revisie.

De leidende didactische principes zijn:

1. **Grammatica als fundament**  
   Zinsontleding en functiebepaling zijn noodzakelijke voorkennis voor veel spellingbeslissingen, maar Ontleedlab is als product primair verantwoordelijk voor het parsingdeel van die keten.

2. **Denkstappen vóór labeluitkomsten**  
   Parsingonderwijs gaat niet alleen over het juiste label, maar over vraagvolgorde, diagnostische denkstappen, contrasten en herstelbaar redeneren.

3. **Scaffolding en cognitieve begrenzing**  
   Nieuwe complexiteit wordt gedoseerd aangeboden. Leerlingen hoeven niet vanaf het begin alle rollen, vragen en uitzonderingen tegelijk te verwerken.

4. **Modulaire leerlijn over producten heen**  
   Eén zin kan later bruikbaar zijn in meerdere instructiemodi, maar dat betekent niet dat al die modi in deze repo thuishoren.

5. **Transfer blijft inhoudelijk belangrijk**  
   Werkwoordspelling, foutentekst en revisie blijven relevante vervolgrichtingen, maar worden hier niet meer als vanzelfsprekende lokale module-uitbouw gepresenteerd.

*Gedeelde parsingdidactische principes: `shared/grammar-core/docs/parsing-didactics-kaders.md`.*

---

## 3. Doelgroep

| Doelgroep | Referentieniveau | Primaire focus |
|-----------|------------------|----------------|
| Onderbouw havo/vwo | 2F (streefniveau) | Parsing, functiebepaling, grammaticale basis |
| Bovenbouw / vervolg | 3F | Transfer naar foutloze toepassing en revisie |
| Verdieping | 4F | Reflectie op taalsysteem en nuance |

Ontleedlab richt zich als product primair op de parsingbasis voor de onderbouw. Verdere transfer naar 3F- of 4F-achtige taken is inhoudelijk relevant, maar niet automatisch lokale productscope.

---

## 4. Lokale productscope Ontleedlab

## 4.1 Huidige kern: parsingmodule

### Status
Werkend lokaal product met parsing als kern.

### Huidige parsingflow
De kernflow blijft lokaal parsingwerk:
1. **Zin opdelen in zinsdelen**
2. **Zinsdelen benoemen**
3. **Feedback ontvangen op structuur, rolkeuze en denkstappen**

Deze flow, inclusief de lokale interactievorm, parsinguitkomsten, evaluatielogica en annotatieconventies, behoort tot de productspecifieke scope van Ontleedlab.

### Huidige lokale productmogelijkheden
Ontleedlab bevat op dit moment lokaal onder meer:
- een parsingtrainer over meerdere moeilijkheidsniveaus
- ondersteuning voor kernrollen, gezegdes, bijzinnen en subrollen
- contextuele feedback en hints
- filters op niveau, gezegde en parsingfocus
- docentenfunctionaliteit voor zinnen, opdrachten en gebruiksdata
- leerling- en docentdashboards
- parsingverwante aanpalende schermen en lokale oefenvormen binnen dezelfde repo

Deze elementen horen bij de lokale productrealiteit. Ze maken Ontleedlab nog niet tot de volledige geïntegreerde grammatica- en spellingomgeving.

## 4.2 Parsinggerichte uitbreidingen binnen lokale scope

De volgende uitbreidingen blijven duidelijk **lokale productuitbreidingen** zolang ze gaan over Ontleedlab-specifieke UI, interactie, evaluatie of parsingdidactiek.

### A. Rollenladder
Een adaptief systeem dat parsingrollen stapsgewijs introduceert en de cognitieve belasting verlaagt.

**Didactisch doel**
- eerst kernonderscheidingen automatiseren
- daarna pas uitbreiden naar complexere rollen en relaties
- ondersteuning afbouwen na beheersing

**Lokale productscope**
Dit blijft lokaal omdat het direct raakt aan:
- toolbar-zichtbaarheid
- validatiegedrag per trede
- lokale feedbackvolgorde
- lokale parsingpresentatie

### B. Tap-to-place naast drag-and-drop
Een extra interactiemodus voor tablets en touchscreens.

**Didactisch doel**
- lagere instapdrempel op schoolapparaten
- minder motorische frictie tijdens parsing

**Lokale productscope**
Dit is productlokaal omdat het direct raakt aan UI, inputgedrag en scherminteractie.

### C. Contrastieve oefenparen
Na een fout korte voorbeeldparen tonen die een relevant parsingcontrast zichtbaar maken.

**Didactisch doel**
- contrast vóór bulk
- verwisselbare rollen scherper onderscheiden
- diagnostische feedback concreter maken

**Lokale productscope**
Dit blijft lokaal zolang contrastparen onderdeel zijn van Ontleedlab-feedback en Ontleedlab-presentatie.

### D. Metacognitieve denkstap-prompts
Korte prompts die de leerling herinneren aan de vraagmethode vóór controle.

**Didactisch doel**
- parsing als denkroute trainen
- vraagvolgorde expliciet houden
- scaffolding geleidelijk afbouwen

### E. Kwalitatieve foutenclassificatie
Fouten onderscheiden naar analysefout, toepassingsfout of ingesleten foutpatroon.

**Didactisch doel**
- gerichtere interventies
- betere terugkoppeling op het soort denkprobleem
- betere koppeling tussen fout en vervolghulp

**Opmerking**
Dit is didactisch sterk, maar de concrete detectie- en opslaglogica blijft lokaal zolang die op Ontleedlab-specifieke evaluatie en feedbackstructuur leunt.

### F. Parsinggerichte toegankelijkheid en gebruiksverbetering
Blijft lokaal zolang het gaat om:
- keyboardnavigatie
- aria-labels
- visuele focus
- quick start
- onboarding
- responsive parsing-UI
- performance en testdekking

## 4.3 Verwante lokale oefenvormen
Ontleedlab kan lokaal parsingverwante of zinsbouwverwante oefenvormen bevatten, zolang de parsingkern leidend blijft en zulke uitbreidingen niet worden voorgesteld als volledige platformintegratie.

Dat geldt ook voor reeds aanwezige of latere lokale schermen die de parsingdidactiek ondersteunen, zoals docentenhulpen, dashboards, editorlogica of zinsbouwverwante workflows.

---

## 5. Verwante of gedeelde platformrichtingen

De onderstaande richtingen blijven inhoudelijk waardevol, maar worden niet meer standaard voorgesteld als onvermijdelijke lokale module-uitbouw van Ontleedlab.

| Richting | Huidige status | Juiste positionering |
|----------|----------------|----------------------|
| Werkwoordspelling | Inhoudelijk belangrijk, niet lokaal uitgewerkt als canonieke Ontleedlab-scope | **Gedeelde platformrichting** of apart productdomein |
| Foutentekst / transfer | Waardevol voor transfer, nog niet lokaal bepaald als vaste scope | **Gedeelde platformrichting** of later lokaal experiment |
| Peer-review | Lange-termijnidee | **Optionele latere product- of platformrichting**, niet standaard lokale roadmap |

## 5.1 Werkwoordspelling
Werkwoordspelling blijft inhoudelijk nauw verbonden met parsing.

De relevante leerlijn is:
1. grammaticale analyse
2. functiebepaling
3. regelkeuze
4. spellingtoepassing
5. revisie en schrijfttransfer

Die keten blijft didactisch leidend, maar wordt architectonisch niet langer voorgesteld als één lokale moduleboom die vanzelf in Ontleedlab zal worden ingebouwd.

### Huidige herpositionering
Werkwoordspelling is in deze specificatie:
- een **verwante gedeelde platformrichting**
- mogelijk later een apart product- of brugdomein
- eventueel een **lokale verkenning**, maar niet de standaardaanname voor deze repo

*Aangrenzende spellingdidactiek (contextueel, niet bindend voor Ontleedlab): `shared/grammar-core/docs/werkwoordspellingsdidactiek-kaders.md`.*

### Wat Ontleedlab hier wél levert
Ontleedlab levert hiervoor vooral:
- parsingvoorkennis
- diagnostische inzichten over functiebepaling
- mogelijke zinnenbasis voor expliciete hergebruikscenario’s

### Wat deze specificatie niet meer aanneemt
Deze specificatie neemt niet meer aan dat werkwoordspelling automatisch de "volgende lokale module" in deze repo is.

## 5.2 Foutentekst en transfer
Foutentekst blijft een sterke didactische richting omdat die de kloof verkleint tussen geïsoleerd oefenen en revisie in context.

### Huidige herpositionering
Foutentekst is:
- inhoudelijk waardevol als **transfergerichte vervolgrichting**
- mogelijk onderdeel van een bredere gedeelde platformketen
- eventueel later een lokaal experiment, maar niet vanzelfsprekend lokale bouwplicht

## 5.3 Peer-review en andere brugtaken
Peer-review, samenwerkend controleren of andere brugtaken kunnen didactisch zinvol zijn, maar vallen buiten de huidige parsinggerichte productscope van Ontleedlab.

Zulke richtingen vragen vaak om:
- gedeelde sessies
- backend of synchronisatie
- andere samenwerkingslogica
- andere beoordelingsafspraken

Dat zijn geen aannames meer voor de lokale Ontleedlab-architectuur.

---

## 6. Lokale architectuur Ontleedlab

## 6.1 Huidige lokale runtime-architectuur
Ontleedlab is een browser-based product met lokale runtimeverantwoordelijkheid voor parsing, presentatie en productlogica.

De huidige repo bevat lokaal onder meer:
- `App.tsx` als shell en route-orkestratie
- hooks voor trainer- en productlogica
- screens voor trainer, score, editor, dashboards, login en aanpalende lokale modules
- componenten voor parsinginteractie en feedbackpresentatie
- sentence-data en lokale stores/services
- lokale validatie, constants, types en rapportagelogica

Deze laag beschrijft **lokale runtime-realiteit**. Zij is niet hetzelfde als de bredere gedeelde platformarchitectuur.

## 6.2 Lokale architectuurthema’s die hier wél thuishoren
Binnen Ontleedlab horen architectuurthema’s thuis zoals:
- state management
- testdekking
- toegankelijkheidsachterstanden
- touch- en keyboardinteractie
- lokale performance
- lokale data- en editorflows
- lokale scherm- en routecoherentie

## 6.3 Bredere architectuur buiten deze repo
De bredere architectuurrichting hoort conceptueel niet primair in deze repo thuis, maar in de gedeelde laag en in expliciete repo-integratie.

Daarin geldt het volgende onderscheid:

### Gedeelde laag
De gedeelde laag hoort conceptueel te definiëren:
- didactische governance
- contentgovernance
- gedeelde schema’s
- gedeelde zinnen- en contentlagen
- gedeelde taxonomie en diagnoseprincipes

*Gedeelde bronnen: `shared/grammar-core/docs/grammar-platform-principles.md` (platformgrenzen) en `shared/grammar-core/docs/taxonomy-governance.md` (taxonomie).*

### Productrepo’s
Productrepo’s, waaronder Ontleedlab, definiëren lokaal:
- product-specifieke UI
- interactiepatronen
- rendererkeuzes
- lokale productbeperkingen
- lokale annotatie- en evaluatieconventies

---

## 7. Legacy-aannames en herpositionering

De vorige versie van dit document bevatte waardevolle didactische ideeën, maar ook architectuuraannames die niet langer de voorkeursrichting beschrijven.

### Legacy-aanname 1
**Oude aanname:** Ontleedlab is de complete grammatica- en werkwoordspellingstrainer in wording.  
**Nieuwe positionering:** Ontleedlab is het parsinggerichte product binnen een bredere gedeelde richting.

### Legacy-aanname 2
**Oude aanname:** Werkwoordspelling, foutentekst en peer-review worden als volgende lokale modules in deze repo uitgebouwd.  
**Nieuwe positionering:** Dit zijn verwante platformrichtingen of optionele latere lokale experimenten, geen automatische lokale implementatieverplichting.

### Legacy-aanname 3
**Oude aanname:** Eén lokale doelstructuur in deze repo kan de toekomstige geïntegreerde grammatica- en spellingomgeving direct huisvesten.  
**Nieuwe positionering:** Lokale runtime-architectuur en gedeelde platformarchitectuur moeten expliciet uit elkaar worden gehouden.

### Legacy-aanname 4
**Oude aanname:** Hergebruik van zinnen over meerdere leermodi impliceert ook één lokale repo als primaire thuisbasis.  
**Nieuwe positionering:** Eén zin kan over meerdere producten of brugtaken heen bruikbaar zijn zonder dat één bestaand productrepo daarom alle modi runtime-technisch hoeft te bezitten.

---

## 8. Prioritering

## 8.1 Lokale productprioriteiten Ontleedlab
De eerstvolgende lokale prioriteiten blijven parsinggericht en productrealistisch:

1. **Quick start, keyboard, aria-labels en touchverbeteringen**
2. **Rollenladder en parsinggerichte scaffolding**
3. **Contrastparen, metacognitie en parsingfoutenanalyse**
4. **Performance, state-refactor en testuitbreiding**
5. **Verbeterde navigatie naar reeds aanwezige lokale parsingverwante modules**

## 8.2 Bredere platformtoekomst
De volgende richtingen zijn inhoudelijk relevant, maar niet automatisch lokale repo-commitments:

1. **Werkwoordspelling als vervolg in dezelfde leerlijn**
2. **Foutentekst en revisietaken als transfergerichte vervolgmodus**
3. **Peer-review en andere brugtaken**
4. **Expliciet gedeeld hergebruik van zinnen, taxonomie en diagnoseprincipes**

Waar zulke richtingen daadwerkelijk landen, is op dit moment niet volledig beslist en hoort niet impliciet door deze lokale specificatie te worden vastgelegd.

---

## 9. Samenvatting

Ontleedlab blijft in deze specificatie:
- een parsinggericht product
- de plek voor parsing-specifieke interactie, lokale leerflow en lokale productdidactiek
- een product dat later gedeelde content of gedeelde didactische kaders kan consumeren
- **niet** de vanzelfsprekende runtime-thuisbasis van het volledige toekomstige geïntegreerde grammatica- en spellingplatform

De parsingdidactische rijkdom blijft dus behouden, maar de repo-gecentreerde platformaanname is losgelaten.
