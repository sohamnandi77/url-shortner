/*
  Warnings:

  - A unique constraint covering the columns `[userId,workspaceId]` on the table `WorkspaceUsers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "ProjectInvite_workspaceId_idx" ON "ProjectInvite"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceUsers_workspaceId_idx" ON "WorkspaceUsers"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceUsers_userId_workspaceId_key" ON "WorkspaceUsers"("userId", "workspaceId");
