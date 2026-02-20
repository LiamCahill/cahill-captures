# post-creation Specification

## Purpose
TBD - created by archiving change add-location-to-postcard. Update Purpose after archive.
## Requirements
### Requirement: Create post
The system SHALL accept post creation requests including title, subreddit, content, images, and an optional location field.

#### Scenario: Create post with location
- **WHEN** a user submits a post creation request with location data included
- **THEN** the post is created and stored with the location information

#### Scenario: Create post without location
- **WHEN** a user submits a post creation request without location data
- **THEN** the post is created successfully with an empty/null location field

#### Scenario: Location is optional in API
- **WHEN** a backend API call creates a post
- **THEN** the location parameter is optional and does not cause errors if omitted

