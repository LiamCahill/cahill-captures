import {query} from "./_generated/server"
import {v} from "convex/values"
import {counts} from "./counter"
import voteKey from "./vote"

export const getTopSpacesToday = query({
    args: {},
    handler: async (ctx) => {
        const oneDayAgo = Date.now() - 1000 * 60 * 60 * 24
        const posts = await ctx.db.query("post")
            .withIndex("by_creation_time")
            .filter(q => q.gt(q.field("_creationTime"), oneDayAgo))
            .collect()

        const countMap = new Map<string, { id: typeof posts[0]["space"], count: number }>()
        for (const post of posts) {
            if (!post.space) continue
            const key = post.space as string
            const entry = countMap.get(key)
            if (entry) {
                entry.count++
            } else {
                countMap.set(key, { id: post.space, count: 1 })
            }
        }

        const sorted = [...countMap.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        return await Promise.all(
            sorted.map(async ({ id, count }) => {
                const space = id ? await ctx.db.get(id) : null
                return { name: space?.name ?? "[deleted]", postCount: count }
            })
        )
    }
})

export const getTopPosts = query({
    args: {limit: v.optional(v.number())},
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10

        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24)
        const posts = await ctx.db.query("post").withIndex("by_creation_time")
        .filter(q => q.gt(q.field("_creationTime"), oneDayAgo.getTime())).collect();

        const postWithScores = await Promise.all(
            posts.map(async (post) => {
                const upvotes = await counts.count(ctx, voteKey(post._id, "upvote"))
                const downvotes = await counts.count(ctx, voteKey(post._id, "downvote"))

                const author = await ctx.db.get(post.authorId)
                const space = post.space ? await ctx.db.get(post.space) : null

                return {
                    ...post,
                    score: upvotes - downvotes,
                    upvotes,
                    downvotes,
                    author: {username: author?.username ?? "[deleted]"},
                    space: {name: space?.name ?? "[deleted]"}
                }
            })
        )
        return postWithScores.sort((a, b) => b.score - a.score).slice(0, limit);
    }
})
