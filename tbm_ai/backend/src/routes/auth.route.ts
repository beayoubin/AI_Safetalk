import { Router } from "express";
import { changePassword, login, me } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/auth/login", login);
authRouter.get("/auth/me", requireAuth, me);
authRouter.post("/auth/change-password", requireAuth, changePassword);

export default authRouter;
