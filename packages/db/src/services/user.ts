import { PrismaClient } from "../../prisma/generated/client/index";

export async function findAllUsersWithTeams(prisma: PrismaClient) {
  return await prisma.user.findMany({
    orderBy: { id: "asc" },
    include: { teams: true },
  });
}

export async function findUserByIdWithTeams(prisma: PrismaClient, id: number) {
  return await prisma.user.findUnique({
    where: { id },
    include: { teams: true },
  });
}
