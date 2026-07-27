import { Request, Response } from "express";
import { weatherConfig } from "../../config/weather";
import {
  createSiteMaster,
  getSiteMasterByName,
  listSiteMasters
} from "../repositories/site.repository";
import {
  resolveKmaGridByLatLon,
  resolveKmaGridBySiteName,
  searchSiteCoordinateCandidates
} from "../services/site-coordinate.service";

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getSiteMasters = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await listSiteMasters();
    res.json({
      ok: true,
      rows: rows.map((row) => ({
        siteId: row.siteId,
        siteName: row.siteName
      }))
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const searchSiteCoordinates = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    if (!query) {
      res.status(400).json({ ok: false, message: "query is required" });
      return;
    }
    const rows = await searchSiteCoordinateCandidates(query);
    res.json({
      ok: true,
      rows: rows.map((row, index) => ({
        id: `${row.provider}-${index}`,
        label: row.label,
        latitude: row.latitude,
        longitude: row.longitude,
        provider: row.provider
      }))
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const addSiteMaster = async (req: Request, res: Response): Promise<void> => {
  try {
    const siteName = typeof req.body?.siteName === "string" ? req.body.siteName.trim() : "";
    const manualLat = toNumber(req.body?.latitude);
    const manualLon = toNumber(req.body?.longitude);
    if (!siteName) {
      res.status(400).json({ ok: false, message: "siteName is required" });
      return;
    }
    const existing = await getSiteMasterByName(siteName);
    if (existing) {
      res.status(200).json({
        ok: true,
        row: {
          siteId: existing.siteId,
          siteName: existing.siteName,
          nx: existing.nx,
          ny: existing.ny
        }
      });
      return;
    }

    let nx: number;
    let ny: number;
    let coordinateSource: "geocoding" | "manual-latlon" | "default-grid" = "geocoding";
    let responseMessage: string | undefined;
    if (manualLat !== null && manualLon !== null) {
      const resolved = resolveKmaGridByLatLon(manualLat, manualLon);
      nx = resolved.nx;
      ny = resolved.ny;
      coordinateSource = "manual-latlon";
      responseMessage = "입력한 좌표를 기준으로 격자(nx/ny)를 계산해 저장했습니다.";
    } else {
      try {
        const resolved = await resolveKmaGridBySiteName(siteName);
        nx = resolved.nx;
        ny = resolved.ny;
      } catch (error) {
        nx = weatherConfig.kma.nx;
        ny = weatherConfig.kma.ny;
        coordinateSource = "default-grid";
        responseMessage =
          `장소 좌표 자동 조회에 실패하여 기본 격자(nx=${nx}, ny=${ny})로 저장했습니다. ` +
          `정확한 장소명을 입력하면 더 정확한 좌표로 등록됩니다.`;
      }
    }

    const row = await createSiteMaster(siteName, nx, ny);
    res.status(201).json({
      ok: true,
      row: {
        siteId: row.siteId,
        siteName: row.siteName,
        nx: row.nx,
        ny: row.ny,
        coordinateSource
      },
      message: responseMessage
    });
  } catch (error) {
    const message = (error as Error).message;
    const isInputError = message.includes("siteName is required");
    res.status(isInputError ? 400 : 500).json({ ok: false, message });
  }
};
