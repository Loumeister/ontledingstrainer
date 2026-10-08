# Cloudflare Free gebruiken

Ontleedlab richt zich op **Workers Free met een private D1-database**. Er is
geen betaald abonnement nodig voor deze codeflow. De eigenaar houdt zelf toegang
tot het Cloudflare-account; Google-ownerrechten in Ontleedlab zijn afzonderlijk.
Zie [databasebeheer](database-toegang.md) en [de loginhandleiding](logins-en-docentomgeving.md).

## Aanmelden

- Docenten en eigenaar gebruiken hun expliciet toegestane Google-account.
- Leerlingen gebruiken een persoonlijke code: 24 uur geldig, één keer bruikbaar.
- De leerlingcookie blijft maximaal 30 dagen geldig op dezelfde browser.
- Een nieuwe code voor hetzelfde record trekt eerdere codes en sessies in;
  het leerling-ID en alle ontvangen rapporten blijven behouden.
- Er zijn geen vaste leerlingwachtwoorden in deze versie. Hun server-side
  identiteit en traceerbaarheid blijven bestaan.

## Gratis grenzen

Gecontroleerd op 1 oktober 2026; controleer de providerpagina's bij activering.

| Onderdeel | Free-grens |
|---|---|
| Worker-aanroepen | 100.000 per dag, voor het hele account |
| Rekentijd | 10 ms per HTTP-request en per cron-aanroep |
| D1 lezen | 5 miljoen gelezen rijen per dag |
| D1 schrijven | 100.000 geschreven rijen per dag |
| Eén D1-database | Maximaal 500 MB |
| Totale D1-opslag | Maximaal 5 GB per account |
| D1 Time Travel | Herstelvenster van 7 dagen |

Bronnen: [Worker-limieten](https://developers.cloudflare.com/workers/platform/limits/),
[D1-prijzen](https://developers.cloudflare.com/d1/platform/pricing/) en
[D1-limieten](https://developers.cloudflare.com/d1/platform/limits/).

Deze Worker draait vóór alle assets om de securityheaders te zetten. Ook
pagina- en assetrequests tellen daardoor mee als Worker-aanroepen. Een rapport
is niet gelijk aan één geschreven rij: indexen, sessies en tellers gebruiken
ook het quotum. Het rapportbudget van 10.000 per dag is een applicatiegrens,
geen garantie dat alle Cloudflare-quota beschikbaar blijven.

Bij uitgeputte Free-quota worden verzoeken of databaseacties geweigerd;
er wordt geen automatische Paid-upgrade uitgevoerd. Reeds opgeslagen werk
blijft in D1. Nieuwe inzendingen kunnen mislukken en moeten worden gecontroleerd:
lokale oefenresultaten zijn geen bewijs van centrale ontvangst. Meer dan
500 MB leerlingwerk vraagt een bewuste opslag-/retentiekeuze; deze versie
verwijdert geen rapporten om onder het quotum te blijven.

## Controle vóór klasgebruik

1. Controleer in Cloudflare dat het Workers-plan daadwerkelijk **Free** is.
   Deze repository wijzigt het accountabonnement niet.
2. Voer de [deploymentstappen](../SECURITY_DEPLOYMENT.md) uit en test Google-login,
   codeclaim, intrekken en eigen historie met echte toegestane accounts.
3. Bekijk de Worker Metrics: CPU-tijd en fouten, vooral `exceededCpu`.
   Test een koude Google-sleutelcache, maximale rapportinput en rapportpagina's.
   De rapport-API geeft maximaal 20 records per pagina om verwerking te beperken;
   het dashboard haalt de volgende pagina's automatisch op.
4. Bekijk D1 Metrics voor gelezen/geschreven rijen en databasegrootte. Controleer
   ook de uurlijkse cleanup: deze verwijdert alleen verlopen authenticatierecords
   en budgettellers, nooit leerlingen of rapporten.
5. Maak private exports en controleer herstel. Time Travel van 7 dagen vervangt
   geen eigen langetermijnbackup. Publiceer exports of toegangscodes nooit.

Lokale workerd-tests controleren de daadwerkelijke codeflow, maar handhaven
of meten het productiequotum van 10 ms niet. Als live requests dit overschrijden,
moet de betreffende route verder worden geoptimaliseerd; upgrade niet automatisch.
