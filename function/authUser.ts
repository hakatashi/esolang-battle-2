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

export type UserInfo = {
  id: number;
  name: string;
  team: { id: number; color: string } | null;
};

export async function verifyUserLogin(name: string, password: string): Promise<UserInfo | null> {
  const user = await prisma.user.findFirst({
    where: { name },
    include: { team: true },
  });

  if (!user) return null;

  // NOTE: 今は平文 password をそのまま比較（運用時はハッシュにすべき）
  if (user.password !== password) return null;

  return {
    id: user.id,
    name: user.name,
    team: user.team ? { id: user.team.id, color: user.team.color } : null,
  };
}

export async function getUserInfo(userId: number): Promise<UserInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { team: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    team: user.team ? { id: user.team.id, color: user.team.color } : null,
  };
}
