import { PLACEHOLDER_URL } from '../services/googleDriveSync';

export function canShowSessionNextButton(mode: 'free' | 'session', hasBeenScored: boolean): boolean {
  return mode === 'session' && hasBeenScored;
}

export type SessionAdvanceAction = 'next_sentence' | 'finish_session';

export function getSessionAdvanceAction(sessionIndex: number, queueLength: number): SessionAdvanceAction {
  const nextIndex = sessionIndex + 1;
  return nextIndex < queueLength ? 'next_sentence' : 'finish_session';
}

interface AutoSendEligibilityInput {
  name: string;
  initiaal: string;
  klas: string;
  scriptUrl: string;
}

export function shouldTriggerAutoSend({ name, initiaal, klas, scriptUrl }: AutoSendEligibilityInput): boolean {
  return (
    name.trim().length > 0
    && initiaal.trim().length > 0
    && klas.trim().length > 0
    && scriptUrl.trim().length > 0
    && scriptUrl.trim() !== PLACEHOLDER_URL
  );
}
