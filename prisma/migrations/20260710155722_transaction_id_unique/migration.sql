/*
  Warnings:

  - A unique constraint covering the columns `[tranId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "meta" JSONB,
ALTER COLUMN "currency" SET DEFAULT 'BDT';

-- CreateIndex
CREATE UNIQUE INDEX "payments_tranId_key" ON "payments"("tranId");
