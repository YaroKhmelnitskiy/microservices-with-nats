/*
  Warnings:

  - The primary key for the `refresh_sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `refresh_sessions` table. All the data in the column will be lost.
  - Changed the type of `user_id` on the `refresh_sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "refresh_sessions" DROP CONSTRAINT "refresh_sessions_pkey",
DROP COLUMN "id",
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
