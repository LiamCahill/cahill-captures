import {mutation, query} from "./_generated/server"
import {v} from "convex/values"
import { getCurrentUserOrThrow } from "./users"
import {counts, commentCountKey} from "./counter"

export const create = mutation({
    args: {
        content: v.string(),
        postId: v.id("post")
    }, handler: async (ctx, args) => {
        const user = await getCurrentUserOrThrow(ctx)
        await ctx.db.insert("comments", {
            content: args.content,
            postId: args.postId,
            authorId: user._id
        });
        await counts.inc(ctx, commentCountKey(args.postId))
    }
})

export const getComments = query({
    args: {postId: v.id("post")},
    handler: async (ctx, args) => {
        const comments = await ctx.db
        .query("comments")
        .withIndex("byPost", (q) => q.eq("postId", args.postId))
        .collect();
        
        // we are using a set below because it will not allow/automatically remove duplicates in 
        // the case where a use commented multiple times on a post.
        const authorIds = [...new Set(comments.map((comment) => comment.authorId))]
        const authors = await Promise.all(
            authorIds.map((id) => ctx.db.get(id))
        )

        const authorMap = new Map(
            authors.map(author => [author!._id, author!.username])
        )

        return comments.map((comment) => ({
            ...comment,
            author: {
                username: authorMap.get(comment.authorId)
            }
        }))
    },
});

export const getCommentCount = query({
    args: {postId: v.id("post")},
    handler: async (convexToJson, args) => {
        return await counts.count(convexToJson,commentCountKey(args.postId))
    }
})