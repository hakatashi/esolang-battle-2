import { PrismaClient } from "../generated/prisma/client.js";

export type GetSubmissionsFilter = {
  userId?: number;
  teamId?: number;
  problemId?: number;
  languageId?: number;
  contestId?: number;
};

export async function getSubmissions(prisma: PrismaClient, filter: GetSubmissionsFilter = {}) {
  const where: any = {};

  if (typeof filter.userId === "number") {
    where.userId = filter.userId;
  }
  if (typeof filter.problemId === "number") {
    where.problemId = filter.problemId;
  }
  if (typeof filter.languageId === "number") {
    where.languageId = filter.languageId;
  }

  if (typeof filter.teamId === "number") {
    where.user = { ...(where.user ?? {}), teams: { some: { id: filter.teamId } } };
  }

  if (typeof filter.contestId === "number") {
    where.problem = { ...(where.problem ?? {}), contestId: filter.contestId };
  }

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: {
      user: {
        include: {
          teams: true,
        },
      },
      problem: true,
      language: true,
    },
  });

  return submissions;
}
