-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "domainsLimit" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "linksLimit" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "linksUsage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tagsLimit" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "usage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usageLimit" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "usersLimit" INTEGER NOT NULL DEFAULT 1;
