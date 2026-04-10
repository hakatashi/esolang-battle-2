/*
  Warnings:

  - You are about to drop the column `colorOfLanguages` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `dispositionOfLanguages` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `edges` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `scoreOfLanguages` on the `Board` table. All the data in the column will be lost.
  - You are about to drop the column `viewerType` on the `Contest` table. All the data in the column will be lost.
  - Added the required column `config` to the `Board` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Board` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Board` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Board" DROP COLUMN "colorOfLanguages",
DROP COLUMN "dispositionOfLanguages",
DROP COLUMN "edges",
DROP COLUMN "languages",
DROP COLUMN "scoreOfLanguages",
ADD COLUMN     "config" JSONB NOT NULL,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "state" JSONB NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Contest" DROP COLUMN "viewerType";

-- DropEnum
DROP TYPE "ContestViewerType";
