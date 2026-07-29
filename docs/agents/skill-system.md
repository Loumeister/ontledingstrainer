# Skillsysteem van Ontleedlab

## Discovery

Codex ontdekt de lokale domeinskills onder:

```text
.agents/skills/<skill-name>/SKILL.md
```

Iedere skill heeft daarnaast `agents/openai.yaml` voor de zichtbare naam, korte omschrijving en een voorbeeldprompt. De directorynaam, frontmatter-`name` en `$skill-name` in de voorbeeldprompt moeten gelijk zijn.

Bestanden onder `shared/grammar-core/.codex/skills/` behoren tot de gesynchroniseerde bronstructuur van grammar-core. Lokale wrappers lezen die canonieke instructies eerst en passen daarna het Ontleedlab-contract toe.

## Lokale set

| Skill | Verantwoordelijkheid |
|---|---|
| `zinsontleding-repo-inspector` | Actuele lokale rollen, annotaties, chunks, evaluator en feedback inspecteren |
| `zinsontleding-constraint-sentence-author` | Eenduidige lokale oefenzinnen maken |
| `zinsontleding-content-quality-gate` | Schema- en inhoudskwaliteit van zinnen vrijgaveklaar beoordelen |
| `zinsontleding-feedback-didactiek` | Diagnostische feedback en scaffolding ontwerpen |
| `ontleedlab-learner-flow-ui` | Didactische leerlingflow en toegankelijke interacties bewaken |
| `ontleedlab-learning-analytics` | Leerdata definiëren, aggregeren en terughoudend interpreteren |
| `parsing-content-governance` | Shared parsingcanon scheiden van lokale runtime |
| `shared-content-integration` | Shared content via expliciete adapters integreren |
| `documentation-sync-guardian` | Automatische updates beperken tot `docs/auto-sync/*` |
| `grammar-core-sync` | De grammar-core-subtree veilig synchroniseren |

## Combinaties

- Zinnen maken: `zinsontleding-repo-inspector` → `zinsontleding-constraint-sentence-author` → `zinsontleding-content-quality-gate`.
- Leerling-UI bouwen: globale `frontend-design` + lokale `ontleedlab-learner-flow-ui` → globale `web-design-guidelines`.
- Shared content integreren: `parsing-content-governance` + `shared-content-integration` → `zinsontleding-content-quality-gate`.
- Algemene engineering: gebruik de globale Matt Pocock-processkills; lokale skills dupliceren geen planning, TDD, Git of review.

## Routinggrenzen

- “Maak een nieuwe pagina” routeert naar `frontend-design`; voeg `ontleedlab-learner-flow-ui` toe zodra de leerlinginteractie of didactische flow wordt geraakt.
- “Audit accessibility/UX/UI” routeert naar `web-design-guidelines`; gebruik de lokale learner-flow-skill voor productspecifieke invarianten.
- Een lokale zinnenbankedit routeert niet automatisch naar `shared-content-integration`.
- Een canonieke taxonomie- of cross-productwijziging routeert wel naar `parsing-content-governance`.
- Algemene tests, documentatie of frontendcode activeren geen verwijderde lokale generieke rol.

## Onderhoud

Valideer na skillwijzigingen:

```text
python <skill-creator>/scripts/quick_validate.py .agents/skills/<skill>
npx skills list --json
git diff --check
```

Test daarnaast positieve en negatieve voorbeeldprompts tegen de descriptions. Houd skills compact en verwijs voor details naar bestaande runtime- of canonieke bronnen.
