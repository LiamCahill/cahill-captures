import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// subreddit.create is used here because it calls getCurrentUserOrCreate
// without triggering any sharded counter operations, making it a clean
// proxy for testing user creation behaviour.

test("getCurrentUserOrCreate auto-creates a user on first mutation", async () => {
  const t = convexTest(schema, modules);

  await t
    .withIdentity({ subject: "new_user_001", name: "Bob" })
    .mutation(api.subreddit.create, { name: "bobscommunity" });

  const user = await t.run(async (ctx) =>
    ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", "new_user_001"))
      .unique(),
  );
  expect(user).not.toBeNull();
  expect(user?.externalId).toBe("new_user_001");
});

test("getCurrentUserOrCreate returns existing user without creating a duplicate", async () => {
  const t = convexTest(schema, modules);
  const identity = { subject: "existing_user", name: "Carol" };

  // Call the mutation twice with the same identity
  await t
    .withIdentity(identity)
    .mutation(api.subreddit.create, { name: "carolsworld" });
  await t
    .withIdentity(identity)
    .mutation(api.subreddit.create, { name: "carolsotherworld" });

  const users = await t.run(async (ctx) =>
    ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", "existing_user"))
      .collect(),
  );
  expect(users.length).toBe(1);
});

test("mutation requiring auth throws when called unauthenticated", async () => {
  const t = convexTest(schema, modules);

  await expect(
    t.mutation(api.subreddit.create, { name: "shouldfail" }),
  ).rejects.toThrow();
});
