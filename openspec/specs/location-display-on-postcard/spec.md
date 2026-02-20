# location-display-on-postcard Specification

## Purpose
TBD - created by archiving change add-location-to-postcard. Update Purpose after archive.
## Requirements
### Requirement: Location displays on post cards
The system SHALL display location information on post cards shown in feeds and list views.

#### Scenario: Post card shows location when present
- **WHEN** a post card is rendered for a post that has a location
- **THEN** the location is displayed on the post card in a clearly visible manner

#### Scenario: Post card hides location when absent
- **WHEN** a post card is rendered for a post without a location
- **THEN** no location element is shown on the post card

#### Scenario: Location is readable and accessible
- **WHEN** a user views a post card with location
- **THEN** the location text is legible and does not obstruct other post information

