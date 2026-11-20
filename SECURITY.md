# Securitycontract — Ontleedlab

De browser, alle frontendassets, routes en browseropslag zijn publiek en onbetrouwbaar.
Dit contract geldt voor iedere nieuwe feature. De security boundary is:

**Browser → dezelfde HTTPS-origin /api → Cloudflare Worker → private D1-binding.**

De React/Vite-trainer blijft lokaal werken. Centrale leerlingadministratie bestaat
uitsluitend in D1. Er is geen browserverbinding met Apps Script, Sheets of Drex.
De Worker serveert ook de statische assets, zodat cookies, API en securityheaders
op dezelfde origin werken. GitHub Pages is geen productiebackend meer.

## Niet-onderhandelbare regels

1. Frontendcode is publiek en onbetrouwbaar.
2. `VITE_*` bevat nooit secrets. Deze app accepteert helemaal geen `VITE_*`-buildconfiguratie.
3. Client-side hashes, PINs, localStorage en sessionStorage zijn nooit autorisatie.
4. Privileged data en acties vereisen server-side authenticatie én autorisatie per request.
5. Leerlingen krijgen least privilege: eigen werk insturen en eigen ontvangen rapporten bekijken.
6. Publieke clients krijgen nooit leesrechten op alle leerlinggegevens.
7. Geen secrets, authenticatiegegevens of leerlinggegevens in URL-querystrings. API-querystrings worden geweigerd.
8. Geheime externe API-keys worden uitsluitend lokaal/server-side gebruikt.
9. Sla alleen persoonsgegevens op die voor het product nodig zijn.
10. Muterende endpoints valideren input server-side, inclusief onbekende velden en maximale grootte.
11. Externe calls krijgen timeouts, generieke foutafhandeling en waar nodig rate-/kostenlimieten.
12. Logs bevatten geen credentials, authheaders, tokens, gevoelige requestbodies of onnodige leerlinggegevens.
13. Onbekende rollen, ontbrekende configuratie en mislukte authenticatie: default-deny.
14. CORS is geen autorisatie. Sta geen wildcard-origin toe voor private APIs.
15. Ontwikkelgemak mag de boundary niet omzeilen; geen lokale bypass in productie.
16. Securityrelevante wijzigingen vereisen tests aan de HTTP-, browser- of buildboundary.
17. Dependency-audit en redacted secret-scanning horen bij CI.
18. Geen productiecredentials in tests, fixtures, screenshots, docs, issues, artifacts of commits.

## Dreigingsmodel

| Actor | Bedreiging | Afgedwongen grens |
|---|---|---|
| Publieke bezoeker/leerling | Rapporten lezen of centrale spam insturen | Geen centrale inzending zonder geldige leerlingcookie; lokaal oefenen blijft mogelijk |
| Leerling die requests manipuleert | Andermans ID kiezen, identiteit wijzigen, docentfunctie gebruiken | Identiteit uit serversessie; body bevat uitsluitend getypeerde oefentelemetrie; geen leerling-ID in submit |
| Gebruiker die JavaScript inspecteert | Browserkey/hash reconstrueren | Geen opslagcredentials of wachtwoordverificatie in frontend; Google client-ID is protocolmatig publiek |
| Gebruiker die browseropslag manipuleert | Rol of leerlingidentiteit vervalsen | Elke private API-call verifieert de HttpOnly-sessie; lokale data is alleen lokale oefen-/UI-state |
| Rechtstreekse endpointcaller | CORS omzeilen, cross-tenant lezen of muteren | Sessie plus rol plus recordownership; Origin-check is aanvullend, geen vervanging |
| Bezitter van gelekte URL/log | Oude sleutel of persoonsgegevens misbruiken | Geen API-querystrings, no-referrer/no-store; oude deployments en sleutels moeten worden ingetrokken |
| Docent | Buiten de eigen leerlingen lezen of beheer uitvoeren | Records gekoppeld aan geverifieerde Google `sub`; docenten zien/muteren alleen eigen register |
| Eigenaar/beheerder | Te brede bevoegdheden of verloren account | Apart expliciet toegestane ownerrol; account-MFA; overige docentsessies intrekken |
| Bezitter van gestolen key/cookie/code | Impersonatie of opslagtoegang | Geen gedeelde browserkey; eenmalige leerlingcode; gehashte sessies, beperkte TTL, intrekken/heruitgeven |

