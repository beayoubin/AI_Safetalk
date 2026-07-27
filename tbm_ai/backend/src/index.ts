import "dotenv/config";
import app from "./app";
import { checkDatabaseConnection } from "../config/database";
import { env } from "../config/env";
import { startWeatherSync } from "./services/weather-sync.service";

const port = env.port;

const startServer = async () => {
  try {
    await checkDatabaseConnection();
    console.log("Database connection established.");
  } catch (error) {
    console.error("Database connection failed:", (error as Error).message);
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend server running on port ${port}`);
    console.log(
      `DB target: ${env.db.client}://${env.db.user}@${env.db.host}:${env.db.port}/${env.db.name}${
        env.db.url ? " (DATABASE_URL override enabled)" : ""
      }`
    );
    startWeatherSync();
  });
};

void startServer();
