# Drex constituent-role audit

Meet hoe goed het beslismodel [Drex](https://drex.nace.ai) (Nace.AI, API-compatibel met TypeSafe Jev) de bestaande annotaties in `src/data/sentences-level-*.json` herkent en bewust ingebouwde fouten vindt.

Drex dient hier als onafhankelijke detector van afwijkingen, niet als nieuwe bron van waarheid. Dit is een los hulpmiddel voor makers van zinnen. Het hoort niet bij de app, draait niet in `npm test` en verandert geen annotaties. Drex levert een signaal; een mens beslist.

## Draaien

```bash
# DREX_API_KEY in de omgeving of in .env (gitignored; nooit met VITE_-prefix)
python3 scripts/drex-audit/measure.py                 # hele corpus -> scripts/drex-audit/rows.jsonl (gitignored)
python3 scripts/drex-audit/analyse.py scripts/drex-audit/rows.jsonl > rapport.md
python3 -m unittest discover -s scripts/drex-audit    # tests zonder netwerk (live-tests worden overgeslagen)
DREX_LIVE=1 python3 -m unittest discover -s scripts/drex-audit -p 'test_live_*.py'   # contract met Drex, live
```

Het hele corpus kost ongeveer 1 miljoen invoertokens: enkele centen. Met een gratis account (2 aanroepen tegelijk) duurt het 30–60 minuten, afhankelijk van hoe druk Drex is. Er gaan alleen oefenzinnen uit de repo naar Drex, geen leerlinggegevens.

## Opzet

Per zin gebruiken we de zinsdeelgrenzen uit de huidige JSON. Drex hoeft de grenzen niet zelf te vinden; we meten alleen het benoemen.

**Scope:** zeven rollen (`ow`, `lv`, `mv`, `vv`, `bwb`, `ng`, `bijst`). Niet gecontroleerd: `pv`, `wg`, de subrollen (`nwd`, `wwd`, `bijv_bep`), `bijzin`, `vw_neven`, `vw_onder`, `bijzinFunctie`, `bijzinAnalyse` en de zinsdeelgrenzen zelf. Die vragen een andere grammaticale vraag en krijgen later een eigen audit.

| opzet | vraag aan Drex | levert |
|---|---|---|
| `A_v2` | `choice`: welke functie heeft dit zinsdeel? Labels met omschrijving (versie 2) | recall en precisie per rol, zekerheid |
| `A_v1` | idem met de eerste omschrijvingen | A/B: helpen scherpere omschrijvingen? |
| `A_bare` | idem zonder omschrijvingen | hoeveel haalt Drex uit de labelnaam zelf? |
| `B_gold` | `noul`: klopt dit label? (goudannotatie zichtbaar) | vals-alarmkans |
| `B_mut` | `noul`: klopt dit label? (één bewust fout label per zin) | foutdetectie |

De drie A-varianten zitten in één aanroep: vragen over dezelfde state beïnvloeden elkaar volgens de Drex-documentatie niet.

Het doel-zinsdeel wordt met tekst aangewezen, niet met woordposities, want Drex telt niet betrouwbaar. Komt de tekst vaker voor ("Ik ben moe, maar ik ..."), dan komen er buurwoorden bij: `"ik" (in "maar ik bedenk")`. In de resultaten is een zinsdeel `(zin-id, start)`.

Een antwoord telt als goed als de leerlingbeoordeling het goedkeurt. Die regel staat in `src/logic/validation.ts` (`chunkTokens.every(t => roleMatchesToken(label, t))`): elk woord van het zinsdeel moet die rol of die `alternativeRole` hebben. Een `alternativeRole` op alleen het eerste woord telt dus niet. De docentanalyse in `sentenceAnalysis.ts` telt fouten op chunkgrenzen en kijkt daardoor alleen naar het eerste woord; dat is geen beoordeling. De `alternativeRole: nwd` op "worden" in zin 147 is een alternatief op subrolniveau en telt niet voor het zinsdeel.

Drex-contract (bevestigd door `test_live_contract.py`): `instructions` moet een string zijn; een omschrijving bij `choice` mag een string of `null` zijn (zo werkt `A_bare`); modelnamen buiten `drex-*` geven 422.

Meet per rol, niet alleen het totaal. Het corpus heeft 384 OW, 296 BWB, 184 LV, 78 NG, 64 MV, 33 VV en maar 5 bijstellingen. Een mooi totaal kan dus verbergen dat Drex bijna alle MV's mist.

## Schema voor Drex

Labels zijn Engels en beschrijvend. Drex leest vooral de labelnaam: korte codes (`ow`, `lv`) naast een optie `other` gaven in een proef 100% `other` met zekerheid 1,0. Laat `other` daarom weg, of geef het een even concrete naam.

| rol | Drex-label | omschrijving (versie 2, eigen woorden) | bron / let op |
|---|---|---|---|
| OW | `subject` | bepaalt persoon en getal van de persoonsvorm; niet op woordvolgorde alleen beslissen | congruentie is de kern; positie is maar een aanwijzing (bijzinnen, inversie) |
| LV | `direct_object` | voorwerp zonder voorzetsel; wie/wat + onderwerp + gezegde; in een natuurlijke lijdende vorm meestal het onderwerp | boeken: vraag met alle werkwoorden; lijdende-vormproef |
| MV | `indirect_object` | ontvanger of begunstigde, vaak met of af te wisselen met *aan/voor*; geen vast voorzetsel | **Engelstalige grammatica's zetten *geven aan, lenen aan, schrijven aan* bij de voorzetselvoorwerpen**; de schoolgrammatica niet |
| VV | `prepositional_object` | aanvulling waarvan het voorzetsel door het gezegde wordt gekozen; tegenover een vrije omstandigheid | de *waar+vz*-proef is geschrapt: die werkt ook bij een BWB van plaats. Lijsten werkwoord + vast voorzetsel horen in code, niet in de prompt |
| BWB | `adverbial` | omstandigheid: tijd, plaats, wijze, duur, frequentie, oorzaak, doel; geen gekozen voorwerp; weglaatbaarheid is niet beslissend | het L2-boek splitst in TIME/MANNER/PLACE; voor de schoolgrammatica is dat één rol |
| NG | `predicative_complement` | Ontleedlab-*ng-chunk*: het naamwoordelijke stuk dat iets over het onderwerp zegt, eventueel met een niet-finiet koppelwerkwoord; de pv staat apart | `constants.ts` noemt `ng` "Naamwoordelijk Gezegde", maar de data annoteren alleen dit stuk (*erg spannend*, *dokter worden*). Niet "corrigeren" naar het hele gezegde |
| BIJST | `apposition` | naamwoordgroep die een aangrenzende naamwoordgroep met dezelfde referent hernoemt; vaak tussen komma's, maar leestekens beslissen niet | n = 5: te weinig om iets te concluderen |

De eerste versie (`DESC_V1` in `schema.py`) bleef bewaard voor de A/B-meting.

Constructies waarover de bronnen het oneens zijn: niet laten beoordelen, maar vermijden of expliciet modelleren (productinvariant):

- **Transitieve koppelwerkwoorden** (*vinden, noemen, beschouwen als, beschrijven als*): het boek noemt het deel na het object een *complement*; in de schoolgrammatica is het geen naamwoordelijk deel. Zie zin 91 (*als een meesterwerk* staat als VV).
- **Bijvoeglijk naamwoord + vast voorzetsel** na een koppelwerkwoord (*trots op, bang voor, tevreden met*): VV bij het naamwoordelijk deel, of een deel van het naamwoordelijk deel.
- ***Er* als plaatsvervangend onderwerp** (*Er wordt gezongen*): het L2-boek noemt *er* het onderwerp; de schoolgrammatica niet.
- ***Luisteren naar*, *kijken naar***: staan in de lijsten met vaste voorzetsels, maar niet overal consequent geannoteerd (zie het rapport).

Geraadpleegd: *Online Dutch Grammar Course* (dutchgrammar.com, woordvolgorde en de lijst werkwoorden + voorzetsel), Donaldson *Dutch: A Comprehensive Grammar* (11.21, 9.5), Shetter *Dutch: An Essential Grammar*, *Intermediate Dutch*. Geen van deze boeken beschrijft schoolse zinsontleding; ze bevestigen vooral de proeven. `grammar-core` en de lesmethode blijven leidend. Neem geen tekst of lijsten uit deze boeken over in de repo.

## Bekende grenzen

- Drex kiest altijd een van de zeven labels. Een zinsdeel dat nergens past, krijgt toch een label.
- Antwoorden variëren licht per aanroep (±0,01). Leg de modelversie vast en sla die per rij op (`model`).
- `schema.mutate` is een testharnas, geen grammaticaal model. Vooral *bwb → vv* (op grond van het eerste woord) en *bijst → ow* zijn kunstmatig. De detectiecijfers zeggen of de audit zo'n fout vindt, niet hoe vaak het corpus fouten bevat. Voor de echte controle gebruik je de kansverdeling uit de classificatie.
- Een onenigheid is een kandidaat voor review, geen bewijs: soms zit de fout in de annotatie, soms in Drex.
