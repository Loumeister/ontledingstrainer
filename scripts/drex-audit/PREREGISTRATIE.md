# Preregistratie: externe validatie van de Drex-audit

Vastgelegd op 2026-09-26, **voordat** er blinde menselijke beoordelingen waren. De commit die dit bestand toevoegt is de tijdstempel. Wijzig na het invullen van de gold-set niets aan de configuratie, de drempels of de maten hieronder. Wie dat toch doet, rapporteert het als verkennende analyse, niet als validatie.

## Waarom

Meting 1 en 2 vergeleken Drex met de huidige annotatie en met kunstmatige fouten. Dat zegt niet of Drex **echte** annotatiefouten vindt, of alleen de dataset consistent nabootst. Dat toetst alleen een blinde menselijke beoordeling. Die mag daarom niet ook gebruikt worden om drempels af te stellen: met 78–128 items is splitsen in afstemmen en toetsen te dun (MV, VV en bijstelling hebben maar een handvol items).

## Bevroren configuratie

Gekozen op meting 2 (`resultaten/2026-09-26-meting-2.md`) met kunstmatige fouten: 77% gevonden bij 5,0% vals alarm.

1. **Classificatie**: Drex kiest de zinsfunctie uit zeven Engelse labels, **zonder omschrijvingen** (`A_bare`).
2. **Verificatie**: Drex beoordeelt of het bestaande label klopt (`B_gold`, criteria met `DESC` v2), los van de classificatie.
3. **Markeren**: een zinsdeel is gemarkeerd als P(goedgekeurde rol | alleen labels) **< 0,18** of verificatie-noul **< 0,45**.
4. **Scores**: de opgeslagen uitkomsten van meting 2, niet opnieuw opgevraagd (`drex-latest` kan veranderen). Bestand `resultaten/2026-09-26-meting-2-scores.csv`, SHA-256 `2c800bf35ef0465f3180964d90f7d4f72ddb518f007a20c28a0699a2fc7e97e6`.
5. Niets wordt automatisch herschreven; gemarkeerde zinsdelen gaan naar menselijke review.

Het markeert 52 van de 1044 zinsdelen. De contrastchecks (VV ↔ BWB per voorzetselgroep, MV ↔ LV per kale naamwoordgroep, met een werkwoord-voorzetsellijst in code) horen **niet** bij deze validatie. Ze zijn nog niet gebouwd of gemeten. Worden ze later op deze gold-set getoetst, dan geldt dat als verkennend.

## Steekproefontwerp

`goldset/ontwerp.csv`, SHA-256 `48c285e5a035540f6b219979457def75feafba764301ba741bc54bc89ff53c1c`.

- **Blad 1** (78 zinsdelen): per rol 6 "verdacht" (Drex met alleen labels wijkt af, of verificatie-noul < 0,5) en 6 "controle", willekeurig getrokken (seed 20260926). Verder alle 5 bijstellingen en zin 5008 als verplicht item.
- **Blad 2** (50 zinsdelen): de 40 gemarkeerde zinsdelen die niet op blad 1 staan, plus 10 willekeurige ongemarkeerde als vulling (seed 20260927). De vulling voorkomt dat je aan het blad kunt zien dat alles erop verdacht is.
- Zo zijn **alle 52 gemarkeerde zinsdelen** beoordeeld: de precisie is een volledige telling, geen schatting.

Stratumgroottes (populatie ongemarkeerd en gemarkeerd samen; `verdacht`/`controle`): OW 15/369, LV 49/135, MV 33/31, VV 4/29, BWB 42/254, NG 9/69, BIJST 5.

## Beoordelen

Blind: zonder annotatie, zonder Drex-antwoord, zonder `goldset-sleutel.csv` of de resultatenbestanden te openen. Per zinsdeel:

- `human_role` / `jouw_rol`: OW, LV, MV, VV, BWB, NWD, BIJST of *anders*;
- `ambiguous` / `twee_lezingen_verdedigbaar`: *ja* als twee schoolanalyses verdedigbaar zijn;
- `note` / `opmerking`: vrij.

Een oordeel is **correct** als de menselijke rol een door de app goedgekeurde rol is, **fout** als dat niet zo is, en **twijfel** bij *ja* op ambiguous. Twijfelgevallen tellen niet mee als fout van Drex of van het corpus.

## Maten

Berekend door `score_goldset.py`:

| maat | definitie | weging |
|---|---|---|
| **corpus-error precision** (hoofdmaat) | van de gemarkeerde, niet-twijfelachtige zinsdelen: aandeel dat echt fout geannoteerd is | geen: volledige telling |
| reviewwaardig | gemarkeerd en fout óf twijfel, gedeeld door gemarkeerd | geen |
| laat correcte items met rust | niet gemarkeerd, gedeeld door correct | gewogen per cel (rol × stratum × gemarkeerd) |
| corpus-error recall | gemarkeerd, gedeeld door fout | gewogen; **beschrijvend**, te weinig zeggingskracht voor een beslissing |
| geschat aandeel annotatiefouten | fout, gedeeld door niet-twijfel | gewogen |

Gewichten: populatie gedeeld door het aantal beoordeelde items per cel (post-stratificatie). Laat correcte items met rust ligt door de regel zelf al boven ongeveer 95% (hij markeert 5% van het corpus). Dat is dus geen beslissende maat.

## Beslisregel (vooraf gekozen)

Alleen geldig als alle 52 gemarkeerde zinsdelen beoordeeld zijn:

- precisie **≥ 20%** en minstens **3** bevestigde fouten → **bruikbaar als reviewrij** voor zinsauteurs;
- precisie **10–20%** → alleen als tweede mening, geen vaste reviewrij;
- precisie **< 10%** → stoppen: Drex bootst vooral de huidige annotatie na.

Sanity check, geen beslissing: zin 5008 *Wij luisteren **naar muziek*** (geannoteerd BWB, Drex VV). Oordeel jij blind VV, dan heeft Drex minstens één echte inconsistentie in het corpus gevonden.

## Grenzen

- Blad 1 is getrokken met dezelfde signalen die we toetsen. Ongewogen cijfers over blad 1 overschatten daarom de recall. Alleen de gewogen cijfers zeggen iets over het corpus.
- Eén beoordelaar. Wat die beoordelaar "fout" noemt, is de maatstaf. Een tweede beoordelaar op de twijfel- en foutgevallen zou de betrouwbaarheid laten zien.
- Omschrijvingen per rol zijn niet weggegooid, maar zijn ongeschikt als primaire instructie gebleken. Een smalle omschrijving per contrast moet later apart bewijzen dat hij iets toevoegt.
