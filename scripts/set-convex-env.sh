#!/bin/bash
# Helper script to set Convex environment variables for different projects
# Usage: ./scripts/set-convex-env.sh <project-name> <clerk-domain>

PROJECT_NAME=$1
CLERK_DOMAIN=$2

if [ -z "$PROJECT_NAME" ] || [ -z "$CLERK_DOMAIN" ]; then
  echo "Usage: ./scripts/set-convex-env.sh <project-name> <clerk-domain>"
  echo "Example: ./scripts/set-convex-env.sh project1 https://project1.clerk.accounts.dev"
  exit 1
fi

echo "Setting Convex environment variables for project: $PROJECT_NAME"
echo "Clerk Domain: $CLERK_DOMAIN"
echo ""

# Set the environment variables
npx convex env set CLERK_JWT_ISSUER_DOMAIN "$CLERK_DOMAIN"

echo ""
echo "✅ Environment variables set for $PROJECT_NAME"
echo "Current Convex environment variables:"
npx convex env list
