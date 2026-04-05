# Werkwoordspellingsdidactiek — kaders voor grammar-core

## Status van dit document
Dit document legt de evidence-informed didactische ontwerpregels vast voor de gedeelde grammatica- en werkwoordspellingskern.

Het doel is niet om losse onderwijsclaims te verzamelen, maar om een klein aantal goed verdedigbare principes expliciet te maken, zodat Claude en Codex:
- inhoudelijk consistenter werken
- geen willekeurige of traditionele routines reproduceren
- nieuwe units, feedback en taxonomie alleen toevoegen als daar didactische grond voor is

## Hoe dit document gebruikt moet worden
Bij inhoudelijke wijzigingen aan:
- units
- zinnenbank
- misconceptietaxonomie
- evaluatorlogica
- learner feedback
- transferopdrachten

moet dit document samen gelezen worden met:
- `docs/grammar-platform-principles.md`
- `docs/content-authoring-rules.md`
- `docs/taxonomy-governance.md`
- `docs/repo-sync-strategy.md`

## Leidende principes

### 1. Grammaticale functie vóór spellingkeuze
Werkwoordspelling mag nooit primair als letterkeuzeprobleem worden aangeboden.

De leerling moet eerst bepalen:
- is dit een persoonsvorm?
- is dit een infinitief?
- is dit een voltooid deelwoord?
- is dit een bijvoeglijk gebruikt voltooid deelwoord?

Pas daarna komt de vraag welke vorm of regel van toepassing is.

### 2. Expliciete instructie en zichtbare redenering
Werkwoordspelling is geen puur impliciete vaardigheid. Het systeem moet de redeneerstappen zichtbaar maken, zeker in vroege items.

### 3. Contrastdidactiek boven losse voorbeeldverzameling
Leerlingen leren sterker van betekenisvolle contrasten dan van veel losse, quasi-unieke voorbeeldzinnen.

Belangrijke contrasten zijn bijvoorbeeld:
- `word` / `wordt`
- `vind` / `vindt`
- `gebeurt` / `gebeurd`
- persoonsvorm versus infinitief
- persoonsvorm versus voltooid deelwoord
- werkwoordelijk versus bijvoeglijk gebruikt voltooid deelwoord

### 4. Diagnostische feedback op fouttype
Feedback moet gebaseerd zijn op een herkenbaar fouttype of misconceptie.

Minimaal onderscheid:
- functiefout
- regeltoepassingsfout
- vormspecifieke fout of uitzonderingsfout
- contextspecifieke fout, alleen als die didactisch aantoonbaar winst oplevert

### 5. Van expliciete steun naar afbouw en transfer
Het doel is niet alleen correcte itemoplossing, maar overdraagbare toepassing in context.

### 6. Variatie moet didactisch functioneel zijn
Variatie in zinnen is alleen zinvol als die iets toevoegt aan het denkwerk.

Functionele variatie is bijvoorbeeld:
- inversie
- onderwerp op afstand
- andere woordvolgorde
- andere grammaticale functie bij vergelijkbare klank
- scheidbare werkwoorden
- onregelmatige vormen

## Ontwerpregels voor units en zinnenbank
- Elke unit moet een beperkt aantal kernonderscheiden centraal zetten.
- Elke nieuwe zin moet aantoonbaar bijdragen aan nieuw fouttype, context, contrast of transfer.
- Nieuwe zinnen moeten natuurlijk Nederlands blijven voor onderbouw VO.
- Als een item zonder functiebepaling op te lossen is, is het didactisch zwak.

## Ontwerpregels voor misconceptietaxonomie
### Wanneer een nieuwe code wél gerechtvaardigd is
Voeg een nieuwe misconception-code alleen toe als:
1. de fout systematisch terugkomt
2. de fout een ander herstelpad vraagt dan bestaande codes
3. docentinzichten inhoudelijk beter worden door dit onderscheid

### Wanneer een nieuwe code níét gerechtvaardigd is
Voeg geen nieuwe code toe als:
- het alleen een cosmetische variant van een bestaande fout is
- het onderscheid geen andere feedback of instructie oplevert
- het verschil alleen op zinsoppervlak zit

## Evidence-based werkafspraak voor Claude en Codex
Agents mogen niet volstaan met: "dit lijkt logisch".

Ze moeten expliciet kunnen aangeven op welk ontwerpprincipe de keuze rust.

### Verplicht format bij didactische voorstellen
Noem altijd:
1. welk didactisch probleem wordt opgelost
2. welk onderscheid of fouttype wordt geoefend
3. welk principe uit dit document de keuze ondersteunt
4. welke test- of contentwijziging nodig is om dat te borgen

## Niet toegestaan
- claims als "evidence-based" zonder verwijzing naar een concreet principe uit dit document
- uitbreiding van content zonder aantoonbare didactische meerwaarde
- veel nieuwe items toevoegen zonder nieuwe contrastwerking
- taxonomie uitbreiden zonder beter herstelpad of betere docentinformatie
- open transfer zonder voldoende voorbereiding
