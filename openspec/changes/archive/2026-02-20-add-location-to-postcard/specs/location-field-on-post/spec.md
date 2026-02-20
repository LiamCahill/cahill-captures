## ADDED Requirements

### Requirement: Users can enter location when creating a post
The system SHALL accept an optional location input from users during post creation and store it with the post.

#### Scenario: User enters location during post creation
- **WHEN** a user fills in the location field on the SubmitPage form and submits the post
- **THEN** the location text is stored with the post in the database

#### Scenario: User skips location field
- **WHEN** a user submits a post without entering a location
- **THEN** the post is created successfully with no location data (field remains empty/null)

#### Scenario: Location is persisted correctly
- **WHEN** a post with location is retrieved from the database
- **THEN** the location field contains the exact text the user entered

