import { problemIdSchema, listProblemsSchema } from '@esolang-battle/common';
import { router, publicProcedure } from '../trpc';
import { getProblem } from '../function/getProblem';
import { listProblems } from '../function/listProblems';

export const problemRouter = router({
  getProblem: publicProcedure
    .input(problemIdSchema)
    .query(async ({ ctx, input }) => {
      return await getProblem(ctx.prisma, input.problemId);
    }),
  listProblems: publicProcedure
    .input(listProblemsSchema)
    .query(async ({ ctx, input }) => {
      return await listProblems(ctx.prisma, input.contestId);
    }),
});
