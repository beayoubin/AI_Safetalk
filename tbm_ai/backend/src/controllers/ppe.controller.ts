import { Request, Response } from "express";
import { listPpeRulesByWorkType } from "../repositories/ppe-rule.repository";

export const getPpeChecklist = async (req: Request, res: Response): Promise<void> => {
  try {
    const workType = typeof req.query.workType === "string" ? req.query.workType.trim() : "";
    if (!workType) {
      res.status(400).json({ ok: false, message: "workType 쿼리 파라미터가 필요합니다." });
      return;
    }

    const rows = await listPpeRulesByWorkType(workType);
    res.json({
      ok: true,
      workType,
      required: rows
        .filter((row) => row.required_yn === "Y")
        .map((row) => ({ name: row.ppe_name, reason: row.reason })),
      additional: rows
        .filter((row) => row.required_yn !== "Y")
        .map((row) => ({ name: row.ppe_name, reason: row.reason }))
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};
