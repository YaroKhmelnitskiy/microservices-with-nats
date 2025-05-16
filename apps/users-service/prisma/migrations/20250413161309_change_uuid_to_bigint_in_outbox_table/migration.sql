/*
  Warnings:

  - The primary key for the `transactions_outbox` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `transactions_outbox` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "transactions_outbox" DROP CONSTRAINT "transactions_outbox_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "transactions_outbox_pkey" PRIMARY KEY ("id");
