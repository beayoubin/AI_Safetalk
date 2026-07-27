const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === "true";
};

export const weatherConfig = {
  provider: process.env.WEATHER_PROVIDER ?? "kma-short-term",
  apiUrl: process.env.WEATHER_API_URL ?? "https://api.open-meteo.com/v1/forecast",
  locationName: process.env.WEATHER_LOCATION_NAME ?? "여수산단",
  siteId: process.env.WEATHER_SITE_ID ? toNumber(process.env.WEATHER_SITE_ID, 0) : undefined,
  syncEnabled: toBoolean(process.env.WEATHER_SYNC_ENABLED, true),
  syncIntervalMs: toNumber(process.env.WEATHER_SYNC_INTERVAL_MS, 600000),
  syncUseHourlyCadence: toBoolean(process.env.WEATHER_SYNC_USE_HOURLY_CADENCE, true),
  syncMinuteOffset: toNumber(process.env.WEATHER_SYNC_MINUTE_OFFSET, 0),
  backfillHours: toNumber(process.env.WEATHER_BACKFILL_HOURS, 12),
  kma: {
    apiUrl:
      process.env.KMA_API_URL ??
      "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst",
    serviceKey: process.env.KMA_SERVICE_KEY ?? "",
    nx: toNumber(process.env.KMA_NX, 73),
    ny: toNumber(process.env.KMA_NY, 67)
  }
};
