#!/usr/bin/env python3
"""Maak het meetrapport uit rows.jsonl (uitvoer van measure.py).

Gebruik: python3 scripts/drex-audit/analyse.py [rows.jsonl] > rapport.md
"""
import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from schema import TARGET_ROLES, agrees  # noqa: E402

CLASSIFY_THRESHOLDS = (0.2, 0.3, 0.5)
VERIFY_THRESHOLDS = (0.3, 0.5, 0.7)
CONF_BANDS = ((0, .5), (.5, .7), (.7, .8), (.8, .9), (.9, .95), (.95, 1.01))
NOUL_BANDS = ((0, .1), (.1, .3), (.3, .5), (.5, .7), (.7, .9), (.9, 1.01))


def pct(a, b):
    return f'{100 * a / b:.1f}%' if b else '–'


CLASSIFY_SETUPS = ('A_v2', 'A_v1', 'A_book', 'A_bare')  # A_book = eerste meting (omschrijvingen v1)


def load(path):
    rows = []
    with open(path) as fh:
        for line in fh:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue  # afgebroken laatste regel
            if 'accepted' not in row:  # eerste meting: alleen de rol van het eerste woord
                row['accepted'] = [row['gold']] + ([row['alt']] if row.get('alt') else [])
            rows.append(row)
    return rows


def key(row):
    return (row['id'], row['start']) if 'start' in row else (row['id'], row['chunk'])


def gold_prob(row):
    return max(row['probs'].get(r, 0) for r in row['accepted'])


def mutation_detection(classified, verified_gold, mutated):
    """Per methode en drempel: (gevonden fouten, vals alarm op goede zinsdelen)."""
    by_chunk = {key(r): r for r in classified}
    result = []
    for t in CLASSIFY_THRESHOLDS:
        found = sum(1 for m in mutated if (a := by_chunk.get(key(m))) and a['probs'].get(m['claimed'], 0) < t)
        false = sum(1 for r in classified if gold_prob(r) < t)
        result.append((f'classificatie: P(getoond label) < {t}', found, len(mutated), false, len(classified)))
    for t in VERIFY_THRESHOLDS:
        found = sum(1 for m in mutated if m['noul'] < t)
        false = sum(1 for r in verified_gold if r['noul'] < t)
        result.append((f'verificatie: noul < {t}', found, len(mutated), false, len(verified_gold)))
    return result


MATCHED_FPR = (0.01, 0.02, 0.05, 0.10)


def detection_at_fpr(gold_scores, mut_scores, fpr):
    """Drempel waaronder een fractie `fpr` van de goede labels valt; geeft (gevonden fouten, werkelijk vals alarm, drempel).

    Zo vergelijk je methodes eerlijk: allemaal bij hetzelfde aantal onterechte meldingen.
    """
    ranked = sorted(gold_scores)
    k = int(fpr * len(ranked))
    t = ranked[k] if k < len(ranked) else float('inf')
    found = sum(s < t for s in mut_scores) / len(mut_scores) if mut_scores else None
    return found, sum(s < t for s in ranked) / len(ranked), t


def auc(pos_scores, neg_scores):
    """Kans dat een willekeurig goed label hoger scoort dan een willekeurig fout label; None zonder beide klassen."""
    if not pos_scores or not neg_scores:
        return None
    wins = sum((p > n) + 0.5 * (p == n) for p in pos_scores for n in neg_scores)
    return wins / (len(pos_scores) * len(neg_scores))


def calibration(pairs, bands):
    """pairs: (score, klopt). Geeft per band (lo, hi, n, aantal klopt, gemiddelde score) en de ECE."""
    table, ece = [], 0.0
    for lo, hi in bands:
        s = [(p, c) for p, c in pairs if lo <= p < hi]
        hits = sum(c for _, c in s)
        mean = sum(p for p, _ in s) / len(s) if s else float('nan')
        if s:
            ece += len(s) / len(pairs) * abs(hits / len(s) - mean)
        table.append((lo, min(hi, 1), len(s), hits, mean))
    return table, ece


