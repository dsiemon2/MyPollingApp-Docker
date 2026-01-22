# Changelog

All notable changes to MyPollingApp Docker are documented here.

## [2.2.0] - 2026-01-22

### Added
- **Poll Scheduling** - Schedule polls to auto-open and auto-close at specific times
  - Added `scheduledAt` field to Poll model
  - Polls can be created in "draft" or "scheduled" status
  - Cron endpoint `/api/cron/process-polls` for automatic status transitions
  - Admin poll form now includes scheduling options

- **Payment Checkout Flow** - Complete checkout pages for subscription upgrades
  - `/checkout/[planId]` - Payment checkout page with card form
  - `/checkout/success` - Payment success confirmation page
  - `/checkout/cancel` - Payment cancellation page
  - `/api/checkout/create-session` - Stripe session creation
  - `/api/checkout/verify` - Payment verification endpoint

- **Payment Webhooks** - Webhook handlers for all payment providers
  - `/api/webhooks/stripe` - Handles checkout, subscription, and invoice events
  - `/api/webhooks/paypal` - Handles order approval and subscription events
  - `/api/webhooks/braintree` - Handles subscription notifications
  - `/api/webhooks/square` - Handles payment and subscription events
  - `/api/webhooks/authorize` - Handles ARB subscription events

- **Email Notifications** - SMTP email service with professional templates
  - Nodemailer integration for sending emails
  - 9 email templates (welcome, subscription, payment, poll notifications)
  - Welcome email on user registration
  - Payment receipts on successful payments
  - Subscription status emails (activated, cancelled, past due)

### Changed
- Subscribe API now creates real Stripe checkout sessions
- Registration API now sends welcome email and creates default subscription
- Poll creation form includes scheduling UI (start time, end time toggles)
- Vote API validates poll status including scheduling

---

## [2.1.0] - 2026-01-22

### Added
- **AI Chat Slider** - Floating AI assistant on all pages (OpenAI GPT-4o-mini)
- **Voice Transcription** - OpenAI Whisper integration for voice-to-text
- **Greeting Configuration** - Admin page to customize AI greeting message
- **Jest Test Suite** - 256 tests covering all features
- **Gap Analysis** - Comprehensive documentation of implementation status

### Changed
- Updated demo account emails from @pollchat.com to @mypollingapp.com
- Renamed "PollChat" references to "MyPollingApp" throughout documentation
- Updated business name handling to use dynamic settings

### Fixed
- Seed data now correctly uses @mypollingapp.com email domain
- PayPal service brand_name fixed to "MyPollingApp"
- Consistent naming across all documentation files

---

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
