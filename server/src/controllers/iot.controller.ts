import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";

const generateSensorKey = () => {
  return `agm_sensor_${crypto.randomBytes(24).toString("hex")}`;
};

const normalizeSensorMode = (mode?: string) => {
  if (mode === "physical") return "physical";
  return "simulated";
};

export const getIoTSensors = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sensors = await prisma.iotSensor.findMany({
      where: {
        crop: {
          plot: {
            userId,
          },
        },
      },
      include: {
        crop: {
          include: {
            plot: {
              select: {
                id: true,
                name: true,
                region: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(sensors);
  } catch (error) {
    console.error("Get IoT sensors error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createIoTSensor = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { cropId, name, mode } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!cropId || Number.isNaN(Number(cropId))) {
      return res.status(400).json({ message: "Crop id is required" });
    }

    const crop = await prisma.crop.findFirst({
      where: {
        id: Number(cropId),
        plot: {
          userId,
        },
      },
      include: {
        plot: true,
      },
    });

    if (!crop) {
      return res.status(404).json({
        message: "Crop not found or access denied",
      });
    }

    const sensor = await prisma.iotSensor.create({
      data: {
        cropId: crop.id,
        name:
          name && String(name).trim()
            ? String(name).trim()
            : `Датчик вологості: ${crop.name}`,
        mode: normalizeSensorMode(mode),
        apiKey: generateSensorKey(),
      },
      include: {
        crop: {
          include: {
            plot: {
              select: {
                id: true,
                name: true,
                region: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json(sensor);
  } catch (error) {
    console.error("Create IoT sensor error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const disableIoTSensor = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const sensorId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Number.isNaN(sensorId)) {
      return res.status(400).json({ message: "Invalid sensor id" });
    }

    const sensor = await prisma.iotSensor.findFirst({
      where: {
        id: sensorId,
        crop: {
          plot: {
            userId,
          },
        },
      },
    });

    if (!sensor) {
      return res.status(404).json({
        message: "Sensor not found or access denied",
      });
    }

    const updated = await prisma.iotSensor.update({
      where: {
        id: sensorId,
      },
      data: {
        isActive: false,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Disable IoT sensor error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const receiveMoistureFromSensor = async (req: Request, res: Response) => {
  try {
    const { sensorKey, value, battery, temperature, timestamp } = req.body;

    if (!sensorKey || typeof sensorKey !== "string") {
      return res.status(400).json({
        message: "sensorKey is required",
      });
    }

    if (value === undefined || value === null) {
      return res.status(400).json({
        message: "value is required",
      });
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return res.status(400).json({
        message: "Invalid moisture value",
      });
    }

    if (numericValue < 0 || numericValue > 100) {
      return res.status(400).json({
        message: "Moisture value must be between 0 and 100",
      });
    }

    const sensor = await prisma.iotSensor.findUnique({
      where: {
        apiKey: sensorKey,
      },
      include: {
        crop: {
          include: {
            plot: true,
          },
        },
      },
    });

    if (!sensor || !sensor.isActive) {
      return res.status(404).json({
        message: "Sensor not found or inactive",
      });
    }

    const recordedAt =
      timestamp && !Number.isNaN(new Date(timestamp).getTime())
        ? new Date(timestamp)
        : new Date();

    const record = await prisma.moistureRecord.create({
      data: {
        cropId: sensor.cropId,
        value: Number(numericValue.toFixed(1)),
        source:
          sensor.mode === "physical" ? "iot_physical" : "iot_simulated",
        recordedAt,
      },
    });

    await prisma.iotSensor.update({
      where: {
        id: sensor.id,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: sensor.crop.plot.userId,
        title: "Отримано показник IoT-датчика",
        message: `${sensor.crop.name}: вологість ґрунту ${record.value}%`,
        type: "info",
      },
    });

    return res.status(201).json({
      message: "Moisture reading accepted",
      record,
      sensor: {
        id: sensor.id,
        name: sensor.name,
        mode: sensor.mode,
        cropId: sensor.cropId,
      },
      meta: {
        battery: battery ?? null,
        temperature: temperature ?? null,
      },
    });
  } catch (error) {
    console.error("Receive IoT moisture error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createTestIoTReading = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const sensorId = Number(req.params.id);
    const { value } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Number.isNaN(sensorId)) {
      return res.status(400).json({ message: "Invalid sensor id" });
    }

    const sensor = await prisma.iotSensor.findFirst({
      where: {
        id: sensorId,
        crop: {
          plot: {
            userId,
          },
        },
      },
      include: {
        crop: true,
      },
    });

    if (!sensor || !sensor.isActive) {
      return res.status(404).json({
        message: "Sensor not found or inactive",
      });
    }

    const numericValue =
      value !== undefined && value !== null
        ? Number(value)
        : Number((35 + Math.random() * 35).toFixed(1));

    if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
      return res.status(400).json({
        message: "Moisture value must be between 0 and 100",
      });
    }

    const record = await prisma.moistureRecord.create({
      data: {
        cropId: sensor.cropId,
        value: Number(numericValue.toFixed(1)),
        source: "iot_simulated",
      },
    });

    await prisma.iotSensor.update({
      where: {
        id: sensor.id,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });

    return res.status(201).json({
      message: "Test IoT reading created",
      record,
    });
  } catch (error) {
    console.error("Create test IoT reading error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};