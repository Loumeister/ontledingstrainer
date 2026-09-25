# Werkwoordelijk en naamwoordelijk deel (werkdocument)

_Status: live als schakelaar "Werkwoordelijk en naamwoordelijk deel" onder "Moeilijke onderdelen", standaard uit._

## Wat de leerling doet

Met de optie aan geeft de leerling elk woord van een naamwoordelijk gezegde een woordlabel:

- **WWD:** alle werkwoorden, ook de PV.
- **NWD:** alle andere woorden.

WWD en NWD staan bij elke zin in de balk, zodat hun aanwezigheid niet verraadt of de zin een NG heeft.

## Didactisch besluit: één woordlabel per woord, BB gaat voor NWD

Een woord kan grammaticaal twee dingen tegelijk zijn. *goede* in "Hij is een goede vader" is een bijvoeglijke bepaling én hoort bij het naamwoordelijk deel. De app geeft elk woord maar één woordlabel. Als bijvoeglijke bepalingen aanstaan, verwacht de app op zo'n woord **BB**. Het woord hoort dan impliciet bij het naamwoordelijk deel.

Gevolg: een leerling die redeneert "alles wat geen werkwoord is, is NWD" krijgt op *goede* een fout. De feedback legt dat uit (`HINTS.GEZEGDE_DEEL_BIJV_BEP`). Hij vraagt of het woord één ander woord nader bepaalt en noemt de regel. De leerling krijgt dus geen vraag over werkwoorden. De Hint-knop volgt dezelfde regel.

Staan bijvoeglijke bepalingen uit, dan verwacht de app op *goede* gewoon NWD.

## Code

| Onderdeel | Plek |
|---|---|
| Welk woordlabel verwacht wordt | `getExpectedSubLabel` in `src/logic/validation.ts` |
| WWD of NWD, afgeleid van de hoofdrol | `getGezegdeDeel` in `src/logic/validation.ts` |
| Hint-knop | `findMissingGezegdeDeel` in `src/logic/validation.ts` |
