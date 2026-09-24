# Bijzinontleding (werkdocument)

_Status: gebouwd, niet live. Alleen bereikbaar via `#/bijzinontleding`._

## Doel

Een leerling die een bijzin goed heeft gevonden, ontleedt die bijzin daarna als een eigen zin. De bijzin blijft in de hoofdzin gewoon als geheel benoemd worden (label `bijzin` plus functie, zoals LV of BWB). De ontleding van de bijzin komt daar optioneel bovenop.

## Didactische besluiten (docent, september 2026)

- **Optioneel:** de leerling zet "Bijzinnen ontleden" aan op het startscherm. Standaard staat het uit.
- **Openklappen:** de bijzin opent na **Controleer**, als de hele hoofdzin gelabeld is en de bijzin zelf klopt: goede grenzen, label "bijzin" en, als die gevraagd wordt, de goede functie. Fouten elders in de hoofdzin blokkeren niet. Een geopende bijzin blijft open tot de volgende zin.
- **Onderschikkend voegwoord:** wordt benoemd, als eigen zinsdeel `vw_onder` binnen de bijzin.
- **Betrekkelijk voornaamwoord:** wordt voorlopig niet gevraagd. Hetzelfde geldt voor andere betrekkelijke of vragende verbindingswoorden: *die, dat, waar, waardoor, waarom*. De leerling ziet ze in de opdracht, maar benoemt ze niet.
- **Betrekkelijke (bijvoeglijke) bijzin:** is moeilijker dan de andere bijzinnen. Ze wordt alleen op het hoogste niveau (4) als zodanig benoemd en ontleed. De functievraag geldt daarnaast alleen als bijvoeglijke bepalingen aanstaan.
  - Deze regel geldt voor **alle** zinnen, ook voor docentzinnen uit de zinseditor en uit `?zinnen=`.
  - Dat is een gedragswijziging. Vroeger vroeg de app de functie van een betrekkelijke bijzin bij elke docentzin, als bijvoeglijke bepalingen aanstonden. Nu gebeurt dat alleen nog bij een docentzin op niveau 4. Bij een lager niveau benoemt de leerling de bijzin wel, maar krijgt geen functievraag.
  - De zinseditor moet de docent hierop wijzen (zie `TODO.md`).
- **Wederkerend voornaamwoord:** hoort altijd bij het werkwoordelijk gezegde, of het wederkerend werkwoord nu verplicht is (*zich vergissen*) of niet (*zich scheren*). Dat geldt ook binnen een bijzin (zin 464: *zich versliep*). Een datatest bewaakt dit voor *zich*.

## Datamodel

Elk woord met `role: 'bijzin'` krijgt een `bijzinAnalyse`:

```json
{ "id": "s330t5", "text": "het", "role": "bijzin", "bijzinAnalyse": { "role": "ow" } }
```

| Veld | Betekenis |
|---|---|
| `role` | zinsdeel binnen de bijzin (`vw_onder`, `pv`, `ow`, `lv`, `mv`, `vv`, `bwb`, `wg`, `ng`) |
| `subRole`, `bijvBepTarget` | zoals bij een gewoon token (bijv. `nwd`/`wwd`, `bijv_bep`) |
| `newChunk` | nieuw zinsdeel bij twee opeenvolgende delen met dezelfde rol (zin 412: *altijd* \| *op het dak*) |
| `alternativeRole` | alleen voor bewust gemodelleerde dubbellezingen |
| `notAsked` | woord hoort bij de bijzin, maar de leerling benoemt het niet. `role` legt de functie toch vast, zodat het later aan kan. |

Regels, bewaakt door `src/data/sentenceData.test.ts`:

- Een bijzin is volledig of helemaal niet geannoteerd.
- Een geannoteerde bijzin heeft een PV.
- Een betrekkelijke bijzin staat op niveau 4.
- Bijzinnen in bijzinnen worden niet ondersteund.

## Code

| Onderdeel | Bestand |
|---|---|
| Bijzin afleiden als gewone `Sentence` | `src/logic/bijzinAnalysis.ts` → `buildBijzinSentence` |
| Openklapregel | `isBijzinUnlocked` (zelfde bestand) |
| Niveauregel betrekkelijke bijzin | `isBijzinAnalyseAsked` en `isBijzinFunctieAsked` in `src/logic/validation.ts` |
| Nakijken | de bestaande `validateAnswer`, dus dezelfde feedback als bij de hoofdzin |
| Scherm | `src/components/BijzinAnalysePanel.tsx`, geopend vanuit `TrainerScreen.tsx` |
| Verborgen route | `isBijzinOntledingRoute` in `src/logic/appRoute.ts` |

In het paneel knipt de leerling met knopjes tussen de woorden en kiest per deel een zinsdeel uit een keuzelijst. **Controleer bijzin** kijkt na. Na een foute poging kan de leerling kiezen voor **Toon antwoord bijzin**.

## Bewust nog niet gedaan

- De score van de bijzin telt niet mee in sessiescore, voortgang of rapportage. Alleen de interactielog registreert `bijzin_analyse_check` en `bijzin_analyse_show_answer`.
- WWD/NWD en bijvoeglijke bepalingen worden binnen de bijzin niet gevraagd, ook als die opties aanstaan.
- Hints (**Hint**-knop) kijken nog niet naar de bijzin.
- De zinseditor kan `bijzinAnalyse` nog niet invoeren of tonen. Zie `TODO.md`.

## Live zetten: checklist

1. Docent test alle 23 bijzinzinnen via `#/bijzinontleding`.
2. Besluit of de bijzinscore meetelt, en zo ja hoe.
3. Zinseditor aangepast (TODO).
4. Besluit of het paneel ook WWD/NWD en bijvoeglijke bepalingen binnen de bijzin moet nakijken als die opties aanstaan. Nu roept het paneel `validateAnswer` aan zonder woordlabels. Zo vraagt het binnen de bijzin ook nog geen WG/NG-keuze op de PV, zoals de hoofdzin sinds #155 wel doet.
5. Vinkje zonder route tonen: verwijder de `bijzinOntledingAvailable`-voorwaarde in `HomeScreen.tsx` en `App.tsx`.
