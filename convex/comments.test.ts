import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// Set up a user, space, and post directly via t.run() to avoid
// counter side effects, then insert comments the same way so getComments
// can be tested in isolation.
async function setupFixture(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      username: "dave",
      externalId: "user_dave",
    });
    const subId = await ctx.db.insert("space", {
      name: "davescommunity",
      authorId: userId,
    });
    const postId = await ctx.db.insert("post", {
      subject: "A post",
      body: "Post body",
      space: subId,
      authorId: userId,
    });
    return { userId, postId };
  });
}

test("getComments returns comments with author.username populated", async () => {
  const t = convexTest(schema, modules);
  const { userId, postId } = await setupFixture(t);

  await t.run(async (ctx) => {
    await ctx.db.insert("comments", {
      content: "Great post!",
      postId,
      authorId: userId,
    });
  });

  const comments = await t.query(api.comments.getComments, { postId });
  expect(comments.length).toBe(1);
  expect(comments[0].author?.username).toBe("dave");
  expect(comments[0].content).toBe("Great post!");
});

test("multiple comments from the same author are all returned with correct username", async () => {
  const t = convexTest(schema, modules);
  const { userId, postId } = await setupFixture(t);

  await t.run(async (ctx) => {
    await ctx.db.insert("comments", {
      content: "First comment",
      postId,
      authorId: userId,
    });
    await ctx.db.insert("comments", {
      content: "Second comment",
      postId,
      authorId: userId,
    });
  });

  const comments = await t.query(api.comments.getComments, { postId });
  expect(comments.length).toBe(2);
  expect(comments.every((c) => c.author?.username === "dave")).toBe(true);
});
