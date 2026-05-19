import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { suggestUnknownCropParamsWithLLM } from "../services/crop-llm.service";

const normalizeName = (value: string) => {
  return value.trim().toLowerCase();
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getCropCatalogController = async (_req: Request, res: Response) => {
  try {
    const references = await prisma.cropReference.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return res.json(references);
  } catch (error) {
    console.error("Get crop catalog error:", error);
    return res.status(500).json({
      message: "Не вдалося завантажити довідник культур.",
    });
  }
};

export const getCropReferences = async (_req: Request, res: Response) => {
  try {
    const references = await prisma.cropReference.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return res.json(references);
  } catch (error) {
    console.error("Get crop references error:", error);
    return res.status(500).json({
      message: "Не вдалося завантажити довідник культур.",
    });
  }
};

export const detectCropReferenceController = async (req: Request, res: Response) => {
  try {
    const { name, plantingDate, region, soilType } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "Назва культури є обов’язковою.",
      });
    }

    const normalized = normalizeName(name);

    const reference = await prisma.cropReference.findFirst({
      where: {
        name: {
          equals: normalized,
          mode: "insensitive",
        },
      },
    });

    if (reference) {
      const averageDaysToHarvest = Number(
        (reference as any).averageDaysToHarvest || 90
      );

      const expectedHarvestDate = plantingDate
        ? addDays(new Date(plantingDate), averageDaysToHarvest).toISOString()
        : null;

      return res.json({
        found: true,
        message: "Культуру знайдено у довіднику.",
        crop: {
          id: reference.id,
          canonicalName: reference.name,
          expectedHarvestDate,
          optimalMoistureMin: (reference as any).optimalMoistureMin ?? null,
          optimalMoistureMax: (reference as any).optimalMoistureMax ?? null,
          baseYield: (reference as any).baseYield ?? null,
        },
      });
    }

    const suggestion = await suggestUnknownCropParamsWithLLM({
      cropName: name,
      region,
      soilType,
    });

    const expectedHarvestDate = plantingDate
      ? addDays(
          new Date(plantingDate),
          suggestion.averageDaysToHarvest
        ).toISOString()
      : null;

    const createdReference = await prisma.cropReference.create({
      data: {
        name: String(name).trim(),
        averageDaysToHarvest: suggestion.averageDaysToHarvest,
        optimalMoistureMin: suggestion.optimalMoistureMin,
        optimalMoistureMax: suggestion.optimalMoistureMax,
        baseYield: suggestion.baseYield,
      } as any,
    });

    return res.json({
      found: false,
      message:
        "Культура не знайдена у довіднику. Параметри запропоновано автоматично та додано до довідника.",
      reason: suggestion.reason,
      reference: createdReference,
      fallback: {
        expectedHarvestDate,
        optimalMoistureMin: suggestion.optimalMoistureMin,
        optimalMoistureMax: suggestion.optimalMoistureMax,
        baseYield: suggestion.baseYield,
      },
    });
  } catch (error) {
    console.error("Detect crop reference error:", error);
    return res.status(500).json({
      message: "Не вдалося визначити параметри культури.",
    });
  }
};

export const createCropReferenceWithAI = async (req: Request, res: Response) => {
  try {
    const { name, region, soilType } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "Назва культури є обов’язковою.",
      });
    }

    const existing = await prisma.cropReference.findFirst({
      where: {
        name: {
          equals: String(name).trim(),
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        message: "Така культура вже є у довіднику.",
        crop: existing,
      });
    }

    const suggestion = await suggestUnknownCropParamsWithLLM({
      cropName: name,
      region,
      soilType,
    });

    const reference = await prisma.cropReference.create({
      data: {
        name: String(name).trim(),
        averageDaysToHarvest: suggestion.averageDaysToHarvest,
        optimalMoistureMin: suggestion.optimalMoistureMin,
        optimalMoistureMax: suggestion.optimalMoistureMax,
        baseYield: suggestion.baseYield,
      } as any,
    });

    return res.status(201).json(reference);
  } catch (error) {
    console.error("Create crop reference with AI error:", error);
    return res.status(500).json({
      message: "Не вдалося створити культуру через AI.",
    });
  }
};

export const createCropReference = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "Назва культури є обов’язковою.",
      });
    }

    const reference = await prisma.cropReference.create({
      data: {
        ...req.body,
        name: String(name).trim(),
      } as any,
    });

    return res.status(201).json(reference);
  } catch (error) {
    console.error("Create crop reference error:", error);
    return res.status(500).json({
      message: "Не вдалося створити культуру в довіднику.",
    });
  }
};

export const deleteCropReference = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Некоректний id культури.",
      });
    }

    await prisma.cropReference.delete({
      where: {
        id,
      },
    });

    return res.json({
      message: "Культуру видалено з довідника.",
    });
  } catch (error) {
    console.error("Delete crop reference error:", error);
    return res.status(500).json({
      message: "Не вдалося видалити культуру з довідника.",
    });
  }
};

export const findCropReferenceByName = async (req: Request, res: Response) => {
  try {
    const name = String(req.query.name || "").trim();

    if (!name) {
      return res.status(400).json({
        message: "Назва культури є обов’язковою.",
      });
    }

    const reference = await prisma.cropReference.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (!reference) {
      return res.status(404).json({
        message: "Культуру не знайдено.",
      });
    }

    return res.json(reference);
  } catch (error) {
    console.error("Find crop reference by name error:", error);
    return res.status(500).json({
      message: "Не вдалося знайти культуру.",
    });
  }
};