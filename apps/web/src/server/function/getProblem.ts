import { PrismaClient, findProblemById } from "@esolang-battle/db";

export async function getProblem(prisma: PrismaClient, problemId: number) {
  const problem = await findProblemById(prisma, problemId);

  if (!problem) {
    return null;
  }

  return {
    id: problem.id,
    title: problem.title,
    problemStatement: problem.problemStatement,
    contestId: problem.contestId,
    acceptedLanguages: problem.acceptedLanguages.map((lang) => ({
      id: lang.id,
      description: lang.description,
      dockerImageId: lang.dockerImageId,
    })),
  };
}
