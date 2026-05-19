import { Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  findCropReference,
  getCropCatalog,
} from "../services/crop-reference.service";
import { suggestUnknownCropParamsWithLLM } from "../services/crop-llm.service";

export const getCropCatalogController = (_req: Request, res: Response) => {
  try {
    return res.json({ crops: getCropCatalog() });
  } catch (error) {
    console.error("Get crop catalog error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const buildExpectedHarvestDate = (
  plantingDate: string | undefined,
  days: number
) => {
  if (!plantingDate) return null;

  const planting = new Date(plantingDate);
  if (Number.isNaN(planting.getTime())) return null;

  const harvest = new Date(planting);
  harvest.setDate(harvest.getDate() + days);
  return harvest.toISOString();
};

export const detectCropReferenceController = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, plantingDate, region, soilType } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Crop name is required" });
    }

    const reference = findCropReference(name);

    if (reference) {
      return res.json({
        found: true,
        crop: {
          canonicalName: reference.name,
          averageDaysToHarvest: reference.averageDaysToHarvest,
          optimalMoistureMin: reference.optimalMoistureMin,
          optimalMoistureMax: reference.optimalMoistureMax,
          baseYield: reference.baseYield,
          expectedHarvestDate: buildExpectedHarvestDate(
            plantingDate,
            reference.averageDaysToHarvest
          ),
        },
        message: "Культуру знайдено у довіднику.",
      });
    }

  const llmSuggestion = await suggestUnknownCropParamsWithLLM({
  cropName: name,
  region,
  soilType,
});

let createdReference = null;

try {
  createdReference = await prisma.cropReference.create({
    data: {
      name: name.trim(),
      description: llmSuggestion.reason || null,
      category: null,
      optimalMoistureMin: llmSuggestion.optimalMoistureMin,
      optimalMoistureMax: llmSuggestion.optimalMoistureMax,
      baseYield: llmSuggestion.baseYield,
      yieldUnit: "т/га",
      growingDays: llmSuggestion.averageDaysToHarvest,
      imageUrl: null,
    },
  });
} catch (createError: any) {
  if (createError.code !== "P2002") {
    throw createError;
  }

  createdReference = await prisma.cropReference.findFirst({
    where: {
      name: {
        equals: name.trim(),
        mode: "insensitive",
      },
    },
  });
}

return res.json({
  found: false,
  createdReference: Boolean(createdReference),
  fallback: {
    averageDaysToHarvest: llmSuggestion.averageDaysToHarvest,
    optimalMoistureMin: llmSuggestion.optimalMoistureMin,
    optimalMoistureMax: llmSuggestion.optimalMoistureMax,
    baseYield: llmSuggestion.baseYield,
    yieldUnit: "т/га",
    imageUrl: null,
    expectedHarvestDate: buildExpectedHarvestDate(
      plantingDate,
      llmSuggestion.averageDaysToHarvest
    ),
  },
  message:
    "Культура не знайдена у довіднику. Параметри запропоновано ШІ та додано до довідника.",
  reason: llmSuggestion.reason,
});
  } catch (error) {
    console.error("Detect crop reference error:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Internal server error",
    });
  }
};
export const createCropReferenceWithAI = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, region, soilType } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Crop name is required",
      });
    }

    const cropName = name.trim();

    const existingReference = await prisma.cropReference.findFirst({
      where: {
        name: {
          equals: cropName,
          mode: "insensitive",
        },
      },
    });

    if (existingReference) {
      return res.json({
        created: false,
        message: "Культура вже існує у довіднику.",
        crop: existingReference,
      });
    }

    const aiSuggestion = await suggestUnknownCropParamsWithLLM({
      cropName,
      region,
      soilType,
    });

    const createdReference = await prisma.cropReference.create({
      data: {
        name: cropName,
        description: aiSuggestion.reason || null,
        category: null,
        optimalMoistureMin: aiSuggestion.optimalMoistureMin,
        optimalMoistureMax: aiSuggestion.optimalMoistureMax,
        baseYield: aiSuggestion.baseYield,
        yieldUnit: "т/га",
        growingDays: aiSuggestion.averageDaysToHarvest,
        imageUrl: null,
      },
    });

    return res.status(201).json({
      created: true,
      message: "Культуру додано до довідника за допомогою ШІ.",
      crop: createdReference,
      reason: aiSuggestion.reason,
    });
  } catch (error: any) {
    console.error("Create crop reference with AI error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Культура з такою назвою вже існує у довіднику.",
      });
    }

    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getCropReferences = async (_req: Request, res: Response) => {
  try {
    const references = await prisma.cropReference.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.json(references);
  } catch (error) {
    console.error("Get crop references error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createCropReference = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      optimalMoistureMin,
      optimalMoistureMax,
      baseYield,
      yieldUnit,
      growingDays,
      imageUrl,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const reference = await prisma.cropReference.create({
      data: {
        name: String(name).trim(),
        description: description || null,
        category: category || null,
        optimalMoistureMin:
          optimalMoistureMin !== undefined && optimalMoistureMin !== ""
            ? Number(optimalMoistureMin)
            : null,
        optimalMoistureMax:
          optimalMoistureMax !== undefined && optimalMoistureMax !== ""
            ? Number(optimalMoistureMax)
            : null,
        baseYield:
          baseYield !== undefined && baseYield !== ""
            ? Number(baseYield)
            : null,
        yieldUnit: yieldUnit || null,
        growingDays:
          growingDays !== undefined && growingDays !== ""
            ? Number(growingDays)
            : null,
        imageUrl: imageUrl || null,
      },
    });

    return res.status(201).json(reference);
  } catch (error: any) {
    console.error("Create crop reference error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Культура з такою назвою вже існує у довіднику.",
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCropReference = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid crop reference id",
      });
    }

    await prisma.cropReference.delete({
      where: { id },
    });

    return res.json({
      message: "Crop reference deleted",
    });
  } catch (error) {
    console.error("Delete crop reference error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const findCropReferenceByName = async (req: Request, res: Response) => {
  try {
    const name = String(req.query.name || "").trim();

    if (!name) {
      return res.status(400).json({
        message: "Name query is required",
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
      return res.json({
        found: false,
        message: "Культуру не знайдено у довіднику.",
      });
    }

    return res.json({
      found: true,
      crop: reference,
    });
  } catch (error) {
    console.error("Find crop reference by name error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
