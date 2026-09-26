"""Tests zonder netwerk: python3 -m unittest discover -s scripts/drex-audit"""
import glob
import json
import unittest
from pathlib import Path

import analyse
import schema

REPO = Path(__file__).resolve().parents[2]


def corpus():
    for f in sorted(glob.glob(str(REPO / 'src/data/sentences-level-[0-4].json'))):
        with open(f) as fh:
            yield from json.load(fh)


def tok(text, role, **extra):
    return {'id': 'x', 'text': text, 'role': role, **extra}


class ChunkTest(unittest.TestCase):
    def test_chunks_follow_role_changes_and_new_chunk(self):
        s = {'tokens': [tok('De', 'ow'), tok('kok', 'ow'), tok('serveert', 'pv'), tok('soep', 'lv'),
                        tok('aan', 'mv'), tok('de', 'mv'), tok('gasten.', 'mv')]}
        self.assertEqual([(c['role'], c['text']) for c in schema.chunks(s)],
                         [('ow', 'De kok'), ('pv', 'serveert'), ('lv', 'soep'), ('mv', 'aan de gasten')])
        s = {'tokens': [tok('gisteren', 'bwb'), tok('thuis', 'bwb', newChunk=True)]}
        self.assertEqual([c['text'] for c in schema.chunks(s)], ['gisteren', 'thuis'])

    def test_chunks_keep_token_span(self):
        s = {'tokens': [tok('Ik', 'ow'), tok('zie', 'pv'), tok('de', 'lv'), tok('kat.', 'lv')]}
        self.assertEqual([(c['start'], c['end']) for c in schema.chunks(s)], [(0, 0), (1, 1), (2, 3)])

    def test_accepted_roles_follow_app_validation(self):
        # Zelfde regel als getConsistentRole: een rol telt alleen als elk woord hem toestaat.
        self.assertEqual(schema.accepted_roles([tok('op', 'vv', alternativeRole='bwb'), tok('tijd', 'vv', alternativeRole='bwb')]),
                         ['bwb', 'vv'])
        # Zin 147: nwd op alleen "worden" is een subrol-alternatief, geen goed antwoord voor het zinsdeel.
        self.assertEqual(schema.accepted_roles([tok('dokter', 'ng', subRole='nwd'),
                                                tok('worden.', 'ng', subRole='wwd', alternativeRole='nwd')]), ['ng'])

    def test_alternative_on_first_token_only_is_not_accepted(self):
        # validation.ts keurt een leerlinglabel alleen goed als élk woord het toestaat (roleMatchesToken over alle
        # tokens); #173 laat de docentanalyse in sentenceAnalysis.ts dezelfde regel volgen.
        self.assertEqual(schema.accepted_roles([tok('iets', 'vv', alternativeRole='bwb'), tok('anders', 'vv')]), ['vv'])

    def test_anchor_disambiguates_repeated_text_without_counting(self):
        s = {'tokens': [tok('Ik', 'ow'), tok('ben', 'pv'), tok('moe,', 'ng'), tok('maar', 'vw_neven'),
                        tok('ik', 'ow'), tok('slaap', 'pv'), tok('niet.', 'bwb')]}
        first, second = [c for c in schema.target_chunks(s) if c['role'] == 'ow']
        self.assertEqual(schema.anchor(s, first), '"Ik" (in "Ik ben")')
        self.assertEqual(schema.anchor(s, second), '"ik" (in "maar ik slaap")')
        moe = next(c for c in schema.target_chunks(s) if c['role'] == 'ng')
        self.assertEqual(schema.anchor(s, moe), '"moe"')

    def test_target_chunks_skip_verbs_and_clauses(self):
        s = {'tokens': [tok('Ik', 'ow'), tok('weet', 'pv'), tok('dat', 'bijzin'), tok('het', 'bijzin')]}
        self.assertEqual([c['role'] for c in schema.target_chunks(s)], ['ow'])

    def test_every_corpus_target_chunk_has_text(self):
        # Via chunks(), niet target_chunks(): die filtert lege zinsdelen al weg.
        for s in corpus():
            for c in schema.chunks(s):
                if c['role'] in schema.LABEL:
                    self.assertTrue(c['text'], f"zin {s['id']} heeft een leeg {c['role']}-zinsdeel")

    def test_corpus_chunk_keys_are_unique(self):
        # (zin-id, starttoken) is de sleutel in de resultaten; de tekst is alleen weergave (zin 326: twee keer "wij").
        keys = [(s['id'], c['start']) for s in corpus() for c in schema.target_chunks(s)]
        self.assertEqual(len(keys), len(set(keys)))


