# Google Sheets-koppeling

Ontleedlab kan sessierapporten via een Google Apps Script Web App in een Sheet van de docent bewaren. Dit is de huidige operationele route, niet de beoogde definitieve gegevenslaag.

## Wat wordt verstuurd

Een verzonden rij bevat tijdstip, voornaam, initiaal, klas en rapportcode. De rapportcode is alleen gecodeerd, niet versleuteld, en bevat oefenresultaten. Alle waarden en de gedeelde API-sleutel gaan nu als queryparameters in een GET-URL.

De sleutel is daardoor geen geheim: zij staat in de browser en kan in URL-logs terechtkomen. De PIN op docentroutes is eveneens client-side toegangsbeperking. Gebruik beide alleen als drempel tegen toevallig gebruik, niet als sterke autorisatie.

## Inrichten

1. Maak een lege Google Sheet en open **Uitbreidingen → Apps Script**.
2. Plaats `apps-script/Code.gs` in het scriptproject.
3. Voeg onder **Projectinstellingen → Scripteigenschappen** een niet-lege `API_KEY` toe. Zonder deze property weigert het script lezen en schrijven.
4. Implementeer het script als Web App, uitgevoerd als de eigenaar en bereikbaar voor de gebruikers van Ontleedlab.
5. Open `/#/usage` in Ontleedlab en sla dezelfde Web App-URL en API-sleutel op.
6. Verstuur één testresultaat en controleer daarna zowel de Sheet als het docentoverzicht.

Bij een wijziging van `Code.gs` moet een nieuwe Apps Script-versie worden geïmplementeerd. Bewaar URL en sleutel niet in documentatie, issues of screenshots.

## Gebruik zolang deze route actief is

- verzamel alleen gegevens die voor de oefenbeslissing nodig zijn
- beperk wie de Sheet en de Apps Script-configuratie kan openen
- verwijder oude rijen volgens de eigen bewaartermijn
- behandel export- en reservecodes als leerlinggegevens
- controleer na configuratiewijzigingen dat een onjuiste sleutel wordt geweigerd

## Beoogde vervanging

De voorkeursrichting is server-side geautoriseerde opslag met een willekeurige leerlingcode. Naam en klas verdwijnen dan uit app en database. Alleen de docent bewaart buiten het systeem de koppeling tussen leerling en code.

Voor die migratie moeten eerst de minimale velden, bewaartermijn, autorisatierollen, export/verwijdering en sleutelrotatie worden vastgelegd. Tot dat besluit blijft de bestaande Sheets-koppeling functioneel, maar wordt zij niet als beveiligde leerlingadministratie beschreven.
