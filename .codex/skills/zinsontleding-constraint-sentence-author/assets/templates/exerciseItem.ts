export type ExerciseItem = {
  id: string;
  sentence: string;
  tokens: string[];
  labels: string[]; // exact repo-labels per token
  difficulty: 1 | 2 | 3 | 4 | 5;
  focus: string;
  explanation: {
    pv: string;
    ow: string;
    rest?: string[];
  };
  distractorRisk?: string;
  spans?: Array<{
    start: number;
    end: number;
    role: string;
  }>;
};
