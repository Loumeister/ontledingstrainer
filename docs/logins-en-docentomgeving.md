# Logins en docentomgeving gebruiken

## Huidige status — 1 oktober 2026

De nieuwe aanmelding, leerlingregistratie en databasekoppeling zijn ingebouwd
en lokaal getest. Ze zijn nog niet door deze wijziging op de publieke site
geactiveerd. Het database-ID, de Google-client-ID en de toegestane accounts
moeten nog worden ingesteld. Deze handleiding beschrijft de nieuwe omgeving
**na activering**; een oudere versie van de site kan nog een ander scherm tonen.

De beheerder voert eerst [de deploymentstappen](../SECURITY_DEPLOYMENT.md) uit.
Voor jouw directe databasetoegang is er een aparte
[handleiding databasebeheer](database-toegang.md).

## Welke login gebruik je?

| Wie | Aanmelden met | Toegang |
|---|---|---|
| Leerling | Een persoonlijke eenmalige code | Eigen werk insturen en eigen ingestuurde historie bekijken |
| Docent | Expliciet toegestaan Google-account | Rapporten en leerlingregister van de eigen leerlingen |
| Eigenaar | Google-account dat als eigenaar is toegestaan | Alle registers/rapporten en eigenaarfuncties |
| Editor | Google-account dat als editor is toegestaan | Lokale/publieke lescontent; geen leerlingadministratie |
| Technisch databasebeheerder | Eigen Cloudflare-account met toegang tot de D1-database | Database rechtstreeks bekijken en beheren |

Een eigenaar in Ontleedlab en een databasebeheerder bij Cloudflare zijn twee
afzonderlijke toegangen. Een Google-login in Ontleedlab geeft niet automatisch
toegang tot het Cloudflare-account. Leerlingen hebben geen Google-account nodig.

## Jouw eigenaarstoegang eenmalig instellen

1. Kies jouw eigen Gmail- of Google Workspace-account voor Ontleedlab.
2. Laat dat exacte e-mailadres server-side opnemen in `OWNER_EMAILS`.
   Deze instelling is een GitHub environment secret en een Worker Secret, niet
   een gewone/publiceerbare configuratievariabele en niet een leerlingveld
   of browserinstelling. Er is geen openbare knop om jezelf eigenaar te maken.
3. De Google-login moet zijn ingesteld voor de exacte site-origin.
4. Zorg daarnaast dat de productie-D1 onder jouw Cloudflare-account staat of
   dat jouw Cloudflare-account hiervoor de passende beheerrechten heeft.
5. Controleer na activering dat jij het tabblad **Eigenaar** ziet en dat jij
   dezelfde database in Cloudflare kunt openen.

Er is nu nog geen persoonlijk eigenaaraccount voor je geconfigureerd: de
rolallowlists in de voorbeeldconfiguratie zijn leeg. Er bestaat geen standaard-PIN.

Andere docenten worden server-side opgenomen in `TEACHER_EMAILS`, editors in
`EDITOR_EMAILS`. Een schooldomein alleen geeft geen docent- of eigenaarrechten.
Een persoonlijk Google-account met een extern, niet door Google beheerd
e-mailadres wordt door deze loginimplementatie geweigerd.

## Aanmelden als docent of eigenaar

