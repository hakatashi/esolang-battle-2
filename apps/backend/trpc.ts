import { initTRPC, TRPCError } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { UserInfo } from '@esolang-battle/common';
import { PrismaClient } from './generated/prisma/client.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// DB Connection
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export const createContext = ({ req, res }: CreateFastifyContextOptions) => {
  const user = (req as any).user as UserInfo | undefined;
  return {
    req,
    res,
    prisma,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// ログイン必須の Procedure
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

// 管理者必須の Procedure
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});
