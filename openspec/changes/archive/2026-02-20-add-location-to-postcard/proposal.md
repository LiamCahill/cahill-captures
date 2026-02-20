## Why

Users want to share the geographic context of their posts, allowing them to tag where a photo or moment was captured. Currently, there's no way to associate location information with posts, limiting the ability for community members to discover content from specific areas and for users to organize their posts geographically.

## What Changes

- Add a new "Location" field to the post creation form (SubmitPage)
- Store location metadata with each post in the database
- Display location information on post cards in the feed and on individual post pages
- Support manual text entry for location (future: dropdown/autocomplete for common locations)
- Update post schema to include location field

## Capabilities

### New Capabilities
- `location-field-on-post`: Ability to capture and store location data when creating a post
- `location-display-on-postcard`: Display location information on post cards in the feed and post pages
- `manual-location-entry`: Allow users to manually type in their location when creating a post

### Modified Capabilities
- `post-creation`: The post creation form and API will now accept an optional location field
- `post-schema`: The database schema will include a location field for storing location information

## Impact

- **Frontend Components**: SubmitPage component (add location input), PostCard component (display location), PostPage component (display location)
- **Database**: Convex schema.ts (add location field to post schema)
- **API/Backend**: post.ts (update mutation to accept location parameter)
- **Types**: Update post type definitions to include location field
- **Styling**: Minor CSS updates for location display on cards

