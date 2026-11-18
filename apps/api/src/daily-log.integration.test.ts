import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import app from "./app.ts";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

test("S3-1.2 daily log API and storage", async (t) => {
  if (!url || !serviceKey || !anonKey) {
    t.skip("Set local SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY");
    return;
  }
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname), "Integration tests require local Supabase");
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const userIds: string[] = [];
  const tokens: string[] = [];
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const endpoint = `http://127.0.0.1:${address.port}/api/log-entries`;
  try {
    for (let i = 0; i < 2; i++) {
      const email = `log-${randomUUID()}@example.test`;
      const password = randomUUID();
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      assert.ifError(created.error);
      userIds.push(created.data.user.id);
      const client = createClient(url, anonKey, { auth: { persistSession: false } });
      const signedIn = await client.auth.signInWithPassword({ email, password });
      assert.ifError(signedIn.error);
      tokens.push(signedIn.data.session.access_token);
    }
    const headers = { Authorization: `Bearer ${tokens[0]}`, "Content-Type": "application/json" };
    const entry = { food_name: "Rice", serving_quantity: 1.5, consumption_date: "2026-11-17", calories: 100, protein: 0, carbohydrate: null };
    let id: number;
    await t.test("S3-1.2 saves and retrieves entries after reconnecting", async () => {
      const created = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(entry) });
      assert.equal(created.status, 201);
      const result = await created.json();
      id = result.entry.id;
      const read = await fetch(`${endpoint}?date=2026-11-17`, { headers: { Authorization: headers.Authorization, Connection: "close" } });
      assert.equal(read.status, 200);
      const saved = (await read.json()).entries;
      assert.equal(saved.length, 1);
      assert.equal(saved[0].food_name, "Rice");
      assert.equal(Number(saved[0].serving_quantity), 1.5);
      assert.equal(saved[0].consumption_date, entry.consumption_date);
      assert.equal(Number(saved[0].calories), 100);
    });
    await t.test("S3-1.2 rejects invalid food, quantity, date and nutrition", async () => {
      for (const invalid of [{ food_name: " " }, { serving_quantity: 0 }, { consumption_date: "2026-02-30" }, { fat: -1 }, { protein: "bad" }]) {
        const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ ...entry, ...invalid }) });
        assert.equal(response.status, 400);
      }
      const read = await fetch(`${endpoint}?date=2026-11-17`, { headers });
      assert.equal((await read.json()).entries.length, 1);
    });
    await t.test("S3-1.2 enforces authentication and ownership", async () => {
      assert.equal((await fetch(`${endpoint}?date=2026-11-17`)).status, 401);
      assert.equal((await fetch(`${endpoint}?date=2026-11-17`, { headers: { Authorization: "Bearer invalid" } })).status, 401);
      const other = await fetch(`${endpoint}?date=2026-11-17`, { headers: { Authorization: `Bearer ${tokens[1]}` } });
      assert.equal(other.status, 200);
      assert.deepEqual((await other.json()).entries, []);
    });
    await t.test("S3-1.2 preserves snapshots and distinguishes unknown from zero", async () => {
      const food = await admin.from("food_db").insert({ dining_hall: "Test", meal_type: "Lunch", name: "Rice", calories: 100, scraped_at: new Date().toISOString() }).select().single();
      assert.ifError(food.error);
      assert.ifError((await admin.from("food_db").delete().eq("id", food.data.id)).error);
      const read = await fetch(`${endpoint}?date=2026-11-17`, { headers });
      const saved = (await read.json()).entries.find((row: { id: number }) => row.id === id);
      assert.equal(saved.food_name, "Rice");
      assert.equal(saved.protein, 0);
      assert.equal(saved.carbohydrate, null);
      assert.equal(saved.fat, null);
    });
  } finally {
    server.close();
    for (const id of userIds) await admin.auth.admin.deleteUser(id);
  }
});
