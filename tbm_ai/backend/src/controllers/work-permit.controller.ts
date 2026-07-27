import { Request, Response } from "express";
import { countWorkPermits, listWorkPermits } from "../repositories/tbm.repository";

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const intValue = Math.trunc(parsed);
  return intValue >= 0 ? intValue : fallback;
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export const getWorkPermits = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = toPositiveInt(req.query.page, 0);
    const pageSize = Math.min(Math.max(toPositiveInt(req.query.pageSize, 10), 1), 100);
    const query = {
      startDate: toOptionalString(req.query.startDate),
      endDate: toOptionalString(req.query.endDate),
      workType: toOptionalString(req.query.workType),
      status: toOptionalString(req.query.status),
      risk: toOptionalString(req.query.risk),
      search: toOptionalString(req.query.search),
      page,
      pageSize
    };

    const [rows, totalCount] = await Promise.all([listWorkPermits(query), countWorkPermits(query)]);

    res.json({
      ok: true,
      rows: rows.map((row) => ({
        id: row.id,
        permitNo: row.permit_no,
        workName: row.work_name,
        workType: row.work_type,
        location: row.location,
        periodStart: row.period_start,
        periodEnd: row.period_end,
        risk: row.risk,
        status: row.status,
        aiTbm: row.ai_tbm,
        writer: row.writer,
        writtenDate: row.written_date,
        createdAt: row.created_at
      })),
      totalCount,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};
