import { v } from "convex/values";
import {
    internalMutation,
    internalQuery,
    internalAction,
    query,
    mutation,
    action,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser, getCurrentUserOrCreate } from "./users";

// ─── Internal Mutations ───────────────────────────────────────────────────────

export const saveConnection = internalMutation({
    args: {
        userId: v.id("users"),
        athleteId: v.number(),
        accessToken: v.string(),
        refreshToken: v.string(),
        expiresAt: v.number(),
        athleteName: v.string(),
        status: v.union(v.literal("connected"), v.literal("invalid")),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("strava_connections")
            .withIndex("byUserId", (q) => q.eq("userId", args.userId))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("strava_connections", args);
        }
    },
});

export const updateConnectionTokens = internalMutation({
    args: {
        userId: v.id("users"),
        accessToken: v.string(),
        refreshToken: v.string(),
        expiresAt: v.number(),
    },
    handler: async (ctx, { userId, accessToken, refreshToken, expiresAt }) => {
        const connection = await ctx.db
            .query("strava_connections")
            .withIndex("byUserId", (q) => q.eq("userId", userId))
            .unique();
        if (connection) {
            await ctx.db.patch(connection._id, { accessToken, refreshToken, expiresAt });
        }
    },
});

export const markConnectionInvalid = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const connection = await ctx.db
            .query("strava_connections")
            .withIndex("byUserId", (q) => q.eq("userId", userId))
            .unique();
        if (connection) {
            await ctx.db.patch(connection._id, { status: "invalid" });
        }
    },
});

export const upsertActivity = internalMutation({
    args: {
        userId: v.id("users"),
        username: v.string(),
        activityId: v.number(),
        name: v.string(),
        type: v.string(),
        distanceMeters: v.number(),
        movingTimeSecs: v.number(),
        locationCity: v.optional(v.string()),
        locationState: v.optional(v.string()),
        startDate: v.number(),
        cachedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("strava_activities")
            .withIndex("byUserId", (q) => q.eq("userId", args.userId))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("strava_activities", args);
        }
    },
});

// ─── Internal Queries ─────────────────────────────────────────────────────────

export const getAllValidConnections = internalQuery({
    args: {},
    handler: async (ctx) => {
        const all = await ctx.db.query("strava_connections").collect();
        return all.filter((c) => c.status !== "invalid");
    },
});

export const getUserByExternalId = internalQuery({
    args: { externalId: v.string() },
    handler: async (ctx, { externalId }) => {
        return await ctx.db
            .query("users")
            .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
            .unique();
    },
});

export const getUserById = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        return await ctx.db.get(userId);
    },
});

// ─── Public Queries ───────────────────────────────────────────────────────────

export const getMyConnectionStatus = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return "none" as const;
        const connection = await ctx.db
            .query("strava_connections")
            .withIndex("byUserId", (q) => q.eq("userId", user._id))
            .unique();
        if (!connection) return "none" as const;
        return connection.status;
    },
});

export const getRecentActivities = query({
    args: {},
    handler: async (ctx) => {
        const activities = await ctx.db.query("strava_activities").collect();
        return activities.sort((a, b) => b.startDate - a.startDate);
    },
});

// ─── Public Mutations ─────────────────────────────────────────────────────────

export const disconnectStrava = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserOrCreate(ctx);
        const connection = await ctx.db
            .query("strava_connections")
            .withIndex("byUserId", (q) => q.eq("userId", user._id))
            .unique();
        if (connection) await ctx.db.delete(connection._id);
        const activity = await ctx.db
            .query("strava_activities")
            .withIndex("byUserId", (q) => q.eq("userId", user._id))
            .unique();
        if (activity) await ctx.db.delete(activity._id);
    },
});

// ─── Public Actions ───────────────────────────────────────────────────────────

export const exchangeCodeForTokens = action({
    args: { code: v.string() },
    handler: async (ctx, { code }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const tokenRes = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
            }),
        });
        if (!tokenRes.ok) {
            throw new Error(`Strava token exchange failed: ${tokenRes.status}`);
        }

        const data = await tokenRes.json();
        const user = await ctx.runQuery(internal.strava.getUserByExternalId, {
            externalId: identity.subject,
        });
        if (!user) throw new Error("User not found");

        await ctx.runMutation(internal.strava.saveConnection, {
            userId: user._id,
            athleteId: data.athlete.id,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at * 1000,
            athleteName: `${data.athlete.firstname} ${data.athlete.lastname}`,
            status: "connected",
        });
    },
});

// ─── Internal Actions ─────────────────────────────────────────────────────────

export const syncAllAthletes = internalAction({
    args: {},
    handler: async (ctx) => {
        const connections = await ctx.runQuery(internal.strava.getAllValidConnections, {});

        for (const connection of connections) {
            try {
                let accessToken = connection.accessToken;

                // Refresh token if expired
                if (Date.now() >= connection.expiresAt) {
                    const refreshRes = await fetch("https://www.strava.com/oauth/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            client_id: process.env.STRAVA_CLIENT_ID,
                            client_secret: process.env.STRAVA_CLIENT_SECRET,
                            refresh_token: connection.refreshToken,
                            grant_type: "refresh_token",
                        }),
                    });
                    if (!refreshRes.ok) {
                        await ctx.runMutation(internal.strava.markConnectionInvalid, {
                            userId: connection.userId,
                        });
                        continue;
                    }
                    const refreshData = await refreshRes.json();
                    accessToken = refreshData.access_token;
                    await ctx.runMutation(internal.strava.updateConnectionTokens, {
                        userId: connection.userId,
                        accessToken: refreshData.access_token,
                        refreshToken: refreshData.refresh_token,
                        expiresAt: refreshData.expires_at * 1000,
                    });
                }

                // Fetch most recent activity
                const activitiesRes = await fetch(
                    "https://www.strava.com/api/v3/athlete/activities?per_page=1",
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                if (activitiesRes.status === 401) {
                    await ctx.runMutation(internal.strava.markConnectionInvalid, {
                        userId: connection.userId,
                    });
                    continue;
                }
                if (!activitiesRes.ok) continue;

                const activities = await activitiesRes.json();
                if (!activities.length) continue;

                const activity = activities[0];
                let locationCity: string | undefined;
                let locationState: string | undefined;

                // Reverse geocode start location
                if (Array.isArray(activity.start_latlng) && activity.start_latlng.length === 2) {
                    const [lat, lon] = activity.start_latlng;
                    const geoRes = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
                        { headers: { "User-Agent": "CahillCaptures/1.0" } }
                    );
                    if (geoRes.ok) {
                        const geo = await geoRes.json();
                        locationCity =
                            geo.address?.city ||
                            geo.address?.town ||
                            geo.address?.village ||
                            undefined;
                        locationState = geo.address?.state || undefined;
                    }
                }

                const user = await ctx.runQuery(internal.strava.getUserById, {
                    userId: connection.userId,
                });
                const username = user?.username ?? connection.athleteName;

                await ctx.runMutation(internal.strava.upsertActivity, {
                    userId: connection.userId,
                    username,
                    activityId: activity.id,
                    name: activity.name,
                    type: activity.type,
                    distanceMeters: activity.distance,
                    movingTimeSecs: activity.moving_time,
                    locationCity,
                    locationState,
                    startDate: new Date(activity.start_date).getTime(),
                    cachedAt: Date.now(),
                });
            } catch (err) {
                console.error(`Error syncing athlete ${connection.athleteId}:`, err);
            }

            // Respect Nominatim rate limit: 1 req/sec between athletes
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    },
});
