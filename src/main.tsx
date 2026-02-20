import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import faviconUrl from "./assets/cahill-captures.png";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Set favicon
const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
if (favicon) {
  favicon.href = faviconUrl;
}

if (!convexUrl) {
  console.error("VITE_CONVEX_URL environment variable is not set");
}

if (!clerkPublishableKey) {
  console.error("VITE_CLERK_PUBLISHABLE_KEY environment variable is not set");
}

const convex = new ConvexReactClient(convexUrl as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>,
);