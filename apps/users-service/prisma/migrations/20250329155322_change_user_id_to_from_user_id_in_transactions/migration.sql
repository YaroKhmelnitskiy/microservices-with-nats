/*
  Warnings:

  - You are about to drop the column `user_id` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `from_user_id` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "user_id",
ADD COLUMN     "from_user_id" UUID NOT NULL;
