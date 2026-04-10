import { PrismaClient, findAllLanguages } from "@esolang-battle/db";

export async function getLanguages(prisma: PrismaClient) {
  return await findAllLanguages(prisma);
}
