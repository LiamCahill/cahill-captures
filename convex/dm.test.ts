import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setupUsers(t: ReturnType<typeof convexTest>) {
    return t.run(async (ctx) => {
        const aliceId = await ctx.db.insert("users", {
            username: "alice",
            externalId: "user_alice",
        });
        const bobId = await ctx.db.insert("users", {
            username: "bob",
            externalId: "user_bob",
        });
        return { aliceId, bobId };
    });
}

// ─── sendMessage ──────────────────────────────────────────────────────────────

test("sendMessage creates a message and upserts a conversation", async () => {
    const t = convexTest(schema, modules);
    const { bobId } = await setupUsers(t);

    await t
        .withIdentity({ subject: "user_alice" })
        .mutation(api.dm.sendMessage, { recipientUserId: bobId, content: "Hello Bob!" });

    const message = await t.run((ctx) =>
        ctx.db.query("messages").first()
    );
    expect(message).not.toBeNull();
    expect(message?.content).toBe("Hello Bob!");
    expect(message?.isRead).toBe(false);

    const convo = await t.run((ctx) =>
        ctx.db.query("conversations").first()
    );
    expect(convo).not.toBeNull();
    expect(convo?.lastMessageContent).toBe("Hello Bob!");
});

test("sendMessage updates an existing conversation record", async () => {
    const t = convexTest(schema, modules);
    const { bobId } = await setupUsers(t);
    const asAlice = t.withIdentity({ subject: "user_alice" });

    await asAlice.mutation(api.dm.sendMessage, { recipientUserId: bobId, content: "First message" });
    await asAlice.mutation(api.dm.sendMessage, { recipientUserId: bobId, content: "Second message" });

    const convos = await t.run((ctx) => ctx.db.query("conversations").collect());
    expect(convos.length).toBe(1);
    expect(convos[0].lastMessageContent).toBe("Second message");
});

test("sendMessage rejects empty content", async () => {
    const t = convexTest(schema, modules);
    const { bobId } = await setupUsers(t);

    await expect(
        t.withIdentity({ subject: "user_alice" })
            .mutation(api.dm.sendMessage, { recipientUserId: bobId, content: "   " })
    ).rejects.toThrow();
});

test("sendMessage is rejected when recipient has blocked sender", async () => {
    const t = convexTest(schema, modules);
    const { aliceId, bobId } = await setupUsers(t);

    // Bob blocks Alice
    await t.run((ctx) =>
        ctx.db.insert("blocks", { blockerId: bobId, blockedUserId: aliceId })
    );

    await expect(
        t.withIdentity({ subject: "user_alice" })
            .mutation(api.dm.sendMessage, { recipientUserId: bobId, content: "Hello!" })
    ).rejects.toThrow();
});

// ─── getConversations ─────────────────────────────────────────────────────────

test("getConversations returns empty array when no conversations exist", async () => {
    const t = convexTest(schema, modules);
    await setupUsers(t);

    const convos = await t
        .withIdentity({ subject: "user_alice" })
        .query(api.dm.getConversations, {});

    expect(convos).toEqual([]);
});

test("getConversations returns conversations for both user1 and user2", async () => {
    const t = convexTest(schema, modules);
    const { bobId } = await setupUsers(t);

    await t
        .withIdentity({ subject: "user_alice" })
        .mutation(api.dm.sendMessage, { recipientUserId: bobId, content: "Hey!" });

    const aliceConvos = await t
        .withIdentity({ subject: "user_alice" })
        .query(api.dm.getConversations, {});

    const bobConvos = await t
        .withIdentity({ subject: "user_bob" })
        .query(api.dm.getConversations, {});

    expect(aliceConvos.length).toBe(1);
    expect(aliceConvos[0].otherUser.username).toBe("bob");
    expect(bobConvos.length).toBe(1);
    expect(bobConvos[0].otherUser.username).toBe("alice");
});

test("getConversations unread count reflects only unread messages in that thread", async () => {
    const t = convexTest(schema, modules);
    const { bobId } = await setupUsers(t);

    // Alice sends 2 messages to Bob (Bob has 2 unread)
    await t.withIdentity({ subject: "user_alice" })
        .mutation(api.dm.sendMessage, { recipientUserId: bobId, content: "Message 1" });
    await t.withIdentity({ subject: "user_alice" })
        .mutation(api.dm.sendMessage, { recipientUserId: bobId, content: "Message 2" });

    const bobConvos = await t
        .withIdentity({ subject: "user_bob" })
        .query(api.dm.getConversations, {});

    expect(bobConvos[0].unreadCount).toBe(2);
});

