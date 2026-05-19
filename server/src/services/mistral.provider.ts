type GenerateWithMistralParams = {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
};

type MistralMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const getContentAsText = (content: unknown) => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (typeof item?.text === "string") return item.text;
        return "";
      })
      .join("")
      .trim();
  }

  return "";
};

export const generateWithMistral = async ({
  system,
  prompt,
  temperature = 0.2,
  maxTokens = 700,
  jsonMode = false,
}: GenerateWithMistralParams) => {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not set");
  }

  const model = process.env.MISTRAL_MODEL || "mistral-small-latest";

  const messages: MistralMessage[] = [
    ...(system
      ? [
          {
            role: "system" as const,
            content: system,
          },
        ]
      : []),
    {
      role: "user",
      content: prompt,
    },
  ];

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: jsonMode
        ? {
            type: "json_object",
          }
        : undefined,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[Mistral API error]", data);

    throw new Error(
      data?.message ||
        data?.error?.message ||
        `Mistral API request failed with status ${response.status}`
    );
  }

  const content = getContentAsText(data?.choices?.[0]?.message?.content);

  if (!content) {
    console.error("[Mistral empty response]", data);
    throw new Error("Mistral returned empty response");
  }

  return {
    text: content,
    provider: "mistral",
    model,
    tokensUsed: data?.usage?.total_tokens ?? null,
  };
};