import { Router } from "express";
import {
  addSiteMaster,
  getSiteMasters,
  searchSiteCoordinates
} from "../controllers/site.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const siteRouter = Router();

siteRouter.get("/sites", requireAuth, getSiteMasters);
siteRouter.get("/sites/search", requireAuth, searchSiteCoordinates);
siteRouter.post("/sites", requireAuth, addSiteMaster);

export default siteRouter;
