import "dotenv/config";
import fastify from 'fastify';
import fastifyPassport from '@fastify/passport';
import fastifySecureSession from '@fastify/secure-session';
import fastifyFormbody from '@fastify/formbody';
import { Strategy as LocalStrategy } from 'passport-local';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { router, publicProcedure, createContext, prisma, protectedProcedure, adminProcedure } from './trpc.js';
import { verifyUserLogin, getUserInfo, registerUser } from './function/authUser.js';
import { z } from 'zod';
import type { UserInfo } from '@esolang-battle/common';

import { getContests } from './function/getContests.js';
import { submitCode } from './function/submitCode.js';
import { submissionQueue } from './queue.js';
import { getBoard } from './function/getBoard.js';
import { getProblem } from './function/getProblem.js';
import { listProblems } from './function/listProblems.js';
import { getSubmissions } from './function/getSubmissions.js';
import { getLanguages } from './function/getLanguages.js';
import { getSubmittableLanguageIdsForTeam } from './function/getSubmittableLanguages.js';
import { getUsersWithTeams } from './function/getUsers.js';
import { getTeams } from './function/getTeams.js';
import { testCode } from './function/testCode.js';

// --- tRPC Router ---
const appRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),
  getContests: publicProcedure.query(async ({ ctx }) => {
    return await getContests(ctx.prisma);
  }),
  getBoard: publicProcedure
    .input(z.object({ contestId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getBoard(ctx.prisma, input.contestId);
    }),
  getProblem: publicProcedure
    .input(z.object({ problemId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getProblem(ctx.prisma, input.problemId);
    }),
  listProblems: publicProcedure
    .input(z.object({ contestId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return await listProblems(ctx.prisma, input.contestId);
    }),
  getSubmissions: publicProcedure
    .input(z.object({
      userId: z.number().optional(),
      teamId: z.number().optional(),
      problemId: z.number().optional(),
      languageId: z.number().optional(),
      contestId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return await getSubmissions(ctx.prisma, input ?? {});
    }),
  getLanguages: publicProcedure.query(async ({ ctx }) => {
    return await getLanguages(ctx.prisma);
  }),
  testCode: publicProcedure
    .input(z.object({
      code: z.string(),
      languageId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await testCode(ctx.prisma, input);
    }),
  getSubmittableLanguageIdsForTeam: protectedProcedure
    .input(z.object({ teamId: z.number(), contestId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getSubmittableLanguageIdsForTeam(ctx.prisma, input.teamId, input.contestId);
    }),
  submitCode: protectedProcedure
    .input(z.object({
      code: z.string(),
      languageId: z.number(),
      problemId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const submission = await submitCode(ctx.prisma, {
        ...input,
        userId: ctx.user.id,
      });
      await submissionQueue.add('evaluate', { submissionId: submission.id });
      return submission;
    }),
  // Admin Procedures
  getUsers: adminProcedure.query(async ({ ctx }) => {
    return await getUsersWithTeams(ctx.prisma);
  }),
  getTeams: adminProcedure.query(async ({ ctx }) => {
    return await getTeams(ctx.prisma);
  }),
  getProblems: adminProcedure
    .input(z.object({ contestId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return await listProblems(ctx.prisma, input?.contestId);
    }),
  upsertProblem: adminProcedure
    .input(z.object({
      id: z.number().nullable(),
      contestId: z.number(),
      title: z.string(),
      problemStatement: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        return await ctx.prisma.problem.update({
          where: { id },
          data,
        });
      } else {
        return await ctx.prisma.problem.create({
          data,
        });
      }
    }),
  updateUserTeam: adminProcedure
    .input(z.object({
      userId: z.number(),
      teamId: z.number().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, teamId } = input;
      // チーム所属を全解除して、新しいチームを追加（簡易実装）
      // Team と User は N:N なので、一度 disconnect する必要がある
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        include: { teams: true },
      });
      if (!user) throw new Error("User not found");

      return await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          teams: {
            set: teamId ? [{ id: teamId }] : [],
          },
        },
        include: {
          teams: true,
        },
      });
    }),
  register: publicProcedure
    .input(z.object({ name: z.string(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await registerUser(ctx.prisma, input.name, input.password);
    }),
});

export type AppRouter = typeof appRouter;

// --- Fastify Server ---
const server = fastify({
  logger: true,
});

server.register(fastifyFormbody);
server.register(fastifySecureSession, {
  key: Buffer.from(process.env.SESSION_SECRET || 'a'.repeat(32), 'utf8'),
  cookie: { path: '/', httpOnly: true },
});
server.register(fastifyPassport.initialize());
server.register(fastifyPassport.secureSession());

fastifyPassport.use('local', new LocalStrategy({
  usernameField: 'name',
  passwordField: 'password',
}, async (name, password, done) => {
  try {
    const user = await verifyUserLogin(prisma, name, password);
    if (!user) return done(null, false, { message: 'Invalid name or password' });
    return done(null, user);
  } catch (err) { return done(err); }
}));

fastifyPassport.registerUserSerializer(async (user: UserInfo) => user.id);
fastifyPassport.registerUserDeserializer(async (id: number) => await getUserInfo(prisma, id));

server.post('/api/login', {
  preValidation: fastifyPassport.authenticate('local'),
}, async (req, res) => req.user as UserInfo);

server.post('/api/logout', async (req, res) => {
  req.logout();
  return { success: true };
});

server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext },
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
