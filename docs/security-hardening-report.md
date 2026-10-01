# Security-hardening — eindrapport

## Scope en status

De 21 onderdelen van de aangeleverde hardeningopdracht zijn als één werkplan
uitgevoerd op `agent/ontledingstrainer-skill-system`, vanaf `4b76cd9`.
De gebruikersaanvulling is leidend: leerlingen moeten herkenbaar en blijvend
traceerbaar zijn, en externe opslag mag daarvoor worden ingebouwd.

De implementatie en lokale verificatie zijn afgerond. Productie is niet uitgerold:
Cloudflare/D1, Google-login, accountallowlists en intrekking van oude deployments
vereisen de externe handelingen in `SECURITY_DEPLOYMENT.md`. Er is niets gecommit,
gepusht of gemerged. Bestaande gebruikersconfiguratie is behouden.

## 1. Gevonden kwetsbaarheden

De eerdere browserbundel bevatte configuratie voor een gedeelde opslagkey en
PIN-/wachtwoordhashes. Apps Script gebruikte die ene key voor schrijven, lezen
en beheer; sleutel, leerlingidentiteit en rapporten reisden via queryparameters.
Browserflags bepaalden toegang tot docent-/owner-/editorroutes. Dat gaf geen
server-side beveiliging tegen DevTools of rechtstreekse HTTP-requests.

## 2. Architectuur en trust boundary

React/Vite blijft de trainer. Eén Cloudflare Worker serveert assets en `/api` op
dezelfde HTTPS-origin, en krijgt private D1-toegang via een binding. De browser
krijgt geen opslagcredential. D1 maakt duurzame leerlingrecords mogelijk zonder
een publieke Apps Script Web App of een extra gedeelde server-to-server-key.

## 3. Gewijzigde bestanden

- Backend: `worker/src/{index,auth,validation,types}.ts`, tests,
  `worker/migrations/0001_security.sql`, Wrangler/config/packagebestanden.
- Frontend: vaste API-adapter, Google-aanmelding, accountgates, leerlingcode-
  dialoog, register, ontvangen historie, trainerinzending en ID-gebaseerde analyses.
- Legacy: `authHash` verwijderd; Apps Script ingetrokken in broncode; lokale
  merge/undo heeft geen centrale effecten; oude key-/URL-configuratie verwijderd.
- Gates: `.github/workflows/deploy.yml`, Vite-buildcontrole, securityscripts,
  tests, dependencylocks, `.env.example`, `.gitignore`.
- Contracten: `SECURITY.md`, `SECURITY_DEPLOYMENT.md`, `AGENTS.md`, README, SPEC
  en de vervangen Google Drive-koppelingsdocumentatie.

Geen parsingannotaties, evaluatorregels of shared grammar-core-content gewijzigd.

## 4. Verwijderde mechanismen

Geen `VITE_API_KEY`, query-key, browser-PIN/hash, sessionStorage-privilege,
instelbare Apps Script-URL of rechtstreekse browser-opslagcall meer. GitHub Pages
is vervangen als deploymentdoel. Oudere werkelijk gepubliceerde Apps Script-
versies blijven bestaan totdat de eigenaar ze extern intrekt.

## 5. Authenticatie en autorisatie

Google ID-tokens worden server-side gecontroleerd op signatuur, issuer,
audience, tijdigheid, subject, verified email en eenmalige nonce. Exacte
allowlists bepalen leerling/docent/editor/owner; leeg betekent geen toegang.
Opaque HttpOnly/Secure/SameSite=Strict-cookies verwijzen naar gehashte D1-sessies.
Elke private request controleert rol en recordownership opnieuw.

Docenten beheren hun eigen register; owner mag alle registers zien. Editor
bewerkt lokale/publieke lescontent en krijgt geen leerlingadministratierechten.

## 6. Leerlingdatastroom

Docent registreert UUID + naam + optionele initiaal + klas. Een persoonlijk
uitgegeven eenmalige code (24 uur) geeft een leerlingsessie (30 dagen).
POST `/api/reports` accepteert alleen begrensde oefentelemetrie en bepaalt het
leerling-ID uit de sessie. Docentrapporten voegen registeridentiteit bij de read
toe. Een nieuwe code behoudt UUID/historie en trekt eerdere sessies in, ook bij
gelijktijdig claimen. Rapporten en registers zijn server-side gepagineerd.

Vrij oefenen blijft lokaal; de expliciete lokale keuze voorkomt automatische
inzending met een eventueel nog aanwezige oude cookie. Dat is een voorkeur,
geen autorisatiemechanisme. Oude data is niet verwijderd of automatisch geïmporteerd.
Een ontbrekende/verlopen leerlingcookie toont een inzendfout; die wordt niet
stilzwijgend als geslaagde of niet-noodzakelijke inzending behandeld.

