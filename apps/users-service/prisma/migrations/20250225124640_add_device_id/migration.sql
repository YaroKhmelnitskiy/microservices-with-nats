/*
  Warnings:

  - Added the required column `device_id` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refresh_sessions" ADD COLUMN     "device_id" TEXT NOT NULL;
