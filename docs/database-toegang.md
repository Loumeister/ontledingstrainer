# Zelf toegang krijgen tot de Ontleedlab-database

De koppeling is in de code ingebouwd: de Cloudflare Worker leest en schrijft
via de private D1-binding `DB`. De tabellen en migratie zijn aanwezig.
**De productiedatabase is door ons nog niet aangemaakt, gekoppeld of live
geverifieerd.** In `worker/wrangler.jsonc` staat nog
`CONFIGURE_D1_DATABASE_ID`; de accountlijsten zijn leeg. Volg eerst
[de deploymentstappen](../SECURITY_DEPLOYMENT.md).

## Twee verschillende toegangen

- Je **Google-account in Ontleedlab** krijgt de ownerrol via `OWNER_EMAILS`.
  Daarmee gebruik je het docentdashboard, alle leerlingrecords en de
  ownerfuncties. Dit geeft geen toegang tot de Cloudflare SQL-console.
- Je **Cloudflare-account** beheert de infrastructuur en database. Laat de
  productieomgeving in een account staan dat jij beheert, of laat jou als
  bevoegd accountlid toevoegen. Controleer dat je de juiste database kunt
  openen. We hebben jouw accounttoegang nog niet verleend of gecontroleerd.

Geef reguliere docenten hun Ontleedlab-login. Rechtstreekse databasebevoegdheid
is veel ruimer: de SQL-console past de docentfilter uit Ontleedlab niet toe.
Gebruik voor technisch meekijken beperkte leesrechten waar mogelijk; geef
schrijfrechten alleen aan degene die daadwerkelijk beheer uitvoert.

## Via de Cloudflare-website

1. Meld aan bij Cloudflare en kies het account van Ontleedlab.
2. Open **D1 SQL database**, kies database **ontleedlab** en open **Console**.
3. Plak een van onderstaande leesqueries en kies **Execute**.
   Onder **Tables** kun je de tabellen bekijken.

Dit is de [officiële D1-dashboardroute](https://developers.cloudflare.com/d1/get-started/).
Is de database afwezig, controleer dan account, toegangsrechten en deployment;
een Google-ownerlogin maakt geen Cloudflare-database aan.

Aantal geregistreerde leerlingen en ontvangen rapporten, zonder persoonsgegevens:

```sql
SELECT
  (SELECT COUNT(*) FROM students) AS leerlingen,
  (SELECT COUNT(*) FROM reports) AS rapporten;
```

Aantal rapporten per klas:

```sql
SELECT s.class_label AS klas,
       COUNT(DISTINCT s.id) AS leerlingen,
       COUNT(r.id) AS rapporten,
       MAX(r.received_at) AS laatste_ontvangst
FROM students s
LEFT JOIN reports r ON r.student_id = s.id
GROUP BY s.class_label
ORDER BY s.class_label;
```

Voor gerichte controle: maximaal 50 leerlingen met hun blijvende ID en
ontvangen werk. Dit resultaat bevat persoonsgegevens; houd het privé.

```sql
SELECT s.id, s.name, s.class_label,
       COUNT(r.id) AS rapporten,
       MAX(r.received_at) AS laatste_ontvangst
FROM students s
LEFT JOIN reports r ON r.student_id = s.id
GROUP BY s.id, s.name, s.class_label
ORDER BY s.class_label, s.name, s.id
LIMIT 50;
```

De telling gaat over ontvangen sessierapporten, niet over individuele
oefenpogingen of bewezen aanwezigheid. Een lege database kan dus correct
gekoppeld zijn terwijl nog geen leerling werk heeft ingestuurd.

## Via de terminal, optioneel

Voer dit vanuit de repository uit met de geïnstalleerde Worker-dependencies.
De eerste opdracht bekijkt uitsluitend de lokale ontwikkelkopie:

```powershell
node .\worker\node_modules\wrangler\bin\wrangler.js d1 execute ontleedlab --config .\worker\wrangler.jsonc --local --command "SELECT COUNT(*) AS rapporten FROM reports;"
```

Voor productie moet `worker/wrangler.production.json` vooraf met het echte
database-ID zijn gemaakt en gecontroleerd volgens de deploymentstappen.
Met geldige Cloudflare-toegang leest deze opdracht de externe database:

```powershell
node .\worker\node_modules\wrangler\bin\wrangler.js d1 execute ontleedlab --config .\worker\wrangler.production.json --remote --command "SELECT COUNT(*) AS rapporten FROM reports;"
```

`--local` en `--remote` kiezen verschillende databases; lokale testresultaten
bewijzen geen productiekoppeling. De opdrachten hierboven bevatten alleen
`SELECT`; Wrangler kan ook wijzigen, dus het hulpmiddel zelf is niet uitsluitend
voor lezen. Zie de [officiële Wrangler-opties](https://developers.cloudflare.com/workers/wrangler/commands/d1/).
Zet een Cloudflare-token nooit in een commando, document, frontend of commit.

## Welke tabellen zijn waarvoor?

| Tabel | Betekenis |
|---|---|
| `students` | Blijvend leerling-ID, naam, klas en eigenaarschap via Google-subject van de docent |
| `reports` | Ontvangen oefentelemetrie, gekoppeld aan het leerling-ID |
| `enrollment_codes` | Tijdelijke hashes van eenmalige leerlingcodes |
| `student_sessions` | Tijdelijke hashes van leerlingsessies |
| `sessions` | Tijdelijke docent-/ownersessies en bijbehorend account |
| `login_challenges` | Eenmalige loginchallenges |
| `rate_budgets` | Tijdelijke tellers voor het dagelijkse rapportbudget |

Voor gewone controle zijn `students` en `reports` voldoende. Toon of exporteer
authenticatietabellen niet voor klasoverzichten. Wijzig leerlinggegevens normaal
via Ontleedlab, zodat rechten en invoercontroles blijven gelden.

## Privé-backup

Na verificatie van account en productiedatabase kan een bevoegd beheerder
een SQL-export maken. Maak vooraf de map `security-reports` in de repository.
De map en bestanden met extensie `.sql.dump` zijn uitgesloten van Git.

```powershell
node .\worker\node_modules\wrangler\bin\wrangler.js d1 export ontleedlab --config .\worker\wrangler.production.json --remote --output .\security-reports\ontleedlab-backup.sql.dump
```

Dit maakt een volledige export, inclusief persoonsgegevens en tijdelijke
authenticatiegegevens. Bewaar hem beveiligd, met beperkte toegang en een
vastgelegde bewaartermijn; Git-ignore is geen toegangsbeveiliging. Cloudflare
beschrijft de [exportfunctie hier](https://developers.cloudflare.com/d1/best-practices/import-export-data/).
Een export is pas een bruikbare backup nadat herstel in een afzonderlijke
testomgeving is gecontroleerd.

Deze handleiding voert geen databasecommando's uit en verandert geen schema
of gegevens. Resets, migraties en imports horen bij een afzonderlijke,
gecontroleerde beheerhandeling.
