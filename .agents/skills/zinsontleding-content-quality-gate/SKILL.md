---
name: zinsontleding-content-quality-gate
description: Beoordeel wijzigingen aan Ontleedlab-zinnen en annotaties op schema, lokale rollen, chunkgrenzen, eenduidige schoolanalyse, didactische focus en niveauopbouw. Gebruik na contentauthoring, bij zinnenbankreviews en vóór vrijgave van gewijzigde `sentences-level-*.json`; niet voor feedbackcopy of UI-audits.
---

# Poort voor zinnenkwaliteit

## Benodigde context

1. Gebruik `zinsontleding-repo-inspector`.
2. Lees `shared/grammar-core/docs/content-authoring-rules.md`.
3. Lees de gewijzigde items, nabije items in hetzelfde niveau, `src/types.ts`, `src/constants.ts` en de taakrelevante evaluator.
4. Lees `docs/sentence-parse-audit.md` of `docs/sentence-coverage-audit.md` alleen wanneer de wijziging hun claims raakt.

## Deterministische controles

Controleer voor iedere wijziging:

- geldig JSON en een objectvorm die overeenkomt met de actuele `Sentence`- en `Token`-typen;
- repo-unieke numerieke zins-ID's en unieke token-ID's binnen ieder item;
- bestaand niveau `0`–`4` en geldig `predicateType`;
- alleen actieve lokale rollen en ondersteunde subrollen;
- correcte aaneengesloten chunks en doelbewust gebruik van `newChunk`;
- geldige verwijzingen vanuit `bijvBepTarget`;
- consistente `bijzinFunctie`, `subRole` en eventuele `alternativeRole`;
- geen hardcoded duplicaat in UI-code.

Voer na contentwijzigingen uit:

```text
node scripts/regenerate_sentence_docs_and_validate.cjs
npm test
```

Voer `npm run build` uit wanneer typen, loaders of runtimeconsumptie zijn geraakt.

## Inhoudelijke controles

1. Ontleed de zin onafhankelijk van de opgeslagen annotatie.
2. Controleer de persoonsvorm met tijdproef of ja-neevraag en het onderwerp met congruentie.
3. Controleer ieder zinsdeel en iedere interne rol op één gangbare schoolanalyse.
4. Beoordeel of de moeilijkheid past bij de lokale niveau-opbouw.
5. Beoordeel of de zin één herkenbare hoofdfocus heeft en natuurlijk Nederlands blijft.
6. Vergelijk op dubbelingen; accepteer herhaling alleen met aantoonbare oefenwaarde.
7. Wijs een kandidaat af wanneer `alternativeRole` alleen een structurele of semantische dubbellezing maskeert.

## Besliscontract

Geef per item precies één uitkomst:

- `ACCEPT`: schema en analyse zijn aantoonbaar geldig;
- `REVISE`: de bedoeling is bruikbaar, maar een concrete correctie is vereist;
- `REJECT`: de zin heeft een onoplosbare dubbellezing, ongeschikte focus of niet-ondersteund model nodig.

Rapporteer bij `REVISE` en `REJECT`:

- bestand en zins-ID;
- falende gate;
- leerlingrisico;
- minimale gerichte correctie;
- bewijs uit runtime, validatie-uitvoer of onafhankelijke analyse.

## Grenzen

- Voeg tijdens de gate geen nieuwe content of rollen toe om een kandidaat alsnog te laten slagen.
- Behandel algemene stijlvoorkeur niet als grammaticale afkeuring.
- Laat gegenereerde documentatie alleen wijzigen via de bestaande validatiescript-output.
- Meld bestaande, niet-gerelateerde fouten apart; vergroot de scope niet stilzwijgend.

## Voltooiingscriteria

- Iedere gewijzigde zin heeft een expliciete beslissing.
- Automatische en inhoudelijke controles zijn beide uitgevoerd.
- Commando-uitvoer en resterende risico's zijn gerapporteerd.
- Geen item is geaccepteerd op basis van alleen schema-validiteit.
