-- Schuelerkartei, Lektionen und Abos (PLAN.md Abschnitt 14, Sprint 8).
--
-- Rein additiv: keine bestehende Tabelle wird angefasst.
-- CreateEnum
CREATE TYPE "LessonCategory" AS ENUM ('AUTO', 'TAXI', 'MOTORRAD', 'LKW', 'ANHAENGER_BE');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('GEPLANT', 'ABSOLVIERT', 'STORNIERT', 'NO_SHOW');

-- CreateTable
CREATE TABLE "student_record" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "practicalExamPassedAt" DATE,
    "wabReminderSentAt" TIMESTAMP(3),
    "wabMailStatus" TEXT,
    "wabMailGrund" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_package" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" "LessonCategory" NOT NULL,
    "size" INTEGER NOT NULL,
    "pricePerLesson" DECIMAL(8,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BAR',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'OFFEN',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "category" "LessonCategory" NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 45,
    "pickupNote" TEXT,
    "status" "LessonStatus" NOT NULL DEFAULT 'GEPLANT',
    "packageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_record_lastName_idx" ON "student_record"("lastName");

-- CreateIndex
CREATE INDEX "student_record_phone_idx" ON "student_record"("phone");

-- CreateIndex
CREATE INDEX "student_record_practicalExamPassedAt_wabReminderSentAt_idx" ON "student_record"("practicalExamPassedAt", "wabReminderSentAt");

-- CreateIndex
CREATE INDEX "lesson_package_studentId_createdAt_idx" ON "lesson_package"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "lesson_studentId_date_idx" ON "lesson"("studentId", "date");

-- CreateIndex
CREATE INDEX "lesson_instructorId_date_idx" ON "lesson"("instructorId", "date");

-- CreateIndex
CREATE INDEX "lesson_packageId_status_idx" ON "lesson"("packageId", "status");

-- AddForeignKey
ALTER TABLE "lesson_package" ADD CONSTRAINT "lesson_package_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "lesson_package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

