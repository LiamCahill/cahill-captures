import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// Mock the sharded counter so vote tests focus on record logic,
// not the counter component (which requires a separate test environment).
vi.mock("./counter", () => ({
  counts: { inc: vi.fn(), dec: vi.fn(), count: vi.fn().mockResolvedValue(0) },
  voteKey: (postId: string, voteType: string) => `${voteType}:${postId}`,
  commentCountKey: (postId: string) => `comments:${postId}`,
  postCountKey: (userId: string) => `post:${userId}`,
  upvoteCountKey: (postId: string) => `upvotes:${postId}`,
  downvoteCountKey: (postId: string) => `downvotes:${postId}`,
}));

const modules = import.meta.glob("./**/*.ts");

// Inserts a user, space, and post directly into the db for test setup.
// Uses t.run() to bypass mutations that call the sharded counter.
async function setupFixture(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      username: "alice",
      externalId: "user_alice",
    });
    const subId = await ctx.db.insert("space", {
      name: "testcommunity",
      authorId: userId,
    });
    const postId = await ctx.db.insert("post", {
      subject: "Test post",
      body: "Hello world",
      space: subId,
      authorId: userId,
    });
    return { userId, postId };
  });
}

test("upvoting a post adds an upvote record", async () => {
  const t = convexTest(schema, modules);
  const { userId, postId } = await setupFixture(t);

  await t
    .withIdentity({ subject: "user_alice" })
    .mutation(api.vote.toggleUpvote, { postId });

  const upvote = await t.run(async (ctx) =>
    ctx.db
      .query("upvote")
      .withIndex("byPost", (q) => q.eq("postId", postId))
      .first(),
  );
  expect(upvote).not.toBeNull();
  expect(upvote?.userId).toBe(userId);
});

test("upvoting twice removes the upvote (toggle off)", async () => {
  const t = convexTest(schema, modules);
  const { postId } = await setupFixture(t);
  const asAlice = t.withIdentity({ subject: "user_alice" });

  await asAlice.mutation(api.vote.toggleUpvote, { postId });
  await asAlice.mutation(api.vote.toggleUpvote, { postId });

  const upvote = await t.run(async (ctx) =>
    ctx.db
      .query("upvote")
      .withIndex("byPost", (q) => q.eq("postId", postId))
      .first(),
  );
  expect(upvote).toBeNull();
});

test("upvoting removes an existing downvote", async () => {
  const t = convexTest(schema, modules);
  const { postId } = await setupFixture(t);
  const asAlice = t.withIdentity({ subject: "user_alice" });

  await asAlice.mutation(api.vote.toggleDownvote, { postId });
  await asAlice.mutation(api.vote.toggleUpvote, { postId });

  const [upvote, downvote] = await t.run(async (ctx) =>
    Promise.all([
      ctx.db
        .query("upvote")
        .withIndex("byPost", (q) => q.eq("postId", postId))
        .first(),
      ctx.db
        .query("downvote")
        .withIndex("byPost", (q) => q.eq("postId", postId))
        .first(),
    ]),
  );
  expect(upvote).not.toBeNull();
  expect(downvote).toBeNull();
});

test("downvoting removes an existing upvote", async () => {
  const t = convexTest(schema, modules);
  const { postId } = await setupFixture(t);
  const asAlice = t.withIdentity({ subject: "user_alice" });

  await asAlice.mutation(api.vote.toggleUpvote, { postId });
  await asAlice.mutation(api.vote.toggleDownvote, { postId });

  const [upvote, downvote] = await t.run(async (ctx) =>
    Promise.all([
      ctx.db
        .query("upvote")
        .withIndex("byPost", (q) => q.eq("postId", postId))
        .first(),
      ctx.db
        .query("downvote")
        .withIndex("byPost", (q) => q.eq("postId", postId))
        .first(),
    ]),
  );
  expect(upvote).toBeNull();
  expect(downvote).not.toBeNull();
});
