import bcrypt from 'bcryptjs';

import type { UserInfo } from '@esolang-battle/common';

import { PrismaClient } from '../prisma/generated/client/index';

export async function verifyUserLogin(
  prisma: PrismaClient,
  email: string,
  password: string
): Promise<UserInfo | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { teams: true },
  });

  if (!user || !user.password) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  return {
    id: user.id,
    name: user.name || '',
    isAdmin: Boolean(user.isAdmin),
    teams: user.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
  };
}

export async function registerUser(
  prisma: PrismaClient,
  email: string,
  name: string,
  password: string
): Promise<UserInfo> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('このメールアドレスは既に登録されています');
  }

  const hashed = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
    },
    include: {
      teams: true,
    },
  });

  return {
    id: created.id,
    name: created.name || '',
    isAdmin: Boolean(created.isAdmin),
    teams: created.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
  };
}

export async function getUserInfo(prisma: PrismaClient, userId: string): Promise<UserInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teams: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name || '',
    isAdmin: Boolean(user.isAdmin),
    teams: user.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
  };
}
