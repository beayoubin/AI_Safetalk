import { Router } from "express";
import {
  deleteTbmHistory,
  downloadTbmHistoryDocument,
  downloadTbmHistoryPdf,
  generateTbm,
  getTbmHistory,
  listRecentTbm,
  listTbmHistoryList,
  saveTbmHistoryDraft,
  saveTbmHistorySignature
} from "../controllers/tbm.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const tbmRouter = Router();

tbmRouter.post("/tbm/generate", requireAuth, generateTbm);
tbmRouter.get("/tbm/history", requireAuth, listRecentTbm);
tbmRouter.get("/tbm/history-list", requireAuth, listTbmHistoryList);
tbmRouter.get("/tbm/history/:id", requireAuth, getTbmHistory);
tbmRouter.patch("/tbm/history/:id/draft", requireAuth, saveTbmHistoryDraft);
tbmRouter.patch("/tbm/history/:id/signature", requireAuth, saveTbmHistorySignature);
tbmRouter.get("/tbm/history/:id/document", requireAuth, downloadTbmHistoryDocument);
tbmRouter.get("/tbm/history/:id/pdf", requireAuth, downloadTbmHistoryPdf);
tbmRouter.delete("/tbm/history/:id", requireAuth, deleteTbmHistory);

export default tbmRouter;
