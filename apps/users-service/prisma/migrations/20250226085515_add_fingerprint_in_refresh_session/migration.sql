/*
  Warnings:

  - You are about to drop the column `device_id` on the `refresh_sessions` table. All the data in the column will be lost.
  - Added the required column `fingerprint` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refresh_sessions" DROP COLUMN "device_id",
ADD COLUMN     "fingerprint" TEXT NOT NULL,
ALTER COLUMN "user_agent" DROP NOT NULL;
