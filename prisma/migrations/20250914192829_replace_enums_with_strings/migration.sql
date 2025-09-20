-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "firstContact" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Touch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "due" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "prospectId" TEXT NOT NULL,
    CONSTRAINT "Touch_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
