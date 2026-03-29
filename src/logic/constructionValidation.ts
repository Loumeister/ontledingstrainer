import type { ConstructionFrame, ChunkCard, FrameSlotKey } from '../types';

export interface ConstructionCheckResult {
  ok: boolean;
  feedback: string[];
  congruenceError: boolean;
  missingSlots: FrameSlotKey[];
  familyError: boolean;
  orderError: boolean;
}

export function validateConstruction(
  frame: ConstructionFrame,
  selectedChunks: Partial<Record<FrameSlotKey, ChunkCard>>,
  orderedSlots: FrameSlotKey[], // actual order student chose
): ConstructionCheckResult {
  const feedback: string[] = [];
  let congruenceError = false;
  let familyError = false;
  let orderError = false;

  // A. Frame compleet: verplichte slots aanwezig?
  const missingSlots = frame.slots.filter(slot => !selectedChunks[slot]);
  if (missingSlots.length > 0) {
    const roleLabels: Record<FrameSlotKey, string> = {
      ow: 'onderwerp', pv: 'persoonsvorm', wg: 'werkwoordelijk gezegde',
      ng: 'naamwoordelijk gezegde', lv: 'lijdend voorwerp', mv: 'meewerkend voorwerp',
      vv: 'voorzetselvoorwerp', bwb: 'bijwoordelijke bepaling', nwd: 'naamwoordelijk deel',
    };
    missingSlots.forEach(slot => {
      feedback.push(`Deze zin mist nog een ${roleLabels[slot] ?? slot}.`);
    });
  }

  // B. Familie-compatibiliteit: chunks uit toegestane families?
  const cards = Object.values(selectedChunks).filter(Boolean) as ChunkCard[];
  for (const card of cards) {
    if (!frame.families.includes(card.familyId)) {
      feedback.push(`De kaart "${card.tokens.map(t => t.text).join(' ')}" past niet in dit frame.`);
      familyError = true;
    }
  }

  // C. Congruentie: OW.number + person ↔ PV.number + person
  const owCard = selectedChunks['ow'];
  const pvCard = selectedChunks['pv'];
  if (owCard && pvCard) {
    if (owCard.number && pvCard.number && owCard.number !== pvCard.number) {
      feedback.push(
        owCard.number === 'pl'
          ? 'Het onderwerp is meervoud — kies een meervoudige persoonsvorm.'
          : 'Het onderwerp is enkelvoud — kies een enkelvoudige persoonsvorm.'
      );
      congruenceError = true;
    }
  }

  // D. Gezegdetype: WG-frame mag geen NG-kaart hebben en vice versa
  for (const card of cards) {
    if (card.predicateType && card.predicateType !== frame.predicateType) {
      feedback.push(
        frame.predicateType === 'WG'
          ? 'Dit gezegde hoort bij een naamwoordelijk gezegde, niet bij een werkwoordelijk.'
          : 'Dit gezegde hoort bij een werkwoordelijk gezegde, niet bij een naamwoordelijk.'
      );
      break;
    }
  }

  // E. Valentie: card.requires aanwezig? card.forbids afwezig?
  for (const card of cards) {
    const presentSlots = Object.keys(selectedChunks) as FrameSlotKey[];
    if (card.requires) {
      for (const req of card.requires) {
        if (!presentSlots.includes(req)) {
          feedback.push(`Bij dit zinsdeel verwacht je ook een ${req}.`);
        }
      }
    }
    if (card.forbids) {
      for (const forb of card.forbids) {
        if (presentSlots.includes(forb)) {
          feedback.push(`Dit zinsdeel past niet samen met een ${forb}.`);
        }
      }
    }
  }

  // F. Woordvolgorde: valt gekozen volgorde binnen frame.wordOrders?
  if (missingSlots.length === 0 && frame.wordOrders.length > 0) {
    const chosenOrder = orderedSlots.join('-');
    if (!frame.wordOrders.includes(chosenOrder)) {
      const patterns = frame.wordOrders
        .map(o => o.toUpperCase().replace(/-/g, ' → '))
        .join(' of ');
      feedback.push(`Verkeerde woordvolgorde. Verwijder een kaart en voeg hem opnieuw toe in de goede volgorde. Geldige volgorde${frame.wordOrders.length > 1 ? 's' : ''}: ${patterns}.`);
      orderError = true;
    }
  }

  // G. Tijdcongruentie: verleden-BWB vereist verleden-tijdsvorm PV
  const bwbCard = selectedChunks['bwb'];
  if (bwbCard?.timeRef === 'past' && pvCard && pvCard.verbTense === 'present') {
    feedback.push(
      `"${bwbCard.tokens.map(t => t.text).join(' ')}" verwijst naar het verleden — kies een verleden-tijdsvorm voor de persoonsvorm (bijv. "zag", "kocht", "pakte").`
    );
  }

  return {
    ok: missingSlots.length === 0 && !congruenceError && !familyError && feedback.length === 0,
    feedback,
    congruenceError,
    missingSlots,
    familyError,
    orderError,
  };
}
