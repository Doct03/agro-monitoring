import { Request, Response } from "express";
import prisma from "../lib/prisma";


export const createCrop = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      name,
      plantingDate,
      growthStage,
      expectedHarvestDate,
      plotId,
      optimalMoistureMin,
      optimalMoistureMax,
      baseYield,
    } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "Некоректна назва культури",
      });
    }

    if (!plantingDate) {
      return res.status(400).json({
        message: "Дата посадки є обов’язковою",
      });
    }

    if (!plotId || Number.isNaN(Number(plotId))) {
      return res.status(400).json({
        message: "Ділянка є обов’язковою",
      });
    }

    const planting = new Date(plantingDate);

    if (Number.isNaN(planting.getTime())) {
      return res.status(400).json({
        message: "Некоректна дата посадки",
      });
    }

    let harvestDate: Date | null = null;

    if (expectedHarvestDate) {
      harvestDate = new Date(expectedHarvestDate);

      if (Number.isNaN(harvestDate.getTime())) {
        return res.status(400).json({
          message: "Некоректна дата очікуваного збору",
        });
      }
    }

    const plot = await prisma.plot.findFirst({
      where: {
        id: Number(plotId),
        userId,
      },
    });

    if (!plot) {
      return res.status(404).json({
        message: "Plot not found or access denied",
      });
    }


 const crop = await prisma.crop.create({
  data: {
    name: String(name).trim(),
    plantingDate: new Date(plantingDate),
    growthStage: growthStage || null,
    expectedHarvestDate: expectedHarvestDate
      ? new Date(expectedHarvestDate)
      : null,
    optimalMoistureMin:
      optimalMoistureMin !== undefined ? Number(optimalMoistureMin) : null,
    optimalMoistureMax:
      optimalMoistureMax !== undefined ? Number(optimalMoistureMax) : null,
    baseYield: baseYield !== undefined ? Number(baseYield) : null,
    isCustom: true,
    plotId: Number(plotId),
  },
      include: {
        plot: {
          select: {
            id: true,
            name: true,
            region: true,
            soilType: true,
            area: true,
          },
        },
      },
    });

    return res.status(201).json(crop);
  } catch (error) {
    console.error("Create crop error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCrops = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const crops = await prisma.crop.findMany({
      where: {
        plot: {
          userId,
        },
      },
      include: {
        plot: {
          select: {
            id: true,
            name: true,
            region: true,
            soilType: true,
            area: true,
          },
        },
        moistureRecords: {
          orderBy: {
            recordedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.json(crops);
  } catch (error) {
    console.error("Get crops error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCropById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const cropId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Number.isNaN(cropId)) {
      return res.status(400).json({ message: "Invalid crop id" });
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
          include: {
            weatherRecords: {
              orderBy: {
                recordedAt: "desc",
              },
              take: 1,
            },
          },
        },
        moistureRecords: {
          orderBy: {
            recordedAt: "desc",
          },
        },
        recommendations: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            plot: true,
          },
        },
      },
    });

    if (!crop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    return res.json(crop);
  } catch (error) {
    console.error("Get crop by id error:", error);

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Internal server error",
    });
  }
};