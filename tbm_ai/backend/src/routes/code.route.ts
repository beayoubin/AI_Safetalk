import { Router } from "express";
import { getCodeOptions, getCodeWorkTypes } from "../controllers/code.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const codeRouter = Router();

codeRouter.get("/code/work-types", requireAuth, getCodeWorkTypes);
codeRouter.get("/code/options", requireAuth, getCodeOptions);

export default codeRouter;
