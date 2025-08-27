import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
//const clerkPublishableKey = "pk_live_Y2xlcmsuY2FoaWxsY2FwdHVyZXMuc3BhY2Uk";
const clerkPublishableKey = "pk_test_bm90ZWQtYXBlLTI4LmNsZXJrLmFjY291bnRzLmRldiQ";

if (!convexUrl) {
  console.error("VITE_CONVEX_URL environment variable is not set");
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