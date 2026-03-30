import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export type TeamSummary = {
  id: number;
  color: string;
  contestId: number;
};

export async function getTeams(): Promise<TeamSummary[]> {
  const teams = await prisma.team.findMany({
    orderBy: { id: "asc" },
  });

  return teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId }));
}
