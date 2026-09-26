"""Tests zonder netwerk: python3 -m unittest discover -s scripts/drex-audit"""
import glob
import json
import unittest
from pathlib import Path

import analyse
import schema

REPO = Path(__file__).resolve().parents[2]


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

    def test_every_corpus_sentence_yields_chunks_with_text(self):
        for f in glob.glob(str(REPO / 'src/data/sentences-level-[0-4].json')):
            with open(f) as fh:
                sentences = json.load(fh)
            for s in sentences:
                for c in schema.target_chunks(s):
                    self.assertTrue(c['text'], f"zin {s['id']} heeft een leeg zinsdeel")


class MutationTest(unittest.TestCase):
    def test_mutations_are_plausible_school_confusions(self):
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
    """Drex weigert null-instructies en niet-string-omschrijvingen (422)."""

    def test_classify_questions_match_drex_contract(self):
        s = {'tokens': [tok('De', 'ow'), tok('kok', 'ow'), tok('kookt.', 'pv')]}
        c = schema.target_chunks(s)[0]
        for desc in (schema.DESC, schema.DESC_V1, None):
            q = schema.classify_question(s, c, desc)
            self.assertIsInstance(q['instructions'], str)
            self.assertNotIn('other', q['criteria'])  # 'other' naast korte codes trok alle kans naar zich toe
            self.assertTrue(all(v is None or isinstance(v, str) for v in q['criteria'].values()))

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
