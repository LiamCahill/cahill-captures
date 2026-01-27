import { internalMutation, mutation, query, QueryCtx } from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator, ConvexError } from "convex/values";
import { counts, postCountKey } from "./counter";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const userAttributes = {
      username: data.username || "",
      externalId: data.id,
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new ConvexError({message: "You must be signed in to perform this action."});
  }
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) {
    throw new ConvexError({
      message: "Your user account hasn't been synced yet. Please try signing out and signing back in, or contact support if the issue persists."
    });
  } 
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  const user = await userByExternalId(ctx, identity.subject);
  if (!user) {
    console.warn(`User not found in database for Clerk ID: ${identity.subject}. Webhook may not have run yet.`);
  }
  return user;
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique();
}

export const getPublicUser = query({
  args: {username: v.string()},
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("byUsername", (q) => q.eq("username", args.username)).unique()
  
  if(!user) return {posts: 0}
     const postCount = await counts.count(ctx, postCountKey(user._id))
     return {
      posts: postCount
     }
  },
})

// Manual sync mutation for debugging/recovery
export const syncCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({message: "Not authenticated"});
    }
    
    // Check if user already exists
    const existingUser = await userByExternalId(ctx, identity.subject);
    if (existingUser) {
      return {message: "User already exists", userId: existingUser._id};
    }
    
    // Create user record manually
    const userId = await ctx.db.insert("users", {
      username: identity.name || identity.email || "",
      externalId: identity.subject,
    });
    
    return {message: "User created", userId};
  },
});