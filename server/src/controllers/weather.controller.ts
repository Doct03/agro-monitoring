import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { fetchWeatherByCoordinates } from "../services/weather.service";

export const updatePlotWeather = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const plotId = Number(req.params.plotId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Number.isNaN(plotId)) {
      return res.status(400).json({ message: "Invalid plot id" });
    }

    const plot = await prisma.plot.findFirst({
      where: {
        id: plotId,
        userId,
      },
    });

    if (!plot) {
      return res.status(404).json({
        message: "Plot not found or access denied",
      });
    }

    if (
      plot.latitude === null ||
      plot.latitude === undefined ||
      plot.longitude === null ||
      plot.longitude === undefined
    ) {
      return res.status(400).json({
        message: "Plot coordinates are required",
      });
    }

    if (plot.latitude < -90 || plot.latitude > 90) {
      return res.status(400).json({
        message: "Invalid plot latitude",
      });
    }

    if (plot.longitude < -180 || plot.longitude > 180) {
      return res.status(400).json({
        message: "Invalid plot longitude",
      });
    }

    const weather = await fetchWeatherByCoordinates(
      plot.latitude,
      plot.longitude
    );

    const record = await prisma.weatherRecord.create({
      data: {
        plotId: plot.id,
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
        windSpeed: weather.windSpeed,
      },
    });

    return res.status(201).json(record);
  } catch (error) {
    console.error("Update plot weather error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPlotWeatherHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const plotId = Number(req.params.plotId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Number.isNaN(plotId)) {
      return res.status(400).json({ message: "Invalid plot id" });
    }

    const plot = await prisma.plot.findFirst({
      where: {
        id: plotId,
        userId,
      },
    });

    if (!plot) {
      return res.status(404).json({
        message: "Plot not found or access denied",
      });
    }

    const records = await prisma.weatherRecord.findMany({
      where: {
        plotId,
      },
      orderBy: {
        recordedAt: "asc",
      },
    });

    return res.json(records);
  } catch (error) {
    console.error("Get plot weather history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};