---
name: ontleedlab-learner-flow-ui
description: "Bewaak en ontwerp de productspecifieke Ontleedlab-leerlingflow: zinsdelen knippen, rollen plaatsen, hints, controleren, antwoord tonen, opnieuw proberen en resultaatfeedback. Gebruik bij leerlinggerichte React-interacties en toegankelijkheid; combineer bij visueel ontwerp met de globale frontend-design-skill en rond af met web-design-guidelines."
---

# Bewaak de Ontleedlab-leerlingflow

Deze skill bevat alleen productspecifieke didactische en interactieregels. Laat algemene frontendimplementatie, ontwerpworkflow en audits aan de daarvoor globale skills.

## Lees eerst

1. Lees `shared/grammar-core/docs/parsing-didactics-kaders.md`.
2. Lees `.agents/skills/zinsontleding-repo-inspector/references/repo-contract.md`.
3. Traceer de relevante flow in:
   - `src/hooks/useTrainer.ts`;
   - `src/screens/HomeScreen.tsx`, `TrainerScreen.tsx` en `ScoreScreen.tsx`;
   - `src/components/DropZone.tsx`, `WordChip.tsx`, `FeedbackPanel.tsx` en de helpmodals;
   - taakrelevante tests.

## Leerlingflow-invarianten

- Behoud de volgorde van segmenteren naar benoemen, tenzij de productopdracht die didactiek expliciet wijzigt.
- Houd persoonsvorm en onderwerp als fundamentele oriëntatiepunten voor hints en herstel.
- Bied drag-and-drop en tap-to-place functioneel gelijkwaardig aan.
- Laat controleren voorafgaan aan antwoord tonen en behoud de eigen invoer voor `Opnieuw proberen`.
- Maak onderscheid tussen knipstatus, hoofdrol, subrol, bijzinfunctie en koppelingen.
- Toon nooit interne rolcodes wanneer een begrijpelijk Nederlands label beschikbaar is.
- Hardcode geen oefenzinnen of correcte antwoorden in componenten.
- Wijzig geen parser-, chunk- of evaluatiesemantiek als onderdeel van een visuele aanpassing.

## Toegankelijkheidscontract

- Gebruik semantische knoppen en invoerelementen; voeg ARIA alleen toe waar HTML-semantiek niet volstaat.
- Ondersteun volledige bediening zonder slepen en zonder muis.
- Maak selectie, plaatsing, foutstatus, feedback en voortgang ook niet-visueel waarneembaar.
- Beheer focus bij stapwissels, modals, fouten en terugkeer uit antwoordweergave.
- Houd kleur ondersteunend; communiceer status ook met tekst of vorm.
- Respecteer reduced motion bij confetti en overige animatie.
- Controleer leesbaarheid in groot lettertype, dyslexiemodus, dark mode en smalle schermen.

## Werkwijze

1. Beschrijf de huidige toestandsovergangen en de leerlingbeslissing die verandert.
2. Controleer of de wijziging de denkstap verduidelijkt zonder het antwoord weg te geven.
3. Ontwerp en implementeer met de globale `frontend-design`-skill wanneer visuele richting of componentbouw nodig is.
4. Test keyboard-, tap-, drag-, focus- en feedbackpaden op functionele gelijkwaardigheid.
5. Gebruik de globale `web-design-guidelines`-skill voor de afsluitende UI- en toegankelijkheidsaudit.
6. Draai gerichte component-/hooktests, daarna `npm test` en bij UI-code `npm run build`.

## Outputcontract

Rapporteer:

- gewijzigde leerlingbeslissing en toestandsovergang;
- behouden didactische invariant;
- toetsenbord-, tap- en drag-gedrag;
- focus- en aankondigingsgedrag;
- uitgevoerde tests en UI-audit;
- resterende toegankelijkheids- of begripsrisico's.

## Voltooiingscriteria

- De wijziging werkt zonder muis en zonder slepen.
- Controle-, antwoord- en retrygedrag blijven consistent.
- De UI verhult of wijzigt geen lokale parsewaarheid.
- Relevante tests, build en globale UI-audit zijn afgerond.