class MutationTest(unittest.TestCase):
    def test_expected_mutation_mapping(self):
        self.assertEqual(schema.mutate('mv', 'aan de gasten'), 'vv')
        self.assertEqual(schema.mutate('mv', 'hun'), 'lv')
        self.assertEqual(schema.mutate('bwb', 'naar school'), 'vv')
        self.assertEqual(schema.mutate('bwb', 'elke woensdag'), 'lv')
        self.assertIsNone(schema.mutate('bwb', 'gisteren'))

    def test_mutation_always_changes_the_role(self):
        for role in schema.TARGET_ROLES:
            for text in ('aan hem', 'de hond', 'morgen'):
                m = schema.mutate(role, text)
                self.assertTrue(m is None or (m != role and m in schema.LABEL))


class QuestionShapeTest(unittest.TestCase):
    """Drex-contract (docs "Shape a choice question" en "Migrate from TypeSafe"): instructions moet een string zijn;
    een choice-omschrijving mag een string of null zijn. Live bevestigd in test_live_contract.py."""

    def test_classify_questions_match_drex_contract(self):
        s = {'tokens': [tok('De', 'ow'), tok('kok', 'ow'), tok('kookt.', 'pv')]}
        c = schema.target_chunks(s)[0]
        for desc in (schema.DESC, schema.DESC_V1, None):
            q = schema.classify_question(s, c, desc)
            self.assertTrue(isinstance(q['instructions'], str) and q['instructions'])
            self.assertNotIn('other', q['criteria'])  # 'other' naast korte codes trok alle kans naar zich toe
            expected = (lambda v: isinstance(v, str) and v) if desc else (lambda v: v is None)
            self.assertTrue(all(expected(v) for v in q['criteria'].values()))

    def test_labels_are_descriptive_and_round_trip(self):
        for role, label in schema.LABEL.items():
            self.assertGreater(len(label), 3)
            self.assertEqual(schema.BACK[label], role)


class AnalyseTest(unittest.TestCase):
    def test_agreement_uses_accepted_roles(self):
        self.assertTrue(schema.agrees({'pred': 'bwb', 'gold': 'vv', 'accepted': ['bwb', 'vv']}))
        self.assertFalse(schema.agrees({'pred': 'bwb', 'gold': 'vv', 'accepted': ['vv']}))

    def test_descriptions_cover_every_label(self):
        for desc in (schema.DESC, schema.DESC_V1):
            self.assertEqual(set(desc), set(schema.LABEL))

    def test_auc_and_calibration(self):
        self.assertEqual(analyse.auc([0.9, 0.8], [0.1, 0.2]), 1.0)
        self.assertEqual(analyse.auc([0.5], [0.5]), 0.5)

    def test_detection_at_matched_false_positive_rate(self):
        gold = [0.1, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9, 0.95, 0.95, 0.99]
        found, false, t = analyse.detection_at_fpr(gold, [0.05, 0.2, 0.6], 0.1)
        self.assertEqual((t, false), (0.5, 0.1))  # precies 1 van de 10 goede labels onder de drempel
        self.assertAlmostEqual(found, 2 / 3)

    def test_auc_requires_both_classes(self):
        # Komt echt voor: 5 bijstellingen, en niet elke rol krijgt een verwisseling.
        self.assertIsNone(analyse.auc([0.9], []))
        self.assertIsNone(analyse.auc([], [0.1]))
        table, ece = analyse.calibration([(0.95, True), (0.95, True), (0.05, False)], analyse.NOUL_BANDS)
        self.assertAlmostEqual(ece, 0.05)
        self.assertEqual(sum(n for _, _, n, _, _ in table), 3)

    def test_detection_counts_false_alarms_on_gold(self):
        classified = [{'id': 1, 'start': 2, 'chunk': 'soep', 'gold': 'lv', 'accepted': ['lv'], 'probs': {'lv': 0.9, 'ow': 0.1}}]
        mutated = [{'id': 1, 'start': 2, 'chunk': 'soep', 'claimed': 'ow', 'noul': 0.2}]
        gold = [{'id': 1, 'start': 2, 'chunk': 'soep', 'noul': 0.8}]
        first = analyse.mutation_detection(classified, gold, mutated)[0]
        self.assertEqual(first[1:], (1, 1, 0, 1))


