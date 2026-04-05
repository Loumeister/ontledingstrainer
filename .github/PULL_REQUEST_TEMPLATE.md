## Wat doet deze PR?

_Beschrijf kort wat er verandert en waarom. Vermeld de daadwerkelijk gewijzigde bestanden, niet alleen de intentie._

---

## Checklist

- [ ] **Branch gebaseerd op huidige `main`** — niet op een verouderde branch of een branch die al gemerged is
- [ ] **Beschrijving klopt met de diff** — gewijzigde bestanden en deletions zijn eerlijk vermeld
- [ ] **Geen gemengde concerns** — één samenhangend doel per PR; los niet-gerelateerde zaken af in aparte PRs
- [ ] **Runtime-bestanden niet verwijderd zonder expliciete motivatie** — als een bestaand logic/service/component-bestand verwijderd wordt, staat hier waarom en wat het vervangt
- [ ] **Tests toegevoegd voor nieuwe `src/logic/*.ts` modules** — elk nieuw puur-logica-bestand heeft een bijbehorend `.test.ts`
- [ ] **Alle UI-tekst in het Nederlands** — geen Engelse labels, knoppen of tooltips
- [ ] **`npm run build` en `npm run test` slagen** — lokaal geverifieerd vóór merge

---

## Type wijziging

- [ ] Bugfix (geen breaking change)
- [ ] Nieuwe feature (geen breaking change)
- [ ] Breaking change (bestaand gedrag verandert)
- [ ] Documentatie / configuratie / tooling only
