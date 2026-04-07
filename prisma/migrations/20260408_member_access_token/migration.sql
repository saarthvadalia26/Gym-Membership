-- AlterTable
ALTER TABLE "Member" ADD COLUMN "accessToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Member_accessToken_key" ON "Member"("accessToken");
