-- CreateTable
CREATE TABLE "scenario_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseTax" DECIMAL(10,4) NOT NULL,
    "inflation" DECIMAL(10,4) NOT NULL DEFAULT 0.04,
    "realEstateRate" DECIMAL(10,4) NOT NULL DEFAULT 0.05,
    "successionTax" DECIMAL(10,4) NOT NULL DEFAULT 0.15,
    "advisorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scenario_templates_advisorId_idx" ON "scenario_templates"("advisorId");

-- AddForeignKey
ALTER TABLE "scenario_templates" ADD CONSTRAINT "scenario_templates_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
