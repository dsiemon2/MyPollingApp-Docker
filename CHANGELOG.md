# Changelog

All notable changes to PollChat Docker are documented here.

## [2.0.0] - 2026-01-14

### Added
- **Poll Types**: 7 different poll types
  - Single Choice (radio buttons)
  - Multiple Choice (checkboxes)
  - Yes/No (binary with optional neutral)
  - Rating Scale (1-5 stars)
  - NPS (0-10 Net Promoter Score)
  - Ranked Choice (preference ranking)
  - Open Text (free response)

- **Admin Panel**
  - Dashboard with stats
  - Poll management (CRUD)
  - Poll types configuration
  - Template management
  - AI providers configuration
  - Voice settings
  - Webhook management
  - Logic rules
  - Custom functions

- **SWR State Management**
  - Auto-refresh polls (5-10 seconds)
  - Auto-refresh messages (3 seconds)
  - Cache invalidation utilities
  - Optimistic updates

- **Vote Input Components**
  - SingleChoiceInput
  - MultipleChoiceInput
  - YesNoInput
  - RatingInput
  - NPSInput
  - RankedInput
  - OpenTextInput

- **Results Display Components**
  - YesNoResults
  - RatingResults
  - NPSResults
  - RankedResults
  - TextResults

- **Documentation**
  - README.md
  - ROADMAP.md
  - CLAUDE.md
  - CHANGELOG.md

### Fixed
- Vote unique constraint removed for multiple choice
- TypeScript type errors in SWR hooks
- Config type assertions in poll detail page

### Changed
- Database from SQLite to PostgreSQL
- Auth from simple to NextAuth
- State from useState to SWR

---

## [1.0.0] - Initial

### Added
- Basic polling functionality
- Single and multiple choice only
- Voice chat
- AI responses

---

## Version Format

Versions follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes (backwards compatible)
