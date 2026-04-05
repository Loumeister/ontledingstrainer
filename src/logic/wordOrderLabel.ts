/**
 * wordOrderLabel — auto-detect Dutch sentence word order (woordvolgorde).
 *
 * Uses the typological SOV/SVO/VSO/VOS/OVS/OSV notation from Dryer (2013),
 * applied to Dutch zinsontleding roles:
 *   S = Onderwerp       (OW)
 *   V = Persoonsvorm    (PV)
 *   O = Lijdend/Meewerkend Voorwerp (LV or MV — first one encountered wins)
 *
 * Dutch main clauses are canonically SVO.
 * Inversie (topic fronting) produces VS orders: VSO, VOS, VS.
 * Bijzinnen (subordinate clauses) typically have SOV order.
 *
 * The module exposes two entry points:
 *   detectWordOrder(tokens)      — for persisted Token[] data
 *   detectWordOrderFromRoles(roles) — for editor state (ordered role keys)
 */

import type { Token } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Six full SVO variants + two partial variants + unknown */
export type WordOrderCode =
  | 'SVO' | 'SOV' | 'VSO' | 'VOS' | 'OVS' | 'OSV'
  | 'SV'  | 'VS'
  | '?';

export interface WordOrderInfo {
  code: WordOrderCode;
  /** True when an O (LV or MV) was found */
  hasObject: boolean;
  /** Dutch role abbreviations that contributed to the label, in detected order */
  components: string[];
}

// ---------------------------------------------------------------------------
// Badge style helpers (Tailwind classes)
// ---------------------------------------------------------------------------

/** Returns Tailwind classes for the word-order badge background + text. */
export function wordOrderBadgeClass(code: WordOrderCode): string {
  switch (code) {
    case 'SVO': return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'VSO':
    case 'VOS':
    case 'VS':  return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'SOV': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case 'OVS':
    case 'OSV': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    case 'SV':  return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    default:    return 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600';
  }
}

/** Short Dutch tooltip for the detected word order. */
export function wordOrderTooltip(code: WordOrderCode): string {
  switch (code) {
    case 'SVO': return 'Standaard volgorde (OW – PV – LV)';
    case 'SOV': return 'Bijzinvolgorde (OW – LV – PV)';
    case 'VSO': return 'Inversie: PV – OW – LV';
    case 'VOS': return 'Inversie: PV – LV – OW';
    case 'OVS': return 'Inversie: LV – PV – OW';
    case 'OSV': return 'Inversie: LV – OW – PV';
    case 'SV':  return 'Standaard zonder lijdend voorwerp (OW – PV)';
    case 'VS':  return 'Inversie zonder lijdend voorwerp (PV – OW)';
    default:    return 'Woordvolgorde onbekend';
  }
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * Given an ordered list of role keys (one per chunk / token / slot),
 * returns the word order code and metadata.
 *
 * Only the FIRST occurrence of each role is used to determine the order.
 * Roles that do not map to S, V, or O are ignored.
 */
export function detectWordOrderFromRoles(roles: readonly (string | undefined | null)[]): WordOrderInfo {
  let sPos = -1;
  let vPos = -1;
  let oPos = -1;
  let oRole = '';

  roles.forEach((role, i) => {
    if (!role) return;
    if (role === 'ow'  && sPos < 0) { sPos = i; }
    if (role === 'pv'  && vPos < 0) { vPos = i; }
    if ((role === 'lv' || role === 'mv') && oPos < 0) { oPos = i; oRole = role.toUpperCase(); }
  });

  const hasObject = oPos >= 0;

  // Build label from positions of present components
  type Slot = { pos: number; abbr: string };
  const slots: Slot[] = [];
  if (sPos >= 0) slots.push({ pos: sPos, abbr: 'OW' });
  if (vPos >= 0) slots.push({ pos: vPos, abbr: 'PV' });
  if (oPos >= 0) slots.push({ pos: oPos, abbr: oRole });
  slots.sort((a, b) => a.pos - b.pos);

  const components = slots.map(s => s.abbr);

  // Map triplet to code
  if (sPos < 0 || vPos < 0) {
    return { code: '?', hasObject, components };
  }

  if (!hasObject) {
    const code: WordOrderCode = sPos < vPos ? 'SV' : 'VS';
    return { code, hasObject, components };
  }

  // All three present
  const triple = [
    { pos: sPos, key: 'S' },
    { pos: vPos, key: 'V' },
    { pos: oPos, key: 'O' },
  ].sort((a, b) => a.pos - b.pos).map(x => x.key).join('') as WordOrderCode;

  const validCodes: WordOrderCode[] = ['SVO', 'SOV', 'VSO', 'VOS', 'OVS', 'OSV'];
  const code: WordOrderCode = validCodes.includes(triple) ? triple : '?';
  return { code, hasObject, components };
}

/**
 * Detect word order from a Token[] array (persisted sentence data).
 * Uses the position of the first token with each role.
 */
export function detectWordOrder(tokens: Token[]): WordOrderInfo {
  const roles = tokens.map(t => t.role as string | undefined);
  return detectWordOrderFromRoles(roles);
}
