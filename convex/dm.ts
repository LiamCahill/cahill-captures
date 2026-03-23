import { mutation, query } from "./_generated/server"
import { ConvexError, v } from "convex/values"
import { getCurrentUserOrCreate, getCurrentUserOrThrow } from "./users"

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getUserInfo = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId)
        if (!user) return null
        return { _id: user._id, username: user.username }
    },
})

export const getConversations = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserOrThrow(ctx)

        const asUser1 = await ctx.db
            .query("conversations")
            .withIndex("byUser1", (q) => q.eq("user1Id", user._id))
            .collect()

        const asUser2 = await ctx.db
            .query("conversations")
            .withIndex("byUser2", (q) => q.eq("user2Id", user._id))
            .collect()

        const all = [...asUser1, ...asUser2]
            .sort((a, b) => b.lastMessageTime - a.lastMessageTime)

        return Promise.all(all.map(async (convo) => {
            const otherUserId = convo.user1Id === user._id ? convo.user2Id : convo.user1Id
            const otherUser = await ctx.db.get(otherUserId)

            const unread = await ctx.db
                .query("messages")
                .withIndex("byUnreadRecipient", (q) =>
                    q.eq("recipientId", user._id).eq("isRead", false)
                )
                .filter((q) => q.eq(q.field("senderId"), otherUserId))
                .collect()

            return {
                _id: convo._id,
                otherUser: { _id: otherUserId, username: otherUser?.username ?? "[deleted]" },
                lastMessage: convo.lastMessageContent ?? "",
                lastMessageTime: convo.lastMessageTime,
                unreadCount: unread.length,
            }
        }))
    },
})

export const getConversation = query({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrThrow(ctx)

        // Check if otherUser has blocked the current user
        const blocked = await ctx.db
            .query("blocks")
            .withIndex("byBlocker", (q) => q.eq("blockerId", args.otherUserId))
            .filter((q) => q.eq(q.field("blockedUserId"), user._id))
            .unique()

        if (blocked) {
            throw new ConvexError({ message: "This user has blocked you." })
        }

        const received = await ctx.db
            .query("messages")
            .withIndex("byConversation", (q) =>
                q.eq("senderId", args.otherUserId).eq("recipientId", user._id)
            )
            .order("desc")
            .take(100)

        const sent = await ctx.db
            .query("messages")
            .withIndex("byConversation", (q) =>
                q.eq("senderId", user._id).eq("recipientId", args.otherUserId)
            )
            .order("desc")
            .take(100)

        const otherUser = await ctx.db.get(args.otherUserId)

        return [...received, ...sent]
            .sort((a, b) => a._creationTime - b._creationTime)
            .slice(-50)
            .map((msg) => ({
                ...msg,
                isOwn: msg.senderId === user._id,
                senderUsername: msg.senderId === user._id
                    ? undefined
                    : (otherUser?.username ?? "[deleted]"),
            }))
    },
})

export const getUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserOrThrow(ctx)
        const unread = await ctx.db
            .query("messages")
            .withIndex("byUnreadRecipient", (q) =>
                q.eq("recipientId", user._id).eq("isRead", false)
            )
            .collect()
        return unread.length
    },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

export const sendMessage = mutation({
    args: {
        recipientUserId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const sender = await getCurrentUserOrCreate(ctx)

        if (!args.content.trim()) {
            throw new ConvexError({ message: "Message cannot be empty." })
        }

        // Check if recipient has blocked sender
        const blocked = await ctx.db
            .query("blocks")
            .withIndex("byBlocker", (q) => q.eq("blockerId", args.recipientUserId))
            .filter((q) => q.eq(q.field("blockedUserId"), sender._id))
            .unique()

        if (blocked) {
            throw new ConvexError({ message: "You cannot send messages to this user." })
        }

        await ctx.db.insert("messages", {
            senderId: sender._id,
            recipientId: args.recipientUserId,
            content: args.content.trim(),
            isRead: false,
        })

        // Upsert conversation record (user IDs stored in sorted order)
        const [user1Id, user2Id] = [sender._id, args.recipientUserId].sort() as [typeof sender._id, typeof args.recipientUserId]

        const existing = await ctx.db
            .query("conversations")
            .withIndex("byUser1", (q) => q.eq("user1Id", user1Id))
            .filter((q) => q.eq(q.field("user2Id"), user2Id))
            .unique()

        const preview = args.content.trim().substring(0, 100)
        const now = Date.now()

        if (existing) {
            await ctx.db.patch(existing._id, {
                lastMessageTime: now,
                lastMessageContent: preview,
            })
        } else {
            await ctx.db.insert("conversations", {
                user1Id,
                user2Id,
                lastMessageTime: now,
                lastMessageContent: preview,
            })
        }
    },
})

export const markConversationAsRead = mutation({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrCreate(ctx)

        const unread = await ctx.db
            .query("messages")
            .withIndex("byUnreadRecipient", (q) =>
                q.eq("recipientId", user._id).eq("isRead", false)
            )
            .filter((q) => q.eq(q.field("senderId"), args.otherUserId))
            .collect()

        await Promise.all(unread.map((msg) => ctx.db.patch(msg._id, { isRead: true })))
    },
})

export const toggleBlockUser = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const blocker = await getCurrentUserOrCreate(ctx)

        if (args.userId === blocker._id) {
            throw new ConvexError({ message: "You cannot block yourself." })
        }

        const existing = await ctx.db
            .query("blocks")
            .withIndex("byBlocker", (q) => q.eq("blockerId", blocker._id))
            .filter((q) => q.eq(q.field("blockedUserId"), args.userId))
            .unique()

        if (existing) {
            await ctx.db.delete(existing._id)
            return { blocked: false }
        } else {
            await ctx.db.insert("blocks", {
                blockerId: blocker._id,
                blockedUserId: args.userId,
            })
            return { blocked: true }
        }
    },
})
