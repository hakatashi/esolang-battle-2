import { PrismaClient } from "../generated/prisma/client.js";

export async function getLanguages(prisma: PrismaClient) {
  const languages = await prisma.language.findMany({
    orderBy: { id: "asc" },
  });

  return languages;
}
