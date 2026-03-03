import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { makeTestClient } from "./helpers";

test("getNewestUsers excludes users with @ in their username", async () => {
  const t = makeTestClient();

  await t.run(async (ctx) => {
    await ctx.db.insert("users", { username: "valid-user", externalId: "ext-1" });
    await ctx.db.insert("users", { username: "another@email.com", externalId: "ext-2" });
    await ctx.db.insert("users", { username: "user@domain.com", externalId: "ext-3" });
  });

  const result = await t.query(api.users.getNewestUsers, {});
  const usernames = result.map((u) => u.username);

  expect(usernames).not.toContain("another@email.com");
  expect(usernames).not.toContain("user@domain.com");
});

test("getNewestUsers includes users with valid usernames", async () => {
  const t = makeTestClient();

  await t.run(async (ctx) => {
    await ctx.db.insert("users", { username: "alice", externalId: "ext-1" });
    await ctx.db.insert("users", { username: "bob", externalId: "ext-2" });
    await ctx.db.insert("users", { username: "charlie", externalId: "ext-3" });
  });

  const result = await t.query(api.users.getNewestUsers, {});
  const usernames = result.map((u) => u.username);

  expect(usernames).toContain("alice");
  expect(usernames).toContain("bob");
  expect(usernames).toContain("charlie");
});
