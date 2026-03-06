import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, getCurrentUserOrCreate } from "./users";
import { ConvexError } from "convex/values";

// Returns next Sunday at 23:59:59 UTC
function nextSundayMidnight(): number {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sun, 6 = Sat
    const daysUntilSunday = day === 0 ? 7 : 7 - day;
    const sunday = new Date(now);
    sunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
    sunday.setUTCHours(23, 59, 59, 0);
    return sunday.getTime();
}

function computeExpiresAt(
    duration: string,
    customDays?: number
): number {
    const now = Date.now();
    const day = 86_400_000;
    switch (duration) {
        case "week":    return now + 7 * day;
        case "weekend": return nextSundayMidnight();
        case "2d":      return now + 2 * day;
        case "3d":      return now + 3 * day;
        case "5d":      return now + 5 * day;
        case "custom":  return now + (customDays ?? 1) * day;
        default:        return now + 7 * day;
    }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getLocationStatuses = query({
    args: {},
    handler: async (ctx) => {
        const rows = await ctx.db.query("user_locations").collect();
        const now = Date.now();
        return rows.map((row) => {
            const traveling =
                row.travelLocation !== undefined &&
                row.expiresAt !== undefined &&
                row.expiresAt > now;
            return {
                ...row,
                travelLocation: traveling ? row.travelLocation : undefined,
                expiresAt: traveling ? row.expiresAt : undefined,
            };
        });
    },
});

export const getMyLocationStatus = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;
        return await ctx.db
            .query("user_locations")
            .withIndex("byUserId", (q) => q.eq("userId", user._id))
            .unique();
    },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const setHomeCity = mutation({
    args: { homeLocation: v.string() },
    handler: async (ctx, { homeLocation }) => {
        const trimmed = homeLocation.trim();
        if (!trimmed) {
            throw new ConvexError("Home city cannot be empty.");
        }
        const user = await getCurrentUserOrCreate(ctx);
        const existing = await ctx.db
            .query("user_locations")
            .withIndex("byUserId", (q) => q.eq("userId", user._id))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, { homeLocation: trimmed, username: user.username });
        } else {
            await ctx.db.insert("user_locations", {
                userId: user._id,
                username: user.username,
                homeLocation: trimmed,
            });
        }
    },
});

export const setTravelStatus = mutation({
    args: {
        travelLocation: v.string(),
        duration: v.union(
            v.literal("week"),
            v.literal("weekend"),
            v.literal("2d"),
            v.literal("3d"),
            v.literal("5d"),
            v.literal("custom")
        ),
        customDays: v.optional(v.number()),
    },
    handler: async (ctx, { travelLocation, duration, customDays }) => {
        const trimmed = travelLocation.trim();
        if (!trimmed) {
            throw new ConvexError("Location cannot be empty.");
        }
        if (duration === "custom") {
            const days = customDays ?? 0;
            if (!Number.isInteger(days) || days < 1 || days > 30) {
                throw new ConvexError("Custom duration must be between 1 and 30 days.");
            }
        }
        const user = await getCurrentUserOrCreate(ctx);
        const existing = await ctx.db
            .query("user_locations")
            .withIndex("byUserId", (q) => q.eq("userId", user._id))
            .unique();
        const expiresAt = computeExpiresAt(duration, customDays);
        if (existing) {
            await ctx.db.patch(existing._id, { travelLocation: trimmed, expiresAt });
        } else {
            // User hasn't set a home city yet — shouldn't happen in normal flow,
            // but handle gracefully by using location as placeholder home
            await ctx.db.insert("user_locations", {
                userId: user._id,
                username: user.username,
                homeLocation: trimmed,
                travelLocation: trimmed,
                expiresAt,
            });
        }
    },
});

export const clearTravelStatus = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserOrCreate(ctx);
        const existing = await ctx.db
            .query("user_locations")
            .withIndex("byUserId", (q) => q.eq("userId", user._id))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, {
                travelLocation: undefined,
                expiresAt: undefined,
            });
        }
    },
});
