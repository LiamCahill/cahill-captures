## ADDED Requirements

### Requirement: Users can manually enter location text
The system SHALL provide a text input field for users to manually enter their location when creating a post.

#### Scenario: Location input field is available
- **WHEN** a user opens the post creation form (SubmitPage)
- **THEN** a location input field is visible and ready for input

#### Scenario: User can type location text
- **WHEN** a user clicks the location field and types text
- **THEN** the text is accepted and displayed in the input field

#### Scenario: Location input has reasonable length limit
- **WHEN** a user attempts to enter location text
- **THEN** the system accepts up to 100 characters (reasonable limit for place names and descriptions)


