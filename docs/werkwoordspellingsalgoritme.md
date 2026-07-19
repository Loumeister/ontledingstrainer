# Werkwoordspellingsalgoritme

## Status en doel
Dit document legt de canonieke beslisvolgorde vast voor werkwoordspelling binnen `grammar-core`.

Doel:
- één gedeelde beslislaag voor Werkwoordlab en latere grammatica- of spellingsproducten
- shared canon voor **beslisstappen**, niet voor productspecifieke UI, itemtypes of evaluatorvormen
- drift voorkomen tussen didactiek, contentauthoring en lokale evaluatielogica

Lees dit document samen met:
- `docs/werkwoordspellingsdidactiek-kaders.md`
- `docs/grammar-platform-principles.md`
- `docs/content-authoring-rules.md`
- `docs/taxonomy-governance.md`

## Reikwijdte
Dit algoritme beschrijft de kern voor:
- persoonsvorm tegenwoordige tijd
- persoonsvorm verleden tijd
- infinitief
- voltooid deelwoord
- hulpwerkwoordkeuze bij perfectumconstructies
- scheidbaar/onscheidbaar gedrag voor werkwoordspelling

Niet in scope van dit document:
- productspecifieke feedbackteksten
- UI-flow of schermlogica
- productlokale datastructuren
- volledige lexicale uitzonderingslijsten per productrepo

## Niet-onderhandelbare volgorde
Werkwoordspelling volgt altijd deze hoofdlijn:

1. grammaticale functie bepalen
2. regelpad kiezen
3. lexicale of morfologische override controleren
4. spellingvorm afleiden
5. antwoord verantwoorden in zichtbare redenering

Deze volgorde concretiseert het shared principe **grammaticale functie vóór spellingkeuze**.

## Canonieke stap 1 - bepaal de grammaticale functie
Bepaal eerst of de doelvorm is:
- `persoonsvorm`
- `infinitief`
- `voltooid-deelwoord`
- `bijvoeglijk-deelwoord`
- `onvoltooid-deelwoord`

Zonder functiebepaling mag geen spellingbeslissing worden geforceerd.

## Canonieke stap 2 - kies het juiste regelpad
Na functiebepaling volgt precies één hoofdpad.

### Pad A - persoonsvorm tegenwoordige tijd
Gebruik dit pad alleen als de vorm een persoonsvorm in de tegenwoordige tijd is.

Beslisvolgorde:
1. leid de **orthografische stam** af
2. bepaal persoon en getal
3. pas TT-uitgang toe
4. controleer bekende uitzonderingen

Kernuitkomsten:
- `ik` -> stam
- `hij/zij/het` -> stam + `t`
- meervoud -> infinitief

Belangrijke uitzondering:
- als de orthografische stam al op `t` eindigt, komt er geen extra `t` bij

### Pad B - persoonsvorm verleden tijd
Gebruik dit pad alleen als de vorm een persoonsvorm in de verleden tijd is.

Beslisvolgorde:
1. leid zowel de **ruwe stam** als de **orthografische stam** af
2. bepaal op basis van de **ruwe stam** of het een `t`-werkwoord of `d`-werkwoord is
3. bepaal enkelvoud of meervoud
4. voeg `-te/-ten` of `-de/-den` toe aan de orthografische stam

Kernregel:
- de keuze tussen `t` en `d` gebeurt op basis van de **ruwe stam**, niet op basis van een later aangepaste eindletter

Dat voorkomt foutieve classificatie van werkwoorden als:
- `leven -> leefde`, niet `leefte`
- `lozen -> loosde`, niet `looste`

### Pad C - infinitief
Gebruik dit pad alleen als de doelvorm een infinitief is.

Beslisvolgorde:
1. controleer of de context een infinitief vereist
2. controleer of `te` verplicht, verboden of contextueel is
3. kies de infinitiefvorm
4. controleer of een voltooid deelwoord in hulpwerkwoordketen naar infinitief moet omslaan

### Pad D - voltooid deelwoord
Gebruik dit pad alleen als de doelvorm een voltooid deelwoord is.

Beslisvolgorde:
1. controleer of een lexicale onregelmatige vorm bestaat
2. controleer of het werkwoord scheidbaar of onscheidbaar is
3. bepaal of `ge-` verschijnt, wegvalt of door een prefix wordt vervangen
4. bepaal `-d` of `-t` op basis van de **ruwe stam**
5. voorkom dubbele slotletters `dd` en `tt`

Reguliere hoofdregel:
- `ge + orthografische stam + d/t`

