# Productspecificatie Ontleedlab

_Actueel op 2026-10-01; productieactivering nog niet geverifieerd._

## Doel

Ontleedlab laat leerlingen grammaticale functies in samenhang bepalen. De kernprestatie is niet één rol herkennen, maar een volledige zin consistent verdelen en benoemen en een fout met een passende grammaticale controle herstellen.

## Primaire leerlus

1. Lees de volledige zin.
2. Bepaal zinsdeelgrenzen.
3. Wijs alle toepasselijke rollen aan.
4. Controleer.
5. Voer bij een fout één gerichte proef of vergelijking uit.
6. Probeer dezelfde zin opnieuw.

Het juiste antwoord wordt pas getoond wanneer de leerling daar expliciet voor kiest.

## Didactische eisen

- Denkstap vóór labeluitkomst.
- Vorm en betekenis worden samen gebruikt; een vraagproef is geen definitie.
- Eén hoofdvalkuil per nieuw item.
- Contrast vóór extra volume.
- Geen zin met twee verdedigbare schoolanalyses zonder expliciete modellering.
- Feedback benoemt alleen waarneembaar gedrag en geeft één uitvoerbare herstelhandeling.

## Modi

### Standaard

Alle toepasselijke rollen zijn tegelijk beschikbaar. Dit is de productnorm en wordt met regressietests beschermd.

Eén afgeleide eis binnen deze norm: de persoonsvorm hoort altijd bij een werkwoordelijk of naamwoordelijk gezegde, nooit op zichzelf. Zodra een leerling een zinsdeel als PV labelt, moet die vanaf niveau 1 (waar WG/NG onderwezen wordt) ook het gezegdetype (WG/NG) op die PV-chunk kiezen voordat gecontroleerd kan worden. Dit is een subrol-eis op de PV zelf, geen extra hoofdrol en geen afgedwongen volgorde voor de overige rollen — die blijven tegelijk beschikbaar. Zie `requiresPredicateChoice`/`getExpectedPredicateType` in `src/logic/validation.ts`.

### Rollenladder

Een verborgen experiment via `#/rollenladder`. De acht treden mogen rollen beperken binnen die route. Activatie wordt nooit opgeslagen en mag de standaardroute niet veranderen. Alleen trede en recente scores mogen lokaal blijven staan.

### Bijzinontleding

Een nog niet vrijgegeven optie via `#/bijzinontleding`. Een goed gevonden bijzin klapt na controle open en wordt als eigen zin ontleed, met dezelfde evaluator. Zie `docs/bijzinontleding.md`.

### Zinsdeellab

Een verborgen experiment voor zinnen bouwen. Het deelt corpus en enkele lokale modellen, maar is geen tweede productkern.

## Beoordeling en feedback

`src/logic/validation.ts` is deterministisch. Feedback op een rollenpaar bevat standaard één korte controlevraag. Een uitgebreid diagnoseobject is alleen gerechtvaardigd als de app ook de redenering van de leerling heeft vastgelegd.

Acceptatiecriteria:

- inhoudelijk juiste grammatica
- geen verborgen bekendmaking van het juiste antwoord vóór de herpoging
- precies één volgende handeling
- direct toepasbaar op de huidige zin
- aparte tekst alleen als het herstelpad werkelijk verschilt

## Gegevens en privacy

De trainer werkt zonder account en backend. Lokale browserdata is apparaatgebonden. Centrale leerlingadministratie gebruikt dezelfde HTTPS-origin /api, een Cloudflare Worker en een private EU-D1. Google Identity Services verifieert staff; exacte server-side allowlists bepalen rechten. Docenten zien uitsluitend eigen records, owner alle records.

Een persoonlijke eenmalige code geeft een HttpOnly/Secure/SameSite=Strict-leerlingsessie. Heruitgifte trekt oude toegang in en behoudt UUID en ontvangen rapporten. Naam, optionele initiaal en klas staan alleen in het private register. Rapportinzending gebruikt de identiteit uit de serversessie. Leerlingen hebben geen vaste wachtwoorden.

Geen browsersecrets, gevoelige querystrings, Pages- of Apps Script-fallback. Bewaar de bestaande Sheets-data privé; automatische import op naam is verboden. Zie SECURITY.md voor HTTP-, CSRF-, payload-, ownership- en rategrenzen, en SECURITY_DEPLOYMENT.md voor backup/herstel en live verificatie. Free-quota en productie-CPU moeten daadwerkelijk worden gemeten; lokale tests bewijzen de 10 ms-limiet niet.

## Niet-doelen

- geen geïntegreerde derde grammatica-app
- geen generatieve beoordeling van leerlingantwoorden
- geen echte beheersingsclaim op basis van enkele lokale pogingen
- geen uitbreiding van de backend buiten het expliciete securitycontract
- geen opsplitsing van `useTrainer.ts` zonder concrete wijziging die daarvan profiteert

## Gedeelde grens

`grammar-core` bepaalt productoverstijgende didactiek en taxonomie. Ontleedlab blijft eigenaar van annotaties, labels, evaluator, routes, feedbackmapping, experimenten en opslag.
