import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import qboOAuthRouter from "./qboOAuth.js";
import storesRouter from "./stores.js";
import businessPlansRouter from "./businessPlans.js";
import notesRouter from "./notes.js";
import floorPlanRouter from "./floorPlan.js";
import reportsRouter from "./reports.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRouter);
app.use("/api", usersRouter);
app.use("/api", qboOAuthRouter);
app.use("/api", storesRouter);
app.use("/api", businessPlansRouter);
app.use("/api", notesRouter);
app.use("/api", floorPlanRouter);
app.use("/api", reportsRouter);

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Eagle V API server running on http://0.0.0.0:3001");
});
