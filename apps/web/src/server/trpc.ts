import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { TRPCError, initTRPC } from '@trpc/server';

import { prisma } from '@esolang-battle/db';

export const createContext = async (opts: { req: Request }) => {
  const session = await getServerSession(authOptions);
  return {
    prisma,
    user: session?.user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});
