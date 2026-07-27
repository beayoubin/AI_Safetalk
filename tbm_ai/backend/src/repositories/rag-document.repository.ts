import { dbPool } from "../../config/database";

export type RagDocumentInput = {
  externalKey: string;
  title: string;
  body: string;
  source: string;
  sourceUrl: string | null;
  workType: string | null;
  riskLevel: string | null;
  process: string | null;
  weatherType: string | null;
  effectiveDate: string | null;
  activeYn: "Y" | "N";
};

export type RagDocumentRow = {
  id: number;
  external_key: string;
  title: string;
  body: string;
  source: string;
  source_url: string | null;
  work_type: string | null;
  risk_level: string | null;
  process: string | null;
  weather_type: string | null;
  effective_date: string | null;
};

let schemaReady = false;

export const ensureRagDocumentTable = async (): Promise<void> => {
  if (schemaReady) {
    return;
  }

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS rag_document (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      external_key VARCHAR(120) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      source VARCHAR(120) NOT NULL,
      source_url VARCHAR(500) NULL,
      work_type VARCHAR(100) NULL,
      risk_level VARCHAR(30) NULL,
      process VARCHAR(100) NULL,
      weather_type VARCHAR(30) NULL,
      effective_date DATE NULL,
      active_yn CHAR(1) NOT NULL DEFAULT 'Y',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  schemaReady = true;
};

export const upsertRagDocuments = async (rows: RagDocumentInput[]): Promise<number> => {
  await ensureRagDocumentTable();
  if (rows.length === 0) {
    return 0;
  }

  let changed = 0;
  for (const row of rows) {
    const [result] = await dbPool.query(
      `
        INSERT INTO rag_document (
          external_key,
          title,
          body,
          source,
          source_url,
          work_type,
          risk_level,
          process,
          weather_type,
          effective_date,
          active_yn
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          body = VALUES(body),
          source = VALUES(source),
          source_url = VALUES(source_url),
          work_type = VALUES(work_type),
          risk_level = VALUES(risk_level),
          process = VALUES(process),
          weather_type = VALUES(weather_type),
          effective_date = VALUES(effective_date),
          active_yn = VALUES(active_yn)
      `,
      [
        row.externalKey,
        row.title,
        row.body,
        row.source,
        row.sourceUrl,
        row.workType,
        row.riskLevel,
        row.process,
        row.weatherType,
        row.effectiveDate,
        row.activeYn
      ]
    );
    changed += Number((result as { affectedRows?: number }).affectedRows ?? 0);
  }
  return changed;
};

export const listActiveRagDocuments = async (): Promise<RagDocumentRow[]> => {
  await ensureRagDocumentTable();
  const [rows] = await dbPool.query(
    `
      SELECT
        id,
        external_key,
        title,
        body,
        source,
        source_url,
        work_type,
        risk_level,
        process,
        weather_type,
        DATE_FORMAT(effective_date, '%Y-%m-%d') AS effective_date
      FROM rag_document
      WHERE active_yn = 'Y'
      ORDER BY id ASC
    `
  );
  return rows as RagDocumentRow[];
};

export const findRealIncidentCasesByWorkType = async (
  workType: string,
  limit: number
): Promise<RagDocumentRow[]> => {
  await ensureRagDocumentTable();
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : 5;
  const [rows] = await dbPool.query(
    `
      SELECT
        id,
        external_key,
        title,
        body,
        source,
        source_url,
        work_type,
        risk_level,
        process,
        weather_type,
        DATE_FORMAT(effective_date, '%Y-%m-%d') AS effective_date
      FROM rag_document
      WHERE active_yn = 'Y'
        AND source <> 'seed-generator'
        AND (work_type = ? OR work_type IS NULL)
      ORDER BY (work_type = ?) DESC, id ASC
      LIMIT ${safeLimit}
    `,
    [workType, workType]
  );
  return rows as RagDocumentRow[];
};
