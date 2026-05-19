import {
  suggestOptimalMoisture,
  suggestBaseYield,
} from "./ai-fill.service";

type FillMissingInput = {
  region?: string;
  latitude?: number;
  longitude?: number;
  cropName?: string;
  missingFields: string[];
};

export const fillMissingFields = (input: FillMissingInput) => {
  const results = [];

  for (const field of input.missingFields) {
    if (field === "optimalMoisture") {
      results.push(suggestOptimalMoisture(input));
    }

    if (field === "baseYield") {
      results.push(suggestBaseYield(input));
    }
  }

  return results;
};