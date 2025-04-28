-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "ChatMember" ADD COLUMN     "role" "ChatRole" NOT NULL DEFAULT 'MEMBER';
