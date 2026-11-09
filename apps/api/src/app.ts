import express from "express";
import { getFoods } from "./data/foods.ts";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/foods", async (_req, res) => {
  try {
    const foods = await getFoods();
    res.json({ foods });
  } catch (error) {
    console.error("Failed to retrieve dining data", error);
    res.status(500).json({ error: "Unable to retrieve dining data" });
  }
});

export default app;
