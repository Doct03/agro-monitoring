import { Request, Response } from "express";
import { fillMissingFields } from "../services/ai.service";
import { lookupSoilTypeByCoordinates } from "../services/soil-lookup.service";
import { buildSoilSuggestionExplanation } from "../services/soil-advisor.service";

export const fillMissingData = async (req: Request, res: Response) => {
  try {
    const { region, latitude, longitude, cropName, missingFields } = req.body;

    if (!missingFields || !Array.isArray(missingFields)) {
      return res.status(400).json({ message: "missingFields must be an array" });
    }

    const suggestions = [];

    for (const field of missingFields) {
      if (field === "soilType") {
        if (latitude === undefined || longitude === undefined) {
          suggestions.push({
            field: "soilType",
            suggestedValue: "",
            confidence: 0,
            reason: "Для автоматичного визначення типу ґрунту необхідно вказати координати ділянки.",
          });
          continue;
        }

        const soilResult = await lookupSoilTypeByCoordinates(
          Number(latitude),
          Number(longitude)
        );

        suggestions.push(
          buildSoilSuggestionExplanation({
            soilType: soilResult.soilType,
            confidence: soilResult.confidence,
            latitude: Number(latitude),
            longitude: Number(longitude),
            source: soilResult.source,
          })
        );

        continue;
      }

      const localSuggestions = fillMissingFields({
        region,
        latitude,
        longitude,
        cropName,
        missingFields: [field],
      });

      suggestions.push(...localSuggestions);
    }

    return res.json({ suggestions });
  } catch (error) {
    console.error("AI fill data error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};