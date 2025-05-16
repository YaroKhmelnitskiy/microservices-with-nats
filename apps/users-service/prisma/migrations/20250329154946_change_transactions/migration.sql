-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_to_user_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_fkey";

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DEFAULT 0;

ALTER TABLE "transactions" ADD CONSTRAINT "amount_positive_check" CHECK ("amount" > 0);
