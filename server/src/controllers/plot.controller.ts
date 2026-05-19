import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const createPlot = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { name, area, region, latitude, longitude, soilType } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Некоректна назва ділянки" });
    }

    if (!area || Number(area) <= 0) {
      return res
        .status(400)
        .json({ message: "Площа повинна бути більшою за 0" });
    }

    if (!region || typeof region !== "string") {
      return res.status(400).json({ message: "Регіон є обов’язковим" });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Координати є обов’язковими" });
    }

    if (Number(latitude) < -90 || Number(latitude) > 90) {
      return res
        .status(400)
        .json({ message: "Широта повинна бути в межах від -90 до 90" });
    }

    if (Number(longitude) < -180 || Number(longitude) > 180) {
      return res
        .status(400)
        .json({ message: "Довгота повинна бути в межах від -180 до 180" });
    }

    const plot = await prisma.plot.create({
      data: {
        name: name.trim(),
        area: Number(area),
        region: region.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        soilType: soilType ? String(soilType).trim() : null,
        userId,
      },
    });

    return res.status(201).json(plot);
  } catch (error) {
    console.error("Create plot error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPlots = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

   const plots = await prisma.plot.findMany({
  where: {
    userId,
  },
  include: {
    crops: {
      select: {
        id: true,
        name: true,
      },
    },
    weatherRecords: {
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

    return res.json(plots);
  } catch (error) {
    console.error("Get plots error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPlotById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const plotId = Number(req.params.id);

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
      include: {
        crops: true,
        weatherRecords: {
          orderBy: { recordedAt: "desc" },
        },
        recommendations: {
          orderBy: { createdAt: "desc" },
          include: {
            crop: true,
          },
        },
      },
    });

    if (!plot) {
      return res.status(404).json({ message: "Plot not found" });
    }

    return res.json(plot);
  } catch (error) {
    console.error("Get plot by id error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};