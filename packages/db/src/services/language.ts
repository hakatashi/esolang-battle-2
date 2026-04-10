import { PrismaClient } from '../../prisma/generated/client/index';

export async function findAllLanguages(prisma: PrismaClient) {
  return await prisma.language.findMany({
    orderBy: { id: 'asc' },
  });
}

export async function findLanguageById(prisma: PrismaClient, id: number) {
  return await prisma.language.findUnique({
    where: { id },
  });
}
