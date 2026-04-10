import { PrismaClient } from "../../prisma/generated/client/index";

export async function findAllContests(prisma: PrismaClient) {
  return await prisma.contest.findMany({
    orderBy: { id: "asc" },
  });
}

export async function findContestById(prisma: PrismaClient, id: number) {
  return await prisma.contest.findUnique({
    where: { id },
  });
}
