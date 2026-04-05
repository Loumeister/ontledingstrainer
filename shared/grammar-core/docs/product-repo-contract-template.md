# Product repo contract template

## Doel van dit document
Dit document is een **canonieke template** voor lokale productrepo-contracten.

Het doel van een lokaal productcontract is:
- gedeelde canon en lokale productrealiteit scherp uit elkaar houden
- voorkomen dat lokale datastructuren, termen of evaluatieregels stilzwijgend als platformwaarheid worden behandeld
- zichtbaar maken welke productkeuzes lokaal gelden en dus niet automatisch gedeeld zijn

Deze template canoniseert **de vorm en functie van een lokaal contract**, niet de inhoud van een specifiek product.

## Reikwijdte
Deze template moet bruikbaar zijn voor:
- `ontledingstrainer`
- `werkwoordlab`
- latere brugtaken of gecombineerde oefenvormen

Daarom beschrijft deze template geen parsingproduct als norm.

## Functie van een lokaal productcontract
Een lokaal productcontract maakt expliciet:
1. welke lokale termen, onderscheidingen of codes daadwerkelijk gelden
2. welk lokaal inhouds- of taakmodel gebruikt wordt
3. welke verschijnselen, taaktypen of evaluatievormen lokaal ondersteund worden
4. welke lokale ambiguïteiten of risico’s vermeden moeten worden
5. hoe gedeelde canon lokaal wordt vertaald, voor zover dat nodig is

## Relatie tot `grammar-core`
Een lokaal productcontract mag:
- gedeelde canon concretiseren voor één product
- lokale begrenzingen expliciet maken
- adapters of mappings documenteren

Een lokaal productcontract mag niet:
- lokale structuren presenteren als gedeeld canon
- `grammar-core` tegenspreken op didactisch of governance-niveau
- productspecifieke modelkeuzes verhullen als universele noodzaak

## Wat expliciet lokaal kan worden vastgelegd
Een lokaal productcontract kan, afhankelijk van het product, onder meer vastleggen:

### 1. Local terminology and distinctions
Welke termen, labels, foutcodes of taakonderscheiden lokaal echt bestaan.

Doel:
- geen lokale begrippen verzinnen
- gedeelde principes correct mappen op lokale terminologie

### 2. Local domain or task model
Welke inhouds-, analyse-, evaluatie- of taakstructuur lokaal gebruikt wordt.

Doel:
- voorkomen dat één productmodel onterecht als platformnorm wordt gelezen

### 3. Supported phenomena and task types
Welke grammaticale verschijnselen, oefenvormen of evaluatietypen lokaal daadwerkelijk ondersteund worden.

Doel:
- onderscheid maken tussen gedeelde ambitie en lokale ondersteuning

### 4. Feedback and evaluation hooks
Welke lokale feedbackhaakjes, evaluatiepunten of herstelmomenten lokaal bestaan.

Doel:
- gedeelde feedbackprincipes niet verwarren met lokale datastructuren of UI-koppelingen

### 5. Risks / ambiguities to avoid
Welke lokale ambiguïteiten, inhoudsrisico’s of modelgrenzen expliciet vermeden moeten worden.

Doel:
- inhoudelijke eenduidigheid bewaken
- verborgen lokale analysecompromissen zichtbaar maken

### 6. Local adapter notes
Alleen indien relevant: hoe gedeelde content, taxonomie of didactische canon lokaal wordt vertaald.

Doel:
- adapters expliciet houden
- verborgen mappinglogica voorkomen

## Wat expliciet lokaal moet blijven
De volgende soorten informatie horen in een lokaal productcontract en **niet** automatisch in `grammar-core` als gedeelde canon:
- lokale terminologie of labelinventaris
- lokale data- of taakstructuren
- lokale JSON-shapes
- lokale codesystemen
- lokale progressionlogica
- lokale renderer- of interactiepatronen
- lokale feedbackdatastructuren
- lokale niveaucodering of ID-logica

## Wat niet uit een lokaal contract mag worden afgeleid
Ook als een productcontract dit beschrijft, mag daaruit **niet** worden afgeleid dat het platformbreed canoniek is:
- een specifieke annotatievorm
- een specifieke taakstructuur
- een specifieke labelset
- een specifieke chunk- of segmentatielogica
- een specifieke progressionindeling
- een specifieke technische opslagvorm

## Gebruik in migratiewerk
Bij migratie van productrepo naar `grammar-core` geldt:
1. bepaal eerst of iets didactisch of governance-matig portable is
2. controleer daarna of het nog leunt op lokale contractinhoud
3. als dat zo is, blijft het lokaal of wordt het eerst geabstraheerd
4. alleen echt portable principes mogen naar `grammar-core`

## Template

Gebruik in een productrepo bij voorkeur dit format.

```md
# Repo contract (<productrepo>)

## Purpose
Beschrijf kort waarom dit lokale contract nodig is.

## Local terminology and distinctions
- lokale termen, labels, codes of taakonderscheiden die hier echt gelden
- geen gedeelde taxonomieclaims

## Local domain or task model
- lokale inhouds-, analyse-, evaluatie- of taakstructuur
- alleen beschrijven, niet canoniseren

## Supported phenomena and task types
- welke verschijnselen, oefenvormen of evaluatietypen lokaal ondersteund worden
- geen speculatieve toekomstwensen

## Feedback and evaluation hooks
- lokale feedbackhaakjes, foutbronnen of evaluatiepunten
- alleen wat hier echt geldt

## Risks / ambiguities to avoid
- bekende lokale ambiguïteiten
- gevallen die in deze repo afgewezen moeten worden

## Local adapter notes
- alleen indien relevant
- expliciete mapping vanaf shared canon naar lokale structuur
```

## Minimale kwaliteitsregels voor lokale contracten
Een lokaal productcontract is pas bruikbaar als het:
- feitelijk klopt met de huidige repo-inhoud
- compact genoeg is om echt gelezen te worden
- expliciet maakt wat lokaal geldt
- geen gedeelde canon simuleert
- aangepast wordt zodra lokale repo-structuren inhoudelijk veranderen

## Niet toegestaan
- een lokaal contract gebruiken als verborgen vervanging van shared canon
- gedeelde didactische principes overschrijven met lokale productgewoontes
- productspecifieke datastructuren verpakken als zogenaamd abstract platformmodel
