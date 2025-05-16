/*
  Warnings:

  - Added the required column `path` to the `avatars` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "avatars" ADD COLUMN     "path" TEXT NOT NULL;
