import { PrismaClient, findSubmissions, GetSubmissionsFilter } from "@esolang-battle/db";

export async function getSubmissions(prisma: PrismaClient, filter: GetSubmissionsFilter = {}) {
  return await findSubmissions(prisma, filter);
}
