#!/usr/bin/env python3
"""Meet Drex tegen de bestaande Ontleedlab-annotaties.

Gebruik (vanuit de repo-root, met DREX_API_KEY in de omgeving of in .env):
    python3 scripts/drex-audit/measure.py [aantal_zinnen] [uitvoer.jsonl]

Constituent-role audit, op de zinsdeelgrenzen uit de huidige JSON:
  A_v2     classificatie: Drex kiest per zinsdeel een functie (labels + omschrijvingen, versie 2)
  A_v1     idem met de eerste omschrijvingen (A/B)
  A_bare   idem zonder omschrijvingen (hoeveel haalt Drex uit de labelnaam zelf?)
  B_gold   verificatie: Drex ziet de goudannotatie en geeft per zinsdeel P(label klopt)
  B_mut    verificatie: idem, met één bewust ingebouwde fout per zin (alleen dat zinsdeel)

Kost ongeveer 1 miljoen invoertokens voor het hele corpus (enkele centen).
Het resultaat bevat alleen zinnen uit de repo en Drex-antwoorden; geen leerlinggegevens.
"""
import glob
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import schema  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
URL = 'https://drex.nace.ai/v1/systemone'
MODEL = 'drex-latest'
CONCURRENCY = 2  # in-flight-limiet van een gratis Drex-account


def api_key():
    if os.environ.get('DREX_API_KEY'):
        return os.environ['DREX_API_KEY']
    env = REPO / '.env'
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith('DREX_API_KEY='):
                return line.split('=', 1)[1].strip()
    sys.exit('DREX_API_KEY ontbreekt (omgeving of .env).')


def call(key, state, questions):
    body = json.dumps({'model': MODEL, 'state': state, 'questions': questions}).encode()
    for attempt in range(8):
        req = urllib.request.Request(URL, data=body, headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
        try:
            return json.load(urllib.request.urlopen(req, timeout=70))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 529):
                time.sleep(int(e.headers.get('retry-after-ms') or 2000) / 1000 + attempt)
                continue
            raise RuntimeError(f'Drex {e.code}: {e.read()[:300]!r}')
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            time.sleep(2 ** attempt)
    raise RuntimeError('Drex: te veel mislukte pogingen')


CLASSIFY_VARIANTS = (('A_v2', schema.DESC), ('A_v1', schema.DESC_V1), ('A_bare', None))


def measure_sentence(key, sentence, seed):
    cs = schema.target_chunks(sentence)
    if not cs:
        return []
    base = {'id': sentence['id'], 'level': sentence['level'], 'zin': schema.sentence_text(sentence)}
    chunk_fields = lambda c: {'chunk': c['text'], 'start': c['start'], 'end': c['end'], 'gold': c['role'], 'accepted': c['accepted']}
    rows = []

    # A: alle varianten in één aanroep; vragen over dezelfde state beïnvloeden elkaar niet.
    qs = {f'{v}_c{i}': schema.classify_question(sentence, c, desc)
          for v, desc in CLASSIFY_VARIANTS for i, c in enumerate(cs)}
    r = call(key, base['zin'], qs)
    per_q_tokens = r['usage']['input_tokens'] / len(qs)
    for v, _ in CLASSIFY_VARIANTS:
        for i, c in enumerate(cs):
            a = r['answers'][f'{v}_c{i}']
            rows.append({**base, **chunk_fields(c), 'setup': v, 'pred': schema.BACK[a['choice']], 'conf': a['confidence'],
                         'probs': {schema.BACK[k]: p for k, p in a['probabilities'].items()},
                         'tokens': per_q_tokens, 'model': r['model']})

    # B: verificatie van de goudannotatie en van één bewust ingebouwde fout.
    candidates = [(i, m) for i, c in enumerate(cs) if (m := schema.mutate(c['role'], c['text']))]
    mut_i, mut_role = random.Random(seed).choice(candidates) if candidates else (None, None)
    gold = [c['role'] for c in cs]
    variants = [('B_gold', gold, range(len(cs)))]
    if mut_i is not None:
        variants.append(('B_mut', [mut_role if i == mut_i else l for i, l in enumerate(gold)], [mut_i]))
    for setup, labels, idx in variants:
        r = call(key, schema.verify_state(sentence, cs, labels),
                 {f'c{i}': schema.verify_question(sentence, cs[i], labels[i]) for i in idx})
        for i in idx:
            rows.append({**base, **chunk_fields(cs[i]), 'setup': setup, 'claimed': labels[i],
                         'noul': r['answers'][f'c{i}']['noul'],
                         'tokens': r['usage']['input_tokens'] / len(idx), 'model': r['model']})
    return rows


def load_corpus():
    sentences = []
    for f in sorted(glob.glob(str(REPO / 'src/data/sentences-level-[0-4].json'))):
        with open(f) as fh:
            sentences += json.load(fh)
    return sentences


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent / 'rows.jsonl'
    key = api_key()
    sentences = load_corpus()[:limit]
    with open(out_path, 'w') as out, ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        for n, rows in enumerate(ex.map(lambda p: measure_sentence(key, p[1], p[0]), enumerate(sentences)), 1):
            for row in rows:
                out.write(json.dumps(row, ensure_ascii=False) + '\n')
            out.flush()
            if n % 25 == 0:
                print(f'{n}/{len(sentences)} zinnen', flush=True)
    print(f'klaar: {len(sentences)} zinnen -> {out_path}')


if __name__ == '__main__':
    main()
