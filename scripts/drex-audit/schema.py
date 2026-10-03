"""Drex-schema voor de constituent-role audit van Ontleedlab: labels, omschrijvingen en pure hulpfuncties.

Geen netwerk, geen sleutel: alles hier is testbaar zonder Drex.

Labels zijn Engels en beschrijvend, omdat Drex vooral de labelnaam leest. Korte codes als `ow`/`lv`
naast een optie `other` gaven in een proef 100% `other`. De omschrijvingen zijn eigen formuleringen,
gebaseerd op de schoolgrammatica en gecontroleerd tegen Engelstalige naslaggrammatica's van het
Nederlands. Neem geen tekst uit die boeken over.

Scope: alleen de zinsfunctie van zinsdelen (7 rollen). Niet gecontroleerd: pv, wg, subrollen
(nwd/wwd/bijv_bep), bijzinfuncties, bijzinanalyses en de zinsdeelgrenzen zelf. Die vragen een
andere grammaticale vraag en horen in een aparte audit.
"""
import re

# Ontleedlab-rol -> Drex-label
LABEL = {
    'ow': 'subject',
    'lv': 'direct_object',
    'mv': 'indirect_object',
    'vv': 'prepositional_object',
    'bwb': 'adverbial',
    # Let op: `ng` is in constants.ts "Naamwoordelijk Gezegde", maar de data annoteren er alleen het
    # naamwoordelijke stuk mee ("erg spannend", "dokter worden"); de persoonsvorm staat apart als pv.
    # Het label beschrijft dus dat stuk, niet het hele gezegde. Niet "corrigeren" naar predicate.
    'ng': 'predicative_complement',
    'bijst': 'apposition',
}
BACK = {v: k for k, v in LABEL.items()}

# Tweede versie, na review: congruentie vóór positie, geen waar+vz-proef (onderscheidt VV niet van
# een BWB van plaats), weglaatbaarheid niet beslissend.
DESC = {
    'ow': 'The subject: controls person/number agreement with the finite verb. Do not decide from word order alone.',
    'lv': 'Direct object: a non-prepositional object of the predicate; answers "whom/what + subject + predicate?". '
          'In a natural passive it typically corresponds to the passive subject.',
    # Engelstalige grammatica's zetten "geven aan" bij de voorzetselvoorwerpen; de schoolgrammatica niet.
    'mv': 'Indirect object: recipient or beneficiary, often introduced by or alternating with "aan" or "voor". '
          'Not a lexically fixed prepositional object.',
    'vv': 'Prepositional object: a complement whose preposition is lexically selected by the predicate. '
          'Contrast with a free circumstance of time, place, manner, cause, etc.',
    'bwb': 'Adverbial: expresses a circumstance such as time, place, manner, duration, frequency, cause or purpose. '
           'It is not a lexically selected object. Omissibility alone is not decisive.',
    'ng': 'Ontleedlab nominal-predicate chunk: contains the nominal part predicated of the subject, possibly together '
          'with a non-finite copular verb. The finite verb is annotated separately as pv.',
    'bijst': 'Apposition: a noun phrase that renames or identifies an adjacent noun phrase with the same referent; '
             'often comma-delimited, but punctuation is not decisive.',
}

# Eerste versie, bewaard voor de A/B-vergelijking in measure.py.
DESC_V1 = {
    'ow': 'Agrees with the finite verb in person and number; stands right before the finite verb, or right after it (inversion).',
    'lv': 'Answers "what/whom does the subject + all verbs?"; no preposition; becomes the subject in the passive.',
    'mv': 'Recipient or beneficiary: has "aan" or "voor", or can get it (hun = aan hen). Never a fixed verb preposition.',
    'vv': 'Preposition fixed by the verb (wachten op, genieten van, zoeken naar, denken aan); not a recipient; asking with "waar+prep" works.',
    'bwb': 'Adds when, how, how long, how often, where, why or with whom; free preposition or none; can usually be left out.',
    'ng': 'Says what the subject is or becomes via a link verb: zijn, worden, blijven, lijken, blijken, schijnen, heten, raken, voorkomen.',
    'bijst': 'A second naming of the same person or thing, right next to it, usually between commas.',
}

LABEL_NL = {
    'ow': 'onderwerp',
    'lv': 'lijdend voorwerp',
    'mv': 'meewerkend voorwerp',
    'vv': 'voorzetselvoorwerp',
    'bwb': 'bijwoordelijke bepaling',
    'ng': 'naamwoordelijk deel van het gezegde',
    'bijst': 'bijstelling',
}

TARGET_ROLES = tuple(LABEL)

PREPOSITIONS = frozenset({
    'aan', 'voor', 'op', 'van', 'naar', 'over', 'met', 'in', 'om', 'tegen', 'bij', 'uit', 'door', 'tot',
    'onder', 'achter', 'na', 'tijdens', 'zonder', 'sinds', 'vanaf', 'binnen', 'buiten', 'naast', 'tussen',
    'rond', 'langs', 'als',
})


