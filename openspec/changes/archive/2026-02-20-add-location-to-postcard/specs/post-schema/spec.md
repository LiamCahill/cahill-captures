## ADDED Requirements

### Requirement: Post data model
The system SHALL store posts with the following fields: id, title, subreddit, content, images, createdAt, author, votes, and an optional location field.

#### Scenario: Post schema includes location field
- **WHEN** a post record is defined in the database schema
- **THEN** the schema includes an optional `location` field of type string or null

#### Scenario: Existing posts work without location
- **WHEN** retrieving posts that were created before location feature existed
- **THEN** those posts display correctly without a location value

