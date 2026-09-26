#!/usr/bin/env python3
"""Externe validatie van de bevroren Drex-configuratie met blinde menselijke beoordelingen.

Vooraf vastgelegd in PREREGISTRATIE.md. Verander de constanten hieronder niet na het zien van de beoordelingen.

Gebruik:
    python3 scripts/drex-audit/score_goldset.py --blad1 goldset-blind.csv [--blad2 goldset-blind-2.csv]

Leest het ontwerp (goldset/ontwerp.csv) en de bevroren Drex-scores van meting 2; roept Drex niet aan.
"""
import argparse
import collections
import csv
import math
from pathlib import Path

HERE = Path(__file__).parent
DESIGN = HERE / 'goldset' / 'ontwerp.csv'
SCORES = HERE / 'resultaten' / '2026-09-26-meting-2-scores.csv'

# ── Bevroren configuratie (gekozen op meting 2 met kunstmatige fouten: 77% gevonden bij 5,0% vals alarm) ──
FLAG_P_LABELS_BELOW = 0.18   # classificatie met alleen labels: P(goedgekeurde rol) onder deze waarde
FLAG_NOUL_BELOW = 0.45       # verificatie van het bestaande label: noul onder deze waarde
SUSPECT_NOUL_BELOW = 0.5     # alleen voor het steekproefontwerp (stratum 'verdacht'), geen beslisregel
USEFUL_PRECISION = 0.20      # S1: bruikbaar als reviewrij
SECOND_OPINION_PRECISION = 0.10
MIN_CONFIRMED_ERRORS = 3

ROLE_MAP = {'ow': 'ow', 'lv': 'lv', 'mv': 'mv', 'vv': 'vv', 'vzv': 'vv', 'bwb': 'bwb', 'nwd': 'ng', 'ng': 'ng',
            'bijst': 'bijst', 'anders': 'anders'}
YES = {'ja', 'j', 'yes', 'y', '1', 'true', 'x'}


def read_csv(path):
    with open(path, encoding='utf-8-sig', newline='') as fh:
        return list(csv.DictReader(fh, delimiter=';'))


def column(row, *prefixes):
    for name, value in row.items():
        if name and any(name.strip().lower().startswith(p) for p in prefixes):
            return (value or '').strip()
    return ''


def flagged(score):
    return score['p_labels'] < FLAG_P_LABELS_BELOW or score['noul'] < FLAG_NOUL_BELOW


def design_stratum(score):
    """Stratum zoals bij het trekken van blad 1; bepaalt samen met rol en markering de gewichten."""
    if score['role'] == 'bijst':
        return 'alle'
    suspect = score['drex_role'] not in score['accepted'] or score['noul'] < SUSPECT_NOUL_BELOW
    return 'verdacht' if suspect else 'controle'


def load_scores(path=SCORES):
    scores = {}
    for r in read_csv(path):
        scores[(int(r['zin_id']), int(r['start']))] = {
            'role': r['annotatie'], 'accepted': r['goedgekeurd'].split('|'), 'drex_role': r['drex_alleen_labels'],
            'p_labels': float(r['p_goedgekeurd_alleen_labels']), 'noul': float(r['verificatie_noul']),
        }
    return scores


def load_judgements(design_path, sheets):
    """sheets: {blad: pad}. Geeft {(zin_id, start): (menselijke rol, twijfel, opmerking)} voor ingevulde regels."""
    design = {(int(r['blad']), int(r['nr'])): (int(r['zin_id']), int(r['start'])) for r in read_csv(design_path)}
    judged = {}
    for blad, path in sheets.items():
        for row in read_csv(path):
            key = design[(blad, int(row['nr']))]
            if int(row['zin_id']) != key[0]:
                raise ValueError(f'blad {blad} nr {row["nr"]}: zin_id {row["zin_id"]} past niet bij het ontwerp ({key[0]})')
            raw = column(row, 'human_role', 'jouw_rol').lower()
            if not raw:
                continue
            if raw not in ROLE_MAP:
                raise ValueError(f'blad {blad} nr {row["nr"]}: onbekende rol "{raw}"')
            judged[key] = (ROLE_MAP[raw], column(row, 'ambiguous', 'twee_lezingen').lower() in YES,
                           column(row, 'note', 'opmerking'))
    return judged


def verdict(score, human_role, ambiguous):
    if ambiguous:
        return 'twijfel'
    return 'correct' if human_role in score['accepted'] else 'fout'


def wilson(k, n, z=1.96):
    if n == 0:
        return None
    p = k / n
    d = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, centre - half), min(1.0, centre + half)


def weights(scores, judged):
    """Post-stratificatie: gewicht = populatie / beoordeeld per cel (rol, ontwerpstratum, gemarkeerd)."""
    cell = lambda x: (scores[x]['role'], design_stratum(scores[x]), flagged(scores[x]))
    population = collections.Counter(cell(x) for x in scores)
    sampled = collections.Counter(cell(x) for x in judged)
    w = {x: population[cell(x)] / sampled[cell(x)] for x in judged}
    uncovered = {c: n for c, n in population.items() if not sampled[c]}
    return w, uncovered


