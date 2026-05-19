import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { buildRecommendation } from "../services/recommendation.service";

export const generateRecommendationForCrop = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;
    const cropId = Number(req.params.cropId);

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
        plot: true,
        moistureRecords: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!crop) {
      return res.status(404).json({
        message: "Crop not found or access denied",
      });
    }

    const latestMoisture = crop.moistureRecords[0];

    if (!latestMoisture) {
      return res.status(400).json({
        message: "No moisture data for this crop",
      });
    }

    const latestWeather = await prisma.weatherRecord.findFirst({
      where: {
        plotId: crop.plotId,
      },
      orderBy: {
        recordedAt: "desc",
      },
    });

    if (!latestWeather) {
      return res.status(400).json({
        message: "No weather data for this plot",
      });
    }

    const recommendationData = buildRecommendation({
      moisture: latestMoisture.value,
      rainfall: latestWeather.rainfall,
      temperature: latestWeather.temperature,
    });

    const recommendation = await prisma.recommendation.create({
      data: {
        plotId: crop.plotId,
        cropId: crop.id,
        message: recommendationData.message,
        recommendationType: recommendationData.recommendationType,
        irrigationVolume: recommendationData.irrigationVolume,
      },
      include: {
        plot: true,
        crop: true,
      },
    });

    return res.status(201).json(recommendation);
  } catch (error) {
    console.error("Generate recommendation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const recommendations = await prisma.recommendation.findMany({
      where: {
        plot: {
          userId,
        },
      },
      include: {
        plot: true,
        crop: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(recommendations);
  } catch (error) {
    console.error("Get recommendations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const previewRecommendationForCrop = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;
    const cropId = Number(req.params.cropId);

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
        plot: true,
        moistureRecords: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!crop) {
      return res.status(404).json({
        message: "Crop not found or access denied",
      });
    }

    const latestMoisture = crop.moistureRecords[0];

    if (!latestMoisture) {
      return res.status(400).json({
        message: "No moisture data for this crop",
      });
    }

    const latestWeather = await prisma.weatherRecord.findFirst({
      where: {
        plotId: crop.plotId,
      },
      orderBy: {
        recordedAt: "desc",
      },
    });

    if (!latestWeather) {
      return res.status(400).json({
        message: "No weather data for this plot",
      });
    }

    const recommendationData = buildRecommendation({
      moisture: latestMoisture.value,
      rainfall: latestWeather.rainfall,
      temperature: latestWeather.temperature,
    });

    return res.json(recommendationData);
  } catch (error) {
    console.error("Preview recommendation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};