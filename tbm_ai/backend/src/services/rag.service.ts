import { env } from "../../config/env";
import { listRagSourceDocuments } from "../repositories/rag-source.repository";
import { createEmbeddings } from "./ai.service";

type QdrantSearchResult = {
  result?: Array<{
    id: number | string;
    score: number;
    payload?: {
      title?: string;
      text?: string;
      sourceType?: string;
      sourceKey?: string;
    };
  }>;
};

const isRagEnabled = (): boolean => Boolean(env.vectorDb.qdrantUrl);

const qdrantHeaders = (): HeadersInit => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.vectorDb.qdrantApiKey) {
    headers["api-key"] = env.vectorDb.qdrantApiKey;
  }
  return headers;
};

const qdrantRequest = async (path: string, method: string, body?: unknown): Promise<Response> => {
  const base = env.vectorDb.qdrantUrl.replace(/\/+$/, "");
  return fetch(`${base}${path}`, {
    method,
    headers: qdrantHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
};

const recreateCollection = async (vectorSize: number): Promise<void> => {
  await qdrantRequest(`/collections/${env.vectorDb.collection}`, "DELETE");
  const response = await qdrantRequest(`/collections/${env.vectorDb.collection}`, "PUT", {
    vectors: {
      size: vectorSize,
      distance: "Cosine"
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qdrant collection setup failed (${response.status}): ${errorText}`);
  }
};

export const syncRagKnowledgeBase = async (): Promise<{ count: number }> => {
  if (!isRagEnabled()) {
    throw new Error("RAG is not configured. Set QDRANT_URL.");
  }

  const docs = await listRagSourceDocuments();
  if (docs.length === 0) {
    return { count: 0 };
  }

  const embeddings = await createEmbeddings(docs.map((doc) => doc.text));
  const vectorSize = embeddings[0]?.length ?? 0;
  if (vectorSize <= 0) {
    throw new Error("Embedding vector size is invalid");
  }
  await recreateCollection(vectorSize);

  const points = docs.map((doc, idx) => ({
    id: idx + 1,
    vector: embeddings[idx],
    payload: {
      title: doc.title,
      text: doc.text,
      sourceType: doc.sourceType,
      sourceKey: doc.sourceKey
    }
  }));

  const upsertResponse = await qdrantRequest(
    `/collections/${env.vectorDb.collection}/points?wait=true`,
    "PUT",
    { points }
  );
  if (!upsertResponse.ok) {
    const errorText = await upsertResponse.text();
    throw new Error(`Qdrant upsert failed (${upsertResponse.status}): ${errorText}`);
  }

  return { count: points.length };
};

const searchRag = async (
  query: string,
  limit: number
): Promise<Array<{ title: string; text: string; sourceType: string; sourceKey: string }>> => {
  if (!isRagEnabled()) {
    return [];
  }

  const [embedding] = await createEmbeddings([query]);
  if (!embedding || embedding.length === 0) {
    return [];
  }

  const response = await qdrantRequest(
    `/collections/${env.vectorDb.collection}/points/search`,
    "POST",
    {
      vector: embedding,
      limit,
      with_payload: true
    }
  );
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as QdrantSearchResult;
  return (data.result ?? [])
    .map((row) => ({
      title: row.payload?.title ?? "",
      text: row.payload?.text ?? "",
      sourceType: row.payload?.sourceType ?? "",
      sourceKey: row.payload?.sourceKey ?? ""
    }))
    .filter((row) => row.text.length > 0);
};

export const buildRagContext = async (query: string): Promise<string> => {
  const items = await searchRag(query, 4);
  if (items.length === 0) {
    return "";
  }

  return items
    .map(
      (item, idx) =>
        `[참고 ${idx + 1}] ${item.title}\n출처: ${item.sourceType}:${item.sourceKey}\n내용: ${item.text}`
    )
    .join("\n\n");
};

export const getRagSourceCount = async (): Promise<number> => {
  const docs = await listRagSourceDocuments();
  return docs.length;
};
