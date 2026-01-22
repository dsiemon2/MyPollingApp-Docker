# MyPollingApp Docker - Advanced Polling Platform

A full-featured polling application with multiple poll types, admin panel, voice chat, and AI insights.

**Production Domain:** www.poligopro.com

## Quick Start

```bash
docker-compose up -d --build
```

App runs at: http://localhost:8610

## Features

- **7 Poll Types**: Single Choice, Multiple Choice, Yes/No, Rating, NPS, Ranked, Open Text
- **Real-time Updates**: SWR with auto-refresh
- **Admin Panel**: Full poll and user management
- **Voice Chat**: OpenAI Whisper transcription
- **AI Assistant**: Floating chat slider with OpenAI integration
- **SMS Notifications**: Twilio integration for poll alerts
- **Email Notifications**: SMTP email service with templates
- **Templates**: Quick poll creation from templates
- **Poll Scheduling**: Schedule polls to auto-open and auto-close
- **Dark Mode**: System and manual toggle support
- **Subscriptions**: 4-tier plan system with full payment checkout
- **Payment Webhooks**: Stripe, PayPal, Braintree, Square, Authorize.net

## Demo Accounts

| Email | Password | Role | Plan |
|-------|----------|------|------|
| admin@mypollingapp.com | password123 | Super Admin | Enterprise |
| polladmin@mypollingapp.com | password123 | Poll Admin | Professional |
| user@mypollingapp.com | password123 | User | Free |

## Poll Types

| Type | Description | Input |
|------|-------------|-------|
| Single Choice | Select one option | Radio buttons |
| Multiple Choice | Select multiple options | Checkboxes |
| Yes/No | Binary choice | Three buttons |
| Rating Scale | 1-5 stars | Star rating |
| NPS | 0-10 score | Number buttons |
| Ranked Choice | Rank preferences | Dropdowns |
| Open Text | Free text | Textarea |

## Pages

### Public
| Route | Description |
|-------|-------------|
| `/` | Landing page with features and pricing |
| `/login` | Login with demo accounts |
| `/register` | User registration |
| `/polls` | Browse active polls |
| `/polls/[id]` | Vote and chat |

### Checkout
| Route | Description |
|-------|-------------|
| `/checkout/[planId]` | Payment checkout page |
| `/checkout/success` | Payment success confirmation |
| `/checkout/cancel` | Payment cancellation |

### Admin
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard |
| `/admin/polls` | Manage polls (with scheduling) |
| `/admin/poll-types` | Configure poll types |
| `/admin/poll-templates` | Manage templates |
| `/admin/ai-providers` | AI configuration |
| `/admin/greeting` | AI greeting message |
| `/admin/voices` | Voice, language, KB settings |
| `/admin/webhooks` | Webhook management |
| `/admin/sms-settings` | Twilio SMS configuration |
| `/admin/subscriptions` | Subscription management |
| `/admin/payment-processing` | Payment gateway config |
| `/admin/trial-codes` | Trial code management |
| `/admin/analytics` | Analytics dashboard |

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- NextAuth.js
- SWR
- Docker
- OpenAI (GPT-4o-mini, Whisper)

## Project Structure

```
src/
├── pages/
│   ├── index.tsx          # Landing page
│   ├── login.tsx          # Auth
│   ├── polls/             # Public polls
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/
│   ├── admin/             # Admin components
│   ├── poll-inputs/       # Vote inputs
│   ├── poll-results/      # Results display
│   └── AIChatSlider.tsx   # AI assistant
├── contexts/
│   ├── ThemeContext.tsx   # Dark mode
│   └── AIAssistantContext.tsx
├── hooks/
│   ├── usePolls.ts        # SWR hooks
│   ├── useSettings.ts     # App settings
│   └── useSubscription.ts # Subscription hooks
├── services/
│   └── payments/          # Payment processors
└── styles/
    └── globals.css
tests/
├── api/                   # API tests
├── feature/               # Feature tests
└── unit/                  # Unit tests
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/mypollingapp
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:8610
OPENAI_API_KEY=your-key
HUGGINGFACE_API_KEY=your-key

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# SMTP Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=MyPollingApp
SMTP_FROM_EMAIL=noreply@mypollingapp.com

# Payment Gateways (optional)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
```

## Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d --build

# Shell into container
docker exec -it mypollingapp-app sh

# Run seed manually
docker-compose exec -T app node prisma/seed.js
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/feature/Results.test.ts
```

Test suite includes 256 tests covering:
- AI Chat functionality
- API endpoints
- Authentication & Authorization
- Poll management
- Voting edge cases
- Subscriptions & Trial codes

## Database

PostgreSQL with Prisma. See `prisma/schema.prisma` for full schema.

```bash
# Generate client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed data
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

## SWR Auto-Refresh

| Data | Interval |
|------|----------|
| Poll list | 10 seconds |
| Single poll | 5 seconds |
| Messages | 3 seconds |

## Subscription Plans

| Plan | Price | Polls | Votes/Poll | AI Features |
|------|-------|-------|------------|-------------|
| Free | $0 | 3 | 50 | No |
| Starter | $9.99/mo | 10 | 200 | Basic |
| Professional | $29.99/mo | 50 | Unlimited | Advanced |
| Enterprise | $99/mo | Unlimited | Unlimited | Advanced |

## Related Projects

- **MyPollingApp** (port 8600) - Simple SQLite version

## Documentation

- [Getting Started](./docs/GETTING_STARTED.md)
- [API Reference](./docs/API.md)
- [Subscriptions](./docs/SUBSCRIPTIONS.md)
- [Payment Processing](./docs/PAYMENT_PROCESSING.md)
- [Roadmap](./docs/ROADMAP.md)
- [Gap Analysis](./GAP_ANALYSIS.md)
