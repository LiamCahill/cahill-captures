# Cahill Captures

A Reddit-like application built with React, Convex, and Clerk authentication.

## Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `env.example` to `.env.local`
   - Fill in your Convex and Clerk credentials

3. Start the development server:
```bash
npm run dev
```

## Deployment to Vercel

### Prerequisites
1. Create a Vercel account
2. Set up your Convex deployment
3. Configure Clerk for production

### Environment Variables
Set these environment variables in your Vercel project settings:

- `VITE_CONVEX_URL`: Your Convex deployment URL
- `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_JWT_ISSUER_DOMAIN`: Your Clerk JWT issuer domain (for Convex backend)
- `CLERK_WEBHOOK_SECRET`: Your Clerk webhook secret (for Convex backend)

### Deployment Steps
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Vite configuration
3. The build will use the `vercel.json` configuration
4. Deploy!

### Clerk Configuration for Production
1. In your Clerk dashboard, add your Vercel domain to allowed origins
2. Update your Clerk application settings for production
3. Ensure webhooks are configured for your production domain

## Features
- User authentication with Clerk
- Real-time data with Convex
- Reddit-style post and comment system
- Image upload support
- Search functionality
- User profiles and subreddits
