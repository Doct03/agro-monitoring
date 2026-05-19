import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { buildRecommendationAIText } from "../services/recommendation-ai.service";

export const generateRecommendationHint = async (
  req: Request,
  res: Response
) => {
  try {
    const recommendationId = Number(req.params.id);

    if (Number.isNaN(recommendationId)) {
      return res.status(400).json({ message: "Invalid recommendation id" });
    }

    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
      include: {
        crop: true,
        plot: true,
      },
    });

    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }

    const crop = recommendation.crop;
    const plot = recommendation.plot;
    const cropId = recommendation.cropId;
    const plotId = recommendation.plotId;

    if (!crop) {
      return res
        .status(404)
        .json({ message: "Crop for recommendation not found" });
    }

    if (!plot) {
      return res
        .status(404)
        .json({ message: "Plot for recommendation not found" });
    }

    if (cropId === null) {
      return res.status(400).json({
        message: "Recommendation does not contain cropId",
      });
    }

    if (plotId === null) {
      return res.status(400).json({
        message: "Recommendation does not contain plotId",
      });
    }

    const latestMoisture = await prisma.moistureRecord.findFirst({
      where: { cropId },
      orderBy: { recordedAt: "desc" },
    });

    const latestWeather = await prisma.weatherRecord.findFirst({
      where: { plotId },
      orderBy: { recordedAt: "desc" },
    });

    if (!latestMoisture || !latestWeather) {
      return res.status(400).json({
        message: "Not enough data to generate AI hint",
      });
    }

    const aiHint = await buildRecommendationAIText({
      cropName: crop.name,
      recommendationType: recommendation.recommendationType,
      moisture: latestMoisture.value,
      rainfall: latestWeather.rainfall,
      temperature: latestWeather.temperature,
      soilType: plot.soilType,
    });

    return res.json(aiHint);
  } catch (error) {
    console.error("Generate recommendation hint error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};