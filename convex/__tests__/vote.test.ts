import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { makeTestClient, seedPost } from "./helpers";

test("first upvote is recorded", async () => {
  const t = makeTestClient();
  const { postId } = await seedPost(t, {
    authorExternalId: "user-author",
    authorUsername: "author",
  });

  const asVoter = t.withIdentity({ subject: "user-voter", name: "voter" });
  await asVoter.mutation(api.vote.toggleUpvote, { postId });

  const hasVoted = await asVoter.query(api.vote.hasUpvoted, { postId });
  expect(hasVoted).toBe(true);
});

test("upvoting twice toggles the vote off", async () => {
  const t = makeTestClient();
  const { postId } = await seedPost(t, {
    authorExternalId: "user-author",
    authorUsername: "author",
  });

  const asVoter = t.withIdentity({ subject: "user-voter", name: "voter" });
  await asVoter.mutation(api.vote.toggleUpvote, { postId });
  await asVoter.mutation(api.vote.toggleUpvote, { postId }); // toggle off

  const hasVoted = await asVoter.query(api.vote.hasUpvoted, { postId });
  expect(hasVoted).toBe(false);
});

test("switching from upvote to downvote removes upvote and creates downvote", async () => {
  const t = makeTestClient();
  const { postId } = await seedPost(t, {
    authorExternalId: "user-author",
    authorUsername: "author",
  });

  const asVoter = t.withIdentity({ subject: "user-voter", name: "voter" });
  await asVoter.mutation(api.vote.toggleUpvote, { postId });
  await asVoter.mutation(api.vote.toggleDownvote, { postId }); // switch

  const hasUpvoted = await asVoter.query(api.vote.hasUpvoted, { postId });
  const hasDownvoted = await asVoter.query(api.vote.hasDownvoted, { postId });
  expect(hasUpvoted).toBe(false);
  expect(hasDownvoted).toBe(true);
});

test("switching from downvote to upvote removes downvote and creates upvote", async () => {
  const t = makeTestClient();
  const { postId } = await seedPost(t, {
    authorExternalId: "user-author",
    authorUsername: "author",
  });

  const asVoter = t.withIdentity({ subject: "user-voter", name: "voter" });
  await asVoter.mutation(api.vote.toggleDownvote, { postId });
  await asVoter.mutation(api.vote.toggleUpvote, { postId }); // switch

  const hasUpvoted = await asVoter.query(api.vote.hasUpvoted, { postId });
  const hasDownvoted = await asVoter.query(api.vote.hasDownvoted, { postId });
  expect(hasUpvoted).toBe(true);
  expect(hasDownvoted).toBe(false);
});
