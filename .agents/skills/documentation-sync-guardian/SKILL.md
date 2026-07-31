---
name: documentation-sync-guardian
description: Bewaak de beperkte automatische documentatiesamenvatting na een push naar `main`. Gebruik voor de workflow die uitsluitend `docs/auto-sync/*` bijwerkt op basis van commitbericht en diff; niet voor handmatige README-, contract-, architectuur- of productdocumentatie.
---

# Bewaak automatische documentatiesync

## Lees eerst

1. Lees `shared/grammar-core/.codex/skills/documentation-sync-guardian/SKILL.md`.
2. Lees `docs/local-scope-contract.md`.
3. Lees `docs/documentation-sync-contract.md`.
4. Lees het commitbericht, de lijst gewijzigde bestanden en de aangeleverde diff.

## Regels

- Schrijf alleen naar `docs/auto-sync/*`.
- Baseer iedere zin op zichtbaar bewijs uit commitbericht, bestandslijst of diff.
- Beschrijf afgerond gedrag alleen wanneer de diff dat daadwerkelijk implementeert.
- Verzin geen parsinggedrag, metrics, architectuurwijziging of roadmapstatus.
- Wijzig geen README, SPEC, TODO, contract, skill of shared canon vanuit deze automatisering.
- Neem geen secrets, leerlinggegevens of onnodige diffdetails over.
- Sla de update over wanneer het bewijs geen bruikbare documentatiesamenvatting draagt.

## Outputcontract

Lever alleen compacte Markdown voor het gevraagde bestand onder `docs/auto-sync/`, met:

- commit of wijzigingsdoel;
- aantoonbaar gewijzigd gedrag of artefact;
- relevante validatie indien zichtbaar;
- expliciete onzekerheid wanneer bewijs ontbreekt.

## Voltooiingscriteria

- Alleen het toegestane gegenereerde bestand is gewijzigd.
- Iedere claim is terug te vinden in de invoer.
- Lokale scope en shared canon zijn niet herschreven.
