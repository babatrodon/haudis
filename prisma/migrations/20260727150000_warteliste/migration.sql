-- Warteliste als eigenes Modell (PLAN.md Abschnitt 14, Sprint 7).

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WARTET', 'EINGELADEN', 'GEBUCHT', 'ENTFERNT');

-- Wartende sind keine Buchungen mehr.
--
-- BookingStatus.WAITLIST wurde von der Anwendung nie geschrieben; die einzigen
-- Zeilen stammen aus db:seed:demo. Sie werden auf CANCELLED gesetzt, bevor der
-- Wert entfernt wird — sonst bricht das ALTER TYPE unten ab. Ein Wartender war
-- ohnehin nie ein belegter Platz, insofern ist CANCELLED der naechstliegende
-- Zustand.
UPDATE "booking" SET "status" = 'CANCELLED' WHERE "status" = 'WAITLIST';

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('CONFIRMED', 'CANCELLED');
ALTER TABLE "public"."booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "booking" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
COMMIT;

-- CreateTable
CREATE TABLE "waitlist_entry" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WARTET',
    "token" TEXT,
    "invitedAt" TIMESTAMP(3),
    "invitedUntil" TIMESTAMP(3),
    "bookingId" TEXT,
    "mailStatus" TEXT,
    "mailGrund" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entry_token_key" ON "waitlist_entry"("token");

-- CreateIndex
CREATE INDEX "waitlist_entry_courseId_status_createdAt_idx" ON "waitlist_entry"("courseId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
