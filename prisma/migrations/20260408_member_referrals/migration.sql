-- AlterTable
ALTER TABLE "Member" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "Member" ADD COLUMN "referredById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Member_gymId_referralCode_key" ON "Member"("gymId", "referralCode");

-- CreateIndex
CREATE INDEX "Member_referredById_idx" ON "Member"("referredById");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
