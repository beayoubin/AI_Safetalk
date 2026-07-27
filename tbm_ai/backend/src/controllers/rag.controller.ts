import { Request, Response } from "express";
import { getRagSourceCount, syncRagKnowledgeBase } from "../services/rag.service";

export const syncRag = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await syncRagKnowledgeBase();
    res.status(201).json({ ok: true, count: result.count });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const getRagSourceSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await getRagSourceCount();
    res.json({ ok: true, count });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};
