import { PrismaClient, createSubmission } from "@esolang-battle/db";

export type SubmitCodeParams = {
  code: string;
  languageId: number;
  userId: number;
  problemId: number;
};

export async function submitCode(prisma: PrismaClient, params: SubmitCodeParams) {
  return await createSubmission(prisma, params);
}
