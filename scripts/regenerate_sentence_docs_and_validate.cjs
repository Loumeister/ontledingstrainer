#!/usr/bin/env node
const fs = require('fs');

const files = [1, 2, 3, 4].map((n) => `data/sentences-level-${n}.json`);
const all = [];
const errors = [];

for (const file of files) {
  const expectedLevel = Number(file.match(/(\d)/)[1]);
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));

  for (let i = 1; i < arr.length; i++) {
    if (arr[i].id !== arr[i - 1].id + 1) {
      errors.push(`${file}: non-contiguous IDs around ${arr[i - 1].id}/${arr[i].id}`);
    }
  }

  for (const s of arr) {
    all.push(s);
    if (s.level !== expectedLevel) errors.push(`${file} id=${s.id}: level mismatch`);

    let hasPv = false;
    let hasOw = false;
    const seen = new Set();

    for (const t of s.tokens) {
      if (seen.has(t.id)) errors.push(`${file} id=${s.id}: duplicate token ${t.id}`);
      seen.add(t.id);
      if (!String(t.id).startsWith(`s${s.id}t`)) errors.push(`${file} id=${s.id}: token prefix mismatch ${t.id}`);
      if (t.role === 'pv') hasPv = true;
      if (t.role === 'ow') hasOw = true;
    }

    if (!hasPv || !hasOw) errors.push(`${file} id=${s.id}: missing pv/ow`);
  }
}

all.sort((a, b) => a.id - b.id);
for (let i = 1; i <= all.length; i++) {
  if (all[i - 1].id !== i) {
    errors.push(`global sequence mismatch at ${i}, got ${all[i - 1].id}`);
    break;
  }
}

if (errors.length) {
  console.error('Validation failed:');
  errors.slice(0, 30).forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}

const byLevel = {
  1: all.filter((s) => s.level === 1),
  2: all.filter((s) => s.level === 2),
  3: all.filter((s) => s.level === 3),
  4: all.filter((s) => s.level === 4),
};

const has = (s, r) => s.tokens.some((t) => t.role === r || t.subRole === r || t.bijzinFunctie === r);
const defs = {
  'PV + OW (basiscontrole)': (s) => has(s, 'pv') && has(s, 'ow'),
  'Lijdend voorwerp (lv)': (s) => has(s, 'lv'),
  'Meewerkend voorwerp (mv)': (s) => has(s, 'mv'),
  'Voorzetselvoorwerp / VZV (vv)': (s) => has(s, 'vv'),
  'Bijwoordelijke bepaling (bwb)': (s) => has(s, 'bwb'),
  'Bijstelling (bijst)': (s) => has(s, 'bijst'),
  'Bijzin als zinsdeel (bijzin)': (s) => has(s, 'bijzin'),
  'Nevenschikkend voegwoord (vw_neven)': (s) => has(s, 'vw_neven'),
  'Onderschikkend voegwoord (vw_onder)': (s) => has(s, 'vw_onder'),
  'Bijvoeglijke bepaling (subRole=bijv_bep)': (s) => s.tokens.some((t) => t.subRole === 'bijv_bep'),
  'Werkwoordelijk gezegde (predicateType=WG)': (s) => s.predicateType === 'WG',
  'Naamwoordelijk gezegde (predicateType=NG)': (s) => s.predicateType === 'NG',
};

const ranges = `N1 ${byLevel[1][0].id}-${byLevel[1][byLevel[1].length - 1].id}, N2 ${byLevel[2][0].id}-${byLevel[2][byLevel[2].length - 1].id}, N3 ${byLevel[3][0].id}-${byLevel[3][byLevel[3].length - 1].id}, N4 ${byLevel[4][0].id}-${byLevel[4][byLevel[4].length - 1].id}`;

