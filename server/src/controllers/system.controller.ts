import { Request, Response } from "express";
import { runWeatherMonitoring } from "../services/weather-monitor.service";

export const runMonitoringNow = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await runWeatherMonitoring(userId);

    return res.json({
      message: "Моніторинг виконано успішно.",
      ...result,
    });
  } catch (error) {
    console.error("Run monitoring now error:", error);

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Не вдалося виконати моніторинг.",
    });
  }
};