def _clean(word):
    return word.strip('.,!?;:"')


def sentence_text(sentence):
    return ' '.join(t['text'] for t in sentence['tokens'])


def accepted_roles(tokens):
    """Rollen die de app voor dit zinsdeel goedkeurt: elk woord heeft die rol of die alternativeRole.

    Volgt getConsistentRole/roleMatchesToken in src/logic/validation.ts. Een alternativeRole op één woord
    (zoals nwd op "worden" in zin 147, een subrol-alternatief) maakt die rol dus niet goed voor het hele zinsdeel.
    """
    candidates = {t['role'] for t in tokens} | {t['alternativeRole'] for t in tokens if t.get('alternativeRole')}
    return sorted(r for r in candidates if all(t['role'] == r or t.get('alternativeRole') == r for t in tokens))


def chunks(sentence):
    """Zinsdelen zoals de app ze afleidt: nieuwe chunk bij rolwissel of newChunk; start/end zijn tokenindices."""
    groups, prev = [], None
    for i, t in enumerate(sentence['tokens']):
        if t['role'] != prev or t.get('newChunk'):
            groups.append([])
        groups[-1].append((i, t))
        prev = t['role']
    out = []
    for g in groups:
        tokens = [t for _, t in g]
        out.append({
            'role': tokens[0]['role'],
            'accepted': accepted_roles(tokens),
            'start': g[0][0],
            'end': g[-1][0],
            'text': ' '.join(w for w in (_clean(t['text']) for t in tokens) if w),
        })
    return out


def target_chunks(sentence):
    return [c for c in chunks(sentence) if c['role'] in LABEL and c['text']]


def anchor(sentence, chunk):
    """Tekst die het zinsdeel uniek aanwijst zonder dat Drex hoeft te tellen.

    Meestal de tekst zelf; komt die vaker voor (zin 402: "Ik ... ik"), dan met buurwoorden erbij.
    """
    words = [_clean(t['text']) for t in sentence['tokens']]
    full = ' '.join(words).lower()

    def occurrences(phrase):
        return len(re.findall(r'(?<!\S)' + re.escape(phrase.lower()) + r'(?!\S)', full))

    lo, hi = chunk['start'], chunk['end']
    phrase = ' '.join(words[lo:hi + 1])
    while occurrences(phrase) > 1 and (lo > 0 or hi < len(words) - 1):
        lo, hi = max(lo - 1, 0), min(hi + 1, len(words) - 1)
        phrase = ' '.join(words[lo:hi + 1])
    if (lo, hi) == (chunk['start'], chunk['end']):
        return f'"{chunk["text"]}"'
    return f'"{chunk["text"]}" (in "{phrase}")'


def mutate(role, text):
    """Testharnas: een geloofwaardige verkeerde annotatie voor dit zinsdeel, of None.

    Geen grammaticaal model. Vooral bwb -> vv (op grond van het eerste woord) en bijst -> ow zijn kunstmatige
    foutinjecties. Detectiecijfers hierop zeggen of de audit zo'n fout vindt, niet hoe vaak het corpus fouten bevat.
    """
    first = text.split()[0].lower()
    if role == 'ow':
        return 'lv'
    if role == 'lv':
        return 'ow'
    if role == 'mv':
        return 'vv' if first in ('aan', 'voor') else 'lv'
    if role == 'vv':
        return 'bwb'
    if role == 'bwb':
        if first in PREPOSITIONS:
            return 'vv'
        return 'lv' if len(text.split()) > 1 else None
    if role == 'ng':
        return 'lv'
    if role == 'bijst':
        return 'ow'
    return None


def classify_question(sentence, chunk, descriptions):
    """descriptions: DESC, DESC_V1 of None (alleen labels)."""
    return {
        'type': 'choice',
        'criteria': {LABEL[r]: (descriptions[r] if descriptions else None) for r in LABEL},
        'instructions': f'In Dutch school grammar (zinsontleding), what is the function of the constituent '
                        f'{anchor(sentence, chunk)} in this sentence?',
    }


def verify_state(sentence, chunk_list, labels):
    return {
        'zin': sentence_text(sentence),
        'voorgestelde_analyse': [{'zinsdeel': c['text'], 'functie': LABEL_NL[l]} for c, l in zip(chunk_list, labels)],
    }


def verify_question(sentence, chunk, label):
    name = LABEL[label].replace('_', ' ')
    return {
        'type': 'noul',
        'instructions': f'In Dutch school grammar, is {anchor(sentence, chunk)} correctly analysed as '
                        f'{LABEL_NL[label]} ({name}) in this sentence?',
        'criteria': {'true': f'It is a {name}: {DESC[label]}', 'false': 'It has a different function in this sentence.'},
    }


def agrees(row):
    return row['pred'] in row['accepted']
