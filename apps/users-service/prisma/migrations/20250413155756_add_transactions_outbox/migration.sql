/*
  Warnings:

  - You are about to drop the `refresh_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "refresh_sessions" DROP CONSTRAINT "refresh_sessions_user_id_fkey";

-- DropTable
DROP TABLE "refresh_sessions";

-- CreateTable
CREATE TABLE "transactions_outbox" (
    "id" UUID NOT NULL,
    "event_name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "transactions_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_outbox_status_idx" ON "transactions_outbox"("status");
