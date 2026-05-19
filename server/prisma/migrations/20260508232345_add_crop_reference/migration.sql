-- CreateTable
CREATE TABLE "CropReference" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "optimalMoistureMin" INTEGER,
    "optimalMoistureMax" INTEGER,
    "baseYield" DOUBLE PRECISION,
    "yieldUnit" TEXT,
    "growingDays" INTEGER,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CropReference_name_key" ON "CropReference"("name");
