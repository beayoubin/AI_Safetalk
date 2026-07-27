import { dbPool } from "../../config/database";

export type WeatherRecordInput = {
  siteId: number;
  observedAt: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  rainfall: number | null;
  rawJson: string;
  warningType: string | null;
  skyStatus: string | null;
};

type WeatherHistoryRow = {
  id: number;
  site_id: number;
  obs_time: string;
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  rainfall: number | null;
  raw_json: string | null;
  warning_type: string | null;
  sky_status: string | null;
  created_at: string;
};

export type LatestWeatherRow = {
  site_id: number;
  obs_time: string;
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  rainfall: number | null;
  warning_type: string | null;
  sky_status: string | null;
};

let schemaReady = false;

const toMysqlDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  const second = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const ensureWeatherTable = async (): Promise<void> => {
  if (schemaReady) {
    return;
  }

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS weather_observation (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      site_id BIGINT NOT NULL,
      obs_time DATETIME NOT NULL,
      temperature DECIMAL(5, 2) NULL,
      humidity DECIMAL(5, 2) NULL,
      wind_speed DECIMAL(5, 2) NULL,
      rainfall DECIMAL(6, 2) NULL,
      raw_json JSON NULL,
      warning_type VARCHAR(50) NULL,
      sky_status VARCHAR(20) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  schemaReady = true;
};

export const saveWeatherObservation = async (input: WeatherRecordInput): Promise<number> => {
  await ensureWeatherTable();
  const obsTime = toMysqlDateTime(input.observedAt);

  const [existingRows] = await dbPool.query(
    `
      SELECT id
      FROM weather_observation
      WHERE site_id = ? AND obs_time = ?
      LIMIT 1
    `,
    [input.siteId, obsTime]
  );

  const existing = existingRows as Array<{ id: number }>;
  if (existing.length > 0) {
    const id = Number(existing[0].id);
    await dbPool.query(
      `
        UPDATE weather_observation
        SET
          temperature = ?,
          humidity = ?,
          wind_speed = ?,
          rainfall = ?,
          raw_json = ?,
          warning_type = ?,
          sky_status = ?
        WHERE id = ?
      `,
      [
        input.temperature,
        input.humidity,
        input.windSpeed,
        input.rainfall,
        input.rawJson,
        input.warningType,
        input.skyStatus,
        id
      ]
    );
    return id;
  }

  const [result] = await dbPool.query(
    `
      INSERT INTO weather_observation (
        site_id,
        obs_time,
        temperature,
        humidity,
        wind_speed,
        rainfall,
        raw_json,
        warning_type,
        sky_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.siteId,
      obsTime,
      input.temperature,
      input.humidity,
      input.windSpeed,
      input.rainfall,
      input.rawJson,
      input.warningType,
      input.skyStatus
    ]
  );

  return Number((result as { insertId: number }).insertId);
};

export const getWeatherHistory = async (limit: number): Promise<WeatherHistoryRow[]> => {
  await ensureWeatherTable();

  const [rows] = await dbPool.query(
    `
      SELECT
        id,
        site_id,
        obs_time,
        temperature,
        humidity,
        wind_speed,
        rainfall,
        raw_json,
        warning_type,
        sky_status,
        created_at
      FROM weather_observation
      ORDER BY obs_time DESC
      LIMIT ?
    `,
    [limit]
  );

  return rows as WeatherHistoryRow[];
};

export const getLatestObservationTimeBySite = async (siteId: number): Promise<Date | null> => {
  await ensureWeatherTable();

  const [rows] = await dbPool.query(
    `
      SELECT MAX(obs_time) AS latest_obs_time
      FROM weather_observation
      WHERE site_id = ?
    `,
    [siteId]
  );

  const latest =
    (rows as Array<{ latest_obs_time: Date | string | null }>)[0]?.latest_obs_time ?? null;
  if (!latest) {
    return null;
  }
  if (latest instanceof Date) {
    return latest;
  }
  const parsed = new Date(String(latest).replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getLatestWeatherObservation = async (): Promise<LatestWeatherRow | null> => {
  await ensureWeatherTable();

  const [rows] = await dbPool.query(
    `
      SELECT
        site_id,
        DATE_FORMAT(obs_time, '%Y-%m-%dT%H:%i:%s') AS obs_time,
        temperature,
        humidity,
        wind_speed,
        rainfall,
        warning_type,
        sky_status
      FROM weather_observation
      ORDER BY obs_time DESC
      LIMIT 1
    `
  );

  const list = rows as LatestWeatherRow[];
  return list.length > 0 ? list[0] : null;
};
