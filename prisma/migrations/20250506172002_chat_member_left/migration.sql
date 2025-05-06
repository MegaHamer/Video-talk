/*
  Warnings:

  - You are about to drop the column `visibleChat` on the `ChatMember` table. All the data in the column will be lost.
  - Added the required column `isActive` to the `ChatMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatMember" DROP COLUMN "visibleChat",
ADD COLUMN     "isActive" BOOLEAN NOT NULL,
ADD COLUMN     "leftAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "FriendshipStatus";

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR(255) NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
