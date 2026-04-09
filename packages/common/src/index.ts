export type TeamInfo = {
  id: number;
  color: string;
  contestId: number;
};

export type UserInfo = {
  id: number;
  name: string;
  isAdmin: boolean;
  teams: TeamInfo[];
};

export type LanguageSummary = {
  id: number;
  name: string;
  description: string;
};

export type ProblemSummary = {
  id: number;
  title: string;
};

export type SubmissionSummary = {
  id: number;
  codeLength: number;
  score: number;
  submittedAt: string;
  user: {
    id: number;
    name: string;
    teams: TeamInfo[];
  };
  language: LanguageSummary;
  problem: ProblemSummary;
};
