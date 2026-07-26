-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'PHONE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'WAITLIST');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BAR', 'TWINT', 'KARTE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('OFFEN', 'BEZAHLT', 'ERSTATTET');

-- CreateTable
CREATE TABLE "instructor" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "phone" TEXT,
    "provisionPerBooking" DECIMAL(8,2) NOT NULL DEFAULT 50,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_type" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePrice" DECIMAL(8,2) NOT NULL,
    "materialPrice" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "onlineLimit" INTEGER NOT NULL DEFAULT 12,
    "requiresLfa" BOOLEAN NOT NULL DEFAULT false,
    "bookable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "courseTypeId" TEXT NOT NULL,
    "price" DECIMAL(8,2) NOT NULL,
    "materialPrice" DECIMAL(8,2) NOT NULL,
    "onlineLimit" INTEGER NOT NULL,
    "earlyBirdDiscount" DECIMAL(8,2),
    "earlyBirdSlots" INTEGER,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "printedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_session" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "instructorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "salutation" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lfaNumber" TEXT,
    "agbAcceptedAt" TIMESTAMP(3),
    "smsReminder" BOOLEAN NOT NULL DEFAULT false,
    "smsPhone" TEXT,
    "source" "BookingSource" NOT NULL DEFAULT 'ONLINE',
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "priceCharged" DECIMAL(8,2) NOT NULL,
    "earlyBird" BOOLEAN NOT NULL DEFAULT false,
    "referredById" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BAR',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'OFFEN',
    "paidAt" TIMESTAMP(3),
    "payrexxRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "sms_log" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instructor_userId_key" ON "instructor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_shortCode_key" ON "instructor"("shortCode");

-- CreateIndex
CREATE INDEX "instructor_active_lastName_idx" ON "instructor"("active", "lastName");

-- CreateIndex
CREATE UNIQUE INDEX "course_type_code_key" ON "course_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "course_type_slug_key" ON "course_type"("slug");

-- CreateIndex
CREATE INDEX "course_type_active_sortOrder_idx" ON "course_type"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "course_status_courseTypeId_idx" ON "course"("status", "courseTypeId");

-- CreateIndex
CREATE INDEX "course_session_courseId_date_idx" ON "course_session"("courseId", "date");

-- CreateIndex
CREATE INDEX "course_session_date_idx" ON "course_session"("date");

-- CreateIndex
CREATE INDEX "course_session_instructorId_date_idx" ON "course_session"("instructorId", "date");

-- CreateIndex
CREATE INDEX "booking_courseId_status_idx" ON "booking"("courseId", "status");

-- CreateIndex
CREATE INDEX "booking_email_courseId_createdAt_idx" ON "booking"("email", "courseId", "createdAt");

-- CreateIndex
CREATE INDEX "booking_referredById_createdAt_idx" ON "booking"("referredById", "createdAt");

-- CreateIndex
CREATE INDEX "booking_lastName_idx" ON "booking"("lastName");

-- CreateIndex
CREATE INDEX "booking_phone_idx" ON "booking"("phone");

-- CreateIndex
CREATE INDEX "sms_log_bookingId_idx" ON "sms_log"("bookingId");

-- CreateIndex
CREATE INDEX "sms_log_sentAt_idx" ON "sms_log"("sentAt");

-- AddForeignKey
ALTER TABLE "instructor" ADD CONSTRAINT "instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course" ADD CONSTRAINT "course_courseTypeId_fkey" FOREIGN KEY ("courseTypeId") REFERENCES "course_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_session" ADD CONSTRAINT "course_session_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_session" ADD CONSTRAINT "course_session_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_log" ADD CONSTRAINT "sms_log_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
