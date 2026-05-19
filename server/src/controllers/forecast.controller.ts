import { Request, Response } from "express";
import prisma from "../lib/prisma";

const getSoilFactor = (soilType?: string | null) => {
  const soil = (soilType || "").toLowerCase();

  if (soil.includes("чорнозем")) return 1.1;
  if (soil.includes("суглин")) return 1;
  if (soil.includes("піщ")) return 0.85;
  if (soil.includes("глин")) return 0.9;

  return 1;
};

const getMoistureFactor = (
  moisture: number | null,
  min?: number | null,
  max?: number | null
) => {
  if (moisture === null) {
    return 0.9;
  }

  if (min !== null && min !== undefined && moisture < min) {
    return 0.75;
  }

  if (max !== null && max !== undefined && moisture > max) {
    return 0.85;
  }

  return 1;
};

const getWeatherFactor = (
  temperature?: number | null,
  rainfall?: number | null
) => {
  let factor = 1;

  if (temperature !== null && temperature !== undefined) {
    if (temperature < 8 || temperature > 34) {
      factor -= 0.12;
    } else if (temperature >= 18 && temperature <= 28) {
      factor += 0.05;
    }
  }

  if (rainfall !== null && rainfall !== undefined) {
    if (rainfall > 0 && rainfall <= 10) {
      factor += 0.04;
    }

    if (rainfall > 30) {
      factor -= 0.08;
    }
  }

  return Math.max(0.7, Math.min(factor, 1.1));
};

const getConfidenceLevel = (
  hasMoisture: boolean,
  hasWeather: boolean,
  hasBaseYield: boolean
) => {
  let confidence = 0.45;

  if (hasMoisture) {
    confidence += 0.25;
  }

  if (hasWeather) {
    confidence += 0.2;
  }

  if (hasBaseYield) {
    confidence += 0.08;
  }

  return Number(Math.min(confidence, 0.9).toFixed(2));
};

export const getForecasts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const forecasts = await prisma.yieldForecast.findMany({
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
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(forecasts);
  } catch (error) {
    console.error("Get forecasts error:", error);

    return res.status(500).json({
      message: "Не вдалося завантажити прогнози урожайності.",
    });
  }
};

export const generateForecastsForAllCrops = async (
  req: Request,
  res: Response
) => {
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
          take: 1,
        },
      },
    });

    const createdForecasts = [];

    for (const crop of crops) {
      if (!crop.plot) {
        continue;
      }

      const latestMoisture = crop.moistureRecords[0] || null;
      const latestWeather = crop.plot.weatherRecords[0] || null;

      const area = Number(crop.plot.area || 0);
      const baseYield = Number(crop.baseYield || 1);

      const moisture = latestMoisture ? Number(latestMoisture.value) : null;

      const soilFactor = getSoilFactor(crop.plot.soilType);

      const moistureFactor = getMoistureFactor(
        moisture,
        crop.optimalMoistureMin,
        crop.optimalMoistureMax
      );

      const weatherFactor = getWeatherFactor(
        latestWeather ? Number(latestWeather.temperature) : null,
        latestWeather ? Number(latestWeather.rainfall) : null
      );

      const expectedYield = Number(
        (
          area *
          baseYield *
          soilFactor *
          moistureFactor *
          weatherFactor
        ).toFixed(1)
      );

      const confidenceLevel = getConfidenceLevel(
        Boolean(latestMoisture),
        Boolean(latestWeather),
        Boolean(crop.baseYield)
      );

      const forecast = await prisma.yieldForecast.create({
        data: {
          cropId: crop.id,
          expectedYield,
          confidenceLevel,
          notes:
            "Розрахунок виконано на основі площі ділянки, типу ґрунту, рівня вологості, погодних умов та базових параметрів культури.",
        },
      });

      await prisma.notification.create({
  data: {
    userId,
    title: "Сформовано прогноз урожайності",
    message: `${crop.name}: очікувана врожайність ${expectedYield}`,
    type: "success",
  },
});

      createdForecasts.push(forecast);
    }

    return res.json({
      message: "Прогнози урожайності сформовано.",
      created: createdForecasts.length,
      forecasts: createdForecasts,
    });
  } catch (error) {
    console.error("Generate forecasts for all crops error:", error);

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Не вдалося сформувати прогнози урожайності.",
    });
  }
};