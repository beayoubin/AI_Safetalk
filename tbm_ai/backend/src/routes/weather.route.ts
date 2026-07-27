import { Router } from "express";
import {
  getCurrentWeather,
  getWeatherHistory,
  syncCurrentWeather
} from "../controllers/weather.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const weatherRouter = Router();

weatherRouter.get("/weather/current", requireAuth, getCurrentWeather);
weatherRouter.post("/weather/sync", requireAuth, syncCurrentWeather);
weatherRouter.get("/weather/history", requireAuth, getWeatherHistory);

export default weatherRouter;
