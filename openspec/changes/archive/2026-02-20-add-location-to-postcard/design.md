## Context

The post creation system currently accepts title, subreddit, content, and images, but has no mechanism to capture geographic context. The frontend uses a React-based form (SubmitPage), the backend uses Convex for data persistence, and posts are displayed in multiple components (PostCard, PostPage). Adding location requires coordinated changes across schema, mutations, components, and UI.

## Goals / Non-Goals

**Goals:**
- Capture location metadata when users create posts
- Display location information consistently across post cards and post pages
- Support manual text entry for location
- Maintain backward compatibility (location should be optional)
- Allow future extensibility for autocomplete/dropdown location selection

**Non-Goals:**
- Geolocation API integration (browser location detection) - future enhancement
- Location-based search or filtering - out of scope for this change
- Map visualization - out of scope
- Location validation against external databases - out of scope

## Decisions

### Decision 1: Location as Optional String Field
**Choice**: Store location as an optional text string in the post schema
**Rationale**: Simple to implement, flexible (supports various location formats), and allows future evolution without schema changes
**Alternatives Considered**:
- Structured location object (lat/long + city) - overly complex for MVP; text is more user-friendly
- Required field - would break existing posts and UX; optional is better for gradual adoption

### Decision 2: Input Method - Manual Text Entry (MVP)
**Choice**: Start with a simple text input field on SubmitPage
**Rationale**: Lowest friction for users, no external dependencies, works immediately
**Alternatives Considered**:
- Geolocation API - requires browser permissions and won't always be available
- Dropdown with predefined locations - limits flexibility and requires curated list

### Decision 3: Data Flow Architecture
**Choice**: Pass location from frontend form → Convex mutation → store in post record → fetch and display in components
**Rationale**: Follows existing data patterns in the codebase; minimal architectural change
**Components affected**: SubmitPage (input), post.ts (mutation), PostCard/PostPage (display)

### Decision 4: Display Behavior
**Choice**: Show location on both PostCard and PostPage; don't show if location is empty
**Rationale**: Consistency across the app; conditional rendering keeps UI clean when location absent
**Styling**: Reuse existing component styles where possible; minimal new CSS

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Backward Compatibility**: Existing posts have no location | Optional field ensures old posts display correctly without location |
| **User Experience**: Text entry could have typos/duplicates | MVP is acceptable; future phases can add autocomplete and validation |
| **Performance**: Additional field in post data | Negligible impact; field is a simple string, no new queries needed |
| **Storage**: Location data grows unbounded | No concern for MVP; can add cleanup/archival policies later if needed |

## Migration Plan

1. **Database**: Update Convex schema.ts to add optional `location?: string` field to post type
2. **Backend API**: Update post.ts mutation to accept location parameter (optional, defaults to null/undefined)
3. **Frontend Components**: 
   - Add location input to SubmitPage form
   - Update PostCard to display location if present
   - Update PostPage to display location if present
4. **Deployment**: Standard rollout; no data migration needed (old posts gracefully lack location)
5. **Rollback**: Remove location field from form, keep in schema for reads (graceful degradation)

## Open Questions

- Should location display have any styling (icon, specific placement)? → Defer to design phase
- Should there be location validation (e.g., character limit)? → Start with reasonable defaults (max 100 chars), can refine based on UX
- Future: Should we support location autocomplete via an API? → Design decision for next phase

