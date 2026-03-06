import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        username: v.string(),
        externalId: v.string(),
    })
    .index("byExternalId", ["externalId"])
    .index("byUsername", ["username"]),
    strava_connections: defineTable({
        userId: v.id("users"),
        athleteId: v.number(),
        accessToken: v.string(),
        refreshToken: v.string(),
        expiresAt: v.number(),
        athleteName: v.string(),
        status: v.union(v.literal("connected"), v.literal("invalid")),
    })
    .index("byUserId", ["userId"])
    .index("byAthleteId", ["athleteId"]),
    strava_activities: defineTable({
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
    })
    .index("byUserId", ["userId"]),
    user_locations: defineTable({
        userId: v.id("users"),
        username: v.string(),
        homeLocation: v.string(),
        travelLocation: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
    })
    .index("byUserId", ["userId"]),
    space: defineTable ({
        name: v.string(),
        description: v.optional(v.string()),
        authorId: v.id("users")
    }).searchIndex("search_body", {searchField: "name"}),
    post: defineTable ({
        subject: v.string(),
        body: v.string(),
        space: v.id("space"),
        authorId: v.id("users"),
        image: v.optional(v.id("_storage")),
        location: v.optional(v.string())
    })
    .index("bySpace", ["space"])
    .index("byAuthor", ["authorId"])
    .searchIndex("search_body", {searchField: "subject", filterFields: ["space"]}),
    comments: defineTable({
        content: v.string(),
        postId: v.id("post"),
        authorId: v.id("users")
    }).index("byPost", ["postId"]),
    downvote: defineTable({
        postId: v.id("post"),
        userId: v.id("users")
    })
    .index("byPost",["postId"])
    .index("byUser", ["userId"]),
    upvote: defineTable({
        postId: v.id("post"),
        userId: v.id("users")
    })
    .index("byPost",["postId"])
    .index("byUser", ["userId"])

});
