import { describe, it, expect } from 'vitest';
import type { Sentence } from '../types';
import { buildSentenceOverview } from './sentenceOverview';
import level0 from '../data/sentences-level-0.json';
import level1 from '../data/sentences-level-1.json';
import level2 from '../data/sentences-level-2.json';
import level3 from '../data/sentences-level-3.json';
import level4 from '../data/sentences-level-4.json';

const all = [level0, level1, level2, level3, level4].flat() as Sentence[];

describe('zinnenoverzicht voor docenten', () => {
  it('past bij de actuele zinnen (bijwerken: npm run docs:zinnen)', async () => {
    await expect(buildSentenceOverview(all)).toMatchFileSnapshot('../../TEACHERS_SENTENCE_OVERVIEW.md');
  });

  it('telt per niveau en toont de zinsdelen per zin, met de functie van een bijzin', () => {
    const md = buildSentenceOverview([
      { id: 1, label: '', level: 0, predicateType: 'WG', tokens: [
        { id: 'a', text: 'Wij', role: 'ow' }, { id: 'b', text: 'lezen.', role: 'pv' },
      ] },
      { id: 2, label: '', level: 3, predicateType: 'WG', tokens: [
        { id: 'c', text: 'Ik', role: 'ow' }, { id: 'd', text: 'weet', role: 'pv' },
        { id: 'e', text: 'dat', role: 'bijzin', bijzinFunctie: 'lv' }, { id: 'f', text: 'hij', role: 'bijzin', bijzinFunctie: 'lv' },
        { id: 'g', text: 'komt.', role: 'bijzin', bijzinFunctie: 'lv' },
      ] },
    ]);
    expect(md).toContain('| **Totaal** | 2 | 2 | 0 |');
    expect(md).toContain('| 1 | Wij lezen. | OW · PV | WG |');
    expect(md).toContain('| 2 | Ik weet dat hij komt. | OW · PV · BIJZIN (LV) | WG |');
  });
});
