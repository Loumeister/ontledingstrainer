/**
 * Shared feedback contract for grammar-core consumers.
 *
 * Downstream repos (werkwoordlab, ontledingstrainer) reference these types
 * via the subtree path: shared/grammar-core/src/feedback/types.ts
 *
 * See docs/feedback-authoring.md for shared authoring conventions.
 * See docs/repo-scope-contracts.md for the shared/local boundary.
 */

/**
 * A feedback value is either a plain string (for simple, single-step prompts)
 * or a structured rich entry (for errors that require diagnosis and reasoning).
 */
export type FeedbackEntry = string | RichFeedbackEntry;

export interface RichFeedbackEntry {
  /** Short control question or recovery prompt shown inline to the learner. Max ~15 words. */
  herstelvraag: string;
  /** Single word from herstelvraag that anchors the expand interaction. */
  sleutelwoord: string;
  uitleg: {
    /** What the learner probably did wrong — 1-2 sentences, "Je hebt waarschijnlijk..." */
    diagnose: string;
    /** The grammar rule or distinction — 1-2 sentences. */
    redenering: string;
    /** One concrete recovery action, imperative mood. */
    herprobeer: string;
  };
}

/**
 * Type guard for narrowing FeedbackEntry to RichFeedbackEntry.
 * Use when iterating over a record of FeedbackEntry values that may be
 * plain strings or rich objects.
 */
export function isRichFeedbackEntry(entry: unknown): entry is RichFeedbackEntry {
  return typeof entry === "object" && entry !== null && "herstelvraag" in entry;
}
