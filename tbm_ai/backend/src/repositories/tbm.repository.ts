import { dbPool } from "../../config/database";

export type TbmHistoryInput = {
  title: string;
  workType: string;
  permitType: string;
  risk: string;
  shift: string;
  workDate: string;
  location: string;
  optionsJson: string;
  userPrompt: string;
  draftText: string;
};

export type TbmHistoryRow = {
  id: number;
  title: string;
  created_at: string;
};

export type TbmSignatureData = {
  checklist?: Record<string, boolean>;
  workerSignature?: string;
  supervisorSignature?: string;
  signedAt?: string;
};

export type TbmHistoryDetailRow = {
  id: number;
  title: string;
  work_type: string;
  permit_type: string;
  risk_level: string;
  work_shift: string;
  work_date: string;
  location: string;
  options_json: string | null;
  user_prompt: string;
  draft_text: string;
  signature_json: string | TbmSignatureData | null;
  created_at: string;
};

export type TbmDashboardSummaryRow = {
  total_count: number;
  high_risk_count: number;
  generated_count: number;
};

export type TbmDashboardRiskRow = {
  risk_level: string;
  count: number;
};

export type TbmDashboardTrendRow = {
  work_date: string;
  count: number;
};

export type TbmDashboardRecentRow = {
  id: number;
  title: string;
  work_type: string;
  permit_type: string;
  risk_level: string;
  location: string;
  work_date: string;
  created_at: string;
};

export type WorkPermitQuery = {
  startDate?: string;
  endDate?: string;
  workType?: string;
  status?: string;
  risk?: string;
  search?: string;
  page: number;
  pageSize: number;
};

export type WorkPermitListRow = {
  id: number;
  permit_no: string;
  work_name: string;
  work_type: string;
  location: string;
  period_start: string;
  period_end: string;
  risk: string;
  status: string;
  ai_tbm: string;
  writer: string;
  written_date: string;
  created_at: string;
};

let schemaReady = false;

const ensureTbmHistoryTable = async (): Promise<void> => {
  if (schemaReady) {
    return;
  }

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS tbm_generation_history (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      permit_no VARCHAR(30) NULL,
      work_type_code VARCHAR(20) NULL,
      work_type_snapshot VARCHAR(100) NOT NULL,
      permit_type_snapshot VARCHAR(100) NULL,
      risk_level VARCHAR(30) NOT NULL,
      shift_code VARCHAR(20) NULL,
      work_shift_snapshot VARCHAR(30) NOT NULL,
      work_date DATE NOT NULL,
      site_id BIGINT NULL,
      location_snapshot VARCHAR(255) NOT NULL,
      options_json JSON NULL,
      special_notes TEXT NULL,
      user_prompt TEXT NOT NULL,
      draft_text LONGTEXT NOT NULL,
      checklist_json JSON NULL,
      signature_json JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [signatureColumnRows] = await dbPool.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tbm_generation_history'
      AND COLUMN_NAME = 'signature_json'
  `);
  const hasSignatureColumn =
    Number((signatureColumnRows as Array<{ count: number }>)[0]?.count ?? 0) > 0;
  if (!hasSignatureColumn) {
    await dbPool.query(`
      ALTER TABLE tbm_generation_history
      ADD COLUMN signature_json JSON NULL AFTER draft_text
    `);
  }

  schemaReady = true;
};

const resolveWorkTypeCode = async (workType: string): Promise<string | null> => {
  const [rows] = await dbPool.query(
    `
      SELECT work_type_code
      FROM code_work_type
      WHERE work_type_name = ? OR work_type_code = ?
      LIMIT 1
    `,
    [workType, workType]
  );
  return (rows as Array<{ work_type_code: string }>)[0]?.work_type_code ?? null;
};

const resolveShiftCode = async (shift: string): Promise<string | null> => {
  const [rows] = await dbPool.query(
    `
      SELECT shift_code
      FROM code_work_shift
      WHERE shift_name = ? OR shift_code = ?
      LIMIT 1
    `,
    [shift, shift]
  );
  return (rows as Array<{ shift_code: string }>)[0]?.shift_code ?? null;
};

export const saveTbmHistory = async (input: TbmHistoryInput): Promise<number> => {
  await ensureTbmHistoryTable();
  const [workTypeCode, shiftCode] = await Promise.all([
    resolveWorkTypeCode(input.workType),
    resolveShiftCode(input.shift)
  ]);

  const [result] = await dbPool.query(
    `
      INSERT INTO tbm_generation_history (
        title,
        work_type_code,
        work_type_snapshot,
        permit_type_snapshot,
        risk_level,
        shift_code,
        work_shift_snapshot,
        work_date,
        location_snapshot,
        options_json,
        user_prompt,
        draft_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.title,
      workTypeCode,
      input.workType,
      input.permitType,
      input.risk,
      shiftCode,
      input.shift,
      input.workDate,
      input.location,
      input.optionsJson,
      input.userPrompt,
      input.draftText
    ]
  );

  return Number((result as { insertId: number }).insertId);
};

