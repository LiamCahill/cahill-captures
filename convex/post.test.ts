import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setupFixture(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      username: "eve",
      externalId: "user_eve",
    });
    const subId = await ctx.db.insert("space", {
      name: "evescommunity",
      authorId: userId,
    });
    const postId = await ctx.db.insert("post", {
      subject: "My first post",
      body: "Hello everyone",
      space: subId,
      authorId: userId,
    });
    return { userId, subId, postId };
  });
}

test("getPost returns enriched post with author.username", async () => {
  const t = convexTest(schema, modules);
  const { postId } = await setupFixture(t);

  const post = await t.query(api.post.getPost, { id: postId });
  expect(post).not.toBeNull();
  expect(post?.author?.username).toBe("eve");
});

test("getPost returns enriched post with space.name and space._id", async () => {
  const t = convexTest(schema, modules);
  const { postId, subId } = await setupFixture(t);

  const post = await t.query(api.post.getPost, { id: postId });
  expect(post?.space?.name).toBe("evescommunity");
  expect(post?.space?._id).toBe(subId);
});

test("getPost returns null for a non-existent post ID", async () => {
  const t = convexTest(schema, modules);

  // Use a valid-format ID that doesn't exist in the db
  const fakeId = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      username: "temp",
      externalId: "temp",
    });
    const subId = await ctx.db.insert("space", {
      name: "temp",
      authorId: userId,
    });
    const id = await ctx.db.insert("post", {
      subject: "temp",
      body: "temp",
      space: subId,
      authorId: userId,
    });
    await ctx.db.delete(id);
    return id;
  });

  const post = await t.query(api.post.getPost, { id: fakeId });
  expect(post).toBeNull();
});
