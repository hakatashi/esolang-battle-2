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

export type ProblemSummary = {
  id: number;
  title: string;
};

export async function listProblems(): Promise<ProblemSummary[]> {
  const problems = await prisma.problem.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      title: true,
    },
  });

  return problems.map((p) => ({ id: p.id, title: p.title }));
}
