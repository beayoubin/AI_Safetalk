import { Request, Response } from "express";
import {
  backfillMissingWeather,
  fetchCurrentWeather,
  listStoredWeatherHistory
} from "../services/weather.service";

const toLimit = (value: string | undefined): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 20;
  }
  return Math.min(Math.max(Math.trunc(parsed), 1), 200);
};

const toSiteId = (value: string | number | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.trunc(parsed);
};

export const getCurrentWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const siteId = toSiteId(req.query.siteId as string | undefined);
    const weather = await fetchCurrentWeather(siteId);
    res.json({ ok: true, weather });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const syncCurrentWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const siteId = toSiteId(req.body?.siteId as number | string | undefined);
    const backfill = await backfillMissingWeather(siteId);
    const count = backfill.reduce((sum, row) => sum + row.savedCount, 0);
    res.status(201).json({ ok: true, count, backfill });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const getWeatherHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = toLimit(req.query.limit as string | undefined);
    const rows = await listStoredWeatherHistory(limit);
    res.json({ ok: true, count: rows.length, rows });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};
