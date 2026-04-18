-- CreateEnum
CREATE TYPE "SortOrder" AS ENUM ('ASC', 'DESC');

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "scoreOrder" "SortOrder" NOT NULL DEFAULT 'DESC';