## Identiteit, rollen en sessies

Docenten melden aan met Google Identity Services. De browser houdt het kortlevende
ID-token alleen in geheugen en verstuurt het per JSON POST. `jose` verifieert de
Google-signatuur (RS256, JWKS met 5 s timeout), issuer, audience, expiry, recent
issued-at, subject, verified email en een eenmalige nonce. De nonce is gekoppeld
aan een HttpOnly challengecookie en wordt atomair geconsumeerd. Gmail of een
door Google beheerd Workspace-domein is vereist voor email-authoriteit.

De server bepaalt rollen via exacte `OWNER_EMAILS`, `TEACHER_EMAILS`,
`EDITOR_EMAILS` en optioneel `STUDENT_EMAILS`. Geen impliciete domeintoegang:
een schooldomein alleen maakt iemand geen docent. Lege lijsten geven niemand
rechten. Rollen worden bij iedere request opnieuw bepaald, zodat het verwijderen
van een account uit een allowlist ook bestaande sessies blokkeert.

De serversessie is een willekeurige 256-bit cookie, geen browser-bearertoken.
Alleen SHA-256 van de token staat in D1. Cookies hebben `__Host-`, Path=/,
HttpOnly, Secure en SameSite=Strict; docentsessies standaard 1 uur (maximaal 8).
Logout verwijdert de serversessie. Owner kan alle andere docentsessies intrekken.
Geen OAuth-clientsecret of refreshtoken is nodig voor deze loginflow.

Een docent registreert een leerling met een blijvend UUID, naam, optionele initiaal
en klas. Die persoonsgegevens zijn nodig voor controle en opvolging van werk,
zoals expliciet gevraagd; de koppeling is alleen voor de bevoegde docent/owner.
Een servergegenereerde 256-bit toegangscode wordt persoonlijk gedeeld, is
24 uur geldig en één keer bruikbaar. Het claimen geeft een HttpOnly-leerlingsessie
van 30 dagen. Een nieuwe code voor hetzelfde UUID trekt oude codes/sessies in:
de leerling kan op een andere laptop verder met dezelfde ontvangen rapporthistorie.
De code is een credential: nooit in een deellink, log of algemene klaslijst.

De gekozen deployment gebruikt Cloudflare Free en eenmalige leerlingcodes.
Er is geen vaste leerlinglogin met wachtwoord, wachtwoordhashing of Node-runtime-
compatibiliteit. De willekeurige codes en sessietokens hebben 256 bits entropie;
SHA-256 dient uitsluitend voor tokenopslag, nooit voor menselijke wachtwoorden.
Rollenlijsten zijn Worker Secrets uit GitHub environment secrets: gewone Wrangler-
vars verschijnen in de openbare deploylogs en zijn hiervoor verboden.

De lokale editor bewerkt publieke/lokale zinnen, exportbestanden en deelbare
lescontent. Hij schrijft geen centrale data en geeft geen toegang tot leerling-
administratie. De route gebruikt de serveraanmelding als UX-gate; de feitelijke
private data wordt uitsluitend door de API beschermd.

## API- en opslagcontract

