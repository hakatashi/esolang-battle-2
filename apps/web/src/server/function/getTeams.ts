import { PrismaClient, findAllTeams } from "@esolang-battle/db";

export type TeamSummary = {
  id: number;
  color: string;
  contestId: number;
};

export async function getTeams(prisma: PrismaClient): Promise<TeamSummary[]> {
  const teams = await findAllTeams(prisma);

  return teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId }));
}
