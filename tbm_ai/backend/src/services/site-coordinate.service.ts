import { env } from "../../config/env";

type GeocodingResult = {
  latitude: number;
  longitude: number;
};

export type GeocodingCandidate = GeocodingResult & {
  label: string;
  provider: "kakao" | "open-meteo" | "nominatim";
};

type OpenMeteoGeocodingResponse = {
  results?: Array<{
    latitude?: number;
    longitude?: number;
    name?: string;
    country_code?: string;
  }>;
};

type NominatimGeocodingItem = {
  lat?: string;
  lon?: string;
};

type KakaoKeywordSearchResponse = {
  documents?: Array<{
    x?: string;
    y?: string;
    place_name?: string;
    address_name?: string;
  }>;
};

const RE = 6371.00877; // Earth radius (km)
const GRID = 5.0; // Grid spacing (km)
const SLAT1 = 30.0; // Projection latitude 1 (degree)
const SLAT2 = 60.0; // Projection latitude 2 (degree)
const OLON = 126.0; // Reference longitude (degree)
const OLAT = 38.0; // Reference latitude (degree)
const XO = 43; // Reference point X coordinate (GRID)
const YO = 136; // Reference point Y coordinate (GRID)

const DEGRAD = Math.PI / 180.0;

const GEO_TIMEOUT_MS = 8000;

const normalizeQueryCandidates = (siteName: string): string[] => {
  const normalized = siteName.trim();
  const candidates = [
    normalized,
    `${normalized} 공장`,
    `${normalized} 대한민국`,
    `${normalized} 산업단지`
  ];
  return Array.from(new Set(candidates.map((item) => item.trim()).filter(Boolean)));
};

const fetchJson = async <T>(url: string, headers?: Record<string, string>): Promise<T> => {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(GEO_TIMEOUT_MS)
  });
  if (!response.ok) {
    throw new Error(`지오코딩 API 호출에 실패했습니다. status=${response.status}`);
  }
  return (await response.json()) as T;
};

const geocodeByOpenMeteo = async (query: string): Promise<GeocodingResult | null> => {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "ko");
  url.searchParams.set("format", "json");

  const data = await fetchJson<OpenMeteoGeocodingResponse>(url.toString());
  const first = data.results?.[0];
  if (!first || typeof first.latitude !== "number" || typeof first.longitude !== "number") {
    return null;
  }

  return {
    latitude: first.latitude,
    longitude: first.longitude
  };
};

const searchByOpenMeteo = async (query: string): Promise<GeocodingCandidate[]> => {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "ko");
  url.searchParams.set("format", "json");
  const data = await fetchJson<OpenMeteoGeocodingResponse>(url.toString());
  const rows = data.results ?? [];
  const result: GeocodingCandidate[] = [];
  for (const row of rows) {
    if (typeof row.latitude !== "number" || typeof row.longitude !== "number") continue;
    result.push({
      latitude: row.latitude,
      longitude: row.longitude,
      label: `${row.name ?? query}${row.country_code ? ` (${row.country_code})` : ""}`,
      provider: "open-meteo"
    });
  }
  return result;
};

const geocodeByNominatim = async (query: string): Promise<GeocodingResult | null> => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "kr");

  const rows = await fetchJson<NominatimGeocodingItem[]>(url.toString(), {
    "User-Agent": "tbm-ai/1.0",
    "Accept-Language": "ko"
  });
  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first || typeof first.lat !== "string" || typeof first.lon !== "string") {
    return null;
  }
  const latitude = Number(first.lat);
  const longitude = Number(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
};

const searchByNominatim = async (query: string): Promise<GeocodingCandidate[]> => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "kr");

  const rows = await fetchJson<Array<NominatimGeocodingItem & { display_name?: string }>>(
    url.toString(),
    {
      "User-Agent": "tbm-ai/1.0",
      "Accept-Language": "ko"
    }
  );
  const result: GeocodingCandidate[] = [];
  for (const row of rows) {
    const latitude = Number(row.lat);
    const longitude = Number(row.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    result.push({
      latitude,
      longitude,
      label: row.display_name ?? query,
      provider: "nominatim"
    });
  }
  return result;
};