Maar:
- geen `ge-` bij werkwoorden met de onscheidbare prefixen `be-, er-, ge-, her-, ont-, ver-`
- bij scheidbare werkwoorden: `prefix + ge + basisdeelwoord`
- bij onscheidbare werkwoorden: `prefix + stam + d/t`

Belangrijke randgevallen:
- een voltooid deelwoord eindigt nooit op dubbel `d` of dubbel `t`
- `her-` kent enkele lexicale uitzonderingen die alsnog `ge-` nemen

### Pad E - bijvoeglijk en onvoltooid deelwoord
Deze paden blijven functiepaden.

Bij `bijvoeglijk-deelwoord`:
- bepaal eerst dat de vorm niet werkwoordelijk gebruikt is
- pas daarna de juiste deelwoordspelling toe

Bij `onvoltooid-deelwoord`:
- herken de `-end`-vorm als functie, niet als klankvraag
- behandel dit domein niet als variant van persoonsvormspelling

## Canonieke stap 3 - controleer overrides
Voordat een generieke regel wordt toegepast, controleer in deze volgorde:

1. lexicale uitzondering
2. scheidbaar/onscheidbaar gedrag
3. sterk of onregelmatig patroon
4. reguliere spellingregel

Lokale productrepo's mogen die volgorde niet omdraaien.

## Canonieke stap 4 - stamafleiding
Voor werkwoordspelling zijn twee stamrepresentaties nodig.

### 1. Ruwe stam
De vorm direct na aftrek van de infinitiefuitgang, vóór orthografische normalisatie.

Voorbeelden:
- `leven -> lev`
- `lozen -> loz`
- `maken -> mak`

Gebruik:
- keuze `d/t`
- classificatie zwak/sterk waar relevant
- diagnostiek bij `v/z`-gevallen

### 2. Orthografische stam
De vorm die na spellingnormalisatie in de zichtbare vervoeging wordt gebruikt.

Normalisaties:
- lange klinker behouden
- dubbele medeklinker reduceren
- eind-`v` wordt `f`
- eind-`z` wordt `s`
- `-iën`-werkwoorden eindigen in de stam op `ie`

Voorbeelden:
- `leven -> leef`
- `lozen -> loos`
- `maken -> maak`
- `ruziën -> ruzie`

## Canonieke stap 5 - hulpwerkwoordkeuze
Hulpwerkwoordkeuze is geen primaire spellingstap, maar is wel onderdeel van de gedeelde grammaticale beslislaag.

Kernonderscheid:
- standaard: `hebben`
- `zijn` bij werkwoorden van beweging, verandering of linkverb-achtig gebruik
- sommige werkwoorden laten zowel `hebben` als `zijn` toe, afhankelijk van:
  - richting/verandering
  - transitief versus intransitief gebruik

Daarom geldt:
- hulpwerkwoordkeuze moet als aparte beslisstap modelleerbaar blijven
- lexicale overrides mogen de patroonregel overschrijven

## Canonieke stap 6 - hulpwerkwoordketens en infinitiefomslag
Als een voltooid deelwoord zelf als hulpwerkwoord moet functioneren, slaat het om naar een infinitief.

Voorbeelden van dit gedeelde principe:
- `heeft willen eten`
- `is komen lopen`
- `had moeten weten`

Productrepo's mogen dit niet reduceren tot een losse uitzonderingslijst; het is een structureel hulpwerkwoordprincipe.

## Minimale gedeelde fouttypologie
Dit document definieert nog geen volledige canonieke taxonomiecode-set, maar wel de minimale gedeelde foutfamilies:
- functiefout
- regelpadfout
- ruwe-stam/orthografische-stamverwarring
- prefixfout bij scheidbaar/onscheidbaar gedrag
- onregelmatige vorm fout behandeld als regelmatig
- hulpwerkwoordkeuze fout
- infinitiefomslagfout in hulpwerkwoordketen

Nieuwe shared codes mogen alleen via `grammar-core` worden gecanoniseerd volgens `docs/taxonomy-governance.md`.

## Wat productrepo's lokaal mogen doen
Productrepo's mogen:
- machineleesbare regelbestanden maken
- lokale evaluatorpaden bouwen
- lexicale lijsten aanvullen
- lokale content en feedback structureren

Maar zij mogen niet:
- deze beslisvolgorde tegenspreken
- een andere precedentievolgorde invoeren
- lokale uitzonderingen stilzwijgend tot shared canon verheffen

## Verwachte lokale vertaling
Werkwoordlab hoort deze canon lokaal te vertalen naar:
- regelbestanden in `content/reference/`
- repo-documentatie over evaluatorgebruik
- contentauthoring-instructies
- tests op randgevallen

De lokale vertaling mag gedetailleerder zijn dan dit document, maar niet strijdig ermee.
