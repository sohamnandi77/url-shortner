/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `LinkTag` table. All the data in the column will be lost.
  - You are about to drop the `_LinkToLinkTag` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[linkId,tagId]` on the table `LinkTag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `linkId` to the `LinkTag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagId` to the `LinkTag` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LinkTag" DROP CONSTRAINT "LinkTag_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "_LinkToLinkTag" DROP CONSTRAINT "_LinkToLinkTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_LinkToLinkTag" DROP CONSTRAINT "_LinkToLinkTag_B_fkey";

-- AlterTable
ALTER TABLE "LinkTag" DROP COLUMN "workspaceId",
ADD COLUMN     "linkId" TEXT NOT NULL,
ADD COLUMN     "tagId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_LinkToLinkTag";

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_workspaceId_key" ON "Tag"("name", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkTag_linkId_tagId_key" ON "LinkTag"("linkId", "tagId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkTag" ADD CONSTRAINT "LinkTag_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkTag" ADD CONSTRAINT "LinkTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
