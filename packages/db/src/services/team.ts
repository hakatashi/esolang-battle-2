import { PrismaClient } from "../../prisma/generated/client/index";

export async function findAllTeams(prisma: PrismaClient) {
  return await prisma.team.findMany({
    orderBy: { id: "asc" },
  });
}
