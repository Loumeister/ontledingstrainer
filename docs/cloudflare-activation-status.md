# Cloudflare-activering — 1 oktober 2026

## Integratie (opdrachtstap 5)

Integratiebranch: `codex/cloudflare-free-production`, basis
`1685590cf646c76dda930debc92338e0778b0247` (geverifieerde `origin/main`).
De oorspronkelijke dirty checkout is behouden. De integratie neemt alleen
de security-/deploymentimplementatie over en behoudt de 100 nieuwere main-commits.
Parsingdata en evaluatorgedrag zijn niet gewijzigd. De analysewijziging gebruikt
blijvende leerling-ID's voor rapportaggregatie.

| Uitgevoerde controle | Resultaat |
|---|---|
| `npm test` | 53 bestanden, 941 tests geslaagd |
| `npm run test:backend` | 2 bestanden, 25 tests geslaagd |
| `npm run build` | TypeScript, Vite en assetscan geslaagd; chunkwaarschuwing 596,12 kB |
| `npm --prefix worker run check` | Geslaagd |
| `npm --prefix worker run build` | Dry-run geslaagd; niets gepubliceerd |
| `node worker/scripts/smoke-free.mjs` | Native workerd + geïsoleerde lokale D1 geslaagd |
| `npm run security:check`, `security:git`, `security:history` | Geslaagd; waarden niet gelogd |
| Beide `npm audit --audit-level=low` (root en worker) | 0 kwetsbaarheden na netwerktoestemming |
| `git diff --cached --check`, `git diff --check` | Geslaagd |

De eerste audits konden de registry vanuit de sandbox niet bereiken. Beide
audits slaagden met expliciet toegestane netwerktoegang; er is geen auditfailure
als geslaagde check voorgesteld. Gitleaks en Linux-CI moeten afzonderlijk worden
geverifieerd op de gepushte integratie.

## Standards

De aparte Standards-review vond geen blokkerende runtimebevindingen. Eén
documentatiepunt (verouderde integratiebasis in SECURITY_DEPLOYMENT.md) is
gecorrigeerd. Geen resterende actiepunten in deze review.

## Spec

De aparte Spec-review vond geen actionable codedefecten. Externe configuratie,
EU-databaselocatie, Free-plan, Google-login, backups en productie-CPU vallen
buiten wat een diffreview of lokale tests aantonen.

## Externe status

- GitHub environment `production` aangemaakt; `APP_ORIGIN` ingesteld op
  `https://ontleedlab.nl`. Overige instellingen nog niet geverifieerd.
- Cloudflare-dashboard vraagt aanmelding; account, domeinownership, D1 en
  Free-plan zijn nog niet geverifieerd.
- In het bestaande Google-project Zinsontledingstrainer is een webclientformulier
  voorbereid voor uitsluitend de productie-origin. Credentialcreatie en
  eigenaaraccountkeuze wachten op de gebruiker.
- Geen productiondeployment, domeinomschakeling, remote databasewijziging,
  backup/herstel of intrekking van oude publicatieroutes uitgevoerd.
- Geen productie-CPU of accountquotagebruik gemeten. Lokale smoketests bewijzen
  geen live Google-login of naleving van de 10 ms Free-limiet.

Gebruik SECURITY_DEPLOYMENT.md voor de resterende acceptatiecontroles.
