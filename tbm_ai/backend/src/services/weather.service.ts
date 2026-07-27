import { weatherConfig } from "../../config/weather";
import { getSiteMaster, listSiteMasters } from "../repositories/site.repository";
import { getWeatherHistory, saveWeatherObservation } from "../repositories/weather.repository";

type OpenMeteoCurrent = {
  time?: string;
  temperature_2m?: number;
  wind_speed_10m?: number;
  weather_code?: number;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  current?: OpenMeteoCurrent;
};

type KmaItem = {
  baseDate: string;
  baseTime: string;
  category: string;
  nx: number;
  ny: number;
  obsrValue: string;
};

type KmaResponse = {
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: {
      items?: {
        item?: KmaItem[];
      };
    };
  };
};

export type CurrentWeather = {
  siteId: number;
  nx: number;
  ny: number;
  observedAt: string;
  locationName: string;
  temperatureC: number | null;
  humidity: number | null;
  windSpeedMs: number | null;
  rainfallMm: number | null;
  warningType: string | null;
  skyStatus: string | null;
  source: string;
};

const buildOpenMeteoUrl = (): string => {
  const url = new URL(weatherConfig.apiUrl);
  url.searchParams.set("latitude", String(34.7526));
  url.searchParams.set("longitude", String(127.7458));
  url.searchParams.set("current", "temperature_2m,wind_speed_10m,weather_code");
  url.searchParams.set("timezone", "Asia/Seoul");
  return url.toString();
};

