import { dbPool } from "../../config/database";
import { ensureWorkTypeSchema } from "./code-work-type.repository";

export type PpeRuleRow = {
  ppe_name: string;
  required_yn: string;
  reason: string | null;
};

export const listPpeRulesByWorkType = async (workType: string): Promise<PpeRuleRow[]> => {
  await ensureWorkTypeSchema();

  const [rows] = await dbPool.query(
    `
      SELECT
        p.ppe_name,
        m.required_yn,
        m.reason
      FROM map_work_type_ppe m
      JOIN code_work_type w
        ON w.work_type_code = m.work_type_code
       AND w.active_yn = 'Y'
      JOIN code_ppe_item p
        ON p.ppe_code = m.ppe_code
       AND p.active_yn = 'Y'
      WHERE w.work_type_name = ?
      ORDER BY m.required_yn DESC, p.ppe_name ASC
    `,
    [workType]
  );
  return rows as PpeRuleRow[];
};
