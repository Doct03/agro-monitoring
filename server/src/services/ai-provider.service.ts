import { generateWithGroq } from "./groq.provider";
import { generateWithMistral } from "./mistral.provider";

type GenerateAITextParams = {
  operation: string;
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
};

const hasMistralKey = () => Boolean(process.env.MISTRAL_API_KEY);
const hasGroqKey = () => Boolean(process.env.GROQ_API_KEY);

export const generateAIText = async ({
  operation,
  system,
  prompt,
  temperature,
  maxTokens,
  jsonMode,
}: GenerateAITextParams) => {
  const provider = process.env.AI_PROVIDER || "mistral";

  if (provider === "groq") {
    if (!hasGroqKey()) {
      console.warn(
        `[AI Provider] ${operation}: GROQ_API_KEY is not set. Trying Mistral.`
      );

      return generateWithMistral({
        system,
        prompt,
        temperature,
        maxTokens,
        jsonMode,
      });
    }

    try {
      const result = await generateWithGroq({
        system,
        prompt,
        temperature,
        maxTokens,
        jsonMode,
      });

      console.log(`[AI Provider] ${operation}: used Groq`);
      return result;
    } catch (groqError) {
      console.error(`[AI Provider] ${operation}: Groq failed`, groqError);

      if (!hasMistralKey()) {
        throw groqError;
      }

      const result = await generateWithMistral({
        system,
        prompt,
        temperature,
        maxTokens,
        jsonMode,
      });

      console.log(`[AI Provider] ${operation}: fallback to Mistral`);
      return result;
    }
  }

  if (provider === "mistral") {
    if (!hasMistralKey()) {
      console.warn(
        `[AI Provider] ${operation}: MISTRAL_API_KEY is not set. Trying Groq.`
      );

      if (!hasGroqKey()) {
        throw new Error("No AI provider API key is configured");
      }

      const result = await generateWithGroq({
        system,
        prompt,
        temperature,
        maxTokens,
        jsonMode,
      });

      console.log(`[AI Provider] ${operation}: fallback to Groq`);
      return result;
    }

    try {
      const result = await generateWithMistral({
        system,
        prompt,
        temperature,
        maxTokens,
        jsonMode,
      });

      console.log(`[AI Provider] ${operation}: used Mistral`);
      return result;
    } catch (mistralError) {
      console.error(
        `[AI Provider] ${operation}: Mistral failed`,
        mistralError
      );

      if (!hasGroqKey()) {
        throw mistralError;
      }

      const result = await generateWithGroq({
        system,
        prompt,
        temperature,
        maxTokens,
        jsonMode,
      });

      console.log(`[AI Provider] ${operation}: fallback to Groq`);
      return result;
    }
  }

  console.warn(
    `[AI Provider] ${operation}: unknown provider "${provider}". Trying Mistral then Groq.`
  );

  if (hasMistralKey()) {
    try {
      const result = await generateWithMistral({
        system,
        prompt,
        temperature,
        maxTokens,
        jsonMode,
      });

      console.log(`[AI Provider] ${operation}: used Mistral`);
      return result;
    } catch (error) {
      console.error(`[AI Provider] ${operation}: Mistral failed`, error);
    }
  }

  if (hasGroqKey()) {
    const result = await generateWithGroq({
      system,
      prompt,
      temperature,
      maxTokens,
      jsonMode,
    });

    console.log(`[AI Provider] ${operation}: fallback to Groq`);
    return result;
  }

  throw new Error("No AI provider API key is configured");
};