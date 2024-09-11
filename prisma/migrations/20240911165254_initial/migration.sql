/*
  Warnings:

  - A unique constraint covering the columns `[domain,keyword]` on the table `Link` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Link_workspaceId_idx" ON "Link"("workspaceId");

-- CreateIndex
CREATE INDEX "Link_domain_idx" ON "Link"("domain");

-- CreateIndex
CREATE INDEX "Link_proxy_idx" ON "Link"("proxy");

-- CreateIndex
CREATE INDEX "Link_password_idx" ON "Link"("password");

-- CreateIndex
CREATE INDEX "Link_archived_idx" ON "Link"("archived");

-- CreateIndex
CREATE INDEX "Link_createdAt_idx" ON "Link"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Link_clicks_idx" ON "Link"("clicks" DESC);

-- CreateIndex
CREATE INDEX "Link_lastClicked_idx" ON "Link"("lastClicked");

-- CreateIndex
CREATE INDEX "Link_userId_idx" ON "Link"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Link_domain_keyword_key" ON "Link"("domain", "keyword");
