import { FEEDBACK_MATRIX } from '../constants';
import { getFeedbackOverrides } from '../services/feedbackOverrides';
import type { FeedbackEntry } from '../types';

/**
 * Returns the effective feedback for a (sourceRole, targetRole) pair.
 * Checks localStorage overrides first; falls back to the built-in FEEDBACK_MATRIX.
 */
export function getEffectiveFeedback(
  sourceRole: string,
  targetRole: string,
): FeedbackEntry | undefined {
  const overrides = getFeedbackOverrides();
  return overrides[sourceRole]?.[targetRole] ?? FEEDBACK_MATRIX[sourceRole]?.[targetRole];
}
