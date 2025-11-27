# Zinsontledingstrainer - Technische Documentatie

Dit is de technische documentatie voor de Zinsontledingstrainer. Deze app is gebouwd met **React**, **TypeScript**, **Vite** en **Tailwind CSS**.

## 🛠️ Installatie & Development

1.  **Clone de repository:**
    ```bash
    git clone <jouw-repo-url>
    cd zinsontledingstrainer
    ```
2.  **Installeer dependencies:**
    ```bash
    npm install
    ```
3.  **Start lokale server:**
    ```bash
    npm run dev
    ```
    De app draait nu op `http://localhost:5173/` (of vergelijkbaar).

## 🚀 Deployment (GitHub Pages)

De app moet gebuild worden omdat browsers geen TypeScript (`.tsx`) begrijpen.

**Automatisch deployen (aanbevolen):**
1.  Zorg dat je ingelogd bent bij git.
2.  Run: `npm run deploy`
    *   Dit script bouwt de app (`npm run build`).
    *   Het pusht de inhoud van de `dist` map naar de `gh-pages` branch.

**Handmatig:**
1.  Run: `npm run build`
2.  Upload de inhoud van de map `dist` naar je webserver.

---

## 📝 Content Management (Nieuwe zinnen toevoegen)

Alle zinnen en regels staan in `constants.ts`.

### 1. Datastructuur van een zin
Voeg nieuwe zinnen toe aan de `SENTENCES` array:

```typescript
{
  id: 301,                        // Uniek nummer
  label: "Zin 301: Korte naam",   // Zichtbaar in dropdown
  predicateType: 'WG',            // 'WG' (Werkwoordelijk) of 'NG' (Naamwoordelijk)
  level: 2,                       // 1=Basis, 2=Middel, 3=Hoog, 4=Samengesteld
  tokens: [                       // De woorden
    { id: "s301t1", text: "Ik", role: "ow" },
    { id: "s301t2", text: "loop", role: "pv" },
    // ...
  ]
}
```

### 2. Belangrijke Regels

#### A. Aaneengesloten zinsdelen
De app voegt automatisch opeenvolgende woorden met dezelfde `role` samen tot één blokje.
*   *Voorbeeld:* "De (ow) boze (ow) man (ow)" wordt één blok "De boze man".

#### B. De `newChunk` regel (Cruciaal!)
Als twee *verschillende* zinsdelen naast elkaar staan die *toevallig* dezelfde rol hebben (bijv. twee keer BWB), moet je de app vertellen waar de knip zit.
Gebruik `newChunk: true` op het **eerste woord** van het **tweede** zinsdeel.

```typescript
{ text: "Gisteren", role: "bwb" },
{ text: "in de tuin", role: "bwb", newChunk: true }, // Forceer splitsing!
```

#### C. Samengestelde Zinnen (Niveau 4)
We onderscheiden twee typen voegwoorden:

1.  **Onderschikkend (dat, omdat, als...):**
    *   De hele bijzin krijgt `role: 'bijzin'`.
    *   Het voegwoord zit *in* de bijzin en krijgt `subRole: 'vw_onder'`.
    
2.  **Nevenschikkend (en, maar, want...):**
    *   Het voegwoord staat *tussen* de zinnen.
    *   Het krijgt een eigen blokje met `role: 'vw_neven'`.

---

## 🏗️ Toekomstvisie (Architectuur)

Om in de toekomst diepere ontleding *binnen* bijzinnen mogelijk te maken, moet de datastructuur evolueren van een platte lijst tokens naar een boomstructuur:

```typescript
interface Clause {
  id: string;
  type: 'hoofdzin' | 'bijzin';
  tokens: Token[]; // Eigen ontleding binnen deze clause
}

interface ComplexSentence extends Sentence {
  clauses: Clause[];
  conjunctions: Token[];
}
```
