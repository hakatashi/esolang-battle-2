import { PrismaClient } from '../../prisma/generated/client/index';

export async function findBoardByContestId(prisma: PrismaClient, contestId: number) {
  return await prisma.board.findUnique({
    where: { contestId },
  });
}

export async function findLanguagesWithLatestSubmissions(prisma: PrismaClient, contestId: number) {
  // コンテストに関連する言語と、それぞれの最新の有効な提出を取得する
  return await prisma.language.findMany({
    include: {
      submissions: {
        where: {
          problem: { contestId },
          score: { not: null },
        },
        orderBy: {
          submittedAt: 'desc',
        },
        take: 1,
        include: {
          user: {
            include: {
              teams: {
                where: { contestId },
              },
            },
          },
        },
      },
    },
  });
}

export async function updateBoardData(
  prisma: PrismaClient,
  contestId: number,
  data: {
    scoreOfLanguages: any;
    colorOfLanguages: any;
    lastProcessedSubmissionId: number | null;
  }
) {
  return await prisma.board.update({
    where: { contestId },
    data,
  });
}
