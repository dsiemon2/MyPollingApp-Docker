# Claude Code Context File

This file helps Claude Code maintain context about the project.

## Project Overview

**Name**: PollChat Docker (MyPollingApp-Docker)
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
| `src/pages/admin/subscriptions.tsx` | Subscription management |
| `src/pages/admin/payment-processing.tsx` | Payment gateway configuration |
| `src/pages/admin/analytics.tsx` | Analytics dashboard with charts |
| `src/pages/api/admin/analytics.ts` | Analytics API endpoint |
| `src/pages/api/admin/polls/[id]/export.ts` | CSV export endpoint |
| `src/contexts/ThemeContext.tsx` | Dark mode context provider |
| `src/components/ThemeToggle.tsx` | Dark mode toggle button |
| `src/components/ShareModal.tsx` | Poll sharing with QR code |
| `src/hooks/usePolls.ts` | SWR hooks for data fetching |
| `src/hooks/useSettings.ts` | App-wide settings hook |
| `src/hooks/useSubscription.ts` | Subscription status hook |
| `src/config/plans.ts` | Subscription plan configuration |
| `src/services/payments/*` | Payment processor modules |
| `src/components/poll-inputs/*` | Vote input components |
| `src/components/poll-results/*` | Results display components |
| `public/images/MyPollingSoftwareLogo.png` | Logo image |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.js` | Database seeding script |
| `docker-entrypoint.sh` | Docker startup script |

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
├── StripeService.ts      # Stripe payment processing
├── PayPalService.ts      # PayPal order management
├── BraintreeService.ts   # Braintree transactions
├── SquareService.ts      # Square payment processing
├── AuthorizeNetService.ts # Authorize.net processing
├── PaymentManager.ts     # Unified payment orchestrator
├── types.ts              # TypeScript interfaces
└── index.ts              # Service exports
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
   - Subscription management
   - Payment processing configuration
   - System settings (business name, logo, colors)

## Demo Accounts

```javascript
const demoUsers = [
  { email: 'admin@pollchat.com', password: 'password123', role: 'SUPER_ADMIN', plan: 'ENTERPRISE' },
  { email: 'polladmin@pollchat.com', password: 'password123', role: 'POLL_ADMIN', plan: 'PROFESSIONAL' },
  { email: 'user@pollchat.com', password: 'password123', role: 'USER', plan: 'FREE' },
];
```

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
- Subscription, PaymentGateway

## API Endpoints

### Public
- `GET /api/polls` - List active polls
- `GET /api/polls/[id]` - Get poll details
- `POST /api/polls/[id]/vote` - Submit vote (enforces plan limits)
- `GET /api/polls/[id]/messages` - Get chat messages
- `POST /api/chat` - AI chat (plan-gated)
- `POST /api/voice/transcribe` - Voice transcription (plan-gated)

### Admin
- `GET/POST /api/admin/polls` - Manage polls (enforces plan limits)
- `GET/POST /api/admin/subscriptions` - Manage subscriptions
- `GET/POST /api/admin/payment-gateways` - Configure payment processors
- `GET/POST /api/admin/settings` - System settings

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
- [ ] Seeding completes
- [ ] Landing page loads with all sections
- [ ] Login/Register work
- [ ] All 7 poll types work
- [ ] SWR auto-refresh works
- [ ] Admin panel accessible
- [ ] Vote calculations correct
- [ ] Subscription limits enforced
- [ ] Payment processing page loads
- [ ] Settings changes reflect app-wide

## Recent Changes Log

| Date | Change |
|------|--------|
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
