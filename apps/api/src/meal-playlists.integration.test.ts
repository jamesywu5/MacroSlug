import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

test("S3-3.1 playlist storage and access policies", async (t) => {
  if (!url || !serviceKey || !anonKey) {
    t.skip("Set local SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY in .env.test");
    return;
  }
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(new URL(url).hostname), "Integration tests require a local Supabase URL");

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const clients = [];
  const credentials: { email: string; password: string }[] = [];
  const ids: string[] = [];
  try {
    for (let i = 0; i < 2; i++) {
      const email = `playlist-${randomUUID()}@example.test`;
      const password = randomUUID();
      credentials.push({ email, password });
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      assert.ifError(created.error);
      ids.push(created.data.user.id);
      const client = createClient(url, anonKey, { auth: { persistSession: false } });
      const signedIn = await client.auth.signInWithPassword({ email, password });
      assert.ifError(signedIn.error);
      clients.push(client);
    }
    const [owner, other] = clients;
    const created = await owner.from("meal_playlists").insert({ name: "Lunch" }).select().single();
    assert.ifError(created.error);
    const playlistId = created.data.id;
    const item = await owner.from("meal_playlist_items").insert({ playlist_id: playlistId, food_name: "Rice", serving_quantity: 1.5, calories: 100 }).select().single();
    assert.ifError(item.error);

    await t.test("S3-3.1 saves and retrieves a playlist and item", async () => {
      const reconnected = createClient(url, anonKey, { auth: { persistSession: false } });
      assert.ifError((await reconnected.auth.signInWithPassword(credentials[0])).error);
      const result = await reconnected.from("meal_playlists").select("name, meal_playlist_items(food_name, serving_quantity)").eq("id", playlistId).single();
      assert.ifError(result.error);
      assert.equal(result.data.name, "Lunch");
      assert.equal(result.data.meal_playlist_items[0].food_name, "Rice");
      assert.equal(Number(result.data.meal_playlist_items[0].serving_quantity), 1.5);
    });
    await t.test("S3-3.1 rejects invalid names, quantities, and nutrition", async () => {
      assert.ok((await owner.from("meal_playlists").insert({ name: "  " })).error);
      assert.ok((await owner.from("meal_playlist_items").insert({ playlist_id: playlistId, food_name: "Rice", serving_quantity: 0 })).error);
      assert.ok((await owner.from("meal_playlist_items").insert({ playlist_id: playlistId, food_name: "Rice", serving_quantity: 1, calories: -1 })).error);
    });
    await t.test("S3-3.1 prevents other users from reading or changing entries", async () => {
      const read = await other.from("meal_playlists").select("id").eq("id", playlistId);
      assert.ifError(read.error);
      assert.deepEqual(read.data, []);
      const items = await other.from("meal_playlist_items").select("id").eq("playlist_id", playlistId);
      assert.ifError(items.error);
      assert.deepEqual(items.data, []);
      assert.ok((await other.from("meal_playlist_items").insert({ playlist_id: playlistId, food_name: "Other", serving_quantity: 1 })).error);
      const update = await other.from("meal_playlists").update({ name: "Changed" }).eq("id", playlistId).select();
      assert.ifError(update.error);
      assert.deepEqual(update.data, []);
      const itemUpdate = await other.from("meal_playlist_items").update({ food_name: "Changed" }).eq("id", item.data.id).select();
      assert.ifError(itemUpdate.error);
      assert.deepEqual(itemUpdate.data, []);
    });
    await t.test("S3-3.1 keeps snapshots independently and cascades playlist deletion", async () => {
      const food = await admin.from("food_db").insert({ dining_hall: "Test", meal_type: "Lunch", name: "Rice", calories: 100, scraped_at: new Date().toISOString() }).select().single();
      assert.ifError(food.error);
      assert.ifError((await admin.from("food_db").delete().eq("id", food.data.id)).error);
      const retained = await owner.from("meal_playlist_items").select("id").eq("id", item.data.id).single();
      assert.ifError(retained.error);
      assert.ifError((await owner.from("meal_playlists").delete().eq("id", playlistId)).error);
      const remaining = await admin.from("meal_playlist_items").select("id").eq("id", item.data.id);
      assert.ifError(remaining.error);
      assert.deepEqual(remaining.data, []);
    });
  } finally {
    for (const id of ids) await admin.auth.admin.deleteUser(id);
  }
});
