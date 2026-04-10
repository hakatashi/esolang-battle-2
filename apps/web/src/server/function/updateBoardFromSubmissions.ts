import { PrismaClient, findBoardByContestId, updateBoardData } from "@esolang-battle/db";
import type { OwnerColor } from "./getBoard";

/**
 * Board.lastProcessedSubmissionId より新しい Submission を反映して
 * Board.scoreOfLanguages / Board.colorOfLanguages / Board.lastProcessedSubmissionId
 * を更新するユーティリティ関数。
 */
export async function updateBoardFromSubmissions(prisma: PrismaClient, contestId: number): Promise<void> {
  const board = await findBoardByContestId(prisma, contestId);

  if (!board) {
    throw new Error(`Board for contest ${contestId} not found`);
  }

  const lastProcessedId = board.lastProcessedSubmissionId ?? 0;

  const newSubmissions = await prisma.submission.findMany({
    where: {
      id: { gt: lastProcessedId },
      problem: { contestId },
    },
    include: {
      user: { include: { teams: true } },
    },
    orderBy: [
      { submittedAt: "asc" },
      { id: "asc" },
    ],
  });

  if (newSubmissions.length === 0) {
    return;
  }

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

      const team = submission.user.teams.find((t: any) => t.contestId === contestId);
      const rawColor = team?.color?.toLowerCase() ?? "neutral";
      const teamColor: OwnerColor =
        rawColor === "red" || rawColor === "blue" ? (rawColor as OwnerColor) : "neutral";
      colorOfLanguages[key] = teamColor;
    }

    if (submission.id > maxSeenSubmissionId) {
      maxSeenSubmissionId = submission.id;
    }
  }

  await updateBoardData(prisma, contestId, {
    scoreOfLanguages,
    colorOfLanguages,
    lastProcessedSubmissionId: maxSeenSubmissionId,
  });
}

/**
 * 盤面を Submission からフル再計算するユーティリティ関数。
 */
export async function recomputeBoardFromSubmissions(prisma: PrismaClient, contestId: number): Promise<void> {
  const board = await findBoardByContestId(prisma, contestId);

  if (!board) {
    throw new Error(`Board for contest ${contestId} not found`);
  }

  const submissions = await prisma.submission.findMany({
    where: {
      problem: { contestId },
    },
    include: {
      user: { include: { teams: true } },
    },
    orderBy: [
      { submittedAt: "asc" },
      { id: "asc" },
    ],
  });

  if (submissions.length === 0) {
    await updateBoardData(prisma, contestId, {
      scoreOfLanguages: {},
      colorOfLanguages: {},
      lastProcessedSubmissionId: null,
    });
    return;
  }

  const scoreOfLanguages: Record<string, number> = {};
  const colorOfLanguages: Record<string, OwnerColor> = {};

  let maxSeenSubmissionId = 0;

  for (const submission of submissions) {
    const languageId = submission.languageId;
    const key = String(languageId);

    const currentScore = scoreOfLanguages[key] ?? Infinity;
    const newScore = submission.score;

    if (typeof newScore === "number" && newScore < currentScore) {
      scoreOfLanguages[key] = newScore;

      const team = submission.user.teams.find((t: any) => t.contestId === contestId);
      const rawColor = team?.color?.toLowerCase() ?? "neutral";
      const teamColor: OwnerColor =
        rawColor === "red" || rawColor === "blue" ? (rawColor as OwnerColor) : "neutral";
      colorOfLanguages[key] = teamColor;
    }

    if (submission.id > maxSeenSubmissionId) {
      maxSeenSubmissionId = submission.id;
    }
  }

  await updateBoardData(prisma, contestId, {
    scoreOfLanguages,
    colorOfLanguages,
    lastProcessedSubmissionId: maxSeenSubmissionId,
  });
}