| API | Toegang | Functie |
|---|---|---|
| POST `/api/auth/challenge`, `/api/auth/login` | Publiek, rate-limited | Nonce en Google-authenticatie |
| GET `/api/auth/session` | Geldige staff-accountcookie | Eigen rol/status |
| POST `/api/auth/logout` | Same-origin | Eigen staff-sessie intrekken |
| POST `/api/student/enroll` | Eenmalige code, rate-limited | Leerlingcookie uitgeven |
| GET `/api/student/session` | Leerlingcookie | Eigen identiteit |
| POST `/api/student/reports` | Leerlingcookie | Alleen eigen rapporten, gepagineerd |
| POST `/api/student/logout` | Same-origin | Eigen leerlingcookie intrekken |
| POST `/api/reports` | Leerlingcookie | Append-only eigen oefenresultaten |
| POST `/api/teacher/reports` | Docent/owner | Eigen leerlingen; owner alle; gepagineerd |
| POST `/api/teacher/students[/list\|/code\|/update]` | Docent/owner | Eigen register, codes en gegevens |
| POST `/api/teacher/classes/rename` | Docent/owner | Alleen eigen leerlingen; owner alle |
| GET `/api/owner/status` | Owner | Opslagstatus zonder credentials |
| POST `/api/owner/sessions/revoke` | Owner | Andere docentsessies intrekken |

Alle API-bodies zijn JSON, maximaal 32 KiB, strikt gevalideerd. Geen GET-mutaties.
POST vereist exact de geconfigureerde Origin; SameSite=Strict en JSON-only
voorkomen CSRF. Queries worden geweigerd, ook voor paginering. Rapport- en registerpagina's
bevatten respectievelijk maximaal 20 en 200 records met een cursor in de volgende POST-body.
Fouten zijn generiek (400/401/403/405/408/413/415/429/503), geen exceptiondetails.
Frontendrequests en het inlezen van API-bodies hebben een timeout van 10 s.
Geen gevoelige responsecaching. Sessies mogen maximaal 10.000 zins-ID's bevatten;
de 32 KiB-bodygrens blijft leidend. Geïmporteerde token-ID's zijn begrensd op
128 tekens, splits/rollabels op 300 per zin; rollabels blijven een vaste enum.

Nieuwe rapporten slaan UUID, ontvangsttijd en oefentelemetrie op: versie,
oefentijdstip, aantallen goede/totale zinsdelen, niveau, fouttellingen, zins-ID's,
per-zin resultaten en optioneel duur, antwoordgebruik en splits/rollabels.
Geen naam/klas of opaque base64-blob wordt bij submit geaccepteerd. Bij een
geautoriseerde read worden naam en klas uit het register toegevoegd voor de
bestaande rapportweergave. Zelfde namen worden via server-ID gescheiden.

D1 slaat verder registerownership (Google subject), staff-email/subject in
kortlevende sessies, hashes van leerlingcodes/sessies en tijdelijke ratebudgetten
op. Er worden geen IP-adressen opgeslagen. Een uurlijkse job verwijdert alleen
verlopen sessies, codes, challenges en ratebudgetten; nooit leerlingwerk.
Bewaartermijnen en gecontroleerde verwijdering van leerlingrecords worden vóór
live gebruik door de verantwoordelijke school/eigenaar vastgelegd.

Leerling-submit is standaard begrensd op 10/minuut per geauthenticeerd leerling-ID;
login/codeclaims op 120/minuut per IP (rekening houdend met school-NAT).
Cloudflare-limieten werken per edge-locatie en zijn geen exact wereldwijd quotum.
Een atomaire D1-teller beperkt succesvolle opslag tot standaard 10.000 rapporten
per UTC-dag. Configureer limieten in `worker/wrangler.jsonc`. Ontbrekende limiter
of ongeldige limietconfiguratie sluit de betreffende route.

## Browser, secrets en Drex

Alle assets lopen door de Worker voor CSP, frame-ancestors 'none', nosniff,
no-referrer, Permissions-Policy, HSTS en veilige API-cacheheaders. CSP staat
alleen eigen scripts en de Google-loginwidget toe; inline styles blijven nodig
voor bestaande React-styling en de Google-widget. De API heeft één vaste origin.
`ALLOW_LOCAL_HTTP` werkt uitsluitend voor localhost/127.0.0.1 en moet in
productie ontbreken. Cloudflare Workers-/preview-URLs zijn uitgeschakeld.

