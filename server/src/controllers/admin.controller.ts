import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { getCacheStats } from "../services//ai-cache.service";

export const getAdminOverview = async (_req: Request, res: Response) => {
  try {
    const [
      usersCount,
      plotsCount,
      cropsCount,
      recommendationsCount,
      forecastsCount,
      sensorsCount,
      notificationsCount,
      cacheStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.plot.count(),
      prisma.crop.count(),
      prisma.recommendation.count(),
      prisma.yieldForecast.count(),
      prisma.iotSensor.count(),
      prisma.notification.count(),
      getCacheStats(),
    ]);

    return res.json({
      usersCount,
      plotsCount,
      cropsCount,
      recommendationsCount,
      forecastsCount,
      sensorsCount,
      notificationsCount,
      ai: {
        provider: process.env.AI_PROVIDER || "mistral",
        mistralModel: process.env.MISTRAL_MODEL || null,
        groqModel: process.env.GROQ_MODEL || null,
        cache: cacheStats,
      },
    });
  } catch (error) {
    console.error("Get admin overview error:", error);
    return res.status(500).json({
      message: "Не вдалося завантажити адмін-статистику.",
    });
  }
};

export const getAdminUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        region: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            plots: true,
            notifications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(users);
  } catch (error) {
    console.error("Get admin users error:", error);
    return res.status(500).json({
      message: "Не вдалося завантажити користувачів.",
    });
  }
};