import { dbPool } from "../../config/database";
import { ensureWorkTypeSchema } from "./code-work-type.repository";

export type PpeRuleRow = {
  ppe_name: string;
  required_yn: string;
  reason: string | null;
};

// 새로 추가된 작업종류(WT011~WT022)에 대한 표준 보호구 목록. 이미 등록되어 있으면 건드리지 않는다.
const EXTRA_PPE_RULES_BY_WORK_TYPE_CODE: Record<string, string[]> = {
  WT011: ["안전모", "안전화", "보안경", "작업장갑"],
  WT012: ["안전모", "안전화", "보안경", "작업장갑", "방진마스크"],
  WT013: ["안전모", "안전화", "보안경", "방독마스크", "내화학장갑"],
  WT014: ["안전모", "안전화", "보안경", "방독마스크", "방열장갑"],
  WT015: ["안전모", "안전화", "보안경", "절연장갑"],
  WT016: ["안전모", "안전화", "보안경", "절연장갑", "아크보호구"],
  WT017: ["안전모", "안전화", "보안경", "용접면", "방열장갑", "방염복"],
  WT018: ["안전모", "안전화", "보안경", "방열장갑", "방염복"],
  WT019: ["안전모", "안전화", "보안경", "안전조끼"],
  WT020: ["안전모", "안전화", "안전조끼"],
  WT021: ["안전모", "안전화", "보안경", "개인선량계"],
  WT022: ["안전모", "안전화", "보안경", "안전조끼"]
};

let extraPpeRulesReady = false;

const ensureExtraPpeRules = async (): Promise<void> => {
  if (extraPpeRulesReady) {
    return;
  }

  // 새 작업종류(WT011~) 행이 code_work_type에 먼저 존재해야 하므로 스키마 동기화를 선행한다.
  await ensureWorkTypeSchema();

  for (const [workTypeCode, ppeNames] of Object.entries(EXTRA_PPE_RULES_BY_WORK_TYPE_CODE)) {
    for (const ppeName of ppeNames) {
      await dbPool.query(
        `
          INSERT INTO code_ppe_rule (work_type_code, ppe_name, required_yn, reason)
          SELECT ?, ?, 'Y', CONCAT(?, ' 표준 보호구')
          WHERE NOT EXISTS (
            SELECT 1 FROM code_ppe_rule WHERE work_type_code = ? AND ppe_name = ?
          )
        `,
        [workTypeCode, ppeName, workTypeCode, workTypeCode, ppeName]
      );
    }
  }

  extraPpeRulesReady = true;
};

export const listPpeRulesByWorkType = async (workType: string): Promise<PpeRuleRow[]> => {
  await ensureExtraPpeRules();

  const [rows] = await dbPool.query(
    `
      SELECT r.ppe_name, r.required_yn, r.reason
      FROM code_ppe_rule r
      JOIN code_work_type w ON w.work_type_code = r.work_type_code
      WHERE w.work_type = ?
      ORDER BY r.required_yn DESC, r.ppe_name ASC
    `,
    [workType]
  );
  return rows as PpeRuleRow[];
};
