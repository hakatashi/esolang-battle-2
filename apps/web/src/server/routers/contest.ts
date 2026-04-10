import { contestIdSchema } from '@esolang-battle/common';
import { router, publicProcedure } from '../trpc';
import { getContests } from '../function/getContests';
import { getBoard } from '../function/getBoard';

export const contestRouter = router({
  getContests: publicProcedure.query(async ({ ctx }) => {
    return await getContests(ctx.prisma);
  }),
  getBoard: publicProcedure
    .input(contestIdSchema)
    .query(async ({ ctx, input }) => {
      return await getBoard(ctx.prisma, input.contestId);
    }),
});
