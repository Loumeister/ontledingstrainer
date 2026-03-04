# Handleiding Zinsontledingstrainer

Welkom bij de Zinsontledingstrainer! Deze app helpt je stap voor stap beter te worden in het ontleden van zinnen.

## Hoe werkt de app?

Je ontleedt elke zin in twee stappen:

1.  **Stap 1: Verdelen (Knippen)** ✂️
    *   Klik tussen de woorden om de zin in stukjes (zinsdelen) te knippen.
    *   Foutje gemaakt? Klik nog een keer op het schaartje om de delen weer aan elkaar te plakken.
    *   *Tip:* Een lidwoord (de/het/een) staat nooit alleen!

2.  **Stap 2: Benoemen (Slepen)** 🏷️
    *   Sleep de gekleurde kaartjes (zoals 'Onderwerp' of 'Persoonsvorm') naar het juiste zinsdeel.
    *   Je kunt ook kaartjes op specifieke woorden slepen (zoals 'Onderschikkend VW' in een bijzin).
    *   Klaar? Klik op **Controleren**.

---

## Hulp nodig?
Kom je er niet uit?
*   **Geef Hint:** Klik op deze knop voor een slimme tip. De app kijkt wat je nog mist (eerst de PV, dan het Onderwerp, etc.).
*   **Foutmeldingen:** Als je iets verkeerd sleept, krijg je vaak een uitleg *waarom* het niet klopt.

---

## Het Startscherm: Wat kies ik?

Je kunt de training helemaal aanpassen aan jouw niveau.

### 1. Moeilijkheidsgraad
*   **Basis:** Korte zinnen, geen ingewikkelde bijzinnen.
*   **Middel:** Langere zinnen, soms met voorzetselvoorwerp.
*   **Hoog:** Moeilijke zinnen met bijvoorbeeld bijstellingen.
*   **Alles:** Een mix van alle niveaus door elkaar (behalve samengesteld).

### 2. Soort Zinnen
*   **Werkwoordelijk (WG):** Zinnen met "normale" werkwoorden (lopen, fietsen, slapen).
*   **Naamwoordelijk (NG):** Zinnen met koppelwerkwoorden (zijn, worden, blijven, blijken, lijken, heten, dunken, voorkomen).
*   **Samengestelde zinnen:** Vink dit aan om te oefenen met hoofdzinnen en bijzinnen.

### 3. Specifiek Oefenen (Focus)
Wil je extra trainen op één onderdeel? Vink deze dan aan. De app zoekt dan alleen zinnen uit waarin dat specifieke onderdeel zit.
*   *Bijvoorbeeld:* Vink **Lijdend Voorwerp** aan als je dat lastig vindt. Je krijgt dan alleen zinnen die een LV hebben.

### 4. Onderdelen (Moeilijkheid)
Hiermee kun je bepaalde lastige onderdelen "uitzetten" als je ze nog niet hebt gehad in de les.
*   **Bijstelling:** (Jan, *mijn broer*, komt langs).
*   **Bijvoeglijke bepaling:** (De *rode* auto).

---

## 👩‍🏫 Docentenmodus (Eigen zinnen maken)

De app heeft een ingebouwde editor waarmee docenten eigen zinnen kunnen aanmaken en delen met leerlingen.

### Toegang

Navigeer naar de volgende URL (niet gelinkt in de interface voor leerlingen):
```
<app-url>/editor
```
of de hash-variant: `<app-url>/#/editor`

De editor vraagt om een pincode. De standaard pincode is **1234**. Vraag je schoolbeheerder als de pincode is gewijzigd.

### Wat kun je in de editor?

*   **Nieuwe zin aanmaken:** Typ een zin in, deel hem op in zinsdelen en ken grammaticale rollen toe aan elk zinsdeel.
*   **Bestaande zinnen bekijken en kopiëren:** Je kunt alle ingebouwde zinnen inzien en als basis voor eigen varianten gebruiken.
*   **Eigen zinnen bewerken of verwijderen:** Gemaakte zinnen zijn te bewerken en te verwijderen via de lijst.
*   **Exporteren:** Download je eigen zinnen als een `.json`-bestand (`docent-zinnen.json`).
*   **Delen via URL:** Genereer een deellink. Leerlingen openen die link en kunnen direct oefenen met jouw zinnen — zonder account of installatie.

### Workflow: zinnen delen met leerlingen

1.  Open de editor door naar `<app-url>/editor` te navigeren.
2.  Maak één of meer zinnen aan.
3.  Klik op **Kopieer deellink** (of exporteer het `.json`-bestand).
4.  Stuur de link (of het bestand) naar je leerlingen:
    *   **Via link:** Leerlingen openen de link in de browser en zien bovenaan een gele banner "Zinnen van je docent". Ze klikken op **Oefenen met docentzinnen**.
    *   **Via bestand:** Leerlingen klikken op **Importeer zinnen (.json)** op het startscherm en laden het bestand in.

### Technische details

*   Eigen zinnen worden lokaal opgeslagen in de browser (`localStorage`). Ze zijn alleen zichtbaar op het apparaat waarop ze zijn aangemaakt.
*   Via de deellink worden de zinnen versleuteld meegestuurd in de URL. Er is geen server of account nodig.
*   De pincode beschermt de editor tegen onbedoeld gebruik door leerlingen op een gedeeld apparaat. Hij biedt geen volledige beveiliging; gebruik hem niet voor gevoelige gegevens.
