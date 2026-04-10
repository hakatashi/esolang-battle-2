import {
  submissionFilterSchema,
  testCodeSchema,
  submittableLanguageSchema,
  submitCodeSchema,
  submissionIdSchema
} from '@esolang-battle/common';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { getSubmissions } from '../function/getSubmissions';
import { getSubmissionDetail } from '../function/getSubmissionDetail';
import { getLanguages } from '../function/getLanguages';
import { getSubmittableLanguageIdsForTeam } from '../function/getSubmittableLanguages';
import { submitCode } from '../function/submitCode';
import { submissionQueue, testQueue, testQueueEvents } from '../queue';

export const submissionRouter = router({
  getSubmissions: publicProcedure
    .input(submissionFilterSchema)
    .query(async ({ ctx, input }) => {
      return await getSubmissions(ctx.prisma, input ?? {});
    }),
  getLanguages: publicProcedure.query(async ({ ctx }) => {
    return await getLanguages(ctx.prisma);
  }),
  getSubmissionDetail: protectedProcedure
    .input(submissionIdSchema)
    .query(async ({ ctx, input }) => {
      return await getSubmissionDetail(ctx.prisma, input.submissionId, ctx.user.id, ctx.user.isAdmin);
    }),
  testCode: publicProcedure
    .input(testCodeSchema)
    .mutation(async ({ input }) => {
      const job = await testQueue.add('runTest', input);
      return await job.waitUntilFinished(testQueueEvents);
    }),
  getSubmittableLanguageIdsForTeam: protectedProcedure
    .input(submittableLanguageSchema)
    .query(async ({ ctx, input }) => {
      return await getSubmittableLanguageIdsForTeam(ctx.prisma, input.teamId, input.contestId);
    }),
  submitCode: protectedProcedure
    .input(submitCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const submission = await submitCode(ctx.prisma, {
        ...input,
        userId: Number(ctx.user.id),
      });
      await submissionQueue.add('evaluate', { submissionId: submission.id });
      return submission;
    }),
});