## 7. Drex-secrets

De bestaande offline Drex-audit staat in een aparte worktree en is niet omgebouwd.
`DREX_API_KEY` blijft lokaal/server-side. Vite weigert alle `VITE_*`-configuratie;
de assetscan detecteert bekende secretwaarden en credentialpatronen. CI bouwt
met synthetische backendsecrets als lekcontrole. Er is geen live browser-Drexcall.

## 8. Permanente regels

`SECURITY.md` en `AGENTS.md` leggen 18 invarianten vast: onbetrouwbare browser,
server-side rechten/ownership, dataminimalisatie, geen gevoelige URL's/logs,
strict JSON, 32 KiB, bodytimeout, timeouts naar externe diensten, rate-/daglimiet,
HTTPS, cookies/CSRF, strict CORS, securityheaders en verplichte regressiegates.

## 9. Verificatie vóór de keuze voor Free (planstap 22)

| Controle | Resultaat |
|---|---|
| `npm test` | 44 bestanden, 802 tests geslaagd (inclusief private deploymentconfig) |
| `npm run test:backend` | 2 bestanden, 30 tests geslaagd; echte lokale D1 en synthetisch gesigneerde JWTs |
| `node worker/scripts/smoke-passwords.mjs` | Native workerd: vaste login, wachtwoordwijziging, OTP, sessie-intrekking en salted hashopslag geslaagd |
| Wrangler dry-run met synthetisch secretsbestand | Echte CLI-uitvoer bevat geen accountadressen of deploytoken; niets gepubliceerd |
| `npm run build` | TypeScript, Vite-productiebundle en assetscan geslaagd |
| `npm --prefix worker run check` | Geslaagd |
| `npm --prefix worker run build` | Wrangler deploy-dry-run geslaagd; niets gepubliceerd |
| `npm run security:check`, `security:git`, `security:history` | Geslaagd; gematchte waarden nooit geprint |
| `npm audit --audit-level=low`, dezelfde audit met `--prefix worker` | Beide 0 bekende kwetsbaarheden |
| `git diff --check` | Geslaagd |
| Lokale D1-migratie | 11 statements geslaagd, uitsluitend lokale lege developmentopslag |
| Lokale HTTP-smoke | Anonieme auth/session, teacher/reports, owner/status en report-submit: 401; no-store/nosniff gecontroleerd |
| Browser | Aanmeldveld focus, Escape/sluiten met focusherstel, vrij oefenen en anonieme docentroute gecontroleerd |
| Browser planstap 22 | Keuze login/OTP met toetsenbord, fout wachtwoord/focus, succesvolle vaste login en Mijn voortgang gecontroleerd op geïsoleerde synthetische D1; wachtwoordvelden visueel gecontroleerd op 360 px |

Eerdere falingen zijn niet verhuld: afhankelijkheden hadden aanvankelijk bekende
kwetsbaarheden; die zijn bijgewerkt. Een bestaande willekeurige selectietest
faalde eenmaal (0,266 tegenover >0,27); de test gebruikt nu een vaste steekproef,
met dezelfde norm en ongewijzigde runtime. Nieuwe regressies toonden een
code-reissue-race en incompatibele lange/importsessies aan; beide zijn hersteld.
Een ES2020-typefout is hersteld zonder de frontendtarget te wijzigen.
Planstap 22 voegde eerst falende tests toe: de nieuwe login was aanvankelijk
404 en accountlijsten stonden nog in gewone Wrangler-vars. Implementatie en
private secretsupload herstellen die fouten. Een D1-LIKE-limiet is vervangen
door exacte tellerkeys. Een frontendtest signaleerde gewijzigde generieke
401-tekst; de bestaande aanmeldboodschap is behouden en de leerlingdialoog geeft
nu een gerichte fout. Worker-typechecking vereiste de Node-type-definities.

Wrangler had eerst geen toegang tot globale config/logpaden; lokale taskpaden
lossen dit op. Lokale development meldde een netwerkwaarschuwing bij ophalen
van Cloudflare requestmetadata; de lokale server en HTTP-checks werkten.
Vite meldt een hoofdchunk boven 500 KiB. Gitleaks is toegevoegd aan CI en is
hier niet lokaal uitgevoerd; de lokale historyscan heeft een beperktere scope.
De echte Google- en productieflow is nog niet live geverifieerd.
De audits voor planstap 22 waren eerst door de sandbox-netwerkgrens geblokkeerd;
met expliciet toegestane netwerktoegang rapporteerden beide audits 0 kwetsbaarheden.

