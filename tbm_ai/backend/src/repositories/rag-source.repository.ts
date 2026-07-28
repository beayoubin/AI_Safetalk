import { dbPool } from "../../config/database";
import { listActiveRagDocuments } from "./rag-document.repository";

export type RagSourceDocument = {
  sourceType: "code_hazard" | "code_work_type" | "code_ppe_rule" | "rag_document";
  sourceKey: string;
  title: string;
  text: string;
};

export const listRagSourceDocuments = async (): Promise<RagSourceDocument[]> => {
  const docs: RagSourceDocument[] = [];

  const [hazardRows] = await dbPool.query(
    `
      SELECT hazard_code, hazard_type, accident_type, standard_controls
      FROM code_hazard
      ORDER BY hazard_code ASC
    `
  );
  for (const row of hazardRows as Array<{
    hazard_code: string;
    hazard_type: string;
    accident_type: string;
    standard_controls: string | null;
  }>) {
    docs.push({
      sourceType: "code_hazard",
      sourceKey: row.hazard_code,
      title: `${row.hazard_code} ${row.hazard_type}`,
      text: `위험코드: ${row.hazard_code}\n위험유형: ${row.hazard_type}\n사고유형: ${row.accident_type}\n표준 안전조치: ${row.standard_controls ?? ""}`
    });
  }

  const [workTypeRows] = await dbPool.query(
    `
      SELECT
        w.work_type_code,
        w.work_type_name AS work_type,
        GROUP_CONCAT(DISTINCT d.detail_name ORDER BY mtd.display_order SEPARATOR ', ') AS sample_tasks,
        GROUP_CONCAT(DISTINCT h.hazard_code ORDER BY mth.display_order SEPARATOR ', ') AS default_hazards
      FROM code_work_type w
      LEFT JOIN map_work_type_detail mtd ON mtd.work_type_code = w.work_type_code
      LEFT JOIN code_detailed_work d ON d.detail_code = mtd.detail_code AND d.active_yn = 'Y'
      LEFT JOIN map_work_type_hazard mth ON mth.work_type_code = w.work_type_code
      LEFT JOIN code_hazard h ON h.hazard_code = mth.hazard_code AND h.active_yn = 'Y'
      WHERE w.active_yn = 'Y'
      GROUP BY w.work_type_code, w.work_type_name
      ORDER BY w.work_type_code ASC
    `
  );
  for (const row of workTypeRows as Array<{
    work_type_code: string;
    work_type: string;
    sample_tasks: string | null;
    default_hazards: string | null;
  }>) {
    docs.push({
      sourceType: "code_work_type",
      sourceKey: row.work_type_code,
      title: `${row.work_type_code} ${row.work_type}`,
      text: `작업유형코드: ${row.work_type_code}\n작업유형: ${row.work_type}\n대표작업예시: ${row.sample_tasks ?? ""}\n기본 위험요인 코드: ${row.default_hazards ?? ""}`
    });
  }

  const [ppeRows] = await dbPool.query(
    `
      SELECT
        m.work_type_code,
        p.ppe_name,
        m.required_yn,
        m.reason
      FROM map_work_type_ppe m
      JOIN code_ppe_item p ON p.ppe_code = m.ppe_code AND p.active_yn = 'Y'
      JOIN code_work_type w ON w.work_type_code = m.work_type_code AND w.active_yn = 'Y'
      ORDER BY m.work_type_code ASC, p.ppe_name ASC
    `
  );
  for (const row of ppeRows as Array<{
    work_type_code: string;
    ppe_name: string;
    required_yn: string;
    reason: string | null;
  }>) {
    docs.push({
      sourceType: "code_ppe_rule",
      sourceKey: `${row.work_type_code}:${row.ppe_name}`,
      title: `${row.work_type_code} ${row.ppe_name}`,
      text: `작업유형코드: ${row.work_type_code}\n보호구: ${row.ppe_name}\n필수여부: ${row.required_yn}\n적용사유: ${row.reason ?? ""}`
    });
  }

  const ragDocuments = await listActiveRagDocuments();
  for (const row of ragDocuments) {
    docs.push({
      sourceType: "rag_document",
      sourceKey: row.external_key,
      title: row.title,
      text: [
        `제목: ${row.title}`,
        `출처: ${row.source}`,
        row.source_url ? `출처 URL: ${row.source_url}` : "",
        row.work_type ? `작업유형: ${row.work_type}` : "",
        row.risk_level ? `위험등급: ${row.risk_level}` : "",
        row.process ? `공정: ${row.process}` : "",
        row.weather_type ? `기상조건: ${row.weather_type}` : "",
        row.effective_date ? `시행일: ${row.effective_date}` : "",
        `내용: ${row.body}`
      ]
        .filter((line) => line.length > 0)
        .join("\n")
    });
  }

  return docs;
};
