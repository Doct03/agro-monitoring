type GenerateWithGroqParams = {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
};

type GroqMessage = {
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

export const generateWithGroq = async ({
  system,
  prompt,
  temperature = 0.2,
  maxTokens = 700,
  jsonMode = false,
}: GenerateWithGroqParams) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  const messages: GroqMessage[] = [
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

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: temperature === 0 ? 0.00000001 : temperature,
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
    console.error("[Groq API error]", data);

    throw new Error(
      data?.message ||
        data?.error?.message ||
        `Groq API request failed with status ${response.status}`
    );
  }

  const content = getContentAsText(data?.choices?.[0]?.message?.content);

  if (!content) {
    console.error("[Groq empty response]", data);
    throw new Error("Groq returned empty response");
  }

  return {
    text: content,
    provider: "groq",
    model,
    tokensUsed: data?.usage?.total_tokens ?? null,
  };
};