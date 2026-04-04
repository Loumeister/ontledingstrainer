/**
 * Shared types for usage analytics tab components.
 */
import type { SentenceUsageData, Sentence } from '../../types';
import type { SessionReport } from '../../services/sessionReport';

export interface EnrichedUsage {
  sentenceId: number;
  label: string;
  level: number;
  isCustom: boolean;
  usage: SentenceUsageData;
  perfectRate: number;
  totalRoleErrors: number;
}

export type SortDir = 'asc' | 'desc';

/** Props shared by most tab components */
export interface UsageTabProps {
  allReports: SessionReport[];
  enrichedData: EnrichedUsage[];
  sentenceMap: Map<number, Sentence>;
  isEigenaar: boolean;
  onReportsChanged: () => void;
}
