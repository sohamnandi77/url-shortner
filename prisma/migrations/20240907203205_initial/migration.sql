-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expiredLink" TEXT,
ADD COLUMN     "shouldIndex" BOOLEAN NOT NULL DEFAULT false;
