import { dbPool } from "../../config/database";

export type CodeWorkTypeRow = {
  work_type_code: string;
  work_type: string;
  category_code: string | null;
  permit_types: string | null;
  display_order: number;
};

export type CodeWorkCategoryRow = {
  category_code: string;
  category_name: string;
};

export type CodeRiskLevelRow = {
  risk_level: string;
};

export type CodePermitTypeRow = {
  permit_type: string;
};

export type CodeApprovalStatusRow = {
  approval_status: string;
};

let schemaReady = false;

export const ensureWorkTypeSchema = async (): Promise<void> => {
  if (schemaReady) {
    return;
  }

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS code_work_type (
      work_type_code VARCHAR(20) PRIMARY KEY,
      category_code VARCHAR(20) NOT NULL,
      work_type_name VARCHAR(100) NOT NULL,
      display_order INT NOT NULL DEFAULT 0,
      active_yn CHAR(1) NOT NULL DEFAULT 'Y'
    )
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS code_work_category (
      category_code VARCHAR(20) PRIMARY KEY,
      category_name VARCHAR(100) NOT NULL,
      display_order INT NOT NULL DEFAULT 0,
      active_yn CHAR(1) NOT NULL DEFAULT 'Y'
    )
  `);

  schemaReady = true;
};

export const parsePermitTypes = (raw: string | null): string[] =>
  (raw ?? "")
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const listCodeWorkCategories = async (): Promise<CodeWorkCategoryRow[]> => {
  await ensureWorkTypeSchema();

  const [rows] = await dbPool.query(
    `
      SELECT category_code, category_name
      FROM code_work_category
      WHERE active_yn = 'Y'
      ORDER BY display_order ASC
    `
  );
  return rows as CodeWorkCategoryRow[];
};

export const listCodeWorkTypes = async (): Promise<CodeWorkTypeRow[]> => {
  await ensureWorkTypeSchema();

  const [rows] = await dbPool.query(
    `
      SELECT
        w.work_type_code,
        w.work_type_name AS work_type,
        w.category_code,
        w.display_order,
        GROUP_CONCAT(pt.permit_type_name ORDER BY pt.permit_type_name SEPARATOR ',') AS permit_types
      FROM code_work_type w
      LEFT JOIN map_work_type_permit_type m
        ON m.work_type_code = w.work_type_code
      LEFT JOIN code_permit_type pt
        ON pt.permit_type_code = m.permit_type_code
       AND pt.active_yn = 'Y'
      WHERE w.active_yn = 'Y'
      GROUP BY w.work_type_code, w.work_type_name, w.category_code, w.display_order
      ORDER BY COALESCE(w.category_code, ''), w.display_order ASC, w.work_type_code ASC
    `
  );
  return rows as CodeWorkTypeRow[];
};

export const listCodeRiskLevels = async (): Promise<CodeRiskLevelRow[]> => {
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS code_risk_level (
      risk_level VARCHAR(30) PRIMARY KEY,
      risk_label VARCHAR(100) NOT NULL,
      display_order INT NOT NULL DEFAULT 0,
      active_yn CHAR(1) NOT NULL DEFAULT 'Y'
    )
  `);

  const [rows] = await dbPool.query(
    `
      SELECT risk_level
      FROM code_risk_level
      WHERE active_yn = 'Y'
      ORDER BY display_order ASC
    `
  );
  return rows as CodeRiskLevelRow[];
};

export const listCodePermitTypes = async (): Promise<CodePermitTypeRow[]> => {
  const [rows] = await dbPool.query(
    `
      SELECT permit_type_name AS permit_type
      FROM code_permit_type
      WHERE active_yn = 'Y'
      ORDER BY permit_type_name ASC
    `
  );
  return rows as CodePermitTypeRow[];
};

export const listCodeApprovalStatuses = async (): Promise<CodeApprovalStatusRow[]> => {
  const [rows] = await dbPool.query(
    `
      SELECT DISTINCT approval_status
      FROM permit_approval
      WHERE approval_status IS NOT NULL AND approval_status <> ''
      ORDER BY approval_status ASC
    `
  );
  return rows as CodeApprovalStatusRow[];
};
