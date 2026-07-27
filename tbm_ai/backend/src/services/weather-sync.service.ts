import { weatherConfig } from "../../config/weather";
import { backfillMissingWeather } from "./weather.service";

let timer: NodeJS.Timeout | null = null;
let startupTimer: NodeJS.Timeout | null = null;

const runSync = async (): Promise<void> => {
  try {
    const results = await backfillMissingWeather(weatherConfig.siteId);
    const total = results.reduce((sum, item) => sum + item.savedCount, 0);
    console.log(`[WEATHER_SYNC] backfill complete: sites=${results.length}, rows_saved=${total}`);
  } catch (error) {
    console.error("[WEATHER_SYNC] failed:", (error as Error).message);
  }
};

export const startWeatherSync = (): void => {
  if (!weatherConfig.syncEnabled) {
    console.log("[WEATHER_SYNC] disabled by WEATHER_SYNC_ENABLED=false");
    return;
  }

  if (timer || startupTimer) {
    return;
  }

  if (weatherConfig.provider === "kma-short-term" && weatherConfig.syncUseHourlyCadence) {
    const minuteOffset = Math.min(Math.max(Math.trunc(weatherConfig.syncMinuteOffset), 0), 59);
    const now = new Date();
    const firstRun = new Date(now);
    firstRun.setMinutes(minuteOffset, 0, 0);
    if (firstRun.getTime() <= now.getTime()) {
      firstRun.setHours(firstRun.getHours() + 1);
    }

    const delayMs = firstRun.getTime() - now.getTime();
    console.log(
      `[WEATHER_SYNC] scheduler started: hourly cadence at minute ${minuteOffset} (first run in ${delayMs}ms)`
    );

    // 서버가 정각 사이에 재기동되어도 공백이 생기지 않도록 즉시 1회 수집한다.
    void runSync();

    startupTimer = setTimeout(() => {
      void runSync();
      timer = setInterval(
        () => {
          void runSync();
        },
        60 * 60 * 1000
      );
    }, delayMs);
    return;
  }

  const interval = Math.max(weatherConfig.syncIntervalMs, 60000);
  console.log(`[WEATHER_SYNC] scheduler started: every ${interval}ms`);
  void runSync();
  timer = setInterval(() => {
    void runSync();
  }, interval);
};
