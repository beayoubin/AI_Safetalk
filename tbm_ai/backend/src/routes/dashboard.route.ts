import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const dashboardRouter = Router();

dashboardRouter.get("/dashboard/summary", requireAuth, getDashboardSummary);

export default dashboardRouter;
