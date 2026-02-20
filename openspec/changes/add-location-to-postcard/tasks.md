## 1. Database Schema Updates

- [x] 1.1 Update convex/schema.ts to add optional `location` field to post type definition

## 2. Backend API Changes

- [x] 2.1 Update convex/post.ts mutation to accept location parameter
- [x] 2.2 Ensure location parameter is optional and properly typed
- [ ] 2.3 Test mutation with and without location data

## 3. Frontend Form Implementation

- [x] 3.1 Add location input field to SubmitPage component
- [x] 3.2 Add location state management to SubmitPage form
- [x] 3.3 Add form validation for location (max 100 characters)
- [x] 3.4 Update form submission to include location in mutation call

## 4. Post Display on Cards

- [x] 4.1 Update PostCard component to accept and display location prop
- [x] 4.2 Add conditional rendering for location (only show if present)
- [x] 4.3 Style location display on PostCard (consistent with existing design)
- [x] 4.4 Update PostCard.css with location styling

## 5. Post Display on Detail Page

- [x] 5.1 Update PostPage component to display location
- [x] 5.2 Add conditional rendering for location (only show if present)
- [x] 5.3 Style location display on PostPage (consistent with design)

## 6. Type Definitions

- [x] 6.1 Update TypeScript types to include location field in Post interface
- [ ] 6.2 Update _generated API types (if applicable)

## 7. Testing & QA

- [ ] 7.1 Test creating post with location
- [ ] 7.2 Test creating post without location
- [ ] 7.3 Test location displays correctly on feed
- [ ] 7.4 Test location displays correctly on post detail page
- [ ] 7.5 Verify existing posts (without location) still display correctly
- [ ] 7.6 Test on mobile/responsive view