const parseKmaNumber = (value: string | undefined): number | null => {
  if (value === undefined) {
    return null;
  }
  if (value.includes("강수없음")) {
    return 0;
  }
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapWarningType = (pty: number | null): string | null => {
  switch (pty) {
    case 1:
      return "비";
    case 2:
      return "비/눈";
    case 3:
      return "눈";
    case 5:
      return "빗방울";
    case 6:
      return "빗방울눈날림";
    case 7:
      return "눈날림";
    default:
      return null;
  }
};

const mapSkyStatus = (pty: number | null): string | null => {
  if (pty === null || pty === 0) {
    return "맑음";
  }
  if (pty === 1 || pty === 5) {
    return "비";
  }
  if (pty === 3 || pty === 7) {
    return "눈";
  }
  if (pty === 2 || pty === 6) {
    return "비/눈";
  }
  return null;
};

const toKmaBaseDateTime = (currentDate: Date): { baseDate: string; baseTime: string } => {
  // 컨테이너 타임존과 무관하게 KST(UTC+9) 기준 정시를 사용한다.
  const kst = new Date(currentDate.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = `${kst.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${kst.getUTCDate()}`.padStart(2, "0");
  const hour = `${kst.getUTCHours()}`.padStart(2, "0");
  return {
    baseDate: `${year}${month}${day}`,
    baseTime: `${hour}00`
  };
};

const buildKmaUltraShortNowcastUrl = (
  nx: number,
  ny: number,
  baseDate: string,
  baseTime: string
): string => {
  const url = new URL(weatherConfig.kma.apiUrl);
  url.searchParams.set("serviceKey", weatherConfig.kma.serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", baseDate);
  url.searchParams.set("base_time", baseTime);
  url.searchParams.set("nx", String(nx));
  url.searchParams.set("ny", String(ny));
  return url.toString();
};

const fetchCurrentWeatherFromKma = async (
  siteId?: number,
  observedAtDate?: Date
): Promise<CurrentWeather> => {
  if (!weatherConfig.kma.serviceKey) {
    throw new Error("KMA_SERVICE_KEY is required for kma-short-term provider");
  }

  const site = await getSiteMaster(siteId ?? weatherConfig.siteId);
  const { baseDate, baseTime } = toKmaBaseDateTime(observedAtDate ?? new Date());
  const endpoint = buildKmaUltraShortNowcastUrl(site.nx, site.ny, baseDate, baseTime);
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`KMA API request failed: ${response.status}`);
  }

  const data = (await response.json()) as KmaResponse;
  const code = data.response?.header?.resultCode;
  if (code && code !== "00") {
    throw new Error(
      `KMA API error ${code}: ${data.response?.header?.resultMsg ?? "Unknown error"}`
    );
  }

  const items = data.response?.body?.items?.item ?? [];
  const getValue = (category: string): string | undefined => {
    return items.find((item) => item.category === category)?.obsrValue;
  };

  const t1h = getValue("T1H");
  const reh = getValue("REH");
  const wsd = getValue("WSD");
  const rn1 = getValue("RN1");
  const pty = parseKmaNumber(getValue("PTY"));

  const sampleTime = items[0] ? `${items[0].baseDate}${items[0].baseTime}` : "";
  const observedAt =
    sampleTime.length === 12
      ? `${sampleTime.slice(0, 4)}-${sampleTime.slice(4, 6)}-${sampleTime.slice(6, 8)}T${sampleTime.slice(8, 10)}:${sampleTime.slice(10, 12)}:00+09:00`
      : new Date().toISOString();

  return {
    siteId: site.siteId,
    nx: site.nx,
    ny: site.ny,
    observedAt,
    locationName: site.siteName,
    temperatureC: parseKmaNumber(t1h),
    humidity: parseKmaNumber(reh),
    windSpeedMs: parseKmaNumber(wsd),
    rainfallMm: parseKmaNumber(rn1),
    warningType: mapWarningType(pty),
    skyStatus: mapSkyStatus(pty),
    source: "kma-ultra-short-nowcast"
  };
};

const fetchCurrentWeatherFromOpenMeteo = async (siteId?: number): Promise<CurrentWeather> => {
  const endpoint = buildOpenMeteoUrl();
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Weather API request failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const current = data.current ?? {};
  const site = await getSiteMaster(siteId ?? weatherConfig.siteId);

  return {
    siteId: site.siteId,
    nx: site.nx,
    ny: site.ny,
    observedAt: current.time ?? new Date().toISOString(),
    locationName: site.siteName,
    temperatureC: typeof current.temperature_2m === "number" ? current.temperature_2m : null,
    humidity: null,
    windSpeedMs: typeof current.wind_speed_10m === "number" ? current.wind_speed_10m : null,
    rainfallMm: null,
    warningType: null,
    skyStatus: typeof current.weather_code === "number" ? String(current.weather_code) : null,
    source: "open-meteo"
  };
};

export const fetchCurrentWeather = async (
  siteId?: number,
  observedAtDate?: Date
): Promise<CurrentWeather> => {
  if (weatherConfig.provider === "kma-short-term") {
    return fetchCurrentWeatherFromKma(siteId, observedAtDate);
  }
  return fetchCurrentWeatherFromOpenMeteo(siteId);
};

export const fetchAndStoreCurrentWeather = async (
  siteId?: number,
  observedAtDate?: Date
): Promise<{ id: number; weather: CurrentWeather }> => {
  const weather = await fetchCurrentWeather(siteId, observedAtDate);
  const id = await saveWeatherObservation({
    siteId: weather.siteId,
    observedAt: weather.observedAt,
    temperature: weather.temperatureC,
    humidity: weather.humidity,
    windSpeed: weather.windSpeedMs,
    rainfall: weather.rainfallMm,
    rawJson: JSON.stringify(weather),
    warningType: weather.warningType,
    skyStatus: weather.skyStatus
  });
  return { id, weather };
};

export const fetchAndStoreCurrentWeatherForAllSites = async (): Promise<
  Array<{ id: number; weather: CurrentWeather }>
> => {
  const sites = await listSiteMasters();
  const results: Array<{ id: number; weather: CurrentWeather }> = [];
  for (const site of sites) {
    const synced = await fetchAndStoreCurrentWeather(site.siteId);
    results.push(synced);
  }
  return results;
};

const getCurrentKstHourDate = (): Date => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCMinutes(0, 0, 0);
  return new Date(kst.getTime() - 9 * 60 * 60 * 1000);
};

const addHours = (date: Date, hours: number): Date =>
  new Date(date.getTime() + hours * 60 * 60 * 1000);

const backfillMissingWeatherForSite = async (
  siteId: number
): Promise<{ siteId: number; savedCount: number }> => {
  const currentHour = getCurrentKstHourDate();
  const backfillHours = Math.max(Math.trunc(weatherConfig.backfillHours), 0);
  let cursor = addHours(currentHour, -backfillHours);
  let savedCount = 0;

  while (cursor.getTime() <= currentHour.getTime()) {
    await fetchAndStoreCurrentWeather(siteId, cursor);
    savedCount += 1;
    cursor = addHours(cursor, 1);
  }

  return { siteId, savedCount };
};

export const backfillMissingWeather = async (
  siteId?: number
): Promise<Array<{ siteId: number; savedCount: number }>> => {
  if (siteId !== undefined) {
    return [await backfillMissingWeatherForSite(siteId)];
  }

  const sites = await listSiteMasters();
  const results: Array<{ siteId: number; savedCount: number }> = [];
  for (const site of sites) {
    results.push(await backfillMissingWeatherForSite(site.siteId));
  }
  return results;
};

export const listStoredWeatherHistory = async (limit: number): Promise<unknown[]> => {
  return getWeatherHistory(limit);
};