if __name__ == '__main__':
    unittest.main()


class GoldsetTest(unittest.TestCase):
    """Scorelogica voor de externe validatie (score_goldset.py), zonder echte beoordelingen."""

    @staticmethod
    def score(role, drex, p, noul, accepted=None):
        return {'role': role, 'accepted': accepted or [role], 'drex_role': drex, 'p_labels': p, 'noul': noul}

    def test_design_is_a_census_of_flagged_chunks(self):
        import score_goldset as sg
        scores = sg.load_scores()
        design = {(int(r['zin_id']), int(r['start'])) for r in sg.read_csv(sg.DESIGN)}
        self.assertEqual(len(scores), 1044)
        self.assertTrue(design <= set(scores))
        self.assertTrue({x for x, s in scores.items() if sg.flagged(s)} <= design)

    def test_verdicts_and_precision(self):
        import score_goldset as sg
        scores = {(1, 0): self.score('bwb', 'vv', 0.1, 0.6),   # gemarkeerd, mens: vv -> echte fout
                  (2, 0): self.score('lv', 'ow', 0.1, 0.9),    # gemarkeerd, mens: lv -> vals alarm
                  (3, 0): self.score('mv', 'lv', 0.5, 0.3),    # gemarkeerd, twijfel
                  (4, 0): self.score('ow', 'ow', 0.9, 0.9)}    # niet gemarkeerd, correct
        judged = {(1, 0): ('vv', False, ''), (2, 0): ('lv', False, ''), (3, 0): ('lv', True, ''), (4, 0): ('ow', False, '')}
        m = sg.evaluate(scores, judged)
        self.assertEqual((m['flagged_total'], m['flagged_judged'], m['errors_flagged']), (3, 3, 1))
        self.assertAlmostEqual(m['precision'], 1 / 2)        # twijfel telt niet mee
        self.assertAlmostEqual(m['review_worthy'], 2 / 3)    # fout + twijfel
        self.assertEqual(m['verdicts'][(3, 0)], 'twijfel')
        self.assertIn('voorlopig', sg.decision({**m, 'flagged_judged': 2}))

    def test_weights_scale_sample_to_population(self):
        import score_goldset as sg
        scores = {(i, 0): self.score('ow', 'ow', 0.9, 0.9) for i in range(10)}
        w, uncovered = sg.weights(scores, {(0, 0): ('ow', False, ''), (1, 0): ('ow', False, '')})
        self.assertEqual(w[(0, 0)], 5.0)
        self.assertEqual(uncovered, {})

    def test_decision_rule_is_frozen(self):
        import score_goldset as sg
        base = {'flagged_total': 10, 'flagged_judged': 10}
        self.assertIn('S1 gehaald', sg.decision({**base, 'precision': 0.3, 'errors_flagged': 3}))
        self.assertIn('tweede mening', sg.decision({**base, 'precision': 0.3, 'errors_flagged': 2}))
        self.assertIn('stoppen', sg.decision({**base, 'precision': 0.05, 'errors_flagged': 0}))
        self.assertEqual((sg.FLAG_P_LABELS_BELOW, sg.FLAG_NOUL_BELOW, sg.USEFUL_PRECISION), (0.18, 0.45, 0.20))

    def test_sheet_columns_in_either_language_and_design_check(self):
        import tempfile
        import score_goldset as sg
        with tempfile.TemporaryDirectory() as d:
            design, sheet = Path(d) / 'ontwerp.csv', Path(d) / 'blad.csv'
            design.write_text('blad;nr;zin_id;start\n1;1;7;2\n1;2;8;0\n', encoding='utf-8')
            sheet.write_text('nr;zin_id;zin;zinsdeel;jouw_rol (OW/..);twee_lezingen_verdedigbaar (ja/nee);opmerking\n'
                             '1;7;x;y;NWD;ja;twijfel\n2;8;x;y;;;\n', encoding='utf-8-sig')
            self.assertEqual(sg.load_judgements(design, {1: sheet}), {(7, 2): ('ng', True, 'twijfel')})
            sheet.write_text('nr;zin_id;human_role;ambiguous;note\n1;9;OW;nee;\n', encoding='utf-8')
            with self.assertRaises(ValueError):
                sg.load_judgements(design, {1: sheet})