export const updateTbmHistory = async (id: number, input: TbmHistoryInput): Promise<boolean> => {
  await ensureTbmHistoryTable();
  const [workTypeCode, shiftCode] = await Promise.all([
    resolveWorkTypeCode(input.workType),
    resolveShiftCode(input.shift)
  ]);

  const [result] = await dbPool.query(
    `
      UPDATE tbm_generation_history
      SET
        title = ?,
        work_type_code = ?,
        work_type_snapshot = ?,
        permit_type_snapshot = ?,
        risk_level = ?,
        shift_code = ?,
        work_shift_snapshot = ?,
        work_date = ?,
        location_snapshot = ?,
        options_json = ?,
        user_prompt = ?,
        draft_text = ?
      WHERE id = ?
      LIMIT 1
    `,
    [
      input.title,
      workTypeCode,
      input.workType,
      input.permitType,
      input.risk,
      shiftCode,
      input.shift,
      input.workDate,
      input.location,
      input.optionsJson,
      input.userPrompt,
      input.draftText,
      id
    ]
  );

  return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
};

export const updateTbmHistorySignature = async (
  id: number,
  signatureJson: string
): Promise<boolean> => {
  await ensureTbmHistoryTable();

  const [result] = await dbPool.query(
    `
      UPDATE tbm_generation_history
      SET signature_json = ?
      WHERE id = ?
      LIMIT 1
    `,
    [signatureJson, id]
  );

  return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
};

export const updateTbmHistoryDraft = async (id: number, draftText: string): Promise<boolean> => {
  await ensureTbmHistoryTable();

  const [result] = await dbPool.query(
    `
      UPDATE tbm_generation_history
      SET draft_text = ?
      WHERE id = ?
      LIMIT 1
    `,
    [draftText, id]
  );

  return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
};

export const listRecentTbmHistory = async (limit: number): Promise<TbmHistoryRow[]> => {
  await ensureTbmHistoryTable();

  const [rows] = await dbPool.query(
    `
      SELECT id, title, created_at
      FROM tbm_generation_history
      ORDER BY id DESC
      LIMIT ?
    `,
    [limit]
  );

  return rows as TbmHistoryRow[];
};

export type TbmHistoryListRow = {
  id: number;
  title: string;
  work_type: string;
  permit_type: string;
  risk_level: string;
  work_date: string;
  location: string;
  signature_json: string | TbmSignatureData | null;
  created_at: string;
};

export type TbmHistoryListParams = {
  offset: number;
  pageSize: number;
  workType?: string;
  risk?: string;
  search?: string;
};

