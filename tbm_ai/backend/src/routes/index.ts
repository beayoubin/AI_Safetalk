import { Router } from "express";
import authRouter from "./auth.route";
import codeRouter from "./code.route";
import dashboardRouter from "./dashboard.route";
import ppeRouter from "./ppe.route";
import ragRouter from "./rag.route";
import siteRouter from "./site.route";
import tbmRouter from "./tbm.route";
import weatherRouter from "./weather.route";
import workPermitRouter from "./work-permit.route";

const apiRouter = Router();

apiRouter.use("/", weatherRouter);
apiRouter.use("/", tbmRouter);
apiRouter.use("/", ragRouter);
apiRouter.use("/", codeRouter);
apiRouter.use("/", ppeRouter);
apiRouter.use("/", dashboardRouter);
apiRouter.use("/", siteRouter);
apiRouter.use("/", workPermitRouter);
apiRouter.use("/", authRouter);

export default apiRouter;
