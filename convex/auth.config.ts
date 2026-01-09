const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!clerkDomain) {
  throw new Error("CLERK_JWT_ISSUER_DOMAIN environment variable is not set");
}

export default {
    providers: [
      {
        domain: clerkDomain,
        applicationID: "convex",
      },
    ]
  };