def evaluate(scores, judged):
    items = [(x, scores[x], *judged[x]) for x in judged]
    v = {x: verdict(s, h, a) for x, s, h, a, _ in items}
    f = {x: flagged(scores[x]) for x in judged}
    w, uncovered = weights(scores, judged)
    all_flagged = [x for x in scores if flagged(scores[x])]

    flagged_judged = [x for x in judged if f[x]]
    decided = [x for x in flagged_judged if v[x] != 'twijfel']
    errors_flagged = sum(v[x] == 'fout' for x in decided)

    def wsum(pred):
        return sum(w[x] for x in judged if pred(x))

    correct_w = wsum(lambda x: v[x] == 'correct')
    error_w = wsum(lambda x: v[x] == 'fout')
    decided_w = wsum(lambda x: v[x] != 'twijfel')
    non_amb = [x for x in judged if v[x] != 'twijfel']
    return {
        'judged': len(judged),
        'flagged_total': len(all_flagged),
        'flagged_judged': len(flagged_judged),
        'flagged_ambiguous': sum(v[x] == 'twijfel' for x in flagged_judged),
        'errors_flagged': errors_flagged,
        'precision': errors_flagged / len(decided) if decided else None,
        'precision_ci': wilson(errors_flagged, len(decided)),
        'review_worthy': sum(v[x] != 'correct' for x in flagged_judged) / len(flagged_judged) if flagged_judged else None,
        'specificity_w': wsum(lambda x: v[x] == 'correct' and not f[x]) / correct_w if correct_w else None,
        'recall_w': wsum(lambda x: v[x] == 'fout' and f[x]) / error_w if error_w else None,
        'error_rate_w': error_w / decided_w if decided_w else None,
        'errors_unflagged': sum(v[x] == 'fout' and not f[x] for x in judged),
        'drex_human_agreement': (sum(scores[x]['drex_role'] == judged[x][0] for x in non_amb), len(non_amb)),
        'uncovered': uncovered,
        'verdicts': v,
        'flags': f,
    }


def decision(m):
    if m['flagged_judged'] < m['flagged_total']:
        return f"voorlopig: {m['flagged_judged']} van {m['flagged_total']} gemarkeerde zinsdelen beoordeeld"
    p = m['precision']
    if p is None:
        return 'geen beslissing: alle gemarkeerde zinsdelen zijn twijfelgevallen'
    if p >= USEFUL_PRECISION and m['errors_flagged'] >= MIN_CONFIRMED_ERRORS:
        return 'S1 gehaald: bruikbaar als reviewrij voor zinsauteurs'
    if p >= SECOND_OPINION_PRECISION:
        return 'alleen als tweede mening; geen vaste reviewrij'
    return 'stoppen: Drex bootst vooral de huidige annotatie na'


def fmt(p):
    return '–' if p is None else f'{100 * p:.1f}%'


def report(scores, judged):
    m = evaluate(scores, judged)
    ci = m['precision_ci']
    agree_k, agree_n = m['drex_human_agreement']
    out = ['# Gold-set: externe validatie', '',
           f"Beoordeeld: {m['judged']} zinsdelen · bevroren regel: P(alleen labels) < {FLAG_P_LABELS_BELOW} "
           f"of verificatie-noul < {FLAG_NOUL_BELOW}", '',
           f"**Beslissing (vooraf vastgelegd): {decision(m)}**", '',
           '| maat | waarde | toelichting |', '|---|---|---|',
           f"| corpus-error precision | {fmt(m['precision'])} ({m['errors_flagged']} fout"
           f"{'' if ci is None else f'; 95%-BI {fmt(ci[0])}–{fmt(ci[1])}'}) | van de gemarkeerde, niet-twijfelachtige zinsdelen: echt fout geannoteerd |",
           f"| reviewwaardig | {fmt(m['review_worthy'])} | gemarkeerd en fout óf twijfelgeval ({m['flagged_ambiguous']} twijfel) |",
           f"| laat correcte items met rust | {fmt(m['specificity_w'])} | gewogen naar het corpus |",
           f"| corpus-error recall | {fmt(m['recall_w'])} | gewogen; {m['errors_unflagged']} gemiste fout(en) in de steekproef — weinig zeggingskracht |",
           f"| geschatte annotatiefouten | {fmt(m['error_rate_w'])} | gewogen, twijfelgevallen niet meegeteld |",
           f"| Drex (alleen labels) = mens | {fmt(agree_k / agree_n if agree_n else None)} ({agree_k}/{agree_n}) | ongewogen |", '']
    if m['uncovered']:
        out += ['Cellen zonder beoordeling (niet vertegenwoordigd in de gewogen cijfers): ' +
                ', '.join(f'{r}/{s}/{"gemarkeerd" if fl else "ongemarkeerd"} (N={n})' for (r, s, fl), n in sorted(m['uncovered'].items())), '']
    if (5008, 2) in judged:
        h, a, _ = judged[(5008, 2)]
        out += [f"Sanity check zin 5008 *naar muziek* (geannoteerd BWB, Drex VV): mens = {h}{' (twijfel)' if a else ''}.", '']
    out += ['## Gemarkeerd en volgens de mens fout of twijfel', '', '| zin | zinsdeel-start | annotatie | Drex | mens | oordeel | opmerking |',
            '|---|---|---|---|---|---|---|']
    for x in sorted(judged):
        if m['flags'][x] and m['verdicts'][x] != 'correct':
            s, (h, _, note) = scores[x], judged[x]
            out.append(f"| {x[0]} | {x[1]} | {s['role']} | {s['drex_role']} | {h} | {m['verdicts'][x]} | {note} |")
    return '\n'.join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--blad1')
    ap.add_argument('--blad2')
    args = ap.parse_args()
    sheets = {b: p for b, p in ((1, args.blad1), (2, args.blad2)) if p}
    if not sheets:
        ap.error('geef minstens --blad1 of --blad2')
    print(report(load_scores(), load_judgements(DESIGN, sheets)))


if __name__ == '__main__':
    main()