// ─── markConversationAsRead ───────────────────────────────────────────────────

test("markConversationAsRead marks all unread messages from sender as read", async () => {
    const t = convexTest(schema, modules);
    const { aliceId, bobId } = await setupUsers(t);

    await t.run((ctx) =>
        Promise.all([
            ctx.db.insert("messages", { senderId: aliceId, recipientId: bobId, content: "Hi", isRead: false }),
            ctx.db.insert("messages", { senderId: aliceId, recipientId: bobId, content: "There", isRead: false }),
        ])
    );

    await t
        .withIdentity({ subject: "user_bob" })
        .mutation(api.dm.markConversationAsRead, { otherUserId: aliceId });

    const unread = await t.run((ctx) =>
        ctx.db.query("messages")
            .withIndex("byUnreadRecipient", (q) => q.eq("recipientId", bobId).eq("isRead", false))
            .collect()
    );
    expect(unread.length).toBe(0);
});

test("markConversationAsRead does not affect messages in other conversations", async () => {
    const t = convexTest(schema, modules);
    const { aliceId, bobId } = await setupUsers(t);
    const charlieId = await t.run((ctx) =>
        ctx.db.insert("users", { username: "charlie", externalId: "user_charlie" })
    );

    await t.run((ctx) =>
        Promise.all([
            ctx.db.insert("messages", { senderId: aliceId, recipientId: bobId, content: "From Alice", isRead: false }),
            ctx.db.insert("messages", { senderId: charlieId, recipientId: bobId, content: "From Charlie", isRead: false }),
        ])
    );

    // Bob marks Alice's thread as read
    await t
        .withIdentity({ subject: "user_bob" })
        .mutation(api.dm.markConversationAsRead, { otherUserId: aliceId });

    const stillUnread = await t.run((ctx) =>
        ctx.db.query("messages")
            .withIndex("byUnreadRecipient", (q) => q.eq("recipientId", bobId).eq("isRead", false))
            .collect()
    );
    // Charlie's message should still be unread
    expect(stillUnread.length).toBe(1);
    expect(stillUnread[0].senderId).toBe(charlieId);
});

// ─── toggleBlockUser ──────────────────────────────────────────────────────────

test("toggleBlockUser creates a block record", async () => {
    const t = convexTest(schema, modules);
    const { bobId } = await setupUsers(t);

    const result = await t
        .withIdentity({ subject: "user_alice" })
        .mutation(api.dm.toggleBlockUser, { userId: bobId });

    expect(result.blocked).toBe(true);

    const block = await t.run((ctx) =>
        ctx.db.query("blocks").withIndex("byBlocker").first()
    );
    expect(block).not.toBeNull();
});

test("toggleBlockUser removes an existing block (unblock)", async () => {
    const t = convexTest(schema, modules);
    const { bobId } = await setupUsers(t);
    const asAlice = t.withIdentity({ subject: "user_alice" });

    await asAlice.mutation(api.dm.toggleBlockUser, { userId: bobId });
    const result = await asAlice.mutation(api.dm.toggleBlockUser, { userId: bobId });

    expect(result.blocked).toBe(false);

    const block = await t.run((ctx) =>
        ctx.db.query("blocks").first()
    );
    expect(block).toBeNull();
});

test("toggleBlockUser rejects self-blocking", async () => {
    const t = convexTest(schema, modules);
    const { aliceId } = await setupUsers(t);

    await expect(
        t.withIdentity({ subject: "user_alice" })
            .mutation(api.dm.toggleBlockUser, { userId: aliceId })
    ).rejects.toThrow();
});

test("block is one-directional: blocker can still message blocked user", async () => {
    const t = convexTest(schema, modules);
    const { aliceId, bobId } = await setupUsers(t);

    // Alice blocks Bob
    await t.run((ctx) =>
        ctx.db.insert("blocks", { blockerId: aliceId, blockedUserId: bobId })
    );

    // Bob sending to Alice should fail (Alice blocked Bob)
    await expect(
        t.withIdentity({ subject: "user_bob" })
            .mutation(api.dm.sendMessage, { recipientUserId: aliceId, content: "Hi Alice" })
    ).rejects.toThrow();

    // Alice sending to Bob should succeed (Bob hasn't blocked Alice)
    await expect(
        t.withIdentity({ subject: "user_alice" })
            .mutation(api.dm.sendMessage, { recipientUserId: bobId, content: "Hi Bob" })
    ).resolves.not.toThrow();
});
