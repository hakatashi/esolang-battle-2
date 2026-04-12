/*
  Warnings:

  - Changed the type of `code` on the `Submission` table. Manual cast added to convert existing text data to bytea.

*/
-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "code" TYPE BYTEA USING "code"::bytea;
