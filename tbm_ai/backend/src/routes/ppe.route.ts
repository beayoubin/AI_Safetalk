import { Router } from "express";
import { getPpeChecklist } from "../controllers/ppe.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const ppeRouter = Router();

ppeRouter.get("/ppe/checklist", requireAuth, getPpeChecklist);

export default ppeRouter;
