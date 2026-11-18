import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

export const dailyLogRouter = Router();

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

dailyLogRouter.use(async (req, res, next) => {
  const match = /^Bearer (\S+)$/i.exec(req.header("authorization") ?? "");
  if (!match) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ error: "Daily log is not configured" });
    return;
  }
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${match[1]}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const { data, error } = await client.auth.getUser(match[1]);
    if (error || !data.user) {
      res.status(401).json({ error: "Invalid authentication" });
      return;
    }
    res.locals.dailyLogClient = client;
    next();
  } catch {
    res.status(503).json({ error: "Authentication unavailable" });
  }
});

dailyLogRouter.post("/", async (req, res) => {
  const body = req.body;
  const nutrients = ["calories", "protein", "carbohydrate", "fat"] as const;
  if (!body || typeof body !== "object" || typeof body.food_name !== "string" || !body.food_name.trim() ||
      typeof body.serving_quantity !== "number" || !Number.isFinite(body.serving_quantity) || body.serving_quantity <= 0 ||
      !validDate(body.consumption_date) ||
      nutrients.some((name) => body[name] != null && (typeof body[name] !== "number" || !Number.isFinite(body[name]) || body[name] < 0))) {
    res.status(400).json({ error: "Invalid log entry" });
    return;
  }
  const entry = {
    food_name: body.food_name.trim(), serving_quantity: body.serving_quantity, consumption_date: body.consumption_date,
    calories: body.calories ?? null, protein: body.protein ?? null, carbohydrate: body.carbohydrate ?? null, fat: body.fat ?? null,
  };
  const { data, error } = await res.locals.dailyLogClient.from("daily_log_entries").insert(entry).select().single();
  if (error) {
    res.status(500).json({ error: "Unable to save log entry" });
    return;
  }
  res.status(201).json({ entry: data });
});

dailyLogRouter.get("/", async (req, res) => {
  if (!validDate(req.query.date)) {
    res.status(400).json({ error: "A valid date is required" });
    return;
  }
  const { data, error } = await res.locals.dailyLogClient.from("daily_log_entries").select().eq("consumption_date", req.query.date).order("created_at");
  if (error) {
    res.status(500).json({ error: "Unable to retrieve log entries" });
    return;
  }
  res.json({ entries: data });
});
