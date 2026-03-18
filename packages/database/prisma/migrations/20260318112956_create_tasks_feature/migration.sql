-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "TaskKind" AS ENUM ('GENERAL', 'INSURANCE_EXPIRY', 'BIRTHDAY', 'AI_RISK', 'SIMULATION_FOLLOWUP');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "productId" TEXT,
ADD COLUMN     "returnRate" DECIMAL(10,4);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "category" TEXT,
    "description" TEXT,
    "returnRate" DECIMAL(10,4) NOT NULL,
    "advisorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" "TaskSource" NOT NULL DEFAULT 'MANUAL',
    "kind" "TaskKind" NOT NULL DEFAULT 'GENERAL',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "uniqueKey" TEXT,
    "metadata" JSONB,
    "advisorId" TEXT NOT NULL,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_advisorId_idx" ON "products"("advisorId");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "tasks_advisorId_dueDate_idx" ON "tasks"("advisorId", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_advisorId_status_idx" ON "tasks"("advisorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_advisorId_uniqueKey_key" ON "tasks"("advisorId", "uniqueKey");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
