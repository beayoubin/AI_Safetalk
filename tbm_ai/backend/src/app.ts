import cors from "cors";
import express from "express";
import apiRouter from "./routes";

const app = express();

app.use(cors({ exposedHeaders: ["X-Auth-Token"] }));
app.use(express.json());
app.use("/api", apiRouter);

export default app;
