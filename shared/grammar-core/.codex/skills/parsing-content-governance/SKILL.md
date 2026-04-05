# Parsing Content Governance

Read first:
- `docs/parsing-didactics-kaders.md`
- `docs/content-authoring-rules.md`
- `docs/product-repo-contract-template.md`
- `docs/taxonomy-governance.md`
- `docs/grammar-platform-principles.md`
- `docs/repo-sync-strategy.md`

Use when:
- toevoegen of beoordelen van parsinggerichte shared content
- beoordelen van product-repo alignment bij parsingwerk
- ontwerpen van expliciete mappings van shared canon naar productlokale structuren
- bewaken dat lokale productbeperkingen niet verdwijnen in schijnalgemeenheid

Rules:
- parsing-governance gaat niet alleen over labelcorrectheid, maar ook over diagnostische denkstappen, vraagvolgorde, didactische focus, zorgvuldig gekozen contrasten en beheersbare cognitieve belasting
- houd canonieke parsingdidactiek in `docs/`; dupliceer geen hele kaders in deze skill
- inspecteer het lokale productcontract voordat je productspecifieke content, evaluatielogica of adaptermappings wijzigt; eis geen onnodige volledige repo-inspectie voor triviale taken
- behandel productspecifieke annotatievelden, RoleKeys, JSON-shapes, chunkconventies, evaluatielogica en feedbackflows nooit als gedeelde waarheid
- laat productrepo’s shared canon expliciet adapteren; vervang lokale productlogica niet stilzwijgend door abstracte shared termen
- wijzig runtimegedrag niet impliciet
- wanneer deze skill via een productrepo-wrapper wordt gebruikt, lees dan eerst `shared/grammar-core/.codex/skills/parsing-content-governance/SKILL.md`, daarna het lokale productcontract en pas daarna de taakprompt

Output should state:
1. welke parsingdidactische keuze of inhoudswijziging wordt voorgesteld
2. welk gedeeld principe dit draagt
3. welke lokale contractpunten gecontroleerd moeten worden
4. wat shared canon blijft en wat lokaal moet blijven
5. of runtimegedrag expliciet ongemoeid moet blijven
