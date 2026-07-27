import { Request, Response } from "express";
import { listSiteMasters } from "../repositories/site.repository";
import {
  getTbmDashboardSummaryByDate,
  listRecentTbmDashboardRows,
  listTbmDailyTrend,
  listTbmRiskDistributionByDate
} from "../repositories/tbm.repository";
import { getLatestWeatherObservation } from "../repositories/weather.repository";

const toDateParam = (value: unknown): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = `${kst.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${kst.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const riskLabelToBucket = (value: string): "HIGH" | "MEDIUM" | "LOW" => {
  const normalized = value.trim().toUpperCase();
  if (normalized.includes("HIGH") || value.includes("고위험")) {
    return "HIGH";
  }
  if (normalized.includes("LOW") || value.includes("저위험")) {
    return "LOW";
  }
  return "MEDIUM";
};

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const selectedDate = toDateParam(req.query.date);
    const siteName =
      typeof req.query.siteName === "string" && req.query.siteName.trim()
        ? req.query.siteName.trim()
        : null;
    const [summary, riskRows, trendRows, recentRows, weather, sites] = await Promise.all([
      getTbmDashboardSummaryByDate(selectedDate, siteName),
      listTbmRiskDistributionByDate(selectedDate, siteName),
      listTbmDailyTrend(selectedDate, 7, siteName),
      listRecentTbmDashboardRows(selectedDate, 10, siteName),
      getLatestWeatherObservation(),
      listSiteMasters()
    ]);

    const riskDistribution = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    riskRows.forEach((row) => {
      const bucket = riskLabelToBucket(row.risk_level);
      riskDistribution[bucket] += row.count;
    });

    let cumulative = 0;
    const trend = trendRows.map((row) => {
      cumulative += row.count;
      return {
        date: row.work_date,
        count: row.count,
        cumulative
      };
    });

    res.json({
      ok: true,
      selectedDate,
      siteOptions: sites.map((site) => ({ siteId: site.siteId, siteName: site.siteName })),
      kpi: {
        totalPermits: summary.total_count,
        pendingApprovals: 0,
        highRisk: summary.high_risk_count,
        generatedTbm: summary.generated_count,
        generationRate:
          summary.total_count > 0
            ? Math.round((summary.generated_count / summary.total_count) * 100)
            : 0
      },
      riskDistribution,
      trend,
      recentPermits: recentRows.map((row) => ({
        permitNo: `TBM-${String(row.id).padStart(6, "0")}`,
        workName: row.title,
        workType: row.work_type,
        location: row.location,
        risk: riskLabelToBucket(row.risk_level),
        status: "생성완료",
        createdAt: row.created_at
      })),
      recentTbm: recentRows.slice(0, 5).map((row) => ({
        id: row.id,
        time: row.created_at,
        permitNo: `TBM-${String(row.id).padStart(6, "0")}`,
        workName: row.title
      })),
      weather: weather
        ? {
            observedAt: weather.obs_time,
            temperature: weather.temperature,
            humidity: weather.humidity,
            windSpeed: weather.wind_speed,
            rainfall: weather.rainfall,
            warningType: weather.warning_type,
            skyStatus: weather.sky_status
          }
        : null
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};
