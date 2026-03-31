import "dotenv/config";
import express from "express";
import cors from "cors";
import qboOAuthRouter from "./qboOAuth.js";
import storesRouter from "./stores.js";
import businessPlansRouter from "./businessPlans.js";

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/api", qboOAuthRouter);
app.use("/api", storesRouter);
app.use("/api", businessPlansRouter);

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(3001, () => {
  console.log("Eagle V API server running on http://localhost:3001");
});
