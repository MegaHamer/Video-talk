/*
  Warnings:

  - You are about to drop the column `replyToId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_replyToId_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "replyToId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status";
