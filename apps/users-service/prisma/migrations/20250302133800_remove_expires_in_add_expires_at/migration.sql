/*
  Warnings:

  - You are about to drop the column `expires_in` on the `refresh_sessions` table. All the data in the column will be lost.
  - Added the required column `expires_at` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refresh_sessions" DROP COLUMN "expires_in",
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL;
