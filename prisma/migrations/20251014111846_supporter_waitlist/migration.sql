-- CreateEnum
CREATE TYPE "SupporterWaitlistStatus" AS ENUM ('PENDING', 'CONFIRMED', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "SupporterWaitlist" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "status" "SupporterWaitlistStatus" NOT NULL DEFAULT 'PENDING',
    "source" TEXT,
    "confirmationSentAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupporterWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupporterWaitlist_email_key" ON "SupporterWaitlist"("email");
