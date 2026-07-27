import { Router } from "express";
import { getWorkPermits } from "../controllers/work-permit.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const workPermitRouter = Router();

workPermitRouter.get("/work-permits", requireAuth, getWorkPermits);

export default workPermitRouter;
