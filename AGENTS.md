# Agent guide

Ontleedlab is de lokale ontleedapp. De runtime en tests bepalen huidig gedrag; `shared/grammar-core/` levert alleen gedeelde didactische kaders.

## Leesroute per taak

- Productdoel of prioriteit: `SPEC.md`, `TODO.md`
- Runtime of UI: betrokken bestand, aanroepers en tests
- Zinnen of annotaties: `.codex/skills/zinsontleding-repo-inspector/references/repo-contract.md` en de relevante dataset
- Ontleedfeedback: `shared/grammar-core/docs/parsing-didactics-kaders.md`, `shared/grammar-core/docs/feedback-authoring.md`, daarna `src/logic/validation.ts` en `src/constants.ts`
- Gedeelde canon of sync: `shared/grammar-core/README.md`, `shared/grammar-core/docs/repo-sync-strategy.md`

Lees niet standaard alle docs of skills.

## Productinvarianten

- Op de gewone URL wijst de leerling alle toepasselijke rollen tegelijk aan.
- De Rollenladder is alleen actief via `#/rollenladder`; alleen trede en scores mogen blijven staan.
- Een verkeerd label bewijst geen precieze denkfout. Feedback geeft één controleerbare herstelstap en laat opnieuw proberen.
- Lokale `RoleKey`-waarden en tokenannotaties blijven productlokaal.
- Zinnen met twee verdedigbare schoolanalyses worden niet stilzwijgend goedgekeurd.
- Browser-PIN's en ingebakken API-sleutels zijn geen echte autorisatie.

## Werkregels

- Hergebruik bestaande pure logica; voeg geen state library, router of backendlaag toe zonder expliciet besluit.
- Verander gedeelde bestanden nooit onder `shared/grammar-core/`; wijzig eerst `grammar-core` en synchroniseer na merge.
- Voeg bij niet-triviale logica één kleine regressietest toe.
- Gebruik Nederlandse UI-tekst, toetsenbordbediening en bestaande Tailwindpatronen.
- Leid aantallen en status uit code/tests af; schrijf ze niet handmatig in docs.

## Controle

```bash
npm test
npm run build
```
