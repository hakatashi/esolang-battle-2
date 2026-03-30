import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { OwnerColor } from "./getBoard.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Board.lastProcessedSubmissionId より新しい Submission を反映して
 * Board.scoreOfLanguages / Board.colorOfLanguages / Board.lastProcessedSubmissionId
 * を更新するユーティリティ関数。
 *
 * 現在のルール（暫定）:
 * - Submission.score がその言語の現在スコアより大きい場合だけ更新する。
 * - そのとき、その言語の色を Submission.user.team.color に更新する。
 * - チーム色が "red" / "blue" 以外の場合は "neutral" として扱う。
 */
export async function updateBoardFromSubmissions(boardId: number): Promise<void> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      contest: true,
    },
  });

  if (!board) {
    throw new Error(`Board ${boardId} not found`);
  }

  const contestId = board.contestId;
  const lastProcessedId = board.lastProcessedSubmissionId ?? 0;

  // まだ処理していない Submission をすべて取得（この Board の contest に属するものだけ）。
  const newSubmissions = await prisma.submission.findMany({
    where: {
      id: { gt: lastProcessedId },
      problem: {
        contestId,
      },
    },
    include: {
      user: {
        include: {
          team: true,
        },
      },
    },
    orderBy: [
      { submittedAt: "asc" },
      { id: "asc" },
    ],
  });

  if (newSubmissions.length === 0) {
    return;
  }

  // 既存のスコア・色設定をオブジェクトとして読み出す
  const scoreOfLanguages: Record<string, number> =
    (board.scoreOfLanguages as any as Record<string, number>) ?? {};
  const colorOfLanguages: Record<string, OwnerColor> =
    (board.colorOfLanguages as any as Record<string, OwnerColor>) ?? {};

  let maxSeenSubmissionId = lastProcessedId;

  for (const submission of newSubmissions) {
    const languageId = submission.languageId;
    const key = String(languageId);

    const currentScore = scoreOfLanguages[key] ?? Infinity;
    const newScore = submission.score;

    if (typeof newScore === "number" && newScore < currentScore) {
      scoreOfLanguages[key] = newScore;

      const rawColor = submission.user.team?.color?.toLowerCase() ?? "neutral";
      const teamColor: OwnerColor =
        rawColor === "red" || rawColor === "blue" ? (rawColor as OwnerColor) : "neutral";
      colorOfLanguages[key] = teamColor;
    }

    if (submission.id > maxSeenSubmissionId) {
      maxSeenSubmissionId = submission.id;
    }
  }

  await prisma.board.update({
    where: { id: boardId },
    data: {
      scoreOfLanguages,
      colorOfLanguages,
      lastProcessedSubmissionId: maxSeenSubmissionId,
    },
  });
}

async function main() {
  const [, , idArg] = process.argv;
  if (!idArg) {
    console.error("Usage: npx tsx function/updateBoardFromSubmissions.ts <boardId>");
    process.exit(1);
  }

  const boardId = Number(idArg);
  if (!Number.isInteger(boardId)) {
    console.error("boardId must be an integer");
    process.exit(1);
  }

  try {
    await updateBoardFromSubmissions(boardId);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI 実行用
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