def report(rows):
    by = collections.defaultdict(list)
    for r in rows:
        by[r['setup']].append(r)
    variants = [v for v in CLASSIFY_SETUPS if by[v]]
    primary = next(v for v in ('A_v2', 'A_book') if by[v])
    A, Bg, Bm = by[primary], by['B_gold'], by['B_mut']
    tokens = sum(r['tokens'] for r in rows)
    models = sorted({r.get('model', '?') for r in rows})
    out = [f"Zinnen: {len({r['id'] for r in rows})} · zinsdelen: {len(A)} · model: {', '.join(models)} · "
           f"invoertokens: {tokens:,.0f} (≈ ${tokens * 40e-9:.3f})", '',
           f'Hoofdvariant voor secties 2–4: `{primary}`.', '']

    out += ['## 1. Overeenstemming met de annotatie (recall per rol)', '',
            '| rol | n | ' + ' | '.join(variants) + ' |', '|---|---|' + '---|' * len(variants)]
    for role in TARGET_ROLES + ('totaal',):
        cells = []
        for v in variants:
            sel = [r for r in by[v] if role == 'totaal' or r['gold'] == role]
            cells.append(pct(sum(map(agrees, sel)), len(sel)))
        n = len([r for r in A if role == 'totaal' or r['gold'] == role])
        out.append(f"| {role} | {n} | " + ' | '.join(cells) + ' |')

    out += ['', f'Per label wat Drex zegt (`{primary}`): precisie = hoe vaak dat label klopt; '
            'vals-positief = aandeel van de zinsdelen met een andere rol dat toch dit label krijgt.', '',
            '| label | Drex zegt dit | precisie | vals-positief |', '|---|---|---|---|']
    for role in TARGET_ROLES:
        said = [r for r in A if r['pred'] == role]
        others = [r for r in A if role not in r['accepted']]
        out.append(f"| {role} | {len(said)} | {pct(sum(role in r['accepted'] for r in said), len(said))} | "
                   f"{pct(sum(r['pred'] == role for r in others), len(others))} |")

    cm = collections.Counter((r['gold'], r['pred']) for r in A)
    out += ['', f'Verwarringsmatrix (`{primary}`; rij = annotatie, kolom = Drex):', '',
            '| | ' + ' | '.join(TARGET_ROLES) + ' |', '|---' * (len(TARGET_ROLES) + 1) + '|']
    for g in TARGET_ROLES:
        out.append(f'| **{g}** | ' + ' | '.join(str(cm[(g, p)] or '·') for p in TARGET_ROLES) + ' |')

    out += ['', '## 2. Bewust ingebouwde fouten', '', f'{len(Bm)} zinnen kregen één verwisseling.', '',
            '| methode | fouten gevonden | vals alarm op goede zinsdelen |', '|---|---|---|']
    for name, found, n_mut, false, n_gold in mutation_detection(A, Bg, Bm):
        out.append(f'| {name} | {pct(found, n_mut)} ({found}/{n_mut}) | {pct(false, n_gold)} ({false}/{n_gold}) |')
    out += ['', 'De verwisselingen komen uit `schema.mutate`: een testharnas. Deze cijfers zeggen of de audit zo\'n fout '
            'vindt, niet hoe vaak het corpus fouten bevat.']
    out += ['', 'Bij gelijke vals-alarmkans (drempel gekozen op de goede labels; de ingebouwde fouten zijn per variant dezelfde):', '',
            '| methode | AUC | ' + ' | '.join(f'@{f:.0%} vals alarm' for f in MATCHED_FPR) + ' |', '|---|---|' + '---|' * len(MATCHED_FPR)]
    methods = []
    for v in variants:
        chunk_of = {key(r): r for r in by[v]}
        methods.append((f'classificatie `{v}`', [gold_prob(r) for r in by[v]],
                        [chunk_of[key(m)]['probs'].get(m['claimed'], 0) for m in Bm if key(m) in chunk_of]))
    methods.append(('verificatie', [r['noul'] for r in Bg], [m['noul'] for m in Bm]))
    for name, g, m in methods:
        a = auc(g, m)
        cells = [f'{pct(found * len(m), len(m))} (< {t:.2f})' for found, _, t in (detection_at_fpr(g, m, f) for f in MATCHED_FPR)]
        out.append(f"| {name} | {'–' if a is None else f'{a:.3f}'} | " + ' | '.join(cells) + ' |')

    auc_value = auc([r['noul'] for r in Bg], [m['noul'] for m in Bm])
    out += ['', f"Verificatie-AUC: {'–' if auc_value is None else f'{auc_value:.3f}'} "
            '(kans dat een goed label hoger scoort dan een fout label; 0,5 = gokken)', '',
            'Per soort verwisseling:', '',
            '| verwisseling | n | verificatie (noul < 0,5) | classificatie (P < 0,3) |', '|---|---|---|---|']
    by_chunk = {key(r): r for r in A}
    kinds = collections.defaultdict(list)
    for m in Bm:
        a = by_chunk.get(key(m))
        kinds[f"{m['gold']} → {m['claimed']}"].append((m['noul'] < 0.5, bool(a) and a['probs'].get(m['claimed'], 0) < 0.3))
    for k, v in sorted(kinds.items(), key=lambda kv: -len(kv[1])):
        out.append(f'| {k} | {len(v)} | {pct(sum(x for x, _ in v), len(v))} | {pct(sum(y for _, y in v), len(v))} |')

    out += ['', '## 3. Zekerheid tegenover werkelijkheid', '',
            'Classificatie: confidence-band → hoe vaak Drex gelijk heeft aan de annotatie', '',
            '| confidence | n | gelijk aan annotatie | gemiddelde confidence |', '|---|---|---|---|']
    table, ece_a = calibration([(r['conf'], agrees(r)) for r in A], CONF_BANDS)
    for lo, hi, n, hits, mean in table:
        out.append(f'| {lo:.2f}–{hi:.2f} | {n} | {pct(hits, n)} | {mean:.2f} |' if n else f'| {lo:.2f}–{hi:.2f} | 0 | – | – |')
    out += ['', f'Kalibratiefout (ECE) classificatie: {ece_a:.3f}', '',
            'Verificatie: noul-band → hoe vaak het getoonde label werkelijk klopt (goud en gemuteerd samen)', '',
            '| noul | n | label klopt | gemiddelde noul |', '|---|---|---|---|']
    table, ece_b = calibration([(r['noul'], True) for r in Bg] + [(m['noul'], False) for m in Bm], NOUL_BANDS)
    for lo, hi, n, hits, mean in table:
        out.append(f'| {lo:.1f}–{hi:.1f} | {n} | {pct(hits, n)} | {mean:.2f} |' if n else f'| {lo:.1f}–{hi:.1f} | 0 | – | – |')
    out += ['', f'Kalibratiefout (ECE) verificatie: {ece_b:.3f}']

    verify = {key(r): r['noul'] for r in Bg}
    dis = sorted([r for r in A if not agrees(r) and r['conf'] >= 0.8], key=lambda r: -r['conf'])
    out += ['', '## 4. Drex zeker (confidence ≥ 0,8) én oneens met de annotatie', '',
            f'{len(dis)} zinsdelen. Kandidaten voor menselijke review, geen bewezen fouten.', '',
            '| zin | niveau | zinsdeel | annotatie | Drex | conf. | verificatie | zin |', '|---|---|---|---|---|---|---|---|']
    for r in dis:
        v = verify.get(key(r))
        out.append(f"| {r['id']} | {r['level']} | {r['chunk']} | {r['gold']} | {r['pred']} | {r['conf']:.2f} | "
                   f"{'–' if v is None else f'{v:.2f}'} | {r['zin']} |")
    return '\n'.join(out)


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent / 'rows.jsonl'
    print(report(load(path)))
