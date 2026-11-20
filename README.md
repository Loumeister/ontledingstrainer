# Ontleedlab

Client-side oefenapp voor Nederlandse zinsontleding. Leerlingen knippen een volledige zin in zinsdelen en benoemen daarna alle toepasselijke functies. De trainer werkt lokaal; één Cloudflare Worker serveert de Vite/React-site en de geautoriseerde API met private D1-opslag.

## Huidige productkern

- niveaus 0–4 met lokale JSON-zinnen
- werkwoordelijk en naamwoordelijk gezegde, verplicht als subrol op de persoonsvorm vanaf niveau 1
- zinsdeelgrenzen, hoofdrollen, deelrollen en bijzinfuncties
- directe controle met een korte herstelvraag en een nieuwe poging
- lokale voortgang, sessierapporten en eigen zinnen
- verborgen experimentele Rollenladder via `#/rollenladder`
- verborgen Zinsdeellab via `#/zinnenlab`

De standaardflow vraagt altijd alle toepasselijke rollen tegelijk, met één uitzondering: de persoonsvorm moet als eerste gelabeld worden en krijgt vanaf niveau 1 een verplichte WG/NG-subrol (gezegdetype) voordat gecontroleerd kan worden. Ladderactivatie wordt niet opgeslagen; alleen de experimentele trede en recente scores blijven lokaal bewaard.

## Ontwikkelen

```bash
npm ci
npm ci --prefix worker
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
| `src/services/*` | lokale oefenopslag en server-side geautoriseerde rapportage |
| `SPEC.md` | productcontract |
| `TODO.md` | nog open werk |

## Verborgen routes

| Route | Functie |
|---|---|
| `#/rollenladder` | activeert het ladderexperiment voor deze route |
| `#/zinnenlab` | experimenteel Zinsdeellab |
| `#/login` | Google-aanmelding voor expliciet toegestane accounts |
| `#/usage` | centrale docentomgeving met recordownership |
| `#/editor` | lokale zinnen-editor |

## Gegevensgrens

Zie [SECURITY.md](SECURITY.md) voor het servercontract en [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md) voor activering. Docenten en eigenaar gebruiken Google; leerlingen krijgen persoonlijke eenmalige codes voor een blijvend leerling-ID en ontvangen rapporten. Rollenlijsten blijven uitsluitend Worker Secrets. De oude Sheets-data blijft behouden als private historische bron.

Voor dagelijks gebruik: [logins en docentomgeving](docs/logins-en-docentomgeving.md). Voor directe infrastructuurtoegang: [databasebeheer](docs/database-toegang.md). Hosting gebruikt uitsluitend [Cloudflare Free](docs/cloudflare-free.md). De productieconfiguratie en live controles zijn nog niet voltooid.

## Gedeelde canon

`shared/grammar-core/` is een git subtree van `Loumeister/grammar-core`. Lokale runtimekeuzes blijven hier. Gedeelde didactiek verandert eerst upstream en wordt daarna via een aparte sync-PR opgehaald. Zie `AGENTS.md`.
