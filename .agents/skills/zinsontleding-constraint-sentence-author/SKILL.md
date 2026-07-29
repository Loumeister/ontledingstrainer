---
name: zinsontleding-constraint-sentence-author
description: Maak of herformuleer eenduidige Nederlandse oefenzinnen in het lokale Ontleedlab-formaat. Gebruik voor nieuwe sentence-items, gerichte contrastparen en niveauopbouw nadat het lokale parsingcontract is geïnspecteerd; gebruik de quality-gate-skill voor de onafhankelijke eindcontrole.
---

# Schrijf constraint-based oefenzinnen

## Lees eerst

1. Gebruik `zinsontleding-repo-inspector` en lees diens `references/repo-contract.md`.
2. Lees `shared/grammar-core/docs/content-authoring-rules.md` en `shared/grammar-core/docs/parsing-didactics-kaders.md`.
3. Lees `references/focus-ladder.md`.
4. Inspecteer bestaande items op het doelniveau in `src/data/sentences-level-*.json`.

## Werkwijze

1. Kies één didactische focus en één primaire verwarringskans per zin.
2. Formuleer natuurlijk Nederlands met genoeg context om de bedoelde schoolanalyse eenduidig te maken.
3. Bepaal eerst de persoonsvorm en het onderwerp. Onderbouw:
   - de persoonsvorm met tijdproef of ja-neevraag;
   - het onderwerp met congruentie en `wie/wat + persoonsvorm`.
4. Analyseer daarna de overige zinsdelen en toets risicovolle contrasten, zoals `lv`/`mv`, `vv`/`bwb`, `wg`/`ng` en de functie van een bijzin.
5. Annoteer exact volgens `Sentence` en `Token` in `src/types.ts`:
   - gebruik uitsluitend lokale actieve rollen;
   - geef ieder item een repo-uniek numeriek zins-ID;
   - geef ieder token een stabiel, uniek token-ID;
   - gebruik niveaus `0` tot en met `4`;
   - zet `newChunk: true` alleen op het eerste token van een nieuw aangrenzend zinsdeel met dezelfde hoofdrol;
   - gebruik `alternativeRole` alleen voor een expliciet ondersteunde, didactisch gewenste variant;
   - koppel bijzinnen en bijvoeglijke bepalingen alleen via bestaande lokale velden.
6. Vergelijk het item met nabije items op niveau, focus en constructie. Herhaling mag wanneer zij didactisch functioneel is.
7. Verwerp de kandidaat zodra een tweede gangbare schoolanalyse nodig is om de annotatie te verdedigen.

## Inhoudsgrenzen

- Neutraliteit is geen doel op zich. Pas woordkeuze aan bij grammaticale onduidelijkheid, onnodige belasting of ongeschiktheid voor de doelgroep.
- Gebruik geen onnatuurlijk Nederlands, ellipsen, betwiste idiomen of syntactische kunstgrepen zonder didactische winst.
- Voeg geen nieuwe taxonomie, runtimevelden, feedbackcodes of generatielaag toe.
- Hardcode geen zinnen in React-componenten; ingebouwde oefeningen blijven versieerbare JSON-content.
- Verander geen bestaande analyse stilzwijgend tijdens een stilistische herformulering.

## Outputcontract

Lever per kandidaat:

1. het volledige lokale `Sentence`-object;
2. `focus` en beoogd niveau;
3. korte `pv`- en `ow`-verantwoording;
4. motivatie van het hoofdonderscheid;
5. bekende risico's of expliciet `REJECT` met reden.

Laat vervolgens `zinsontleding-content-quality-gate` de content controleren voordat het item als gereed wordt gemeld.

## Voltooiingscriteria

- De kandidaat past zonder schema-adapter in het doeldatabestand.
- Er is precies één primaire didactische focus.
- De analyse is zelfstandig verdedigbaar zonder `alternativeRole` als noodverband.
- ID's, rollen, chunks, niveau en gezegdetype zijn tegen de runtime gecontroleerd.
