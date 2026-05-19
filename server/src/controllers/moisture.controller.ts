import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const createMoistureRecord = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { cropId, value, source } = req.body;

    if (!cropId || value === undefined || value === null) {
      return res.status(400).json({
        message: "cropId and value are required",
      });
    }

    const numericCropId = Number(cropId);
    const numericValue = Number(value);

    if (Number.isNaN(numericCropId)) {
      return res.status(400).json({
        message: "Invalid crop id",
      });
    }

    if (Number.isNaN(numericValue)) {
      return res.status(400).json({
        message: "Некоректне значення вологості",
      });
    }

    if (numericValue < 0 || numericValue > 100) {
      return res.status(400).json({
        message: "Вологість повинна бути в межах від 0 до 100",
      });
    }

    const crop = await prisma.crop.findFirst({
      where: {
        id: numericCropId,
        plot: {
          userId,
        },
      },
    });

    if (!crop) {
      return res.status(404).json({
        message: "Crop not found or access denied",
      });
    }

    const record = await prisma.moistureRecord.create({
      data: {
        cropId: numericCropId,
        value: numericValue,
        source: source ? String(source).trim() : "manual",
      },
    });

    return res.status(201).json(record);
  } catch (error) {
    console.error("Create moisture record error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCropMoistureHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const cropId = Number(req.params.cropId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Number.isNaN(cropId)) {
      return res.status(400).json({
        message: "Invalid crop id",
      });
    }

    const crop = await prisma.crop.findFirst({
      where: {
        id: cropId,
        plot: {
          userId,
        },
      },
      include: {
        plot: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    if (!crop) {
      return res.status(404).json({
        message: "Crop not found or access denied",
      });
    }

    const records = await prisma.moistureRecord.findMany({
      where: {
        cropId,
      },
      orderBy: {
        recordedAt: "asc",
      },
    });

    return res.json(records);
  } catch (error) {
    console.error("Get crop moisture history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};