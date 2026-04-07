-- Multi-tenant migration: introduce Gym, attach all existing rows to a default gym.
-- A new "Gym" row is inserted first; every existing User/Member/Plan/Subscription/CheckIn
-- is updated to point at it before the NOT NULL constraint is enforced.

PRAGMA foreign_keys=OFF;

-- 1. Create Gym table
CREATE TABLE "Gym" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert a default Gym to host pre-existing data.
--    Branding falls back to env vars at app startup, but the row exists so FKs resolve.
INSERT INTO "Gym" ("id", "name", "address", "phone")
VALUES ('cmnlegacygym00000000000000', 'Saarth Fitness Club', '123 Main Street, Your City', '+91 99999 99999');

-- 3. Rebuild User with gymId
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("id", "email", "passwordHash", "gymId", "createdAt")
SELECT "id", "email", "passwordHash", 'cmnlegacygym00000000000000', "createdAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_gymId_idx" ON "User"("gymId");

-- 4. Rebuild Member with gymId; phoneNumber is now unique per (gymId, phoneNumber) instead of globally
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gymId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "joinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emergencyContact" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("id", "gymId", "fullName", "phoneNumber", "joinDate", "emergencyContact", "createdAt")
SELECT "id", 'cmnlegacygym00000000000000', "fullName", "phoneNumber", "joinDate", "emergencyContact", "createdAt" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_gymId_phoneNumber_key" ON "Member"("gymId", "phoneNumber");
CREATE INDEX "Member_gymId_idx" ON "Member"("gymId");

-- 5. Rebuild Plan with gymId
CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Plan" ("id", "gymId", "name", "pricePaise", "durationDays", "createdAt")
SELECT "id", 'cmnlegacygym00000000000000', "name", "pricePaise", "durationDays", "createdAt" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE INDEX "Plan_gymId_idx" ON "Plan"("gymId");

-- 6. Rebuild Subscription with gymId
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "pricePaidPaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("id", "gymId", "memberId", "planId", "startDate", "endDate", "pricePaidPaise", "status", "createdAt")
SELECT "id", 'cmnlegacygym00000000000000', "memberId", "planId", "startDate", "endDate", "pricePaidPaise", "status", "createdAt" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE INDEX "Subscription_gymId_idx" ON "Subscription"("gymId");
CREATE INDEX "Subscription_memberId_idx" ON "Subscription"("memberId");
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");

-- 7. Rebuild CheckIn with gymId
CREATE TABLE "new_CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allowed" BOOLEAN NOT NULL,
    CONSTRAINT "CheckIn_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CheckIn" ("id", "gymId", "memberId", "timestamp", "allowed")
SELECT "id", 'cmnlegacygym00000000000000', "memberId", "timestamp", "allowed" FROM "CheckIn";
DROP TABLE "CheckIn";
ALTER TABLE "new_CheckIn" RENAME TO "CheckIn";
CREATE INDEX "CheckIn_gymId_timestamp_idx" ON "CheckIn"("gymId", "timestamp");
CREATE INDEX "CheckIn_memberId_timestamp_idx" ON "CheckIn"("memberId", "timestamp");

PRAGMA foreign_keys=ON;