## Standards

De aparte Standards-review vond aanvankelijk een revocatierace, centrale effecten
van lokale undo en samenvoeging van gelijknamige leerlingen. Die zijn hersteld
en opnieuw beoordeeld. Ook de stille 1.000-recordgrens is vervangen door cursors.
Resterende actionable Standards-bevindingen: **0**. Optioneel onderhoudspunt:
de Workerdispatcher kan later in kleinere endpointhandlers worden verdeeld.

## Spec

De aparte Spec-review vond incompatibele lange/importsessies en centrale effecten
van legacy undo. Beide zijn hersteld en opnieuw beoordeeld. Resterende actionable
Spec-bevindingen in de gerichte review: **0**. Dit is geen bewijs van een veilige
nog niet uitgerolde productieconfiguratie.

Reviewbasis: `git diff 4b76cd9...HEAD` en `git diff --cached` zijn leeg omdat de
implementatie ongecommit is. De daadwerkelijke review omvatte `git diff 4b76cd9`,
de unstaged diff en alle nieuwe taakbestanden. Gebruikersconfiguratie was uitgesloten.

## 10. Handmatige deployment

Volg `SECURITY_DEPLOYMENT.md`: EU D1, Google web client, accountallowlists,
GitHub productionenvironment/Cloudflaretoken, gecontroleerde integratie in de
productiebranch, migrations/deployment, live checks en persoonlijk leerlingcodes
uitgeven. Deze branch ligt achter `origin/main`; geen automatische vermenging
met de 100 nieuwere commits is uitgevoerd. Regel tevens backup/herstel en bewaartermijnen.

## 11. Rotatie/intrekking

Trek alle oude Apps Script-deployments en de oude gedeelde browserkey in.
Verwijder oude Vite-key-/PIN-hashsecrets uit CI/hosting. Beschouw hashes als
publiek; wijzig elders hergebruikte wachtwoorden. Schakel de oude Pagesroute
uit bij omschakeling en verifieer dat oude endpoints geen leerlingdata meer leveren.

## 12. Restrisico's

Gestolen/gedeelde codes of een ontgrendelde laptop kunnen een leerling
impersoneren. Werk en scores zijn clientaangeleverd: traceerbaar betekent hier
gekoppeld aan het uitgegeven leerlingrecord, geen fraudebestendige toetsregistratie.
Cloudflare edge-limieten zijn geen wereldwijd exact quotum; D1 begrenst het
dagtotaal. Netwerkfouten kunnen inzending verhinderen; lokale oefenresultaten
zijn geen automatisch gesynchroniseerde centrale historie. Retentie, backup,
live Google/CSP/cookies en intrekking van oude toegang moeten vóór live gebruik
extern worden afgerond. Developmenttooling gebruikt de huidige Miniflare
5-alpha; dit is geen runtimeafhankelijkheid van de productie-Worker.

## Planstap 22 — eerdere implementatie, vervangen door planstap 23

Leerlingen kunnen een vaste loginnaam/wachtwoord en de eenmalige leerlingcode
als alternatieven gebruiken. Beide komen bij hetzelfde record uit. De docent
stelt logins in en reset wachtwoorden; de leerling wijzigt zelf met het huidige
wachtwoord. Native scrypt bewaart een salted hash in de private tabel
`student_credentials`; er staat geen leesbaar wachtwoord in D1. De schemawijziging
is een afzonderlijke, additieve migratie `0002_student_credentials.sql`.

