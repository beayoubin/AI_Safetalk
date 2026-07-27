import { env } from "../../config/env";

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type OpenAIEmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
};

type OllamaGenerateResponse = {
  response?: string;
};

type OllamaEmbeddingResponse = {
  embedding?: number[];
};

const isOpenAi = (): boolean => env.llm.provider.toLowerCase() === "openai";

export const assertAiConfigured = (): void => {
  if (isOpenAi()) {
    if (!env.openai.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    return;
  }

  if (!env.ollama.baseUrl) {
    throw new Error("OLLAMA_BASE_URL is not configured");
  }
};

export const generateText = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  assertAiConfigured();

  if (isOpenAi()) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openai.apiKey}`
      },
      body: JSON.stringify({
        model: env.openai.model,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OpenAIChatCompletionResponse;
    const message = data.choices?.[0]?.message?.content?.trim();
    if (!message) {
      throw new Error("OpenAI response was empty");
    }
    return message;
  }

  const base = env.ollama.baseUrl.replace(/\/+$/, "");
  const response = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.ollama.model,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama generate failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  const text = data.response?.trim();
  if (!text) {
    throw new Error("Ollama response was empty");
  }
  return text;
};

export const createEmbeddings = async (texts: string[]): Promise<number[][]> => {
  assertAiConfigured();
  if (texts.length === 0) {
    return [];
  }

  if (isOpenAi()) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openai.apiKey}`
      },
      body: JSON.stringify({
        model: env.openai.embeddingModel,
        input: texts
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding request failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OpenAIEmbeddingResponse;
    const embeddings = (data.data ?? []).map((item) => item.embedding ?? []);
    if (embeddings.length !== texts.length) {
      throw new Error("Embedding response length mismatch");
    }
    return embeddings;
  }

  const base = env.ollama.baseUrl.replace(/\/+$/, "");
  const embeddings: number[][] = [];
  for (const text of texts) {
    const response = await fetch(`${base}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.ollama.embeddingModel,
        prompt: text
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama embedding failed (${response.status}): ${errorText}`);
    }
    const data = (await response.json()) as OllamaEmbeddingResponse;
    if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
      throw new Error("Ollama embedding was empty");
    }
    embeddings.push(data.embedding);
  }

  return embeddings;
};
