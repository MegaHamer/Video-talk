/*
  Warnings:

  - You are about to drop the `Relationship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_requesterId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "globalName" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "Relationship";
