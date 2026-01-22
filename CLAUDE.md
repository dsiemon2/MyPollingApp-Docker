# MyPollingApp Docker - Project Reference

**Type:** Voice-enabled Polling Platform
**Port:** 8610
**Status:** Active (Development)
**Live URL:** https://www.poligopro.com
**Last Updated:** 2026-01-22 (v2.2.0)

---

This file helps Claude Code maintain context about the project.

## Project Overview

**Name**: MyPollingApp Docker
**Port**: 8610
**Type**: Advanced voice-enabled polling platform with subscription management
**Status**: Active development
**Database**: PostgreSQL (via Docker)

## Related Projects

| Project | Port | Database | Description |
|---------|------|----------|-------------|
| MyPollingApp | 8600 | SQLite | Simple version |
| MyPollingApp-Docker | 8610 | PostgreSQL | Advanced version with admin & subscriptions |

## Critical Files - DO NOT BREAK

| File | Purpose |
|------|---------|
| `src/pages/index.tsx` | Full landing page with hero, features, pricing, CTA |
| `src/pages/login.tsx` | Login page with demo accounts |
| `src/pages/register.tsx` | Registration page |
| `src/pages/polls/index.tsx` | Public polls listing with SWR |
| `src/pages/polls/[id].tsx` | Poll detail with all poll types |
| `src/pages/admin/*` | Admin panel pages |
| `src/pages/admin/greeting.tsx` | AI greeting configuration |
| `src/pages/admin/voices.tsx` | Voices, languages, KB documents |
| `src/pages/admin/subscriptions.tsx` | Subscription management |
| `src/pages/admin/payment-processing.tsx` | Payment gateway configuration |
| `src/pages/admin/trial-codes.tsx` | Trial codes management |
| `src/pages/admin/account.tsx` | Account settings page |
| `src/pages/admin/my-subscription.tsx` | Current subscription view |
| `src/pages/admin/pricing.tsx` | Pricing plans page |
| `src/pages/admin/analytics.tsx` | Analytics dashboard with charts |
| `src/pages/api/admin/analytics.ts` | Analytics API endpoint |
| `src/pages/api/admin/greeting.ts` | Greeting API endpoint |
| `src/pages/api/admin/polls/[id]/export.ts` | CSV export endpoint |
| `src/contexts/ThemeContext.tsx` | Dark mode context provider |
| `src/contexts/AIAssistantContext.tsx` | AI Chat Slider context provider |
| `src/components/ThemeToggle.tsx` | Dark mode toggle button |
| `src/components/ShareModal.tsx` | Poll sharing with QR code |
| `src/components/AIChatSlider.tsx` | Floating AI assistant chat component |
| `src/components/admin/AdminLayout.tsx` | Admin sidebar layout |
| `src/pages/api/ai-assistant/chat.ts` | AI assistant chat endpoint (OpenAI) |
| `src/pages/api/ai-assistant/transcribe.ts` | Voice transcription endpoint (Whisper) |
| `src/pages/api/ai-assistant/settings.ts` | AI assistant settings endpoint |
| `src/hooks/usePolls.ts` | SWR hooks for data fetching |
| `src/hooks/useSettings.ts` | App-wide settings hook |
| `src/hooks/useSubscription.ts` | Subscription status hook |
| `src/config/plans.ts` | Subscription plan configuration |
| `src/services/payments/*` | Payment processor modules |
| `src/services/email.service.ts` | Email notifications (Nodemailer) |
| `src/services/emailTemplates.ts` | Email HTML templates |
| `src/pages/checkout/[planId].tsx` | Payment checkout page |
| `src/pages/checkout/success.tsx` | Payment success page |
| `src/pages/checkout/cancel.tsx` | Payment cancel page |
| `src/pages/api/checkout/create-session.ts` | Stripe session creation |
| `src/pages/api/checkout/verify.ts` | Payment verification |
| `src/pages/api/webhooks/stripe.ts` | Stripe webhook handler |
| `src/pages/api/webhooks/paypal.ts` | PayPal webhook handler |
| `src/pages/api/webhooks/braintree.ts` | Braintree webhook handler |
| `src/pages/api/webhooks/square.ts` | Square webhook handler |
| `src/pages/api/webhooks/authorize.ts` | Authorize.net webhook handler |
| `src/pages/api/cron/process-polls.ts` | Poll scheduling cron endpoint |
| `src/lib/pollStatus.ts` | Poll status calculation helpers |
| `src/components/poll-inputs/*` | Vote input components |
| `src/components/poll-results/*` | Results display components |
| `public/images/MyPollingSoftwareLogo.png` | Logo image |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.js` | Database seeding script |
| `docker-entrypoint.sh` | Docker startup script |
| `tests/*` | Jest test suite (256 tests) |

## Poll Types

| Code | Name | Category | Plan Required |
|------|------|----------|---------------|
| single_choice | Single Choice | choice | Free |
| multiple_choice | Multiple Choice | choice | Free |
| yes_no | Yes/No | choice | Free |
| rating_scale | Rating Scale | rating | Starter+ |
| nps | Net Promoter Score | rating | Starter+ |
| ranked | Ranked Choice | ranking | Starter+ |
| open_text | Open Text | text | Starter+ |

## Subscription Plans

| Plan | Price | Polls | Votes/Poll | Voice | AI | Branding |
|------|-------|-------|------------|-------|-----|----------|
| Free | $0 | 3 | 50 | No | No | No |
| Starter | $9.99/mo | 10 | 200 | Yes | Basic | No |
| Professional | $29.99/mo | 50 | Unlimited | Yes | Advanced | Yes |
| Enterprise | $99/mo | Unlimited | Unlimited | Yes | Advanced | Yes |

## Payment Processors

All 5 payment gateways are fully integrated:

| Gateway | Status | Description |
|---------|--------|-------------|
| **Stripe** | Full integration | Primary processor with test/live mode |
| **PayPal** | Full integration | Direct PayPal API integration |
| **Braintree** | Full integration | Supports cards and PayPal payments |
| **Square** | Full integration | Point of sale integration |
| **Authorize.net** | Full integration | Legacy payment support |

### Payment Services Location
```
src/services/payments/
├── stripe.service.ts       # Stripe payment processing
├── paypal.service.ts       # PayPal order management
├── braintree.service.ts    # Braintree transactions
├── square.service.ts       # Square payment processing
├── authorize.service.ts    # Authorize.net processing
├── payment.service.ts      # Unified payment orchestrator
└── index.ts                # Service exports
```

### Payment Webhooks
All payment providers have webhook handlers that:
1. Verify webhook signatures
2. Handle subscription events (created, updated, cancelled)
3. Handle payment events (succeeded, failed)
4. Update database subscription status
5. Send email notifications

| Provider | Webhook URL |
|----------|-------------|
| Stripe | `/api/webhooks/stripe` |
| PayPal | `/api/webhooks/paypal` |
| Braintree | `/api/webhooks/braintree` |
| Square | `/api/webhooks/square` |
| Authorize.net | `/api/webhooks/authorize` |

## Poll Scheduling

Polls support automatic scheduling with:
- `scheduledAt` - When to auto-open the poll
- `closedAt` - When to auto-close the poll
- Status transitions: `draft` → `scheduled` → `open` → `closed`

### Cron Endpoint
`GET/POST /api/cron/process-polls` - Call periodically to process scheduled polls
- Opens polls where `scheduledAt` has passed
- Closes polls where `closedAt` has passed
- Secured with optional `CRON_SECRET` environment variable

## Email Service

SMTP email service using Nodemailer with 9 templates:

| Template | Trigger |
|----------|---------|
| Welcome | User registration |
| Password Reset | Forgot password |
| Subscription Activated | New subscription |
| Subscription Cancelled | Subscription cancelled |
| Payment Receipt | Successful payment |
| Payment Failed | Failed payment |
| Poll Created | New poll created |
| Poll Closed | Poll ended |
| Poll Results | Results notification |

### Environment Variables
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=MyPollingApp
SMTP_FROM_EMAIL=noreply@mypollingapp.com
```

## Key Features That Must Work

1. **Landing Page** (`/`)
   - Navigation with logo and auth-aware links
   - Hero section with feature pills and demo card
   - 6 feature cards section
   - Use cases section
   - 4-tier pricing section with plan details
   - About/stats section
   - CTA section
   - Full footer

2. **Login Page** (`/login`)
   - Logo branding from settings
   - Email/password form
   - Demo account buttons
   - NextAuth integration

3. **Polls Page** (`/polls`)
   - SWR auto-refresh every 10 seconds
   - Dynamic business name from settings
   - Grid of poll cards
   - Vote counts

4. **Poll Detail** (`/polls/[id]`)
   - SWR auto-refresh every 5 seconds
   - Dynamic vote input based on poll type
   - Dynamic results display
   - Chat with AI (plan-gated)
   - Voice input (plan-gated)

5. **Admin Panel** (`/admin`)
   - Dashboard with stats
   - Polls management with plan limits
   - Poll types management
   - Templates management
   - AI configuration
   - Greeting configuration
   - Voices, languages, KB documents
   - Subscription management
   - Payment processing configuration
   - System settings (business name, logo, colors)

## Demo Accounts

```javascript
const demoUsers = [
  { email: 'admin@mypollingapp.com', password: 'password123', role: 'SUPER_ADMIN', plan: 'ENTERPRISE' },
  { email: 'polladmin@mypollingapp.com', password: 'password123', role: 'POLL_ADMIN', plan: 'PROFESSIONAL' },
  { email: 'user@mypollingapp.com', password: 'password123', role: 'USER', plan: 'FREE' },
];
```

## Seed Data

The seed script (`prisma/seed.js`) creates:

| Data Type | Count | Description |
|-----------|-------|-------------|
| Users | 4 | Owner + 3 demo accounts |
| Voices | 6 | OpenAI TTS voices (alloy, echo, fable, onyx, nova, shimmer) |
| Languages | 24 | Full language support with native names |
| KB Documents | 8 | Knowledge base articles |
| AI Providers | 6 | OpenAI, Anthropic, Gemini, DeepSeek, Groq, Hugging Face |
| AI Agents | 4 | Poll Assistant, Results Analyst, Survey Designer, Moderator |
| AI Tools | 6 | Calculator, Calendar, Poll Results, etc. |
| Logic Rules | 5 | Greeting, Results, Help, Off-Topic, Negative Sentiment |
| Custom Functions | 4 | Get Poll Stats, Format Results, Calculate NPS, Validate Vote |
| Webhooks | 5 | Vote, Poll Created, Poll Closed, Milestone, Slack |
| Payment Gateways | 5 | Stripe, PayPal, Braintree, Square, Authorize.net |
| Poll Types | 7 | All poll types with configurations |
| Poll Templates | 8 | Quick Poll, Customer Satisfaction, NPS, etc. |
| Sample Polls | 8 | Various poll types with sample votes |
| Trial Codes | 3 | TRIAL14FREE, WELCOME30, STARTER7DAY |

## AI Chat Slider

A floating AI assistant available on all pages. Provides natural language interaction with the polling system.

### Features
- **Floating Button**: 60px circular button, configurable position (bottom-right default)
- **Slide-out Panel**: 380px wide chat interface with smooth animations
- **OpenAI Integration**: GPT-4o-mini for intelligent responses
- **Voice Input**: Whisper API for voice-to-text transcription
- **Context-Aware**: Understands current polls, results, and user context
- **Visual Aids**: Stats cards, poll previews, step-by-step guides
- **Dark Mode Support**: Automatically adapts to theme

### Configuration
Settings stored in `SystemSetting` with category `ai_assistant`:

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `ai_assistant_enabled` | true | Enable/disable the chat slider |
| `ai_assistant_position` | bottom-right | Position: bottom-right, bottom-left, top-right, top-left |
| `ai_assistant_button_color` | #1e40af | Button and header color |
| `ai_assistant_panel_width` | 380 | Panel width in pixels |
| `ai_assistant_voice_enabled` | true | Enable voice input |
| `ai_assistant_show_on_public` | true | Show on public pages |
| `ai_assistant_show_on_admin` | true | Show in admin panel |

### Usage (React)
```typescript
import { useAIAssistant } from '@/contexts/AIAssistantContext';

const {
  isOpen,
  messages,
  sendMessage,
  toggleChat,
  startRecording,
  stopRecording,
  settings,
  updateSettings
} = useAIAssistant();
```

### Plan Requirements
- **AI Chat**: Requires Starter plan or higher
- **Voice Input**: Requires Starter plan or higher

## Testing

Jest test suite with 256 tests covering:

```
tests/
├── api/
│   └── ApiEndpoints.test.ts      # 30 API endpoint tests
├── feature/
│   ├── AiChatSlider.test.ts      # 32 AI chat tests
│   ├── Authentication.test.ts    # 19 auth tests
│   ├── Authorization.test.ts     # 23 role-based access tests
│   ├── PollManagement.test.ts    # 26 poll CRUD tests
│   ├── Results.test.ts           # 15 results tests
│   ├── Subscription.test.ts      # 21 subscription tests
│   ├── TrialCode.test.ts         # 26 trial code tests
│   └── VotingEdgeCases.test.ts   # 24 voting validation tests
└── unit/
    ├── PollTypes.test.ts         # 20 poll type tests
    └── SubscriptionLimits.test.ts # 14 limit tests
```

Run tests: `npm test`

## Logging

Simple logger for payment services and server operations:

```
src/utils/logger.ts
```

### Features
- **Console Output**: Formatted logs with level prefixes
- **Log Levels**: info, error, warn, debug
- **Development Mode**: Debug logs only appear in development
- **Payment Integration**: Used by all payment services for transaction logging

### Log Levels
- `error` - Error conditions
- `warn` - Warning conditions
- `info` - Informational messages
- `debug` - Debug information (dev only)

### Usage
```typescript
import logger from '../utils/logger';

logger.info({ userId, action }, 'User action logged');
logger.error({ error: err.message }, 'Database connection failed');
logger.debug({ paymentId }, 'Processing payment');
```

---

## Commands

```bash
# Start with Docker
docker-compose up -d --build

# View logs
docker-compose logs -f

# View app logs only
docker-compose logs app --tail 50

# Stop
docker-compose down

# Reset database (full reset)
docker-compose down -v
docker-compose up -d --build

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d

# Run seed manually
docker-compose exec -T app node prisma/seed.js

# Run tests
npm test
```

## SWR Hooks

```typescript
// Poll list (10s refresh)
const { polls, isLoading, refresh } = usePolls();

// Single poll (5s refresh)
const { poll, isLoading, refresh } = usePoll(pollId);

// Messages (3s refresh)
const { messages, refresh } = usePollMessages(pollId);

// Vote status
const { voteStatus, refresh } = useVoteStatus(pollId, visitorId);

// Settings (app-wide)
const { settings } = useSettings();

// Subscription
const { subscription, features, canCreatePoll, canUseVoiceChat } = useSubscription();

// Invalidate cache
invalidatePoll(pollId);
invalidatePolls();
invalidateMessages(pollId);
invalidateSettings();
invalidateSubscription();
```

## Database Tables

### Core
- User, Poll, PollOption, Vote, ChatMessage

### Configuration
- PollType, PollTemplate, SystemSetting

### AI System
- AIProvider, AIConfig, AIAgent, AITool, AIAgentTool

### Localization
- Voice, Language, KnowledgeDocument

### Automation
- LogicRule, CustomFunction, Webhook, WebhookLog

### Payments & Subscriptions
- Subscription, SubscriptionPlan, PaymentGateway, TrialCode

## API Endpoints

### Public
- `GET /api/polls` - List active polls
- `GET /api/polls/[id]` - Get poll details
- `POST /api/polls/[id]/vote` - Submit vote (enforces plan limits)
- `GET /api/polls/[id]/messages` - Get chat messages
- `POST /api/chat` - AI chat (plan-gated)
- `POST /api/voice/transcribe` - Voice transcription (plan-gated)

### AI Assistant
- `POST /api/ai-assistant/chat` - AI chat with OpenAI (plan-gated)
- `POST /api/ai-assistant/transcribe` - Voice-to-text with Whisper (plan-gated)
- `GET/POST /api/ai-assistant/settings` - AI assistant configuration

### Checkout
- `POST /api/checkout/create-session` - Create Stripe checkout session
- `POST /api/checkout/verify` - Verify payment completion

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/webhooks/paypal` - PayPal webhook handler
- `POST /api/webhooks/braintree` - Braintree webhook handler
- `POST /api/webhooks/square` - Square webhook handler
- `POST /api/webhooks/authorize` - Authorize.net webhook handler

### Cron
- `GET/POST /api/cron/process-polls` - Process scheduled polls

### Admin
- `GET/POST /api/admin/polls` - Manage polls with scheduling (enforces plan limits)
- `GET/POST /api/admin/greeting` - AI greeting configuration
- `GET/POST /api/admin/voices` - Manage voices, languages, KB documents
- `GET/POST /api/admin/subscriptions` - Manage subscriptions
- `GET/POST /api/admin/payment-gateways` - Configure payment processors
- `GET/POST /api/admin/settings` - System settings
- `GET/POST /api/admin/trial-codes` - Trial codes management
- `POST /api/admin/trial-codes/[id]/extend` - Extend trial code
- `POST /api/admin/trial-codes/[id]/revoke` - Revoke trial code
- `POST /api/admin/account/update` - Update profile
- `POST /api/admin/account/change-password` - Change password
- `GET /api/admin/my-subscription` - Get current subscription
- `GET /api/admin/pricing` - Get pricing plans
- `POST /api/admin/subscription/subscribe/[planId]` - Subscribe to plan
- `POST /api/admin/subscription/start-trial/[planId]` - Start trial
- `POST /api/admin/subscription/cancel` - Cancel subscription
- `POST /api/admin/subscription/resume` - Resume subscription

## Feature Enforcement Points

| Feature | Enforcement Location |
|---------|---------------------|
| Poll creation limit | `/api/admin/polls` POST |
| Vote limit per poll | `/api/polls/[id]/vote` POST |
| Poll type access | `/api/admin/polls` POST |
| Voice chat | `/api/voice/transcribe` POST |
| AI insights | `/api/chat` POST |

## Testing Checklist

Before deployment, verify:

- [ ] Docker builds successfully
- [ ] Database migrations run
- [ ] Seeding completes (all data visible)
- [ ] Landing page loads with all sections
- [ ] Login/Register work
- [ ] All 7 poll types work
- [ ] SWR auto-refresh works
- [ ] Admin panel accessible
- [ ] Voices page shows 6 voices, 24 languages, 8 KB docs
- [ ] Greeting page works
- [ ] Vote calculations correct
- [ ] Subscription limits enforced
- [ ] Payment processing page loads
- [ ] Settings changes reflect app-wide
- [ ] Jest tests pass (256 tests)

## Recent Changes Log

| Date | Change |
|------|--------|
| 2026-01-22 | **v2.2.0** - Added Poll Scheduling (scheduledAt, closedAt, cron endpoint) |
| 2026-01-22 | **v2.2.0** - Added Payment Checkout Flow (checkout pages, session creation, verification) |
| 2026-01-22 | **v2.2.0** - Added Payment Webhooks (Stripe, PayPal, Braintree, Square, Authorize.net) |
| 2026-01-22 | **v2.2.0** - Added Email Notifications (Nodemailer, 9 templates) |
| 2026-01-22 | Added greeting configuration page (`/admin/greeting`) |
| 2026-01-22 | Added Jest test suite with 256 tests |
| 2026-01-22 | Fixed business name consistency (removed PollChat references) |
| 2026-01-22 | Updated demo account emails to @mypollingapp.com |
| 2026-01-22 | Added floating AI Chat Slider with OpenAI integration |
| 2026-01-22 | Added voice transcription with OpenAI Whisper |
| 2026-01-22 | Added AI assistant settings API |
| 2026-01-19 | Replaced payment services with full implementations |
| 2026-01-19 | Added logging utilities for payment services |
| 2026-01-19 | Added Trial Codes management system |
| 2026-01-19 | Added Account Settings page |
| 2026-01-19 | Added My Subscription page |
| 2026-01-19 | Added Pricing Plans page |
| 2026-01-19 | Added SubscriptionPlan and TrialCode models to schema |
| 2026-01-15 | Added analytics dashboard with vote/poll trends |
| 2026-01-15 | Added CSV export for poll data |
| 2026-01-15 | Added dark mode support with toggle |
| 2026-01-15 | Enhanced QR code sharing in ShareModal |
| 2026-01-15 | Added subscription system with 4 tiers |
| 2026-01-15 | Added payment processing (Stripe, Braintree, Square, Authorize.net) |
| 2026-01-15 | Enhanced landing page with pricing section |
| 2026-01-15 | Added feature enforcement by plan |
| 2026-01-15 | Added docker-entrypoint.sh for auto-migration |
| 2026-01-15 | Created JS seed script for production |
| 2026-01-14 | Added SWR state management |
| 2026-01-14 | Fixed TypeScript errors in hooks |
| 2026-01-14 | Added favicon.svg |
| 2026-01-14 | Tested all poll types E2E |

## DO NOT

- Remove demo accounts
- Break SWR hooks
- Remove poll type support
- Delete admin pages
- Change database schema without migration
- Remove subscription enforcement
- Delete payment service modules
- Break docker-entrypoint.sh
- Use hardcoded names (use settings.businessName instead)
- Use @pollchat.com emails (use @mypollingapp.com)
