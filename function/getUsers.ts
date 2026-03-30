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

export type UserWithTeam = {
  id: number;
  name: string;
  isAdmin: boolean;
  team: { id: number; color: string } | null;
};

export async function getUsersWithTeams(): Promise<UserWithTeam[]> {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    include: { team: true },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    isAdmin: Boolean(u.isAdmin),
    team: u.team ? { id: u.team.id, color: u.team.color } : null,
  }));
}