Wachtwoordpogingen worden per loginnaam (over IP's heen) en per dag begrensd.
Resets en wijzigingen trekken eerdere sessies/codes in. Een gelijktijdige
docentreset blokkeert een login met de inmiddels oude hash. De alternatieve OTP
blijft 24 uur geldig en één keer bruikbaar; een nieuw OTP laat de vaste login
intact. Bij verlies van een wachtwoord is daarom een wachtwoordreset nodig.

De openbare repository bevat uitsluitend code en synthetische voorbeelden.
GitHub environment secrets leveren accountlijsten aan Worker Secrets via een
tijdelijk genegeerd bestand; gewone vars worden verwijderd om persoonsgegevens
uit publieke Wrangler-deploylogs te houden. De workflow verwijdert het bestand
ook na een fout. Deploymentinstellingen worden binnen de beschermde productiejob
gecontroleerd, vóór migraties. De reviews vonden een eerder overslaande jobconditie
en focus op een nog disabled invoerveld; beide zijn hersteld. De aanvullende
Standards- en Spec-review rapporteren elk **0** resterende actionable bevindingen.

De handleidingen `docs/logins-en-docentomgeving.md` en `docs/database-toegang.md`
leggen dagelijkse bediening, metricbetekenis, resets en rechtstreekse D1-toegang
uit. Google-ownerrechten en Cloudflare-databasebeheer blijven twee afzonderlijke
toegangen. De centrale docentomgeving is `#/usage`; `#/docent-dashboard` is lokaal.
Enkele dashboardlabels zijn verduidelijkt; dit is geen volledige dashboardherbouw.

De nieuwe vaste login vraagt Workers Paid (CPU-limiet 1000 ms); live klasbelasting
en echte Google-aanmelding moeten nog worden gecontroleerd. Productie-D1 en jouw
persoonlijke eigenaar-/databaseaccount zijn door dit werk niet geactiveerd.

## Planstap 23 — Cloudflare Free (1 oktober 2026)

De expliciete keuze voor Free vervangt de nog niet gepubliceerde vaste login.
Wachtwoordendpoints, scrypt, Node-compatibiliteit, de wachtwoord-UI en de
ongepubliceerde credentialmigratie zijn verwijderd. De huidige migraties maken
geen wachtwoordtabel aan. Er is geen productie-D1 gemuteerd en er zijn geen
leerlinggegevens verwijderd. Codes/sessies behouden dezelfde UUID en rapporten.
Private allowlists en de Google-authenticatie blijven server-side gecontroleerd.

Rapportpagina's bevatten maximaal 20 records; de bestaande client volgt alle
cursors. Een HTTP-test controleert alle 202 rapporten, zonder duplicaten of
verlies. Indexen ondersteunen leerlinghistorie, heruitgifte en expiry-cleanup.
De bestaande 200-recordpagina's voor het leerlingregister blijven intact.

De nieuwe HTTP-test faalde eerst omdat de wachtwoordroute nog bestond (401 in
plaats van 404). De gewijzigde pagineringstest faalde eerst op 200 in plaats
van 20 records. Beide slagen na de implementatie. De zes tests van de verwijderde
wachtwoordfunctie zijn vervallen; OTP-, sessie-, ownership-, CSRF-, payload-,
rate- en Google-signatuurtests blijven bestaan.

De native smoke gebruikt de gebouwde Worker zonder Node-compatibiliteit, echte
lokale D1 en uitsluitend een synthetische Google-JWKS. Het test geen werkelijk
Google-account en heeft geen toegang tot productie-D1. Het bewijst geen
productie-CPU-verbruik van maximaal 10 ms; dat moet na activering worden gemeten.
Quota en databasetoegang staan in de bijgewerkte handleidingen. Er is geen
abonnement geactiveerd of deployment uitgevoerd.

### Verificatie planstap 23

| Controle | Resultaat |
|---|---|
| `npm test` | 44 bestanden, 802 tests geslaagd |
| `npm run test:backend` | 2 bestanden, 25 tests geslaagd; echte lokale D1 |
| `npm run build` | TypeScript, Vite en assetscan geslaagd; bestaande waarschuwing voor hoofdchunk groter dan 500 kB (nu 595,40 kB) |
| `npm --prefix worker run check` | Geslaagd zonder Node-runtime-types |
| `npm --prefix worker run build` | Dry-run geslaagd; niets gepubliceerd |
| `node worker/scripts/smoke-free.mjs` | Gebouwde Worker in workerd: Google-signatuurcontrole, OTP, ownership, historie, intrekking en native rate limiter geslaagd |
| `npm run security:check`, `security:git`, `security:history` | Geslaagd; waarden redacted |
| Beide dependency-audits met `--audit-level=low` | 0 bekende kwetsbaarheden |
| Browser met geïsoleerde synthetische D1 | Ongeldige code/focusherstel, geldige codeclaim, eigen historie zonder wachtwoordvelden, Tab/Enter/Escape en focusherstel gecontroleerd |
| Scherm van 360 px breed | Leesbaar; geen horizontale overflow |
| UI-richtlijnen, Standards- en Spec-review | Geen resterende actiepunten binnen planstap 23 |
| `git diff --check` | Geslaagd |

De eerste Worker-dry-run faalde doordat Wrangler zijn log-/configmap buiten de
Windows-sandbox wilde schrijven. Met een lokale, genegeerde `.wrangler`-map
voor `XDG_CONFIG_HOME` en `WRANGLER_LOG_PATH` slaagde de dry-run. Er is geen
ACL gewijzigd of sandbox omzeild. Een procesinspectie tijdens cleanup kreeg
geen rechten; beide tijdelijke testpoorten waren na stoppen aantoonbaar gesloten.
