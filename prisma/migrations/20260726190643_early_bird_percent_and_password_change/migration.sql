-- AlterTable
ALTER TABLE "course" DROP COLUMN "earlyBirdDiscount",
ADD COLUMN     "earlyBirdPercent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

