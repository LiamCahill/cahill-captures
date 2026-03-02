import {query} from "./_generated/server"
import {v} from "convex/values"
import {counts} from "./counter"
import voteKey from "./vote"

export const getTopSubredditsToday = query({
    args: {},
    handler: async (ctx) => {
        const oneDayAgo = Date.now() - 1000 * 60 * 60 * 24
        const posts = await ctx.db.query("post")
            .withIndex("by_creation_time")
            .filter(q => q.gt(q.field("_creationTime"), oneDayAgo))
            .collect()

        const countMap = new Map<string, { id: typeof posts[0]["subreddit"], count: number }>()
        for (const post of posts) {
            const key = post.subreddit as string
            const entry = countMap.get(key)
            if (entry) {
                entry.count++
            } else {
                countMap.set(key, { id: post.subreddit, count: 1 })
            }
        }

        const sorted = [...countMap.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        return await Promise.all(
            sorted.map(async ({ id, count }) => {
                const subreddit = await ctx.db.get(id)
                return { name: subreddit?.name ?? "[deleted]", postCount: count }
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
                const subreddit = await ctx.db.get(post.subreddit)

                return {
                    ...post,
                    score: upvotes - downvotes,
                    upvotes,
                    downvotes,
                    author: {username: author?.username ?? "[deleted]"},
                    subreddit: {name: subreddit?.name ?? "[deleted]"}
                }
            })
        )
        return postWithScores.sort((a, b) => b.score - a.score).slice(0, limit);
    }
})