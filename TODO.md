# Roadmap Ontleedlab

_Alleen open werk. Afgerond werk staat in git._

## P0: vertrouwen

- [ ] Ontwerp de vervanging van de huidige Sheets-koppeling: server-side autorisatie, minimale oefengegevens en alleen een willekeurige leerlingcode; de koppeling naar een leerling blijft uitsluitend bij de docent.
- [ ] Beperk en documenteer tot die migratie wat de bestaande Sheets-route verstuurt en bewaart.
- [ ] Maak de adaptieve selectietest deterministisch; de huidige kansgestuurde drempel kan zonder codewijziging wisselen.
- [ ] Laat CI op iedere PR tests, build en `grammar-core`-drift controleren.

## P1: didactische kern

- [ ] Pilot de korte feedback op de vaakste rolverwarringen en meet het succes van de tweede poging.
- [ ] Laat een docent de zinnen met `vv`/`bwb`, gezegdes en bijzinfuncties op modelconsistentie auditen.
- [ ] Test expliciet dat de standaardroute alle toepasselijke rollen tegelijk vraagt en het ladderexperiment niet lekt.
- [ ] Bepaal op basis van pilotdata of de Rollenladder leerwinst geeft; verwijder hem als dat niet aantoonbaar is.

## P2: pas na bewijs

- [ ] Splits delen uit `useTrainer.ts` wanneer de eerstvolgende inhoudelijke wijziging anders onnodig breed wordt.
- [ ] Herontwerp rapportage en docentoverzicht pas na het P0-besluit over gegevens en identiteit.
- [ ] Bouw alleen een brug naar Werkwoordlab als een concreet spellingfouttype aantoonbaar door ontbrekende zinsanalyse wordt veroorzaakt.

## Definition of done

- één bron van waarheid aangepast
- één gerichte regressietest bij niet-triviale logica
- `npm test` en `npm run build` groen
- docs alleen aangepast als productgedrag of een besluit werkelijk veranderde
