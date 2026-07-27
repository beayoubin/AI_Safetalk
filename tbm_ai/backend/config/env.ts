const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: toNumber(process.env.PORT, 4000),
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? "tbm-dev-secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
    passwordMinLength: toNumber(process.env.PASSWORD_MIN_LENGTH, 8),
    passwordHistoryLimit: toNumber(process.env.PASSWORD_HISTORY_LIMIT, 5)
  },
  llm: {
    provider: process.env.LLM_PROVIDER ?? "openai"
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    model: process.env.OLLAMA_MODEL ?? "llama3.1:8b",
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text"
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small"
  },
  geocoding: {
    kakaoRestApiKey: process.env.KAKAO_REST_API_KEY ?? ""
  },
  vectorDb: {
    provider: process.env.VECTOR_DB_PROVIDER ?? "qdrant",
    qdrantUrl: process.env.QDRANT_URL ?? "",
    qdrantApiKey: process.env.QDRANT_API_KEY ?? "",
    collection: process.env.QDRANT_COLLECTION ?? "tbm_knowledge"
  },
  db: {
    client: process.env.DB_CLIENT ?? "mysql",
    host: process.env.DB_HOST ?? process.env.B_HOST ?? "localhost",
    port: toNumber(process.env.DB_PORT, 3306),
    name: process.env.DB_DATABASE ?? process.env.DB_NAME ?? "tbm_ai",
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
    url: process.env.DATABASE_URL
  }
};
