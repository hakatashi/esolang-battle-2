import "dotenv/config";
import Fastify from 'fastify';
import fastifyPassport from '@fastify/passport';
import fastifySecureSession from '@fastify/secure-session';
import fastifyFormbody from '@fastify/formbody';
import { Strategy as LocalStrategy } from 'passport-local';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { router, publicProcedure, createContext, prisma, protectedProcedure, adminProcedure } from './trpc.js';
import { verifyUserLogin, getUserInfo } from './function/authUser.js';
import { z } from 'zod';
import { UserInfo } from '@esolang-battle/common';

import { getContests } from './function/getContests.js';

// --- tRPC Router ---
const appRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),
  getContests: publicProcedure.query(async ({ ctx }) => {
    return await getContests(ctx.prisma);
  }),
  // 今後、既存の関数をここに追加していく
});

export type AppRouter = typeof appRouter;

// --- Fastify Server ---
const server = Fastify({
  logger: true,
});

// JSON や フォームボディのパース
server.register(fastifyFormbody);

// セッション管理
server.register(fastifySecureSession, {
  key: Buffer.from(process.env.SESSION_SECRET || 'a'.repeat(32), 'utf8'), // 実運用では環境変数から
  cookie: {
    path: '/',
    httpOnly: true,
  },
});

// Passport 設定
server.register(fastifyPassport.initialize());
server.register(fastifyPassport.secureSession());

fastifyPassport.use('local', new LocalStrategy({
  usernameField: 'name',
  passwordField: 'password',
}, async (name, password, done) => {
  try {
    const user = await verifyUserLogin(name, password);
    if (!user) {
      return done(null, false, { message: 'Invalid name or password' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

fastifyPassport.registerUserSerializer(async (user: UserInfo) => {
  return user.id;
});

fastifyPassport.registerUserDeserializer(async (id: number) => {
  return await getUserInfo(id);
});

// --- Auth Routes (Traditional HTTP) ---
server.post('/api/login', {
  preValidation: fastifyPassport.authenticate('local'),
}, async (req, res) => {
  const user = req.user as UserInfo;
  return user;
});

server.post('/api/logout', async (req, res) => {
  req.logout();
  return { success: true };
});

// --- tRPC Plugin ---
server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext },
});

// --- Start ---
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
