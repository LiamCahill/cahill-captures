import {mutation, query, QueryCtx} from "./_generated/server"
import {ConvexError, v} from "convex/values"
import { getCurrentUserOrCreate } from "./users"
import {Doc, Id} from "./_generated/dataModel"
import {counts, postCountKey} from "./counter"

type EnrichedPost = Omit<Doc<"post">, "space"> & {
    author: {username: string} | undefined
    space: {
        _id: Id<"space">;
        name: string;
    } | undefined
    imageUrl?: string
}

const ERROR_MESSAGE = {
    POST_NOT_FOUND: "Post not found",
    SPACE_NOT_FOUND: "Space not found",
    UNAUTHORIZED_DELETE: "You can't delete this post."
}



export const create = mutation({
    args: {
        subject: v.string(),
        body: v.string(),
        space: v.id("space"),
        storageId: v.optional(v.id("_storage")),
        location: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrCreate(ctx)
        const postId = await ctx.db.insert("post", {
            subject: args.subject,
            body: args.body,
            space: args.space,
            authorId: user._id,
            image: args.storageId || undefined,
            location: args.location || undefined
        });
        await counts.inc(ctx, postCountKey(user._id))
        return postId
    },
});

async function getEnrichedPost(ctx: QueryCtx, post: Doc<"post">): Promise<EnrichedPost> {
    const [author, space] = await Promise.all([
        ctx.db.get(post.authorId),
        post.space ? ctx.db.get(post.space) : Promise.resolve(null)
    ])

    const image = post.image && await ctx.storage.getUrl(post.image)

    return {
        ...post,
        author: author? {username: author.username} : undefined,
        space: {
            _id: space!._id,
            name: space!.name
        },
        imageUrl: image ?? undefined
    }
}

export async function getEnrichedPosts(
    ctx: QueryCtx,
    posts: Doc<"post">[]
): Promise<EnrichedPost[]> {
    return Promise.all(posts.map((post) => getEnrichedPost(ctx, post)));
}


export const getPost = query({
    args: {id: v.id("post")},
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id)
        if(!post) return null
        return getEnrichedPost(ctx, post)
    }

})

/* We are first using the space name to get the space's id, then we are using that id to get all its posts. */
export const getSpacePosts = query({
    args: {space: v.string()},
    handler: async (ctx, args): Promise<EnrichedPost[]> => {
        const space = await ctx.db
        .query("space")
        .filter((q) => q.eq(q.field("name"), args.space))
        .unique()

        if(!space) return [];

        const posts = await ctx.db
        .query("post")
        .withIndex("bySpace", (q) => q.eq("space", space._id))
        .collect();

        return getEnrichedPosts(ctx, posts)
    },
})

export const userPosts = query({
    args: {authorUsername: v.string()},
    handler: async (ctx, args): Promise<EnrichedPost[]> => {
        const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("username"), args.authorUsername))
        .unique()

        if(!user) return [];

        const posts = await ctx.db
        .query("post")
        .withIndex("byAuthor", (q) => q.eq("authorId", user._id))
        .collect();

        return getEnrichedPosts(ctx, posts)
    },
})

export const deletePost = mutation({
    args: {id: v.id("post")},
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id);
        if(!post) throw new ConvexError({message: ERROR_MESSAGE.POST_NOT_FOUND})

        const user = await getCurrentUserOrCreate(ctx)
        if(post.authorId != user._id){
            throw new ConvexError({message: ERROR_MESSAGE.UNAUTHORIZED_DELETE})
        }

        await counts.dec(ctx, postCountKey(user._id))
        await ctx.db.delete(args.id)
    }

})

export const getRecentPosts = query({
    args: {},
    handler: async (ctx): Promise<EnrichedPost[]> => {
        const posts = await ctx.db
            .query("post")
            .order("desc")
            .take(20);
        return getEnrichedPosts(ctx, posts);
    },
})

export const search = query({
    args: {queryStr: v.string(), space: v.string()},
    handler: async (ctx, args) => {
        if (args.queryStr) return []

        const spaceObj = await ctx.db.query("space").filter((q) => q.eq(q.field("name"), args.space))
        .unique();

        if (!spaceObj) return [];

        const posts = await ctx.db.query("post").withSearchIndex("search_body", (q) => q.search("subject", args.queryStr)
    .eq("space", spaceObj._id)).take(10);

    return posts.map(post => ({_id: post._id, title: post.subject, type: "post", name: spaceObj.name}))
    }
})
