import prisma from "../lib/prisma";
import { fetchWeatherByCoordinates } from "./weather.service";
import { buildRecommendation } from "./recommendation.service";
import { simulateMoistureValue } from "./moisture-simulation.service";
import { buildRecommendationAIText } from "./recommendation-ai.service";

const RECOMMENDATION_COOLDOWN_HOURS = Number(
  process.env.RECOMMENDATION_COOLDOWN_HOURS || 6
);

export const runWeatherMonitoring = async (userId?: number) => {
  try {
    const plots = await prisma.plot.findMany({
      where: userId
        ? {
            userId,
          }
        : undefined,
      include: {
        crops: {
          include: {
            moistureRecords: {
              orderBy: {
                recordedAt: "desc",
              },
              take: 1,
            },
          },
        },
      },
    });

    console.log("Plots found:", plots.length);

    let processedPlots = 0;
    let processedCrops = 0;
    let createdRecommendations = 0;
    let skippedRecommendations = 0;

    for (const plot of plots) {
      try {
        console.log("Processing plot:", plot.id, plot.name);

        if (plot.latitude < -90 || plot.latitude > 90) {
          console.log(`Invalid latitude for plot ${plot.id}:`, plot.latitude);
          continue;
        }

        if (plot.longitude < -180 || plot.longitude > 180) {
          console.log(`Invalid longitude for plot ${plot.id}:`, plot.longitude);
          continue;
        }

        const weather = await fetchWeatherByCoordinates(
          plot.latitude,
          plot.longitude
        );

        const savedWeather = await prisma.weatherRecord.create({
          data: {
            plotId: plot.id,
            temperature: weather.temperature,
            humidity: weather.humidity,
            rainfall: weather.rainfall,
            windSpeed: weather.windSpeed,
          },
        });

        processedPlots += 1;

        console.log("Weather saved for plot:", plot.id);

        for (const crop of plot.crops) {
          const latestMoisture = crop.moistureRecords[0];

          const simulatedMoisture = simulateMoistureValue({
            previousMoisture: latestMoisture?.value ?? null,
            temperature: savedWeather.temperature,
            rainfall: savedWeather.rainfall,
          });

          const savedMoisture = await prisma.moistureRecord.create({
            data: {
              cropId: crop.id,
              value: simulatedMoisture,
              source: "simulated_sensor",
            },
          });

          processedCrops += 1;

          console.log(
            "Moisture simulated for crop:",
            crop.id,
            savedMoisture.value
          );

          const recommendationData = buildRecommendation({
            moisture: savedMoisture.value,
            rainfall: savedWeather.rainfall,
            temperature: savedWeather.temperature,
          });

          const cooldownDate = new Date();
          cooldownDate.setHours(
            cooldownDate.getHours() - RECOMMENDATION_COOLDOWN_HOURS
          );

          const recentRecommendation = await prisma.recommendation.findFirst({
            where: {
              plotId: plot.id,
              cropId: crop.id,
              recommendationType: recommendationData.recommendationType,
              createdAt: {
                gte: cooldownDate,
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (recentRecommendation) {
            skippedRecommendations += 1;

            console.log(
              `Recommendation skipped by cooldown for crop ${crop.id}. Similar recommendation already exists.`
            );

            continue;
          }

          const aiRecommendation = await buildRecommendationAIText({
            cropName: crop.name,
            recommendationType: recommendationData.recommendationType,
            moisture: savedMoisture.value,
            rainfall: savedWeather.rainfall,
            temperature: savedWeather.temperature,
            soilType: plot.soilType,
          });

          const createdRecommendation = await prisma.recommendation.create({
            data: {
              plotId: plot.id,
              cropId: crop.id,
              message: aiRecommendation.title,
              recommendationType: recommendationData.recommendationType,
              irrigationVolume: recommendationData.irrigationVolume,
              explanation: aiRecommendation.explanation,
              advice: aiRecommendation.advice,
              priority: aiRecommendation.priority,
            },
          });

          await prisma.notification.create({
            data: {
              userId: plot.userId,
              title:
                recommendationData.recommendationType === "irrigation"
                  ? "Потрібен полив"
                  : "Нова рекомендація",
              message: `${crop.name}: ${aiRecommendation.title}`,
              type:
                recommendationData.recommendationType === "irrigation"
                  ? "warning"
                  : "info",
            },
          });

          createdRecommendations += 1;

          console.log(
            "Recommendation created for crop:",
            crop.id,
            createdRecommendation.id
          );
        }
      } catch (plotError) {
        console.error(`Error processing plot ${plot.id}:`, plotError);
      }
    }

    console.log("Weather monitoring completed successfully");

    return {
      processedPlots,
      processedCrops,
      createdRecommendations,
      skippedRecommendations,
    };
  } catch (error) {
    console.error("Weather monitoring error:", error);
    throw error;
  }
};