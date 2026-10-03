# Resterende externe deploymenthandelingen

1. Maak een Cloudflare-account/project voor `ontleedlab.nl` gereed. Maak een
   private D1-database `ontleedlab` met `wrangler d1 create ontleedlab --jurisdiction eu`.
   Noteer het database-ID. Gebruik een aparte lege database voor development.
   Regel toegang, schoolafspraken, bewaartermijn, backup/export en gecontroleerde
   gegevensverwijdering. Verifieer een backupherstel voordat leerlingwerk live gaat.
   Zorg dat de eigenaar zelf toegang houdt tot het Cloudflare-account en D1;
   de Google-ownerrol in Ontleedlab verleent die technische toegang niet.
   Zie [database-toegang.md](docs/database-toegang.md).

2. Maak bij Google een OAuth web client voor Google Identity Services met de
   exacte productie-origin als Authorized JavaScript Origin. Configureer consent/
   organisatie en de toegestane accounts. Deze loginflow gebruikt uitsluitend de
   publieke client-ID; plaats geen clientsecret in frontend, build of browseropslag.
   Maak eventuele development-origin afzonderlijk bekend bij Google.

3. Configureer GitHub environment `production`: variable `CLOUDFLARE_ACCOUNT_ID`,
   `CLOUDFLARE_D1_DATABASE_ID`, `APP_ORIGIN` (exact HTTPS-origin zonder slash),
   `GOOGLE_CLIENT_ID`. Voeg `OWNER_EMAILS`, `TEACHER_EMAILS` en `EDITOR_EMAILS`
   als **environment secrets** toe, niet als variables.
   Rollenlijsten bevatten exacte, komma-gescheiden Gmail/Workspace-accounts;
   laat ongebruikte rollen leeg. Geef owneraccounts MFA. Voeg
   `CLOUDFLARE_API_TOKEN` als extra deploysecret toe met beperkte Worker/D1/DNS-rechten
   voor dit account. Gebruik environment protection en verplichte security-CI
   voor changes naar de productiebranch.
   Neem het Google-account van de eigenaar expliciet op in `OWNER_EMAILS`.
   Dagelijks aanmelden en codes uitdelen staan in
   [logins-en-docentomgeving.md](docs/logins-en-docentomgeving.md).
   Deze repository en de Actions-logs zijn openbaar. Het configuratiescript schrijft
   accountlijsten uitsluitend naar een tijdelijk, genegeerd secretsbestand.
   Wrangler uploadt dat als Worker Secrets samen met de versie; de workflow
   verwijdert het bestand daarna. Zet geen accountlijsten in `wrangler.jsonc`,
   documentatie, screenshots of publieke artifacts.
   Kies **Workers Free** en houd dat plan actief; activeer geen Paid-upgrade.
   Deze versie gebruikt uitsluitend eenmalige leerlingcodes en geen scrypt.
   Zie [Cloudflare Free: grenzen en controle](docs/cloudflare-free.md).

4. Laat deze wijziging in de bedoelde productiebranch reviewen en integreren.
   De implementatie is gemaakt op `agent/ontledingstrainer-skill-system`, basis
   `4b76cd9`; deze checkout bevat niet alle latere `origin/main`-wijzigingen.
   Integreer die bewust en herhaal tests/build/review; overschrijf geen nieuwer
   productwerk. Start daarna de nieuwe GitHub workflow met `workflow_dispatch`.
   De validatiejob draait tests/audits/scans; de deployjob maakt serverconfig,
   past alleen de nieuwe D1-migraties toe en deployt frontend en Worker samen.
   Zonder configuratie wordt geen Pages-/Apps Script-fallback gedeployd.

5. Controleer vóór domeinomschakeling met echte accounts: geldige Google-login,
   onbekend account afgewezen, docent ziet alleen eigen leerlingen, ownerfunctie
   geeft docent 403, leerling geeft staff-endpoints 403, onbekende cookie geeft
   401, code hergebruik afgewezen, nieuwe code herstelt hetzelfde leerling-ID en
   trekt oude leerlingsessies in, eigen historie werkt op tweede browser/laptop,
   verlopen codes en sessies geven 401 en te veel inlogpogingen geven 429.
   De oude wachtwoordroutes bestaan niet en geven geen nieuwe sessies uit.
   CSRF/origin/payload/rate-limieten werken. Controleer daadwerkelijke headers,
   Secure/HttpOnly-cookie en no-store; verifieer Google-widget/CSP in ondersteunde
   browsers. Controleer Worker CPU-belasting (Free: 10 ms per request),
   inclusief Google-login met koude sleutelcache en grote rapportpagina's.
   Controleer dagelijks requests, D1-rows en opslag in het Cloudflare-dashboard.
   Gebruik beschikbare gratis abusebescherming; activeer geen betaalde functies.

6. Laat docenten hun leerlingregister aanmaken en codes persoonlijk uitgeven.
   De docent bewaart hiermee de herkenbare identiteit server-side. Gebruik geen
   namen/codes in links of publieke klaslijsten. Bij laptopverlies/verloop geeft
   de docent een nieuwe code uit voor het bestaande record, geen nieuw record.

7. Exporteer de bestaande Google Sheet privé en behoud de oorspronkelijke data.
   Oude inzendingen zijn niet geauthenticeerd; importeer ze niet automatisch op
   naam. Leg per legacy-identiteit een gecontroleerde mapping naar leerling-UUID
   en docent vast, maak een backup en beoordeel die mapping vóór een afzonderlijke
   import. Tot die tijd is de oude export een private historische bron buiten de
   nieuwe live dashboards. Er is geen automatische dataverwijdering of import.

8. Trek **alle oude Apps Script Web App deployments/versies** in (archiveren van
   alleen de laatste versie is onvoldoende). De retirement-code in
   `apps-script/Code.gs` kan aanvullend worden gepubliceerd maar oude gepubliceerde
   versies blijven bestaan totdat ze afzonderlijk zijn ingetrokken. Roteer/intrek
   de oude Apps Script API-key. Verwijder de oude Vite-key/hashsecrets uit Actions,
   hosting en lokale frontendconfig. Oude docent/owner/editorwachtwoorden die
   elders worden hergebruikt moeten daar worden gewijzigd.

9. Schakel de bestaande GitHub Pages-publicatie/domeinroute uit en routeer het
   productiedomein uitsluitend naar de Worker. Verifieer dat oude URLs geen
   leerlingdata meer geven en dat geen oude bundle de oude backend nog kan
   gebruiken. Verifieer CI/Gitleaks en de echte productiebuild op de uiteindelijke
   branch. Markeer de migratie pas dan als operationeel afgerond.
