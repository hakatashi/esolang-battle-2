import { PrismaClient, findAllProblems } from "@esolang-battle/db";

export type ProblemSummary = {
  id: number;
  contestId: number;
  title: string;
  problemStatement: string;
};

export async function listProblems(prisma: PrismaClient, contestId?: number): Promise<ProblemSummary[]> {
  const problems = await findAllProblems(prisma, contestId);

  return problems.map((p) => ({
    id: p.id,
    contestId: p.contestId,
    title: p.title,
    problemStatement: p.problemStatement,
  }));
}
