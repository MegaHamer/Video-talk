/*
  Warnings:

  - You are about to drop the column `role` on the `ChatMember` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "ownerId" INTEGER;

-- AlterTable
ALTER TABLE "ChatMember" DROP COLUMN "role";

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
