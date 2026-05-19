import { getFromCache, saveToCache } from "../services/ai-cache.service";
import { generateAIText } from "../services/ai-provider.service";

type RecommendationAIInput = {
  cropName: string;
  recommendationType: string;
  moisture: number;
  rainfall: number;
  temperature: number;
  soilType?: string | null;
};

type RecommendationAIResult = {
  title: string;
  explanation: string;
  advice: string;
  priority: string;
};

const allowedPriorities = ["low", "medium", "high"];

const roundToStep = (value: number, step: number): number =>
  Math.round(value / step) * step;

const buildCacheBucket = (input: RecommendationAIInput) => ({
  cropName: input.cropName,
  recommendationType: input.recommendationType,
  soilType: input.soilType || null,
  moistureBucket: roundToStep(input.moisture, 5),
  rainfallBucket: roundToStep(input.rainfall, 1),
  temperatureBucket: roundToStep(input.temperature, 2),
});

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

const validateRecommendationAIResult = (
  data: RecommendationAIResult
): RecommendationAIResult => {
  const priority = String(data.priority || "medium").toLowerCase();

  return {
    title:
      data.title?.trim() ||
      "Рекомендація для догляду за культурою",
    explanation:
      data.explanation?.trim() ||
      "Рекомендацію сформовано на основі поточного рівня вологості ґрунту та погодних умов.",
    advice:
      data.advice?.trim() ||
      "Перевірте стан ґрунту та виконайте агротехнічні дії відповідно до умов на ділянці.",
    priority: allowedPriorities.includes(priority) ? priority : "medium",
  };
};

const parseRecommendationResult = (text: string): RecommendationAIResult => {
  const json = extractJson(text);
  const parsed = JSON.parse(json);

  return validateRecommendationAIResult({
    title: String(parsed.title || ""),
    explanation: String(parsed.explanation || ""),
    advice: String(parsed.advice || ""),
    priority: String(parsed.priority || "medium"),
  });
};

const getAlgorithmicFallback = ({
  cropName,
  recommendationType,
  moisture,
  rainfall,
  temperature,
  soilType,
}: RecommendationAIInput): RecommendationAIResult => {
  if (recommendationType === "irrigation") {
    return {
      title: `Потрібен полив для культури ${cropName}`,
      explanation: `Рівень вологості ґрунту становить ${moisture}%, що може бути недостатнім для стабільного розвитку культури. Температура ${temperature}°C та опади ${rainfall} мм також враховані під час оцінки.`,
      advice: "Рекомендується провести помірний полив і повторно перевірити стан ґрунту після зволоження.",
      priority: moisture < 30 ? "high" : "medium",
    };
  }

  if (recommendationType === "delay_irrigation") {
    return {
      title: `Полив культури ${cropName} варто відкласти`,
      explanation: `Поточні умови не вимагають негайного поливу. Зафіксовано вологість ${moisture}% та опади ${rainfall} мм.`,
      advice: "Не виконуйте додатковий полив зараз. Повторно перевірте вологість пізніше.",
      priority: "medium",
    };
  }

  return {
    title: `Додаткових дій для культури ${cropName} не потрібно`,
    explanation: `Поточні показники вологості ґрунту та погоди не вказують на потребу в термінових діях.${
      soilType ? ` Тип ґрунту: ${soilType}.` : ""
    }`,
    advice: "Продовжуйте плановий моніторинг стану культури та погодних умов.",
    priority: "low",
  };
};

export const buildRecommendationAIText = async ({
  cropName,
  recommendationType,
  moisture,
  rainfall,
  temperature,
  soilType,
}: RecommendationAIInput): Promise<RecommendationAIResult> => {
  const cacheInput = buildCacheBucket({
    cropName,
    recommendationType,
    moisture,
    rainfall,
    temperature,
    soilType,
  });

  const cached = await getFromCache({
    operation: "recommendation_explanation",
    inputParams: cacheInput,
  });

  if (cached) {
    console.log(
      `[AI Cache HIT] recommendation: ${cropName}/${recommendationType} ` +
        `(m=${cacheInput.moistureBucket}%, r=${cacheInput.rainfallBucket}мм, ` +
        `t=${cacheInput.temperatureBucket}°C)`
    );

    try {
      return JSON.parse(cached) as RecommendationAIResult;
    } catch (error) {
      console.error("[AI Cache] Failed to parse cached recommendation:", error);
    }
  }

  console.log(
    `[AI Cache MISS] recommendation: ${cropName}/${recommendationType} ` +
      `(m=${cacheInput.moistureBucket}%, r=${cacheInput.rainfallBucket}мм, ` +
      `t=${cacheInput.temperatureBucket}°C)`
  );

  const systemPrompt = `
Ти аграрний помічник для невеликого господарства.
Пояснюй рекомендації українською мовою, просто, коротко і практично.
Не використовуй markdown.
Поверни тільки JSON-об'єкт без додаткового тексту.
`.trim();

  const userPrompt = `
Культура: ${cropName}
Тип рекомендації: ${recommendationType}
Вологість ґрунту: ${moisture}%
Опади: ${rainfall} мм
Температура: ${temperature} °C
Тип ґрунту: ${soilType || "не вказано"}

Потрібно повернути JSON строго такої структури:
{
  "title": "коротка назва рекомендації українською",
  "explanation": "коротке пояснення, чому система дала цю рекомендацію",
  "advice": "коротка практична порада користувачу",
  "priority": "low | medium | high"
}

Правила:
- title має бути коротким;
- explanation має пояснювати зв'язок між вологістю, погодою та рекомендацією;
- advice має бути практичним;
- priority має бути тільки одним із значень: low, medium, high.
`.trim();

  try {
    const aiResult = await generateAIText({
      operation: "recommendation_explanation",
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
      maxTokens: 500,
      jsonMode: true,
    });

    const result = parseRecommendationResult(aiResult.text);

    await saveToCache({
      operation: "recommendation_explanation",
      inputParams: cacheInput,
      prompt: `${systemPrompt}\n\n---\n\n${userPrompt}`,
      response: JSON.stringify(result),
      provider: aiResult.provider,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      ttlDays: 30,
    });

    return result;
  } catch (error) {
    console.error(
      "[AI recommendation_explanation] Provider failed, using fallback:",
      error
    );

    const fallback = getAlgorithmicFallback({
      cropName,
      recommendationType,
      moisture,
      rainfall,
      temperature,
      soilType,
    });

    await saveToCache({
      operation: "recommendation_explanation",
      inputParams: cacheInput,
      prompt: `${systemPrompt}\n\n---\n\n${userPrompt}`,
      response: JSON.stringify(fallback),
      provider: "algorithmic_fallback",
      model: "local-rules",
      ttlDays: 14,
    });

    return fallback;
  }
};