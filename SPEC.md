# Productspecificatie Ontleedlab

_Actueel op 2026-09-12._

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

### Rollenladder

Een verborgen experiment via `#/rollenladder`. De acht treden mogen rollen beperken binnen die route. Activatie wordt nooit opgeslagen en mag de standaardroute niet veranderen. Alleen trede en recente scores mogen lokaal blijven staan.

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

De productkern werkt zonder account en backend. Lokale browserdata is apparaatgebonden en geen klasadministratie. Google Sheets blijft voorlopig de gebruikte rapportagekoppeling, maar de Apps Script-route is in de huidige vorm geen beveiligde gegevenslaag: client-side geheimen zijn uitleesbaar en GET-URL's kunnen gegevens loggen.

De beoogde migratierichting is een server-side geautoriseerde opslag met een willekeurige leerlingcode. De app en database bewaren geen naam of klas; alleen de docent beheert buiten het systeem de koppeling tussen code en leerling. Dit is een ontwerpbesluit, geen al gebouwde backend.

## Niet-doelen

- geen geïntegreerde derde grammatica-app
- geen generatieve beoordeling van leerlingantwoorden
- geen echte beheersingsclaim op basis van enkele lokale pogingen
- geen nieuwe backend voordat identiteit, beheer, privacy en autorisatie expliciet zijn ontworpen
- geen opsplitsing van `useTrainer.ts` zonder concrete wijziging die daarvan profiteert

## Gedeelde grens

`grammar-core` bepaalt productoverstijgende didactiek en taxonomie. Ontleedlab blijft eigenaar van annotaties, labels, evaluator, routes, feedbackmapping, experimenten en opslag.