1. Open na activering [Aanmelden](https://ontleedlab.nl/#/login).
2. Gebruik de Google-aanmeldknop en kies het toegestane account.
3. Na controle opent voor docenten/eigenaar automatisch
   [de centrale docentomgeving](https://ontleedlab.nl/#/usage).
4. Werk in de gewenste tab. Klik bovenaan **Afmelden** als je klaar bent.

De docentsessie is standaard één uur geldig. Bij een verlopen sessie meld je
opnieuw aan. Het Google-wachtwoord wordt uitsluitend bij Google ingevoerd.

Editors landen na dezelfde Google-aanmelding op `#/editor`. Een editoraccount
zonder docent- of eigenaarrol kan geen leerlingregister openen.

## Leerlingen registreren en codes uitdelen

1. Meld je aan als docent en open **Beheer → Leerlingregister**.
2. Vul **Naam**, eventueel **Initiaal**, en **Klas** in.
3. Klik **Leerling toevoegen**. De server maakt een blijvend leerling-ID.
4. Kopieer de getoonde code en geef die persoonlijk aan deze leerling.
5. Klik **Code verbergen** zodra je de code hebt overgedragen.

Een code is 24 uur geldig en één keer te gebruiken. Geef iedere leerling een
eigen code. Deel codes niet via een algemene klaslijst of een openbare link.
Het register bevat ook leerlingen die nog niets hebben ingestuurd; het tabblad
Leerlingen toont de leerlingen waarvoor rapporten beschikbaar zijn.

## Leerling: de eerste keer aanmelden

1. Open Ontleedlab en klik **Snel Starten**, of stel een training samen.
2. Voer in **Oefenen voor je docent** de persoonlijke leerlingcode in.
3. Klik **Aanmelden en oefenen**.
4. Maak de sessie af. Het eindscherm meldt wanneer het werk werkelijk is
   ingestuurd. Bij een inzendfout is het resultaat nog niet centraal ontvangen.
5. Eigen ontvangen rapporten staan bij `#/mijn-voortgang`, onder
   **Ingestuurd werk voor je docent**. Lokale oefenvoortgang staat daar apart.

Op dezelfde browser blijft de leerlingaanmelding maximaal 30 dagen geldig.
De code wordt niet bij elke oefening opnieuw ingevoerd.

## Gratis omgeving en eenmalige codes

Deze versie gebruikt Cloudflare Free. Leerlingen hebben geen vaste loginnaam of
wachtwoord: hun vaste identiteit is het leerlingrecord van de docent. Eenmalig
betekent dat de code maar één aanmelding toestaat; de aanmelding zelf blijft op
dezelfde browser maximaal 30 dagen geldig. Geef na afmelden, laptopwissel of
verloop een nieuwe code voor het bestaande record. De historie blijft behouden.

**Vrij oefenen op dit apparaat** bewaart werk uitsluitend lokaal. Dat verschijnt
niet automatisch bij de docent. Een reserve-rapportcode voor lokale controle
is evenmin een geauthenticeerde centrale inzending.

## Nieuwe laptop, verlopen code of kwijtgeraakte aanmelding

Voor een nieuwe eenmalige code volg je onderstaande stappen.

1. De docent zoekt de bestaande leerling in **Beheer → Leerlingregister**.
2. Controleer naam, klas en leerling-ID; maak niet opnieuw dezelfde leerling aan.
3. Klik bij dat record **Nieuwe code** en bevestig.
4. De leerling meldt zich met die nieuwe code aan op de gewenste browser/laptop.

De vorige codes en aanmeldingen vervallen. Het leerling-ID en de ontvangen
rapporten blijven behouden. Lokale oefeningen, browserinstellingen en lokale
opdrachten worden hiermee niet automatisch naar de andere laptop overgezet.

Bij twee leerlingen met dezelfde naam gebruik je klas en leerling-ID om het
juiste record te kiezen. **Bewerken** wijzigt dat record zonder de historie
onder een andere identiteit te plaatsen.

## Wegwijs in de centrale docentomgeving

De hoofdroute voor ontvangen leerlingwerk is `#/usage`.

| Tab | Gebruik |
|---|---|
| **Overzicht** | Ontvangen sessies, actieve leerlingen, scores, terugkerende fouten en klas-/datum-/leerlingfilters |
| **Leerlingen** | Leerling kiezen, eerdere sessies en fouten bekijken, opgeslagen antwoorden vergelijken |
| **Zinnen** | Patronen in de ontvangen oefenresultaten per zin bekijken |
| **Beheer** | Leerlingen registreren, gegevens bewerken en codes vernieuwen |
| **Eigenaar** | Alleen voor owner: accountbeveiliging en technische/lokale beheerfuncties |

Klik **Verversen** om opnieuw rapporten op te halen. Docenten krijgen uitsluitend
rapporten van leerlingen die aan hun eigen register zijn gekoppeld. De eigenaar
kan alle registers zien. Technische diagnostiek en lokale feedbackinstellingen
in Eigenaar zijn geen centrale leerlingdatabasetabellen.

`#/docent-dashboard` is een bestaande **lokale** samenvatting. Die pagina verwijst
naar de centrale omgeving. Voor controle van werk dat op leerlinglaptops is
ingestuurd, gebruik je `#/usage`.

## Wat betekenen de cijfers?

- **Actieve leerlingen**: verschillende leerling-ID's met ontvangen rapporten;
  dit is niet hetzelfde als het aantal geregistreerde leerlingen of aanwezigheid.
- **Afgeronde sessies**: het aantal ontvangen rapporten; niet ieder lokaal
  gestart of afgebroken oefenmoment wordt ingestuurd.
- **Gemiddelde score in Overzicht/klassen**: alle goede zinsdelen gedeeld door
  alle beoordeelde zinsdelen; langere sessies wegen daardoor zwaarder mee.
- **Gemiddelde score per leerling**: het rekenkundige gemiddelde van de
  afzonderlijke rapportpercentages. Bij 1/2 en 8/8 is dat 75%; het samengenomen
  percentage is 9/10 = 90%. Deze twee gemiddelden hebben verschillende noemers.
- **In een keer goed**: het aandeel geregistreerde zinnen waarvan het opgeslagen
  eerste resultaat foutloos is; de noemer is zinnen, niet zinsdelen.
- **Terugkerende fouten**: dezelfde rolfout in minstens twee ontvangen sessies
  van hetzelfde leerling-ID. Dit is een signaal voor opvolging, geen bewijs van
  een specifieke leerstoornis of oorzaak.
- **Antwoord bekeken**: geregistreerd gebruik van antwoord tonen. Dit is iets
  anders dan algemene hintvragen of het aantal controleklikken.

Het rapportoverzicht ondersteunt filters. Sommige bovenste inzichten gebruiken
nog alle ontvangen rapporten en veranderen niet met alle filters. Centrale
rapporten bevatten geen volledig kliklog; onbekende aantallen herkansingen en
controleklikken mogen niet worden gelezen als nul. Scores zijn door de browser
aangeleverde oefenresultaten, geen fraudebestendige cijfers.

## Als aanmelden of insturen niet lukt

| Melding/situatie | Wat doe je? |
|---|---|
| Google-knop ontbreekt / dienst niet beschikbaar | Beheerder controleert Worker/D1/Google-configuratie en de live deployment |
| Geen toegang | Controleer gekozen Google-account en server-side rollenlijst |
| Docentsessie verlopen | Meld opnieuw aan via `#/login` |
| Leerlingcode ongeldig, verlopen of al gebruikt | Docent geeft een nieuwe code voor het bestaande leerling-ID |
| Leerlingaanmelding verlopen | Vraag een nieuwe code; nog niet ontvangen werk blijft lokaal |
| Rapport te groot | Gebruik een kleinere sessie; er geldt een begrensde requestgrootte |
| Te veel verzoeken | Wacht en probeer later; bij herhaling controleert de beheerder de limieten |
| Een leerling ontbreekt bij rapporten | Zoek eerst in het register; controleer aanmelden, afgeronde sessie en inzendstatus |

Voor het probleemonderzoek zijn foutmelding, tijdstip en leerling-ID voldoende.
Deel geen Google-token, leerlingcode, cookie of database-export in een openbare
melding. Het intrekken van **Andere docentsessies** in Eigenaar laat jouw huidige
ownersessie bestaan; andere staff-accounts moeten daarna opnieuw aanmelden.
