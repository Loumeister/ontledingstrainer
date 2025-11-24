## Toekomstvisie: Samengestelde Zinnen

Om in de toekomst samengestelde zinnen (hoofd- en bijzinnen) te ondersteunen, moet de datastructuur worden aangepast.

**Architectuurplan:**
De structuur evolueert van `Sentence -> Tokens[]` naar `Sentence -> Clause[] -> Tokens[]`.

**Voorgestelde Interfaces:**
```typescript
interface Clause {
  id: string;
  type: 'hoofdzin' | 'bijzin';
  tokens: Token[];
  // Elke clause wordt onafhankelijk ontleed (PV, OW, etc.) binnen zijn eigen context.
}

interface ComplexSentence extends Sentence {
  clauses: Clause[];
  conjunctions: Token[]; // Voegwoorden die clauses verbinden
}
```

**UI Wijzigingen:**
1.  **Stap 0 (Nieuw)**: Zin splitsen in deelzinnen (Clauses). Sleep een scheidingslijn tussen clauses.
2.  **Stap 1 & 2**: De huidige stappen (verdelen en benoemen) uitvoeren per clause (bijv. via tabbladen of onder elkaar).
