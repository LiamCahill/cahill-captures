import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { makeTestClient, seedPost } from "./helpers";

test("post author can delete their own post", async () => {
  const t = makeTestClient();
  const { postId } = await seedPost(t, {
    authorExternalId: "user-alice",
    authorUsername: "alice",
  });

  const asAlice = t.withIdentity({ subject: "user-alice", name: "alice" });
  await asAlice.mutation(api.post.deletePost, { id: postId });

  const deleted = await t.run(async (ctx) => ctx.db.get(postId));
  expect(deleted).toBeNull();
});

test("non-author cannot delete a post", async () => {
  const t = makeTestClient();
  const { postId } = await seedPost(t, {
    authorExternalId: "user-alice",
    authorUsername: "alice",
  });

  // Bob has a different subject, so getCurrentUserOrCreate creates a different user
  const asBob = t.withIdentity({ subject: "user-bob", name: "bob" });

  await expect(
    asBob.mutation(api.post.deletePost, { id: postId })
  ).rejects.toThrow();
});
