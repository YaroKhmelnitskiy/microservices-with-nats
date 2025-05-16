-- AlterTable
ALTER TABLE "refresh_sessions" ALTER COLUMN "ip_address" DROP NOT NULL,
ADD CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("refresh_token");

-- DropIndex
DROP INDEX "refresh_sessions_refresh_token_key";
