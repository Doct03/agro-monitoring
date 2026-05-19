/*
  Warnings:

  - You are about to drop the `IoTSensor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "IoTSensor" DROP CONSTRAINT "IoTSensor_cropId_fkey";

-- DropTable
DROP TABLE "IoTSensor";

-- CreateTable
CREATE TABLE "iot_sensors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'simulated',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "cropId" INTEGER NOT NULL,

    CONSTRAINT "iot_sensors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "iot_sensors_apiKey_key" ON "iot_sensors"("apiKey");

-- CreateIndex
CREATE INDEX "iot_sensors_cropId_idx" ON "iot_sensors"("cropId");

-- CreateIndex
CREATE INDEX "iot_sensors_apiKey_idx" ON "iot_sensors"("apiKey");

-- AddForeignKey
ALTER TABLE "iot_sensors" ADD CONSTRAINT "iot_sensors_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
