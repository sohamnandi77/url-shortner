-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "invalidLoginAttempts" INTEGER NOT NULL DEFAULT 0;
