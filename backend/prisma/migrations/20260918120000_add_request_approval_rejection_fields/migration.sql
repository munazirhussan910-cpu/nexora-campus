-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requestTypeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "assignedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dueAt" DATETIME,
    "completedAt" DATETIME,
    "rejectionReason" TEXT,
    "rejectedBy" TEXT,
    "rejectedAt" DATETIME,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    CONSTRAINT "Request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Request_requestTypeId_fkey" FOREIGN KEY ("requestTypeId") REFERENCES "RequestType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("assignedTo", "completedAt", "createdAt", "description", "dueAt", "id", "location", "priority", "requestNumber", "requestTypeId", "requesterId", "status", "title", "updatedAt") SELECT "assignedTo", "completedAt", "createdAt", "description", "dueAt", "id", "location", "priority", "requestNumber", "requestTypeId", "requesterId", "status", "title", "updatedAt" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE UNIQUE INDEX "Request_requestNumber_key" ON "Request"("requestNumber");
CREATE INDEX "Request_status_idx" ON "Request"("status");
CREATE INDEX "Request_priority_idx" ON "Request"("priority");
CREATE INDEX "Request_assignedTo_idx" ON "Request"("assignedTo");
CREATE INDEX "Request_requesterId_idx" ON "Request"("requesterId");
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
CREATE INDEX "Request_dueAt_idx" ON "Request"("dueAt");
CREATE INDEX "Request_requesterId_createdAt_idx" ON "Request"("requesterId", "createdAt");
CREATE INDEX "Request_rejectedBy_idx" ON "Request"("rejectedBy");
CREATE INDEX "Request_approvedBy_idx" ON "Request"("approvedBy");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
