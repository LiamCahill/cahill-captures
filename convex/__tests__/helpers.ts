import { convexTest } from "convex-test";
import schema from "../schema";
import { modules, shardedCounterModules } from "../test.setup";
import shardedCounterSchema from "../../node_modules/@convex-dev/sharded-counter/src/component/schema";
import { Id } from "../_generated/dataModel";

/**
 * Creates a configured convex-test client with the ShardedCounter component registered.
 * Use this instead of calling convexTest() directly.
 */
export function makeTestClient() {
  const t = convexTest(schema, modules);
  t.registerComponent("shardedCounter", shardedCounterSchema, shardedCounterModules);
  return t;
}

/**
 * Seeds a subreddit and a post directly in the DB, returning their IDs.
 * Use this to set up test data for vote and post tests.
 */
export async function seedPost(
  t: ReturnType<typeof makeTestClient>,
  opts: { authorExternalId: string; authorUsername: string }
): Promise<{ authorId: Id<"users">; subredditId: Id<"subreddit">; postId: Id<"post"> }> {
  return t.run(async (ctx) => {
    const authorId = await ctx.db.insert("users", {
      username: opts.authorUsername,
      externalId: opts.authorExternalId,
    });
    const subredditId = await ctx.db.insert("subreddit", {
      name: "testcommunity",
      authorId,
    });
    const postId = await ctx.db.insert("post", {
      subject: "Test Post",
      body: "Test body",
      subreddit: subredditId,
      authorId,
    });
    return { authorId, subredditId, postId };
  });
}
