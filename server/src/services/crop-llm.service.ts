import { getFromCache, saveToCache } from "../services/ai-cache.service";
import { generateAIText } from "../services/ai-provider.service";

type CropLLMInput = {
  cropName: string;
  region?: string;
  soilType?: string | null;
};

type CropLLMResult = {
  averageDaysToHarvest: number;
  optimalMoistureMin: number;
  optimalMoistureMax: number;
  baseYield: number;
  reason: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const validateCropSuggestion = (data: CropLLMResult): CropLLMResult => {
  const validated = {
    averageDaysToHarvest: clamp(Math.round(data.averageDaysToHarvest), 20, 400),
    optimalMoistureMin: clamp(Math.round(data.optimalMoistureMin), 20, 95),
    optimalMoistureMax: clamp(Math.round(data.optimalMoistureMax), 25, 100),
    baseYield: Number(clamp(Number(data.baseYield), 1, 200).toFixed(2)),
    reason: data.reason?.trim() || "Параметри запропоновано моделлю.",
  };

  if (validated.optimalMoistureMin >= validated.optimalMoistureMax) {
    validated.optimalMoistureMin = Math.max(
      20,
      validated.optimalMoistureMax - 10
    );
  }

  return validated;
};

const extractJson = (text: string) => {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("AI response does not contain JSON object");
  }

  return match[0];
};

const parseCropSuggestion = (text: string): CropLLMResult => {
  const json = extractJson(text);
  const parsed = JSON.parse(json);

  return {
    averageDaysToHarvest: Number(parsed.averageDaysToHarvest),
    optimalMoistureMin: Number(parsed.optimalMoistureMin),
    optimalMoistureMax: Number(parsed.optimalMoistureMax),
    baseYield: Number(parsed.baseYield),
    reason: String(parsed.reason || ""),
  };
};

const getAlgorithmicFallback = ({
  cropName,
  region,
  soilType,
}: CropLLMInput): CropLLMResult => {
  const name = cropName.toLowerCase();
  const soil = (soilType || "").toLowerCase();

  let averageDaysToHarvest = 90;
  let optimalMoistureMin = 55;
  let optimalMoistureMax = 75;
  let baseYield = 3.5;

  if (name.includes("картоп")) {
    averageDaysToHarvest = 100;
    optimalMoistureMin = 60;
    optimalMoistureMax = 80;
    baseYield = 3.0;
  } else if (name.includes("томат") || name.includes("помідор")) {
    averageDaysToHarvest = 95;
    optimalMoistureMin = 60;
    optimalMoistureMax = 80;
    baseYield = 4.5;
  } else if (name.includes("огір")) {
    averageDaysToHarvest = 55;
    optimalMoistureMin = 65;
    optimalMoistureMax = 85;
    baseYield = 5.0;
  } else if (name.includes("капуст")) {
    averageDaysToHarvest = 100;
    optimalMoistureMin = 65;
    optimalMoistureMax = 85;
    baseYield = 4.0;
  } else if (name.includes("виноград")) {
    averageDaysToHarvest = 150;
    optimalMoistureMin = 45;
    optimalMoistureMax = 65;
    baseYield = 2.0;
  } else if (name.includes("кабач")) {
    averageDaysToHarvest = 55;
    optimalMoistureMin = 55;
    optimalMoistureMax = 75;
    baseYield = 4.0;
  }

  if (soil.includes("піщ")) {
    optimalMoistureMin += 5;
    optimalMoistureMax += 5;
  }

  if (soil.includes("глин")) {
    optimalMoistureMin -= 3;
    optimalMoistureMax -= 3;
  }

  return validateCropSuggestion({
    averageDaysToHarvest,
    optimalMoistureMin,
    optimalMoistureMax,
    baseYield,
    reason: `Використано алгоритмічний fallback для культури "${cropName}"${
      region ? ` з урахуванням регіону: ${region}` : ""
    }.`,
  });
};

export const suggestUnknownCropParamsWithLLM = async ({
  cropName,
  region,
  soilType,
}: CropLLMInput): Promise<CropLLMResult> => {
  const cacheInput = {
    cropName,
    region: region || null,
    soilType: soilType || null,
  };

  const cached = await getFromCache({
    operation: "crop_params",
    inputParams: cacheInput,
  });

  if (cached) {
    console.log(
      `[AI Cache HIT] crop_params: "${cropName}" (region: ${region || "—"})`
    );

    try {
      return JSON.parse(cached) as CropLLMResult;
    } catch (error) {
      console.error("[AI Cache] Failed to parse cached value:", error);
    }
  }

  console.log(
    `[AI Cache MISS] crop_params: "${cropName}" (region: ${region || "—"})`
  );

  const systemPrompt = `
Ти агротехнічний помічник для невеликого господарства.
Поверни лише JSON-об'єкт без markdown, без пояснень поза JSON і без зайвого тексту.
Значення мають бути практичними та помірно консервативними.
Якщо культура незвична, запропонуй безпечні орієнтовні параметри.
`.trim();

  const userPrompt = `
Назва культури: ${cropName}
Регіон: ${region || "не вказано"}
Тип ґрунту: ${soilType || "не вказано"}

Потрібно повернути JSON строго такої структури:
{
  "averageDaysToHarvest": number,
  "optimalMoistureMin": number,
  "optimalMoistureMax": number,
  "baseYield": number,
  "reason": "коротке пояснення українською"
}

Опис полів:
- averageDaysToHarvest — середня кількість днів до збору;
- optimalMoistureMin — мінімальна оптимальна вологість ґрунту у %;
- optimalMoistureMax — максимальна оптимальна вологість ґрунту у %;
- baseYield — орієнтовна базова урожайність у кг/м²;
- reason — коротке пояснення українською.

Враховуй, що система призначена для невеликих господарств.
`.trim();

  try {
    const aiResult = await generateAIText({
      operation: "crop_params",
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
      maxTokens: 600,
      jsonMode: true,
    });

    const parsed = parseCropSuggestion(aiResult.text);
    const validated = validateCropSuggestion(parsed);

    await saveToCache({
      operation: "crop_params",
      inputParams: cacheInput,
      prompt: `${systemPrompt}\n\n---\n\n${userPrompt}`,
      response: JSON.stringify(validated),
      provider: aiResult.provider,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      ttlDays: 90,
    });

    return validated;
  } catch (error) {
    console.error("[AI crop_params] Provider failed, using fallback:", error);

    const fallback = getAlgorithmicFallback({
      cropName,
      region,
      soilType,
    });

    await saveToCache({
      operation: "crop_params",
      inputParams: cacheInput,
      prompt: `${systemPrompt}\n\n---\n\n${userPrompt}`,
      response: JSON.stringify(fallback),
      provider: "algorithmic_fallback",
      model: "local-rules",
      ttlDays: 30,
    });

    return fallback;
  }
};