export const listTbmHistoryPage = async (
  params: TbmHistoryListParams
): Promise<{ rows: TbmHistoryListRow[]; totalCount: number }> => {
  await ensureTbmHistoryTable();

  const conditions: string[] = [];
  const values: unknown[] = [];
  if (params.workType) {
    conditions.push("work_type_snapshot = ?");
    values.push(params.workType);
  }
  if (params.risk) {
    conditions.push("risk_level = ?");
    values.push(params.risk);
  }
  if (params.search) {
    conditions.push("(title LIKE ? OR location_snapshot LIKE ?)");
    values.push(`%${params.search}%`, `%${params.search}%`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countRows] = await dbPool.query(
    `SELECT COUNT(*) as total FROM tbm_generation_history ${whereClause}`,
    values
  );
  const totalCount = Number((countRows as Array<{ total: number }>)[0]?.total ?? 0);

  const safePageSize =
    Number.isFinite(params.pageSize) && params.pageSize > 0 ? Math.trunc(params.pageSize) : 10;
  const safeOffset =
    Number.isFinite(params.offset) && params.offset >= 0 ? Math.trunc(params.offset) : 0;

  const [rows] = await dbPool.query(
    `
      SELECT
        id,
        title,
        work_type_snapshot AS work_type,
        permit_type_snapshot AS permit_type,
        risk_level,
        DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
        location_snapshot AS location,
        signature_json,
        created_at
      FROM tbm_generation_history
      ${whereClause}
      ORDER BY id DESC
      LIMIT ${safePageSize} OFFSET ${safeOffset}
    `,
    values
  );

  return { rows: rows as TbmHistoryListRow[], totalCount };
};

export const getTbmHistoryDetail = async (id: number): Promise<TbmHistoryDetailRow | null> => {
  await ensureTbmHistoryTable();

  const [rows] = await dbPool.query(
    `
      SELECT
        id,
        title,
        work_type_snapshot AS work_type,
        permit_type_snapshot AS permit_type,
        risk_level,
        work_shift_snapshot AS work_shift,
        DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
        location_snapshot AS location,
        options_json,
        user_prompt,
        draft_text,
        signature_json,
        created_at
      FROM tbm_generation_history
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  const typedRows = rows as TbmHistoryDetailRow[];
  return typedRows.length > 0 ? typedRows[0] : null;
};

export const deleteTbmHistory = async (id: number): Promise<boolean> => {
  await ensureTbmHistoryTable();

  const [result] = await dbPool.query(
    `
      DELETE FROM tbm_generation_history
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
};

export const getTbmDashboardSummaryByDate = async (
  date: string,
  locationKeyword?: string | null
): Promise<TbmDashboardSummaryRow> => {
  await ensureTbmHistoryTable();

  const keyword = locationKeyword?.trim() ? locationKeyword.trim() : null;
  const [rows] = await dbPool.query(
    `
      SELECT
        COUNT(*) AS total_count,
        SUM(CASE WHEN UPPER(risk_level) IN ('HIGH', '고위험') THEN 1 ELSE 0 END) AS high_risk_count,
        COUNT(*) AS generated_count
      FROM tbm_generation_history
      WHERE DATE(work_date) = DATE(?)
        AND (? IS NULL OR location_snapshot LIKE CONCAT('%', ?, '%'))
    `,
    [date, keyword, keyword]
  );

  const row = (rows as Array<Partial<TbmDashboardSummaryRow>>)[0] ?? {};
  return {
    total_count: Number(row.total_count ?? 0),
    high_risk_count: Number(row.high_risk_count ?? 0),
    generated_count: Number(row.generated_count ?? 0)
  };
};

export const listTbmRiskDistributionByDate = async (
  date: string,
  locationKeyword?: string | null
): Promise<TbmDashboardRiskRow[]> => {
  await ensureTbmHistoryTable();

  const keyword = locationKeyword?.trim() ? locationKeyword.trim() : null;
  const [rows] = await dbPool.query(
    `
      SELECT risk_level, COUNT(*) AS count
      FROM tbm_generation_history
      WHERE DATE(work_date) = DATE(?)
        AND (? IS NULL OR location_snapshot LIKE CONCAT('%', ?, '%'))
      GROUP BY risk_level
      ORDER BY count DESC, risk_level ASC
    `,
    [date, keyword, keyword]
  );

  return (rows as Array<{ risk_level: string; count: number }>).map((row) => ({
    risk_level: row.risk_level,
    count: Number(row.count)
  }));
};

export const listTbmDailyTrend = async (
  endDate: string,
  days: number,
  locationKeyword?: string | null
): Promise<TbmDashboardTrendRow[]> => {
  await ensureTbmHistoryTable();

  const keyword = locationKeyword?.trim() ? locationKeyword.trim() : null;
  const [rows] = await dbPool.query(
    `
      SELECT DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date, COUNT(*) AS count
      FROM tbm_generation_history
      WHERE DATE(work_date) BETWEEN DATE_SUB(DATE(?), INTERVAL ? DAY) AND DATE(?)
        AND (? IS NULL OR location_snapshot LIKE CONCAT('%', ?, '%'))
      GROUP BY DATE_FORMAT(work_date, '%Y-%m-%d')
      ORDER BY DATE_FORMAT(work_date, '%Y-%m-%d') ASC
    `,
    [endDate, Math.max(days - 1, 0), endDate, keyword, keyword]
  );

  return (rows as Array<{ work_date: string; count: number }>).map((row) => ({
    work_date: row.work_date,
    count: Number(row.count)
  }));
};

export const listRecentTbmDashboardRows = async (
  date: string,
  limit: number,
  locationKeyword?: string | null
): Promise<TbmDashboardRecentRow[]> => {
  await ensureTbmHistoryTable();

  const keyword = locationKeyword?.trim() ? locationKeyword.trim() : null;
  const [rows] = await dbPool.query(
    `
      SELECT
        id,
        title,
        work_type_snapshot AS work_type,
        permit_type_snapshot AS permit_type,
        risk_level,
        location_snapshot AS location,
        DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
        created_at
      FROM tbm_generation_history
      WHERE DATE(work_date) = DATE(?)
        AND (? IS NULL OR location_snapshot LIKE CONCAT('%', ?, '%'))
      ORDER BY id DESC
      LIMIT ?
    `,
    [date, keyword, keyword, limit]
  );

  return rows as TbmDashboardRecentRow[];
};

const buildWorkPermitWhereClause = (
  query: WorkPermitQuery
): { whereSql: string; params: unknown[] } => {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.startDate) {
    conditions.push("DATE(work_date) >= DATE(?)");
    params.push(query.startDate);
  }
  if (query.endDate) {
    conditions.push("DATE(work_date) <= DATE(?)");
    params.push(query.endDate);
  }
  if (query.workType && query.workType !== "all") {
    conditions.push("work_type_snapshot = ?");
    params.push(query.workType);
  }
  if (query.risk && query.risk !== "all") {
    conditions.push("risk_level = ?");
    params.push(query.risk);
  }
  if (query.status && query.status !== "all") {
    if (query.status === "승인") {
      conditions.push("1 = 1");
    } else {
      conditions.push("1 = 0");
    }
  }
  const normalizedSearch = query.search?.trim();
  if (normalizedSearch) {
    conditions.push(
      "(title LIKE CONCAT('%', ?, '%') OR location_snapshot LIKE CONCAT('%', ?, '%') OR CAST(id AS CHAR) LIKE CONCAT('%', ?, '%'))"
    );
    params.push(normalizedSearch, normalizedSearch, normalizedSearch);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params
  };
};

export const countWorkPermits = async (query: WorkPermitQuery): Promise<number> => {
  await ensureTbmHistoryTable();
  const { whereSql, params } = buildWorkPermitWhereClause(query);
  const [rows] = await dbPool.query(
    `
      SELECT COUNT(*) AS count
      FROM tbm_generation_history
      ${whereSql}
    `,
    params
  );
  const count = (rows as Array<{ count: number }>)[0]?.count ?? 0;
  return Number(count);
};

export const listWorkPermits = async (query: WorkPermitQuery): Promise<WorkPermitListRow[]> => {
  await ensureTbmHistoryTable();
  const { whereSql, params } = buildWorkPermitWhereClause(query);
  const offset = Math.max(query.page, 0) * Math.max(query.pageSize, 1);
  const limit = Math.max(query.pageSize, 1);

  const [rows] = await dbPool.query(
    `
      SELECT
        id,
        CONCAT('PTW-', DATE_FORMAT(work_date, '%Y%m%d'), '-', LPAD(id, 4, '0')) AS permit_no,
        title AS work_name,
        work_type_snapshot AS work_type,
        location_snapshot AS location,
        CONCAT(DATE_FORMAT(work_date, '%Y-%m-%d'), ' ', CASE WHEN work_shift_snapshot = '야간' THEN '20:00' ELSE '08:00' END) AS period_start,
        CONCAT(
          DATE_FORMAT(
            DATE_ADD(work_date, INTERVAL CASE WHEN work_shift_snapshot = '야간' THEN 1 ELSE 0 END DAY),
            '%Y-%m-%d'
          ),
          ' ',
          CASE WHEN work_shift_snapshot = '야간' THEN '05:00' ELSE '17:00' END
        ) AS period_end,
        UPPER(risk_level) AS risk,
        '승인' AS status,
        '생성 완료' AS ai_tbm,
        '시스템' AS writer,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS written_date,
        created_at
      FROM tbm_generation_history
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  );

  return rows as WorkPermitListRow[];
};
