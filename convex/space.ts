import {mutation, query} from "./_generated/server"
import { getCurrentUserOrCreate } from "./users"
import {ConvexError, v} from "convex/values"
import { getEnrichedPosts } from "./post"

export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),

    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrCreate(ctx)
        const spaces = await ctx.db.query("space").collect()
        if(spaces.some((s) => s.name === args.name)) {
            throw new ConvexError({message: "Space already exists."})
        }
        await ctx.db.insert("space", {
            name: args.name,
            description: args.description,
            authorId: user._id
        })
    }
})

export const get = query({
    args: {name: v.string()},
    handler: async(ctx, args) => {
        const space = await ctx.db
        .query("space")
        .filter((q) => q.eq(q.field("name"), args.name))
        .unique();
        if(!space) return null

        const posts = await ctx.db
        .query("post")
        .withIndex("bySpace", (q) => q.eq("space", space._id))
        .collect();

        const enrichedPosts = await getEnrichedPosts(ctx, posts)

        return {...space, posts: enrichedPosts};
    }
})

export const search = query({
    args: {queryStr: v.string()},
    handler: async (ctx, args) => {
        if (!args.queryStr) return []

        const spaces = await ctx.db.query("space").withSearchIndex("search_body", (q) => q.search("name", args.queryStr))
        .take(10);

        return spaces.map((space) => {
            return {...space, type: "community", title: space.name}
        })
    }
})
