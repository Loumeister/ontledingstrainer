import { LEVEL_NAMES, ROLES } from '../constants';
import type { DifficultyLevel, RoleKey, Sentence, Token } from '../types';
import { detectWordOrder, type WordOrderCode } from './wordOrderLabel';

/**
 * Builds TEACHERS_SENTENCE_OVERVIEW.md from the built-in sentences. Counts and lists come
 * from the data only, so the overview cannot drift from what students actually practise.
 */

const LEVELS: DifficultyLevel[] = [0, 1, 2, 3, 4];
const WORD_ORDERS: WordOrderCode[] = ['SVO', 'SV', 'VSO', 'VS', 'OVS', 'VOS', 'SOV', 'OSV', '?'];

const shortLabel = (role: RoleKey) => ROLES.find(r => r.key === role)?.shortLabel ?? role.toUpperCase();

/** Chunks follow the same rule as validation: a new chunk starts on a role change or newChunk. */
function chunkTokens(tokens: Token[]): Token[][] {
  const chunks: Token[][] = [];
  tokens.forEach((t, i) => {
    if (i === 0 || t.role !== tokens[i - 1].role || t.newChunk) chunks.push([t]);
    else chunks[chunks.length - 1].push(t);
  });
  return chunks;
}

function describeChunks(s: Sentence): string {
  return chunkTokens(s.tokens).map(chunk => {
    const first = chunk[0];
    const functie = first.role === 'bijzin' && first.bijzinFunctie ? ` (${shortLabel(first.bijzinFunctie)})` : '';
    return shortLabel(first.role) + functie;
  }).join(' · ');
}

const cell = (text: string) => text.replace(/\|/g, '\\|');
const hasRole = (s: Sentence, role: RoleKey) => s.tokens.some(t => t.role === role);
const count = (sentences: Sentence[], test: (s: Sentence) => boolean) => sentences.filter(test).length;

export function buildSentenceOverview(sentences: Sentence[]): string {
  const byLevel = new Map(LEVELS.map(l => [l, sentences.filter(s => s.level === l).sort((a, b) => a.id - b.id)]));
  const levelName = (l: DifficultyLevel) => `${LEVEL_NAMES[l]} (${l})`;
  const lines: string[] = [];

  lines.push(
    '# Zinnenoverzicht voor docenten',
    '',
    '> Automatisch gegenereerd uit `src/data/sentences-level-*.json`. Bewerk dit bestand niet met de hand:',
    '> werk het bij met `npm run docs:zinnen`. De test in `src/logic/sentenceOverview.test.ts` faalt',
    '> zodra dit overzicht niet meer bij de zinnen past.',
    '',
    '## Per niveau',
    '',
    '| Niveau | Zinnen | WG | NG | Met LV | Met MV | Met VV | Met BWB | Met bijzin | Nevenschikking |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  );
  const levelRow = (label: string, group: Sentence[]) => `| ${label} | ${group.length} | ${[
    count(group, s => s.predicateType === 'WG'),
    count(group, s => s.predicateType === 'NG'),
    count(group, s => hasRole(s, 'lv')),
    count(group, s => hasRole(s, 'mv')),
    count(group, s => hasRole(s, 'vv')),
    count(group, s => hasRole(s, 'bwb')),
    count(group, s => hasRole(s, 'bijzin')),
    count(group, s => hasRole(s, 'vw_neven')),
  ].join(' | ')} |`;
  for (const l of LEVELS) lines.push(levelRow(levelName(l), byLevel.get(l)!));
  lines.push(levelRow('**Totaal**', sentences));

  const orders = WORD_ORDERS.filter(code => sentences.some(s => detectWordOrder(s.tokens).code === code));
  lines.push(
    '',
    '## Woordvolgorde per niveau',
    '',
    'OW = S, PV = V, eerste LV of MV = O. Alles waar de PV vóór het OW staat, is inversie. "Zonder OW": bevelzin of onderwerpszin.',
    '',
    `| Niveau | ${orders.map(code => (code === '?' ? 'zonder OW' : code)).join(' | ')} |`,
    `|---|${orders.map(() => '---:').join('|')}|`,
  );
  for (const l of LEVELS) {
    const group = byLevel.get(l)!;
    lines.push(`| ${levelName(l)} | ${orders.map(code => count(group, s => detectWordOrder(s.tokens).code === code)).join(' | ')} |`);
  }

  const tags = new Map<string, number[]>();
  for (const s of [...sentences].sort((a, b) => a.id - b.id)) {
    for (const tag of s.structuralTags ?? []) tags.set(tag, [...(tags.get(tag) ?? []), s.id]);
  }
  lines.push('', '## Structuurlabels', '', '| Label | Zinnen |', '|---|---|');
  for (const tag of [...tags.keys()].sort((a, b) => a.localeCompare(b, 'nl'))) {
    lines.push(`| ${cell(tag)} | ${tags.get(tag)!.join(', ')} |`);
  }

  lines.push('', '## Alle zinnen');
  for (const l of LEVELS) {
    lines.push('', `### ${levelName(l)}`, '', '| ID | Zin | Zinsdelen | Gezegde |', '|---:|---|---|---|');
    for (const s of byLevel.get(l)!) {
      lines.push(`| ${s.id} | ${cell(s.tokens.map(t => t.text).join(' '))} | ${describeChunks(s)} | ${s.predicateType} |`);
    }
  }

  return lines.join('\n') + '\n';
}
