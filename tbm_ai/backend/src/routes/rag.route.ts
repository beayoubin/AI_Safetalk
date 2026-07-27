import { Router } from "express";
import { getRagSourceSummary, syncRag } from "../controllers/rag.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const ragRouter = Router();

ragRouter.get("/rag/sources", requireAuth, getRagSourceSummary);
ragRouter.post("/rag/sync", requireAuth, syncRag);

export default ragRouter;
