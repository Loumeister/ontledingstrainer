---
name: ontleedlab-learning-analytics
description: Analyseer Ontleedlab-leerdata, pogingen, eventlogs, rolfouten, gebruik van hints en sessie-uitkomsten voor didactische en docentgerichte beslissingen. Gebruik bij aggregaties, dashboards, meetdefinities en interpretatie van leerpatronen; niet voor ruwe producttelemetrie zonder leervraag.
---

# Analyseer Ontleedlab-leerdata

## Lees eerst

Selecteer alleen de relevante bronnen:

- `src/logic/analyticsHelpers.ts` en de tests;
- `src/services/usageData.ts`;
- `src/services/interactionLog.ts` en `trainerActivityLog.ts`;
- `src/services/sessionReport.ts`, `sessionHistory.ts`, `trainerSubmissionStore.ts` en `labSubmissionStore.ts`;
- `src/screens/TeacherDashboardScreen.tsx`, `StudentDashboardScreen.tsx` of `UsageLogScreen.tsx`;
- `src/types.ts` voor versie-, domein- en opslagsemantiek.

## Meetcontract

1. Definieer eerst een concrete leervraag en de populatie, periode en bron.
2. Leg vast wat één poging, eerste check, sessie, afgeronde submission, hint en `show_answer` betekenen.
3. Houd trainer- en labsubmissions uit elkaar via hun `domain`-discriminator; combineer ze alleen met een expliciete, vergelijkbare maat.
4. Respecteer bestaande versionering van opdrachten en oefeningen. Vergelijk historische resultaten met de versie waarop zij zijn gemaakt.
5. Segmenteer fouten op lokale rol, stap en fouttype wanneer de bron dat werkelijk ondersteunt.
6. Scheid conceptuele verwarring van mogelijke UX-frictie; een eventpatroon bewijst geen oorzaak.
7. Rapporteer aantallen en noemers naast percentages en benoem kleine steekproeven.
8. Gebruik geaggregeerde gegevens voor inzichten en toon geen persoonsgegevens die de vraag niet vereist.

## Invarianten

- Eerste-checkscores mogen niet dubbel tellen door opnieuw controleren of antwoordweergave.
- `showAnswerUsed`, hints, splitfouten en rolfouten zijn verschillende signalen.
- Ontbrekende events betekenen niet automatisch dat een leerling een stap niet heeft uitgevoerd.
- Legacy en nieuwe opslag kunnen tijdelijk naast elkaar bestaan; dedupliceer niet zonder stabiele identiteit en attributieregel.
- Wijzig geen meetdefinitie stilzwijgend. Documenteer migratie en vergelijkbaarheid.

## Werkwijze

1. Traceer de gebeurtenis of submission van schrijfpunt tot aggregator.
2. Schrijf de meetdefinitie in gewone taal en als testbaar voorbeeld.
3. Voeg de kleinste pure aggregatie of selector toe.
4. Test nul gevallen, incomplete sessies, versies, dubbele events en gemengde domeinen.
5. Controleer dashboardcopy op juiste noemer en terughoudende interpretatie.

## Outputcontract

Lever:

- `Finding`: wat de data aantoonbaar laat zien;
- `Metric definition`: bron, teller, noemer, filters en versie;
- `Hypothesis`: mogelijke verklaring, expliciet als hypothese;
- `Action`: kleine product- of didactische vervolgstap;
- `Validation`: hoe het effect wordt gemeten;
- `Limitations`: ontbrekende data, bias en privacyrisico.

## Voltooiingscriteria

- Iedere claim is herleidbaar tot bron en meetdefinitie.
- Trainer-, lab- en legacydata zijn correct begrensd.
- Aggregaties hebben gerichte tests.
- Het resultaat ondersteunt een besluit zonder causaliteit te veinzen.
