-- CreateTable
CREATE TABLE "MessMenu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostelBlockId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "meal" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "timings" TEXT,
    "specialNotes" TEXT,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessMenu_hostelBlockId_fkey" FOREIGN KEY ("hostelBlockId") REFERENCES "HostelBlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessMenu_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MessMenu_hostelBlockId_idx" ON "MessMenu"("hostelBlockId");

-- CreateIndex
CREATE INDEX "MessMenu_day_idx" ON "MessMenu"("day");

-- CreateIndex
CREATE UNIQUE INDEX "MessMenu_hostelBlockId_day_meal_key" ON "MessMenu"("hostelBlockId", "day", "meal");
