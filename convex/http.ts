import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    console.log("Webhook received at /clerk-users-webhook");
    const event = await validateRequest(request);
    if (!event) {
      console.error("Webhook validation failed");
      return new Response("Error occured", { status: 400 });
    }
    console.log(`Processing webhook event: ${event.type} for user: ${event.data.id}`);
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        console.log(`Successfully processed ${event.type} for user: ${event.data.id}`);
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        console.log(`Successfully deleted user: ${clerkUserId}`);
        break;
      }
      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/feed.xml",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const posts = await ctx.runQuery(api.post.getRecentPosts);

    const items = posts.map((post) => {
      const link = `https://cahillcaptures.space/post/${post._id}`;
      const pubDate = new Date(post._creationTime).toUTCString();
      const enclosure = post.imageUrl
        ? `<enclosure url="${escapeXml(post.imageUrl)}" length="0" type="image/jpeg" />`
        : "";

      const cdataDescription = `<![CDATA[
        <p>${post.body}</p>
        ${post.imageUrl ? `<p><img src="${post.imageUrl}" alt="${post.subject}" /></p>` : ""}
        ${post.location ? `<p>📍 ${post.location}</p>` : ""}
        <p><a href="${link}">View on Cahill Captures →</a></p>
      ]]>`;

      return `
    <item>
      <title>${escapeXml(post.subject)}</title>
      <link>${link}</link>
      <description>${cdataDescription}</description>
      <author>${escapeXml(post.author?.username ?? "unknown")}</author>
      <category>${escapeXml(post.space?.name ?? "")}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
      ${enclosure}
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cahill Captures</title>
    <link>https://cahillcaptures.space/</link>
    <atom:link href="https://cahillcaptures.space/feed.xml" rel="self" type="application/rss+xml" />
    <description>The latest photography captures from the Cahill Captures community</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;