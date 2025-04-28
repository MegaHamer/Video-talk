/*
  Warnings:

  - The values [DM] on the enum `ChatType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `_ChatParticipants` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChatType_new" AS ENUM ('SERVER', 'PRIVATE', 'GROUP');
ALTER TABLE "Chat" ALTER COLUMN "type" TYPE "ChatType_new" USING ("type"::text::"ChatType_new");
ALTER TYPE "ChatType" RENAME TO "ChatType_old";
ALTER TYPE "ChatType_new" RENAME TO "ChatType";
DROP TYPE "ChatType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "_ChatParticipants" DROP CONSTRAINT "_ChatParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChatParticipants" DROP CONSTRAINT "_ChatParticipants_B_fkey";

-- DropTable
DROP TABLE "_ChatParticipants";

-- CreateTable
CREATE TABLE "ChatMember" (
    "chatId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "visibleChat" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("chatId","userId")
);

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
