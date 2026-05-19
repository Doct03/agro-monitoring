-- CreateTable
CREATE TABLE "IoTSensor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'simulated',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "cropId" INTEGER NOT NULL,

    CONSTRAINT "IoTSensor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IoTSensor_apiKey_key" ON "IoTSensor"("apiKey");

-- AddForeignKey
ALTER TABLE "IoTSensor" ADD CONSTRAINT "IoTSensor_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
