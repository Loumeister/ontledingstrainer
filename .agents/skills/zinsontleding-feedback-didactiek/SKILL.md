---
name: zinsontleding-feedback-didactiek
description: Ontwerp of review diagnostische Ontleedlab-feedback, hints en scaffolding voor lokale parsingfouten zoals splitsing, rolverwisseling, bijzinfunctie en gezegdeanalyse. Gebruik bij wijzigingen aan feedbackmatrices, feedbacklookup, validatiefeedback of leerlingcopy; niet voor algemene visuele styling.
---

# Ontwerp diagnostische parsingfeedback

## Lees eerst

1. Lees `shared/grammar-core/docs/parsing-didactics-kaders.md`.
2. Lees `zinsontleding-repo-inspector/references/repo-contract.md`.
3. Inspecteer de taakrelevante route in:
   - `src/constants.ts`;
   - `src/types.ts` (`FeedbackEntry` en `RichFeedbackEntry`);
   - `src/logic/validation.ts` en `src/logic/feedbackLookup.ts`;
   - `src/services/feedbackOverrides.ts`;
   - `src/components/FeedbackPanel.tsx` en `src/hooks/useTrainer.ts`.

## Didactisch contract

- Diagnoseer de vermoedelijke denkfout; meld niet alleen het juiste label.
- Geef één uitvoerbare herstelstap in de volgorde die de leerling kan toepassen.
- Bouw vanuit functies: vind waar nodig eerst persoonsvorm en onderwerp en ga daarna naar objecten, bepalingen, gezegde of bijzinfunctie.
- Houd leerlingtaal bondig, steunend en concreet.
- Beperk één feedbackmoment tot één primaire misconceptie.
- Maak onderscheid tussen een knipfout, een benoemingsfout en een combinatie van beide.
- Gebruik alleen lokale rol- en foutsignalen; introduceer geen canonieke misconceptiecode zonder governancewijziging in grammar-core.

Voor een `RichFeedbackEntry` gelden de runtime-invarianten:

- `herstelvraag` blijft kort en bevat één duidelijke actie;
- `sleutelwoord` is exact één woord dat letterlijk in `herstelvraag` voorkomt;
- `uitleg.diagnose` benoemt de waarschijnlijke aanpak;
- `uitleg.redenering` legt het relevante onderscheid uit;
- `uitleg.herstap` geeft één scherpe volgende vraag of handeling.

## Werkwijze

1. Reproduceer welke foutstatus en sleutel de evaluator werkelijk oplevert.
2. Traceer of een override de ingebouwde tekst vervangt.
3. Benoem de misconceptie en het risico voor de volgende denkstap.
4. Schrijf de kleinste feedback die de leerling opnieuw laat redeneren.
5. Controleer de tekst in de werkelijke componentcontext, inclusief compacte en uitgebreide toestand.
6. Voeg of wijzig gerichte tests voor lookup, fallback, override en relevante validatie-uitkomst.

## Outputcontract

Rapporteer per wijziging:

- `Trigger`: de exacte lokale foutstatus of lookup-sleutel;
- `Diagnosis`: de vermoedelijke denkfout;
- `Recovery`: de bedoelde leerlinghandeling;
- `Copy`: plakklare Nederlandse tekst of `RichFeedbackEntry`;
- `Evidence`: bronpad en test;
- `Residual risk`: resterende ambiguïteit of fallback.

## Grenzen

- Verander geen correcte analyse of score om feedbackcopy eenvoudiger te maken.
- Toon het antwoord niet voordat de bestaande check-flow dat toestaat.
- Verpak meerdere herstelvragen niet in één lange uitleg.
- Gebruik geen LLM-afhankelijke feedback in de leerlingloop.

## Voltooiingscriteria

- Iedere tekst is gekoppeld aan een echte evaluatorroute.
- De leerling krijgt diagnose én volgende stap.
- Lokale types en rendererinvarianten blijven geldig.
- Relevante tests en de volledige testsuite slagen.
