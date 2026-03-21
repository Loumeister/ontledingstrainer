# Google Drive Koppeling – Setup en Gebruik

## Overzicht

Leerlingenresultaten worden automatisch verstuurd naar een Google Sheet via een
Google Apps Script Web App. De docent/eigenaar haalt de resultaten op met één
druk op de knop in `/#/usage`.

```
Leerling (browser)
  └─ ScoreScreen: naam + initiaal + klas invullen → "Verstuur naar docent"
       └─ GET-request → Apps Script URL
            └─ Apps Script voegt rij toe aan Google Sheet

Docent (/#/usage, PIN 4321)
  └─ "Haal resultaten op uit Drive"
       └─ GET-request → Apps Script URL
            └─ Apps Script leest Sheet → app toont data, filters op klas/leerling
```

---

## Eenmalige setup (±10 minuten)

### Stap 1 – Maak een Google Sheet aan

1. Ga naar [sheets.google.com](https://sheets.google.com) en maak een nieuw leeg spreadsheet.
2. Geef het een duidelijke naam, bijv. **"Zinsontledingstrainer – Resultaten"**.
3. Laat het tabblad leeg; de Apps Script maakt automatisch een tabblad "Resultaten" aan.

### Stap 2 – Maak een Apps Script aan

1. Open in het spreadsheet: **Uitbreidingen → Apps Script**.
2. Verwijder de bestaande code in `Code.gs`.
3. Kopieer de inhoud van `apps-script/Code.gs` (uit deze repository) en plak die.
4. Klik op het **Opslaan**-icoon (diskette of Ctrl+S).

### Stap 3 – Haal de API-sleutel op uit de app

De app genereert automatisch een unieke API-sleutel. Haal die als volgt op:

1. Open de **Zinsontledingstrainer** in een ander browsertabblad.
2. Ga naar `/#/usage` en voer PIN **4321** in.
3. Scroll naar **🔗 Google Drive koppeling**.
4. Klik op de **Kopieer**-knop naast de API-sleutel — de sleutel staat nu op je klembord.

Ga nu terug naar het **Apps Script**-tabblad:

5. Klik op het **tandwielpictogram** links (Projectinstellingen).
6. Scroll naar **Scriptproperty's** → klik **Scriptproperty toevoegen**.
7. Vul in:
   - **Eigenschap**: `API_KEY`
   - **Waarde**: *(plak hier de zojuist gekopieerde sleutel)*
8. Klik **Scriptproperty's opslaan**.

### Stap 4 – Deploy als Web App

1. Klik in Apps Script rechtsboven op **Deployen → Nieuwe implementatie**.
2. Kies type: **Web App**.
3. Stel in:
   - **Uitvoeren als**: Ik *(jouw Google-account)*
   - **Wie heeft toegang**: Iedereen
4. Klik **Implementeren**.
5. Kopieer de **Web App URL** (begint met `https://script.google.com/macros/s/...`).

> **Let op**: elke keer dat je de script-code aanpast, moet je een **nieuwe implementatie**
> maken (niet "implementatie beheren" gebruiken voor codewijzigingen).

### Stap 5 – Voer URL en sleutel in de app in

1. Open de app en ga naar `/#/usage`.
2. Voer de eigenaar-PIN in: **4321**.
3. Scroll naar **🔗 Google Drive koppeling**.
4. Plak de **Web App URL** in het URL-veld.
5. Plak (of genereer) de **API-sleutel** in het sleutelveld.
6. Klik **Sla koppeling op**.

De koppeling is nu actief. Leerlingen kunnen resultaten insturen en jij kunt ze ophalen.

---

## Dagelijks gebruik

### Voor leerlingen

Aan het einde van een oefensessie (ScoreScreen):

1. Vul in: **voornaam**, **eerste letter van de achternaam** en **klasnaam**
   (bijv. `1ga`, `2hv3`, `3h5`).
2. Klik op **"Verstuur naar docent"**.
3. Bij succes zie je een groene bevestiging.
4. Mislukt het (geen internet, fout)? Kopieer de **reservecode** en geef die aan de docent.

### Voor de docent – resultaten ophalen

1. Ga naar `/#/usage` en voer PIN **1234** of **4321** in.
2. Klik op **"📡 Haal resultaten op uit Drive"**.
3. De rapporten worden ingeladen (elke keer vers opgehaald – niets wordt lokaal opgeslagen).
4. Gebruik de dropdowns om te filteren op **klas** of **leerling**.
5. Klik op een klas in de klastabel om direct op die klas te filteren.

> **Klasnamen** worden automatisch genormaliseerd naar kleine letters:
> `1GA`, `1ga` en `1Ga` worden allemaal als `1ga` herkend.

---

## Eigen Drive koppelen (voor andere docenten)

Elke docent kan een eigen Google Sheet koppelen:

1. Voer stappen 1–4 hierboven uit met **je eigen Google-account**.
2. Ga naar `/#/usage` (eigenaar-PIN: **4321**).
3. Vul bij **🔗 Google Drive koppeling** de eigen Web App URL en API-sleutel in.
4. Sla op.

De URL en sleutel worden opgeslagen in de `localStorage` van de browser.
Verschillende docenten die de app op verschillende computers gebruiken,
kunnen zo elk hun eigen Sheet koppelen.

---

## Onderhoud

### Quota-limieten (geen probleem in de praktijk)

| Limiet | Waarde |
|--------|--------|
| Maximale uitvoertijd Apps Script | 6 minuten per aanroep |
| Aanroepen per dag | 100.000 (gratis) |
| Sheet-rijen | ~10 miljoen (Google Sheets limiet) |

Een schoolklas van 30 leerlingen die dagelijks oefenen genereert ~30 aanroepen per dag,
ruim onder de grenzen.

### Sheet opschonen

Data wordt nooit automatisch gewist. Als de Sheet te groot wordt (na jaren gebruik):

1. Open de Sheet in Google Sheets.
2. Selecteer en verwijder oude rijen (bijv. van vorig schooljaar).
3. Of maak een nieuw tabblad voor het nieuwe schooljaar en pas `SHEET_NAME` aan in `Code.gs`
   (vergeet dan niet opnieuw te deployen).

### Back-up

De Sheet staat in Google Drive – Google maakt automatisch versiegeschiedenissen bij.
Voor een extra back-up: **Bestand → Downloaden → CSV** of gebruik de dagelijkse
download-knop in de app (`⬇ Download gegevens`).

### Apps Script aanpassen

Als je `Code.gs` aanpast:

1. Sla op in de Apps Script editor.
2. Klik **Deployen → Nieuwe implementatie** (niet "bewerken"!).
3. Kopieer de **nieuwe URL** en voer die in bij de koppeling in de app.
   (De oude URL werkt nog, maar is niet bijgewerkt.)

---

## Probleemoplossing

| Probleem | Oplossing |
|----------|-----------|
| Leerling ziet "versturen mislukt" | Controleer of de URL correct is ingesteld; leerling kan de reservecode kopiëren |
| "Ongeautoriseerd" bij ophalen | API-sleutel in app en in Apps Script Properties kloppen niet overeen |
| Geen resultaten na ophalen | Controleer of de Sheet het tabblad "Resultaten" heeft; eerste keer: leerlingen moeten eerst iets insturen |
| 404 / "Script not found" | De Web App URL is verlopen na een nieuwe implementatie – voer de nieuwe URL in |
| CORS-fout in console | Normaal gedrag bij sommige browsers; data wordt toch verstuurd |

---

## Veiligheid

- De Web App URL is een lange willekeurige string (niet raadbaar, niet publiek geïndexeerd).
- De API-sleutel voegt een extra laag toe: alleen aanroepen met de juiste sleutel worden verwerkt.
- Opgeslagen data: voornaam, eerste letter achternaam, klas en oefenscores. Geen wachtwoorden of gevoelige persoonsgegevens.
- De Sheet staat in jouw persoonlijke Google Drive – alleen jij hebt rechtstreeks toegang.
- Voor hogere veiligheidseisen: beperk toegang in Apps Script tot specifieke Google-accounts
  (verander "Wie heeft toegang" van "Iedereen" naar "Iedereen binnen [jouw domein]").
