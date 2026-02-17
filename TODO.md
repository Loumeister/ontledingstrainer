# TODO & Roadmap

Dit document bevat de toekomstplannen en ideeën voor de Zinsontledingstrainer, gebaseerd op recent didactisch onderzoek (o.a. Chamalaun 2023, Steenbakkers, SLO-leerlijnen, 'Spelling en didactiek' 2024).

---

## Prioriteit 1: Didactische Versterking (Korte termijn)

Deze functies zijn het meest urgent op basis van wetenschappelijke inzichten en verhogen de leerkwaliteit direct.

### 1. Gefaseerde Modus ("Veel kennis van weinig")
*Bron: Steenbakkers, cognitieve belastingtheorie*

De huidige app biedt alle zinsdelen tegelijk aan. De theorie benadrukt dat leerlingen beter presteren wanneer ze eerst één concept volledig beheersen voordat het volgende wordt geïntroduceerd.

**Implementatie:**
*   **Fase 1 - PV vinden:** Leerling hoeft alleen de persoonsvorm te identificeren (tijds-/getalsproef).
*   **Fase 2 - PV + OW:** Persoonsvorm + onderwerp.
*   **Fase 3 - PV + OW + LV/MV:** Kern-zinsdelen.
*   **Fase 4 - Alles:** Volledige ontleding (huidige werking).
*   Per fase een **100%-beheersingscriterium** voordat de volgende fase ontsluit.
*   Dit kan naast de huidige vrije modus bestaan als "Leermodus".

### 2. Interactieve Beslisboom / Stappenplan
*Bron: algoritmische werkwijze als controlemechanisme*

Een visueel, uitklapbaar hulpmiddel dat de leerling stap voor stap door de ontleding begeleidt:
1.  Zoek de persoonsvorm (tijdsproef: verander de zin van tijd)
2.  Zoek het onderwerp (Wie of wat + PV?)
3.  Bepaal het gezegde (WG of NG?)
4.  Zoek overige zinsdelen (LV: Wie/wat + GZ + OW? MV: Aan/voor wie? BWB: Waar/wanneer/hoe?)

Dit is fundamenteel anders dan de huidige hint-knop: het is een permanent beschikbaar referentie-instrument (vergelijk: "spiekbriefje" uit de methode Blink).

### 3. Kwalitatieve Foutenanalyse
*Bron: 'Spelling en didactiek' (2024), kwalitatieve foutenanalyse*

De huidige `mistakeStats` telt alleen *welk zinsdeel* fout is. De theorie onderscheidt drie fouttypen die elk een andere interventie vragen:

| Fouttype | Definitie | Voorbeeld | Interventie |
|----------|-----------|-----------|-------------|
| **Analysefout** | Grammaticale status verkeerd bepaald | PV niet herkend | Meer oefenen met tijdsproef |
| **Toepassingsfout** | Regel bekend, verkeerd uitgevoerd | OW en LV verwisseld | Gerichte feedback over de vraagmethode |
| **Inprentfout** | Verkeerd patroon ingeslepen | Steeds BWB i.p.v. VV | Herhaalde blootstelling aan correct patroon |

**Implementatie:** Classificeer fouten automatisch op basis van de FEEDBACK_MATRIX en toon dit in het sessie-overzicht.

### 4. Theorie-tooltips (Taalbeschouwing)
*Bron: taalbeschouwelijke insteek, vaktermen als denkinstrument*

Een (?) icoontje bij elke rol in de toolbar. Bij hover/klik verschijnt:
*   **Definitie** + **vraagmethode** (bv. "Onderwerp: Wie of wat + gezegde?")
*   **Waarom?** - korte taalkundige uitleg (bv. "Het onderwerp bepaalt de vervoeging van de persoonsvorm: 'ik loop' vs. 'hij loopt'.")
*   **Veelgemaakte fout** (bv. "Let op: in inversie-zinnen staat het OW achter de PV!")

---

## Prioriteit 2: Gamification & Motivatie (Korte termijn)

### 5. Confetti & Visuele Beloning
*   **Confetti-effect** (bv. `canvas-confetti`) bij foutloze zin of sessie.
*   **Streak-systeem** in `localStorage`: dagen achter elkaar geoefend, zinnen achter elkaar goed.
*   **Badges:** "PV Meester" (10x PV goed), "Ontleedkampioen" (sessie 100%), etc.

### 6. "Kijk terug"-functie (Reflectie)
*Bron: revisiefase, spellingbewustzijn*

Na het afronden van een sessie: bekijk gemaakte fouten met de juiste analyse ernaast. De leerling kan per fout zien:
*   Wat hij/zij koos
*   Wat het juiste antwoord was
*   Welk type fout het was (analyse/toepassing/inprenting)
*   Een gerichte tip

