# Ontleedlab

Client-side oefenapp voor Nederlandse zinsontleding. Leerlingen knippen een volledige zin in zinsdelen en benoemen daarna alle toepasselijke functies. De app draait als statische Vite/React-site.

## Huidige productkern

- niveaus 0–4 met lokale JSON-zinnen
- werkwoordelijk en naamwoordelijk gezegde
- zinsdeelgrenzen, hoofdrollen, deelrollen en bijzinfuncties
- directe controle met een korte herstelvraag en een nieuwe poging
- lokale voortgang, sessierapporten en eigen zinnen
- verborgen experimentele Rollenladder via `#/rollenladder`
- verborgen Zinsdeellab via `#/zinnenlab`

De standaardflow vraagt altijd alle toepasselijke rollen tegelijk. Ladderactivatie wordt niet opgeslagen; alleen de experimentele trede en recente scores blijven lokaal bewaard.

## Ontwikkelen

```bash
npm ci
npm run dev
npm test
npm run build
```

`npm test` bevat de domeinregressies. `npm run build` voert TypeScript en de productie-build uit.

## Belangrijkste bestanden

| Pad | Verantwoordelijkheid |
|---|---|
| `src/App.tsx` | kleine hash-router en schermkeuze |
| `src/hooks/useTrainer.ts` | bestaande sessiestaat en orkestratie |
| `src/logic/validation.ts` | deterministische beoordeling |
| `src/constants.ts` | rollen, korte feedback en hints |
| `src/logic/rollenladder.ts` | alleen het verborgen ladderexperiment |
| `src/data/sentences-level-*.json` | ingebouwde zinnen en annotaties |
| `src/services/*` | lokale opslag en optionele externe rapportage |
| `SPEC.md` | productcontract |
| `TODO.md` | nog open werk |

## Verborgen routes

| Route | Functie |
|---|---|
| `#/rollenladder` | activeert het ladderexperiment voor deze route |
| `#/zinnenlab` | experimenteel Zinsdeellab |
| `#/login` | client-side toegangsscherm |
| `#/usage` | lokaal docentoverzicht |
| `#/editor` | lokale zinnen-editor |

## Gegevensgrens

Zonder geconfigureerde Apps Script-koppeling blijft informatie in de browser. Met die koppeling worden voornaam, initiaal, klas en een decodeerbaar sessierapport naar een Google Sheet gestuurd.

De huidige PIN-hashes en `VITE_API_KEY` worden in de publieke browserbundel opgenomen; de API-sleutel gaat bovendien mee in GET-URL's. Dit is toegangsbeperking voor laag-risicogebruik, geen beveiligde leerlingadministratie. Gebruik geen gevoelige of grootschalige leerlinggegevens totdat een echte server-side autorisatie- en privacygrens is gekozen.

## Gedeelde canon

`shared/grammar-core/` is een git subtree van `Loumeister/grammar-core`. Lokale runtimekeuzes blijven hier. Gedeelde didactiek verandert eerst upstream en wordt daarna via een aparte sync-PR opgehaald. Zie `AGENTS.md`.