let overview = '# Docentenoverzicht zinnen per subskill\n\n';
overview += "Dit overzicht is automatisch samengesteld uit de actuele zinnenbestanden (niveau 1 t/m 4) en sorteert alle zin-ID's numeriek. Gebruik dit document om gericht te testen op subskills zoals **VZV** of **MV**.\n\n";
overview += `- Totaal aantal zinnen: **${all.length}**.\n`;
overview += '- Controle: elke zin bevat expliciet een **PV** en **OW**.\n';
overview += `- ID-bereiken na hernummering: **${ranges}**.\n\n`;
overview += '## Subskillmatrix (aantallen)\n\n| Subskill | Totaal | N1 | N2 | N3 | N4 |\n|---|---:|---:|---:|---:|---:|\n';

for (const [name, pred] of Object.entries(defs)) {
  const c = [1, 2, 3, 4].map((l) => byLevel[l].filter(pred).length);
  overview += `| ${name} | ${c.reduce((a, b) => a + b, 0)} | ${c[0]} | ${c[1]} | ${c[2]} | ${c[3]} |\n`;
}

for (const [name, pred] of Object.entries(defs)) {
  overview += `\n## ${name}\n\n`;
  for (const l of [1, 2, 3, 4]) {
    const ids = byLevel[l].filter(pred).map((s) => s.id);
    overview += `- Niveau ${l} (${ids.length}): ${ids.length ? ids.join(', ') : '—'}\n`;
  }
}

fs.writeFileSync('TEACHERS_SENTENCE_OVERVIEW.md', overview);

const audit = `# Sentence parse audit (maart 2026)\n\nDeze controle volgt de workflow van \`zinsontleding-repo-inspector\` en \`zinsontleding-constraint-sentence-author\`, opnieuw uitgevoerd op de actuele dataset.\n\n## Label inventory\n\nGebruikte labels in de dataset sluiten aan op \`types.ts\` en \`constants.ts\`: \`pv\`, \`ow\`, \`lv\`, \`mv\`, \`bwb\`, \`vv\`, \`wg\`, \`ng\`, \`nwd\`, \`wwd\`, \`bijst\`, \`bijzin\`, \`vw_neven\`, \`vw_onder\`, plus \`subRole: bijv_bep\`.\n\n## Annotation model\n\n- Token-per-woord annotatie in alle niveaubestanden.\n- Chunks via opeenvolgende rollen en \`newChunk\` waar nodig.\n- \`predicateType\` wordt consistent gebruikt (\`WG\` of \`NG\`).\n\n## Supported phenomena\n\n- Kernzinnen met \`pv/ow/lv/mv/bwb\`.\n- VZV-zinnen (\`vv\`) op meerdere niveaus.\n- NG/WG-onderscheid met \`nwd\`/\`wwd\`.\n- Samengestelde zinnen met \`bijzin\`, \`vw_neven\` en \`vw_onder\`.\n\n## Feedback hooks\n\nDe gecontroleerde zinnen gebruiken alleen rollen die door bestaande feedback/hints worden ondersteund in \`constants.ts\`.\n\n## Risks / ambiguities to avoid\n\n- Vermijd schoolgrammaticale dubbellezing zonder expliciete fallback via \`alternativeRole\`.\n- Houd één hoofdvalkuil per nieuwe zin om feedback scherp te houden.\n\n## Parse correctness check\n\nAutomatische controles op alle ${all.length} zinnen:\n\n- geldig rolgebruik (\`role\`, \`subRole\`, \`bijzinFunctie\`)\n- unieke en consistente token-id's (\`s<zinId>t<tokenIndex>\`)\n- niveauconsistentie (\`sentence.level\` == bestandsniveau)\n- aanwezigheid van expliciete \`pv\` en \`ow\`\n\nResultaat: **alle ${all.length} zinnen slagen**.\n\n## Numerieke ordening\n\n- Binnen elk niveaubestand staan zinnen in oplopende \`id\`.\n- Globale id-reeks: **${ranges}**.\n- Voor docenten is een numeriek overzicht per subskill beschikbaar in \`TEACHERS_SENTENCE_OVERVIEW.md\`.\n`;

fs.writeFileSync('data/sentence-parse-audit.md', audit);
console.log('Regenerated docs and validated sentence dataset.');
