# Zinsontledingstrainer

De **Zinsontledingstrainer** is een interactieve, educatieve webapplicatie waarmee leerlingen het ontleden van zinnen kunnen oefenen. De applicatie is didactisch opgebouwd en ondersteunt het splitsen van zinnen in zinsdelen (chunking) gevolgd door het benoemen ervan.

## Functionaliteiten

### Het Oefenproces
De app hanteert een **twee-stappen** didactiek:
1.  **Stap 1: Verdelen**: De leerling klikt tussen de woorden om de zin in de juiste zinsdelen te knippen.
2.  **Stap 2: Benoemen**: De leerling sleept de juiste termen (zoals Persoonsvorm, Onderwerp, Lijdend Voorwerp) naar de gemaakte zinsdelen.

### Oefenmodi
*   **Vrij oefenen**: De leerling kan specifiek één zin uit de lijst kiezen om te oefenen.
*   **Oefensessie**: De leerling start een sessie met een zelfgekozen aantal zinnen (bijv. 10 willekeurige zinnen). Aan het einde volgt een resultatenscherm met een percentuele score en een foutenanalyse.

### Instellingen & Differentiatie
Op het startscherm kan de training op maat worden gemaakt:
*   **Moeilijkheidsgraad**: Filter zinnen op niveau (Basis, Middel, Hoog).
*   **Type Gezegde**: Oefen alleen met Werkwoordelijk Gezegde (WG), Naamwoordelijk Gezegde (NG), of allebei.
*   **Optionele onderdelen**: De volgende onderdelen kunnen aan/uit worden gezet:
    *   *Bijstelling*
    *   *Bijvoeglijke Bepaling* (benoemen op woordniveau binnen een zinsdeel)
    *   *Voorzetselvoorwerp*

### Feedback
De applicatie geeft directe feedback na het controleren:
*   Zijn de zinsdelen correct geknipt?
*   Zijn de juiste namen aan de zinsdelen gegeven?
*   Zijn eventuele sub-rollen (zoals bijvoeglijke bepalingen) correct geplaatst?
*   De knop "Toon antwoord" laat de volledige uitwerking zien (dit levert 0 punten op in een sessie).

## Bestandsstructuur

*   **`index.html`**: De basis HTML-pagina die de applicatie laadt.
*   **`App.tsx`**: De hoofdcomponent. Hierin zit de logica voor navigatie, state management (sessies, scores) en validatie van de antwoorden.
*   **`constants.ts`**: De database. Dit bestand bevat alle oefenzinnen (`SENTENCES`) en de definities van de grammaticale rollen (`ROLES`).
*   **`types.ts`**: De TypeScript definities voor datastructuren zoals `Sentence`, `Token`, en `RoleKey`.
*   **`components/`**:
    *   `DropZone.tsx` (SentenceChunk): Het visuele blokje van een zinsdeel. Handelt de logica voor splitsen en het ontvangen van gesleepte labels af.
    *   `WordChip.tsx` (DraggableRole): De sleepbare knoppen met de namen van de zinsdelen.

## Zinnen Toevoegen & Beheren

Alle data staat in `constants.ts`. Om een nieuwe zin toe te voegen, voeg je een object toe aan de `SENTENCES` array.

### Datastructuur van een zin

```typescript
{
  id: 129,                    // Uniek nummer
  label: "Titel van de zin",  // Zichtbaar in selectielijst
  predicateType: 'WG',        // 'WG' (Werkwoordelijk) of 'NG' (Naamwoordelijk)
  level: 2,                   // 1 (Basis), 2 (Middel), 3 (Hoog)
  tokens: [
    // Elk woord is een apart object
    { id: "s129t1", text: "De", role: "ow" }, 
    { id: "s129t2", text: "man", role: "ow" },
    { id: "s129t3", text: "loopt", role: "pv" },
    { id: "s129t4", text: "op", role: "bwb" },
    { id: "s129t5", text: "straat", role: "bwb" }, 
    // ...
  ]
}
```

### Belangrijke aandachtspunten

1.  **`role`**: De grammaticale rol van het **zinsdeel** waar het woord in zit (bv. `pv`, `ow`, `lv`, `bwb`).
2.  **`subRole`**: (Optioneel) De rol van het **woord zelf**, bijvoorbeeld `bijv_bep` (bijvoeglijke bepaling).
3.  **`newChunk`**: (Belangrijk!) Als twee zinsdelen met **dezelfde rol** direct achter elkaar staan (bijvoorbeeld twee keer een `bwb`), plak de applicatie ze standaard aan elkaar. Om aan te geven dat het tweede deel los moet staan, geef je het eerste woord van dat tweede deel de eigenschap `newChunk: true`.

    *Voorbeeld:* "... [gisteren] [hard] ..." (beide BWB).
    ```typescript
    { id: "...", text: "gisteren", role: "bwb" },
    { id: "...", text: "hard", role: "bwb", newChunk: true }, // start nieuwe BWB
    ```

## Technologie

De applicatie is gebouwd met:
*   **React**: Voor de gebruikersinterface en logica.
*   **TypeScript**: Voor type-veiligheid en structuur.
*   **Tailwind CSS**: Voor de styling.

