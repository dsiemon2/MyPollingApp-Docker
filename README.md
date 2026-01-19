# PollChat Docker - Advanced Polling Platform

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
- **AI Assistant**: Configurable AI providers
- **SMS Notifications**: Twilio integration for poll alerts
- **Templates**: Quick poll creation from templates

## Demo Accounts

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@pollchat.com | password123 | Super Admin | Full admin |
| polladmin@pollchat.com | password123 | Poll Admin | Poll management |
| user@pollchat.com | password123 | User | Voting only |

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
| `/` | Splash screen |
| `/login` | Login with demo accounts |
| `/register` | User registration |
| `/polls` | Browse active polls |
| `/polls/[id]` | Vote and chat |

### Admin
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard |
| `/admin/polls` | Manage polls |
| `/admin/poll-types` | Configure poll types |
| `/admin/poll-templates` | Manage templates |
| `/admin/ai-providers` | AI configuration |
| `/admin/voices` | Voice settings |
| `/admin/webhooks` | Webhook management |
| `/admin/sms-settings` | Twilio SMS configuration |

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- NextAuth.js
- SWR
- Docker

## Project Structure

```
src/
├── pages/
│   ├── index.tsx          # Splash
│   ├── login.tsx          # Auth
│   ├── polls/             # Public polls
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/
│   ├── admin/             # Admin components
│   ├── poll-inputs/       # Vote inputs
│   └── poll-results/      # Results display
├── hooks/
│   ├── index.ts           # Hook exports
│   └── usePolls.ts        # SWR hooks
└── styles/
    └── globals.css
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/pollchat
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:8610
OPENAI_API_KEY=your-key
HUGGINGFACE_API_KEY=your-key

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
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
docker exec -it pollchat-app sh
```

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

## Related Projects

- **MyPollingApp** (port 8600) - Simple SQLite version
