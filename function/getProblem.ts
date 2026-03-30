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

export async function getProblem(problemId: number) {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      contest: true,
      acceptedLanguages: true,
    },
  });

  if (!problem) {
    return null;
  }

  return {
    id: problem.id,
    title: problem.title,
    problemStatement: problem.problemStatement,
    contestId: problem.contestId,
    acceptedLanguages: problem.acceptedLanguages.map((lang) => ({
      id: lang.id,
      description: lang.description,
      dockerImageId: lang.dockerImageId,
    })),
  };
}

export async function getFirstProblemByIdAsc() {
  const problem = await prisma.problem.findFirst({
    orderBy: { id: "asc" },
    include: {
      contest: true,
      acceptedLanguages: true,
    },
  });

  if (!problem) {
    return null;
  }

  return {
    id: problem.id,
    title: problem.title,
    problemStatement: problem.problemStatement,
    contestId: problem.contestId,
    acceptedLanguages: problem.acceptedLanguages.map((lang) => ({
      id: lang.id,
      description: lang.description,
      dockerImageId: lang.dockerImageId,
    })),
  };
}