const geocodeByKakaoKeyword = async (query: string): Promise<GeocodingResult | null> => {
  const kakaoKey = env.geocoding.kakaoRestApiKey;
  if (!kakaoKey) {
    return null;
  }

  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "3");

  const data = await fetchJson<KakaoKeywordSearchResponse>(url.toString(), {
    Authorization: `KakaoAK ${kakaoKey}`
  });
  const first = data.documents?.[0];
  if (!first || typeof first.x !== "string" || typeof first.y !== "string") {
    return null;
  }
  const longitude = Number(first.x);
  const latitude = Number(first.y);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
};

const searchByKakaoKeyword = async (query: string): Promise<GeocodingCandidate[]> => {
  const kakaoKey = env.geocoding.kakaoRestApiKey;
  if (!kakaoKey) return [];
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "5");

  const data = await fetchJson<KakaoKeywordSearchResponse>(url.toString(), {
    Authorization: `KakaoAK ${kakaoKey}`
  });
  const rows = data.documents ?? [];
  const result: GeocodingCandidate[] = [];
  for (const row of rows) {
    const longitude = Number(row.x);
    const latitude = Number(row.y);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    result.push({
      latitude,
      longitude,
      label: row.place_name ?? row.address_name ?? query,
      provider: "kakao"
    });
  }
  return result;
};

const geocodeByQuery = async (query: string): Promise<GeocodingResult | null> => {
  try {
    const kakaoResult = await geocodeByKakaoKeyword(query);
    if (kakaoResult) {
      return kakaoResult;
    }
  } catch {
    // Try next provider
  }

  try {
    const openMeteoResult = await geocodeByOpenMeteo(query);
    if (openMeteoResult) {
      return openMeteoResult;
    }
  } catch {
    // Try fallback provider
  }

  try {
    return await geocodeByNominatim(query);
  } catch {
    return null;
  }
};

export const latLonToKmaGrid = (
  latitude: number,
  longitude: number
): { nx: number; ny: number } => {
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + latitude * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = longitude * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
};

export const resolveKmaGridBySiteName = async (
  siteName: string
): Promise<{ nx: number; ny: number }> => {
  const candidates = normalizeQueryCandidates(siteName);
  for (const candidate of candidates) {
    const geocoded = await geocodeByQuery(candidate);
    if (!geocoded) {
      continue;
    }
    const { latitude, longitude } = geocoded;
    return latLonToKmaGrid(latitude, longitude);
  }

  throw new Error("장소 좌표를 찾지 못했습니다. 보다 정확한 장소명을 입력해 주세요.");
};

export const resolveKmaGridByLatLon = (
  latitude: number,
  longitude: number
): { nx: number; ny: number } => latLonToKmaGrid(latitude, longitude);

export const searchSiteCoordinateCandidates = async (
  query: string
): Promise<GeocodingCandidate[]> => {
  const normalized = query.trim();
  if (!normalized) return [];

  const [kakao, openMeteo, nominatim] = await Promise.allSettled([
    searchByKakaoKeyword(normalized),
    searchByOpenMeteo(normalized),
    searchByNominatim(normalized)
  ]);

  const merged = [
    ...(kakao.status === "fulfilled" ? kakao.value : []),
    ...(openMeteo.status === "fulfilled" ? openMeteo.value : []),
    ...(nominatim.status === "fulfilled" ? nominatim.value : [])
  ];

  const dedup = new Map<string, GeocodingCandidate>();
  for (const item of merged) {
    const key = `${item.latitude.toFixed(6)}|${item.longitude.toFixed(6)}`;
    if (!dedup.has(key)) dedup.set(key, item);
  }
  return Array.from(dedup.values()).slice(0, 8);
};
