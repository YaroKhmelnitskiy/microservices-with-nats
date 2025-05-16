/*
  Warnings:

  - A unique constraint covering the columns `[refresh_token]` on the table `refresh_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usersId` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refresh_sessions" ADD COLUMN     "usersId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_refresh_token_key" ON "refresh_sessions"("refresh_token");

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