`DREX_API_KEY` blijft lokaal/offline of server-side, nooit `VITE_DREX_API_KEY`.
Deze branch bevat geen Drex-runtime of live-proxy; de bestaande offline audit
staat in een aparte worktree en is niet verplaatst of verbouwd. De productiebuild
en assetscan weigeren Drex-/serversecretpatronen en bekende lokale secretwaarden.
Een toekomstige live-Drexfeature vereist een expliciete backendroute met
validatie, budget, timeout en abusebescherming; browsercalls blijven verboden.

Een GitHub Secret in een `VITE_*`-buildvariabele wordt publiek. Daarom krijgt de
build geen credentials. Alleen de deployjob krijgt het Cloudflare API-token.
D1 is een private capability-binding; er bestaat geen opslagkey voor de browser.

## Migratie, verificatie en beperkingen

Zie [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md) voor externe handelingen.
De oude Apps Script Web App blijft onveilig totdat al haar gepubliceerde versies
zijn ingetrokken. De retirement-code is geen bewijs dat dat al gebeurd is.
Behandel de oude browserkey en password/PIN-hashes als publiek; roteer/intrek
de sleutel en wijzig elders hergebruikte wachtwoorden.

Oude Sheets- en lokale data wordt niet automatisch verwijderd of geclaimd als
geauthenticeerde leerlinghistorie. Bewaar een private export; leg een expliciete
identiteitsmapping vast vóór een eventuele import. Centrale dashboards mengen
lokale/offline imports niet met ontvangen leerlingwerk. Lokale oefenvoortgang is
afzonderlijk aangeduid. Een handmatige oude rapportcode-import blijft lokaal.
De oude lokale beheer- en undo-acties hebben geen centrale schrijfrechten.
Een expliciete keuze voor vrij oefenen voorkomt automatische rapportinzending,
ook wanneer een oude leerlingcookie nog bestaat; dit is een lokale voorkeur,
geen bewijs van identiteit of rechten.

Traceerbaarheid betekent hier dat de serversessie aan het uitgegeven leerling-
record is gekoppeld. Een gestolen/gedeelde code of ontgrendelde laptop kan die
leerling impersoneren; de docent moet codes persoonlijk uitgeven en bij verlies
heruitgeven. Ook scores en antwoorden blijven clientaangeleverde oefendata.
Dit is geen fraudebestendige examen- of cijferregistratie en geen bewijs van
aanwezigheid. Server-side scoring van een vastgelegde opdrachtversie valt buiten
deze hardening en vraagt een afzonderlijke productkeuze.

Regressiegates: frontend/API-tests, echte lokale D1-tests met gesigneerde test-JWTs,
source- en assetscans, dependency-audits en Gitleaks in CI. De lokale historyscan
controleert gangbare credentialpatronen en tracked env-bestanden in lokaal
beschikbare refs (blobs tot 2 MB); dit bewijst niet dat er nooit een secret lekte.
Niet-lokale/verwijderde Git-history, provideraccounts en live deployments zijn
zonder toegang niet geverifieerd. Schoolprivacy/retentie en live Google-login
moeten vóór productie daadwerkelijk worden gecontroleerd.

## Checklist bij backend- of authwijzigingen

- Benoem actor, capability, identiteit, rol en recordownership vóór implementatie.
- Test zonder cookie, met leerling/docent/editor/owner, vervalste/gestolen token,
  verkeerde eigenaar, onbekende velden, overgrote body, CSRF en rate limit.
- Controleer browserbundle, URL's, logs, errors en CI op credentials en persoonsgegevens.
- Controleer de deploymentorigin, headers, sessieverval en intrekken; geen fallback.
- Leg opgeslagen gegevens, noodzakelijkheid, migratie en beperkingen vast.
- Draai `npm test`, `npm run test:backend`, `npm run build`, worker check/build,
  `npm run security:check`, `npm run security:git` en audits; review de volledige diff.