---

## Prioriteit 3: UX & Toegankelijkheid (Korte termijn)

### 7. Dyslexie-modus
Een schakelaar voor een dyslexie-vriendelijk font (OpenDyslexic of vergelijkbaar) met extra spatiëring.

### 8. Dark Mode (deels geïmplementeerd)
Systeemvoorkeuren detectie (`prefers-color-scheme`) voor automatische dark mode. Basis is al aanwezig.

---

## Prioriteit 4: Nieuwe Modules (Middellange termijn)

### 9. Werkwoordspelling-module
*Bron: integrale benadering grammatica-spelling, Chamalaun (2023)*

Een aparte module die voortbouwt op de grammaticakennis uit de zinsontledingstrainer. De zinsontleding is de **voorwaarde** voor correcte werkwoordspelling.

**Submodules (modulair, niet lineair):**
*   **PV in tegenwoordige tijd:** stam + t-regel, met analogie-hulp ("denk aan lopen")
*   **Homofoon-training:** wordt/word, vind/vindt met visuele waarschuwingen
*   **Verleden tijd:** zwakke werkwoorden met 't kofschip
*   **Voltooid deelwoord:** ge- + stam + d/t
*   **Alles samen:** integrale oefening

**Didactische principes:**
*   Expliciete Directe Instructie (EDI): worked examples bij nieuwe concepten
*   Homofoondominantie tegengaan: extra herhaling van de minder-frequente vorm
*   Adaptieve herhaling: foutieve items komen terug
*   100%-beheersingscriterium per submodule

### 10. Foutentekst-modus (Transfer naar schrijven)
*Bron: transfer naar schrijfvaardigheid, revisiefase*

Een module waarin leerlingen een tekst krijgen met grammaticafouten en deze moeten markeren/corrigeren. Dit traint het spellingbewustzijn in de context van schrijven, niet als geïsoleerde invuloefening.

### 11. Peer-review Modus
*Bron: peer-response als werkvorm*

Leerlingen controleren elkaars ontledingen. Doordat ze zich niet hoeven te concentreren op de inhoud (die staat er al), kunnen ze al hun cognitieve capaciteit inzetten voor de grammaticale analyse.

---

## Prioriteit 5: Architectuur (Nodig voor Prioriteit 4)

### 12. App.tsx Opsplitsen in Modules
Het huidige `App.tsx` (950 regels) bevat alle logica en UI. Voor uitbreidbaarheid opsplitsen in:
*   `screens/HomeScreen.tsx`
*   `screens/TrainerScreen.tsx`
*   `screens/ScoreScreen.tsx`
*   `hooks/useSession.ts`
*   `hooks/useValidation.ts`

### 13. Module-router
Een eenvoudige router (of state-based navigatie) om te kiezen tussen:
*   Zinsontleding (huidige app)
*   Werkwoordspelling (nieuwe module)
*   Foutentekst (nieuwe module)

### 14. Samengestelde Zinnen (Complexe Zinnen)
De datastructuur evolueert van `Sentence -> Tokens[]` naar `Sentence -> Clause[] -> Tokens[]`.

```typescript
interface Clause {
  id: string;
  type: 'hoofdzin' | 'bijzin';
  tokens: Token[];
}

interface ComplexSentence extends Sentence {
  clauses: Clause[];
  conjunctions: Token[];
}
```

**UI Wijzigingen:**
1.  **Stap 0 (Nieuw)**: Zin splitsen in deelzinnen.
2.  **Stap 1 & 2**: Verdelen en benoemen per clause.

### 15. Backend & Integratie (Lange termijn)
*   Koppeling met ELO's (Magister/SOM) via LTI.
*   Centrale database voor voortgangsanalyse door docenten.
*   Datamonitoring: docent ziet direct struikelblokken per leerling.

---

## Wetenschappelijke Referenties

| Bron | Relevant inzicht |
|------|-----------------|
| Chamalaun (2023) | Grammaticakennis essentieel voor homofone werkwoordsvormen |
| Chamalaun et al. (2022) | Expliciete link grammatica-spelling = minder fouten |
| 'Spelling en didactiek' (2024) | Kwalitatieve foutenanalyse, vaktermen als denkinstrument |
| Steenbakkers - Diploma werkwoordspelling | "Veel kennis van weinig", computersturing, niveaus |
| De Staat van het Onderwijs 2025 | 20% scholen onvoldoende, didactisch handelen tekortschiet |
| SLO referentieniveaus | 2F = einde onderbouw vo, volledige werkwoordspelling |
| Cognitieve belastingtheorie | Werkgeheugen overbelast bij schrijven → automatisering nodig |
| Methode Blink | Spiekbriefje als hulpmiddel, functioneel inzetten van kennis |
