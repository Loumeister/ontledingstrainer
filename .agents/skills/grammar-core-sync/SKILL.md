---
name: grammar-core-sync
description: Synchroniseer de `shared/grammar-core/`-subtree van Ontleedlab met de canonieke grammar-core-repository en routeer lokale canonverbeteringen eerst upstream. Gebruik voor subtree-pulls, syncconflicten, referentie-updates en een veilige draft-PR-overdracht.
---

# Synchroniseer grammar-core veilig

## Lees eerst

1. Lees `shared/grammar-core/plugins/grammar-core-toolkit/skills/grammar-core-sync/SKILL.md`.
2. Lees `shared/grammar-core/docs/repo-sync-strategy.md`.
3. Lees `AGENTS.md` en `.agents/skills/parsing-content-governance/SKILL.md`.

## Preflight

1. Inspecteer `git status --short`, huidige branch, remotes en de aanwezigheid van `shared/grammar-core/`.
2. Begin bij voorkeur met een schone worktree. Stop bij wijzigingen die de subtree, syncreferenties of conflictpaden raken; stash, verwijder of overschrijf gebruikerswerk nooit automatisch.
3. Controleer de canonieke remote-URL en bepaal de upstream-defaultbranch uit remote metadata. Gebruik `main` alleen nadat die branch daadwerkelijk is geverifieerd.
4. Controleer of de huidige branch geschikt is. Maak zo nodig een beschrijvende syncbranch vanaf de overeengekomen basis; hardcode geen branchnaam wanneer die al bestaat of een andere conventie geldt.
5. Als lokale verbeteringen onder `shared/grammar-core/` staan, routeer ze eerst naar een aparte grammar-core-branch en PR. Trek pas na merge opnieuw in.

## Pull

Voer met de geverifieerde remote en branch uit:

```text
git subtree pull --prefix=shared/grammar-core <canonical-remote> <default-branch> --squash
```

## Conflicten

1. Inspecteer ieder conflict met `git status` en de betrokken basis-, lokale en upstreamversie.
2. Bepaal of het conflict canonieke subtree-inhoud, lokale wrapperdocumentatie of gegenereerde referentie betreft.
3. Neem geen blanket `checkout --theirs` of `--ours` over de subtree.
4. Stop en routeer upstream wanneer een lokale wijziging eigenlijk canoniek hoort te zijn.
5. Los productlokale referenties buiten de subtree afzonderlijk op en valideer dat zij naar bestaande paden wijzen.
6. Markeer alleen bewust beoordeelde bestanden als opgelost.

## Validatie

1. Controleer eerst de scope met `git diff --stat` en `git diff --name-only`.
2. Verwacht subtreewijzigingen plus alleen expliciet noodzakelijke lokale referentie-updates.
3. Zoek naar verouderde skillpaden, verwijderde canonieke bestanden en gewijzigde productcontractaannames.
4. Draai taakrelevante contentvalidatie, daarna:

```text
npm test
npm run build
git diff --check
```

5. Noteer bestaande failures afzonderlijk; accepteer geen nieuwe regressie als syncresultaat.

## Overdracht

Rapporteer:

- canonieke remote, branch en ingetrokkene commit/squash;
- subtree- en lokale referentiewijzigingen;
- conflictbeslissingen per bestand;
- validatie-uitvoer en bestaande failures;
- gewijzigde shared regels die lokale adoptie of een vervolgtaak vragen.

Bereid een draft-PR-beschrijving voor. Commit, push of open de PR alleen wanneer de opdracht externe GitHub-wijzigingen autoriseert.

## Voltooiingscriteria

- De subtree komt aantoonbaar van de geverifieerde canonieke bron.
- Geen gebruikerswerk is weggegooid of stilzwijgend overschreven.
- Conflicten zijn per bestand inhoudelijk beoordeeld.
- Lokale wrappers en verwijzingen zijn geldig.
- Tests, build en diffcontrole zijn gerapporteerd.
