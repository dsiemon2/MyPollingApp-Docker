# PollChat Docker - Documentation

Welcome to the PollChat Docker documentation. This advanced voice-enabled polling platform provides real-time voting, AI-powered chat, and comprehensive subscription management.

## Quick Links

| Document | Description |
|----------|-------------|
| [Getting Started](./GETTING_STARTED.md) | Installation and setup guide |
| [Subscription Plans](./SUBSCRIPTIONS.md) | Plan tiers and feature gating |
| [Payment Processing](./PAYMENT_PROCESSING.md) | Payment gateway configuration |
| [API Reference](./API.md) | REST API documentation |
| [Implementation Details](./IMPLEMENTATION.md) | Technical architecture |
| [Roadmap](./ROADMAP.md) | Future plans and completed features |

### Additional Documentation
- [Poll Sharing Plan](./POLL_SHARING_PLAN.md)
- [Polling Architecture](./POLLING_ARCHITECTURE1.md)
- [PollChat Documentation](./POLLCHAT_DOCUMENTATION.md)

## Overview

PollChat is a full-featured polling application built with:

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Docker)
- **Authentication**: NextAuth.js
- **Real-time**: SWR with auto-refresh
- **AI**: Hugging Face, OpenAI Whisper
- **Payments**: Stripe, Braintree, Square, Authorize.net

## Features

### Poll Types
- Single Choice
- Multiple Choice
- Yes/No
- Rating Scale (1-5 stars)
- Net Promoter Score (0-10)
- Ranked Choice Voting
- Open Text Responses

### Subscription Tiers
| Plan | Price | Key Features |
|------|-------|--------------|
| Free | $0/mo | 3 polls, 50 votes/poll |
| Starter | $9.99/mo | 10 polls, voice chat, basic AI |
| Professional | $29.99/mo | 50 polls, unlimited votes, custom branding |
| Enterprise | $99/mo | Unlimited everything, API access, white-label |

### Admin Features
- Dashboard with analytics
- Poll management with templates
- AI provider configuration
- Subscription management
- Payment gateway setup
- Custom branding settings

## Quick Start

```bash
# Clone and start
git clone <repository>
cd MyPollingApp-Docker
docker-compose up -d --build

# Access the app
open http://localhost:8610
```

## Demo Accounts

| Email | Password | Role | Plan |
|-------|----------|------|------|
| admin@pollchat.com | password123 | Super Admin | Enterprise |
| polladmin@pollchat.com | password123 | Poll Admin | Professional |
| user@pollchat.com | password123 | User | Free |

## Project Structure

```
MyPollingApp-Docker/
├── docs/                    # Documentation
├── prisma/                  # Database schema & migrations
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin UI components
│   │   ├── poll-inputs/    # Vote input components
│   │   └── poll-results/   # Results display components
│   ├── config/             # Configuration files
│   │   └── plans.ts        # Subscription plan config
│   ├── hooks/              # React hooks
│   ├── lib/                # Utilities
│   ├── pages/              # Next.js pages
│   │   ├── admin/          # Admin panel pages
│   │   ├── api/            # API routes
│   │   └── polls/          # Poll pages
│   ├── services/           # Business logic
│   │   └── payments/       # Payment processor modules
│   ├── styles/             # CSS styles
│   └── types/              # TypeScript definitions
├── docker-compose.yml       # Docker configuration
├── Dockerfile              # Container build
├── docker-entrypoint.sh    # Startup script
└── package.json            # Dependencies
```

## Support

For issues and feature requests, please refer to the project repository.
