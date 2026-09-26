"""Live contracttest tegen Drex. Draait alleen met DREX_LIVE=1 en een DREX_API_KEY (omgeving of .env):

    DREX_LIVE=1 python3 -m unittest discover -s scripts/drex-audit -p 'test_live_*.py'

Legt vast welke vraagvormen Drex accepteert. De 422-gevallen kosten niets; de geslaagde aanroep een paar
tientallen tokens.
"""
import json
import os
import time
import unittest
import urllib.error
import urllib.request

import measure
import schema


def post(body, attempts=6):
    """(status, body). Wacht bij 429/529 zoals Drex vraagt (retry-after-ms); dat is capaciteit, geen contract."""
    for attempt in range(attempts):
        req = urllib.request.Request(measure.URL, data=json.dumps(body).encode(),
                                     headers={'Authorization': f'Bearer {measure.api_key()}', 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=70) as resp:
                return resp.status, json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code in (429, 529) and attempt < attempts - 1:
                time.sleep(int(e.headers.get('retry-after-ms') or 2000) / 1000 + attempt)
                continue
            return e.code, json.loads(e.read() or b'{}')


@unittest.skipUnless(os.environ.get('DREX_LIVE') == '1', 'live test: zet DREX_LIVE=1')
class DrexContractTest(unittest.TestCase):
    sentence = {'tokens': [{'text': 'De', 'role': 'ow'}, {'text': 'kok', 'role': 'ow'}, {'text': 'kookt.', 'role': 'pv'}]}

    def question(self, desc):
        return schema.classify_question(self.sentence, schema.target_chunks(self.sentence)[0], desc)

    def test_null_choice_descriptions_are_accepted(self):
        status, body = post({'model': measure.MODEL, 'state': 'De kok kookt.', 'questions': {'q': self.question(None)}})
        self.assertEqual(status, 200, body)
        probs = body['answers']['q']['probabilities']
        self.assertEqual(set(probs), set(schema.BACK))
        self.assertAlmostEqual(sum(probs.values()), 1, places=2)

    def test_null_instructions_are_rejected(self):
        q = {**self.question(schema.DESC), 'instructions': None}
        status, body = post({'model': measure.MODEL, 'state': 'De kok kookt.', 'questions': {'q': q}})
        self.assertEqual(status, 422)
        self.assertIn('questions.q.instructions', json.dumps(body))

    def test_jev_model_name_is_rejected(self):
        status, _ = post({'model': 'jev-latest', 'state': 'De kok kookt.', 'questions': {'q': self.question(None)}})
        self.assertEqual(status, 422)


if __name__ == '__main__':
    unittest.main()
