# PollChat - Complete Documentation

## Overview

PollChat is a Next.js-based polling application with AI-powered chat discussions, voice input capabilities, and comprehensive poll sharing/embedding features. It runs in Docker with PostgreSQL and supports role-based access control.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Admin Pages](#admin-pages)
7. [Poll Sharing & Embedding](#poll-sharing--embedding)
8. [Authentication & Roles](#authentication--roles)
9. [AI Integration](#ai-integration)
10. [Configuration](#configuration)
11. [Future Roadmap](#future-roadmap)

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth.js |
| Voice Transcription | OpenAI Whisper |
| AI Chat | Hugging Face (configurable) |
| Containerization | Docker, Docker Compose |

### Docker Configuration
- **App Port:** 8610 (external) → 8600 (internal)
- **Database Port:** 5444 (external) → 5432 (internal)

---

## Features

### Core Features
- **Poll Creation** - Create polls with multiple options
- **Voting** - Anonymous or authenticated voting with duplicate prevention
- **Results** - Real-time vote percentages with visual progress bars
- **AI Chat** - Discuss polls with AI assistant
- **Voice Input** - Speech-to-text using OpenAI Whisper

### Sharing Features (Fully Implemented)
- **Copy Link** - Direct URL sharing
- **Social Media** - Facebook, X/Twitter, LinkedIn share buttons
- **QR Codes** - Scannable codes for Instagram Stories and print
- **iFrame Embed** - For WordPress, Joomla, any website
- **JavaScript Widget** - Native embedding without iframes
- **oEmbed** - WordPress auto-discovery embedding
- **Preview Images** - Auto-generated social media cards

### Admin Features
- **Poll Management** - Full CRUD operations
- **AI Configuration** - Multiple AI providers
- **Voice Settings** - TTS voice configuration
- **Knowledge Base** - Custom AI training documents
- **Webhooks** - Event-driven integrations
- **Logic Rules** - Automated actions

---

## Architecture

### File Structure

```
src/
├── components/
│   ├── ShareModal.tsx          # Poll sharing dialog (3 tabs)
│   ├── VoiceRecorder.tsx       # Speech-to-text input
│   └── ...
├── lib/
│   └── prisma.ts               # Database client
├── pages/
│   ├── api/
│   │   ├── auth/               # NextAuth endpoints
│   │   ├── chat.ts             # AI chat endpoint
│   │   ├── oembed.ts           # oEmbed endpoint
│   │   ├── polls/
│   │   │   ├── index.ts        # List polls
│   │   │   └── [id]/
│   │   │       ├── index.ts    # Get poll
│   │   │       ├── vote.ts     # Submit/check votes
│   │   │       ├── messages.ts # Chat messages
│   │   │       ├── embed.ts    # JSON embed data
│   │   │       ├── qrcode.ts   # QR code generation
│   │   │       └── preview.png.ts # Social preview image
│   │   ├── admin/              # Admin API endpoints
│   │   └── voice/
│   │       └── transcribe.ts   # Whisper transcription
│   ├── admin/                  # Admin dashboard pages
│   ├── embed/polls/[id].tsx    # Embeddable poll page
│   ├── polls/
│   │   ├── index.tsx           # Poll listing
│   │   └── [id].tsx            # Poll detail + chat
│   ├── login.tsx
│   ├── register.tsx
│   └── test-embed.tsx          # Embed testing page
├── public/
│   └── widget.js               # JavaScript embedding widget
└── prisma/
    └── schema.prisma           # Database schema
```

---

## Database Schema

### Core Models

#### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      Role     @default(USER)  // SUPER_ADMIN, POLL_ADMIN, USER
}
```

#### Poll
```prisma
model Poll {
  id          String       @id @default(cuid())
  title       String
  description String?
  type        String       @default("single")  // single, multiple
  status      String       @default("open")    // open, closed
  createdAt   DateTime     @default(now())
  closedAt    DateTime?
  creatorId   String?

  options     PollOption[]
  votes       Vote[]
  messages    ChatMessage[]
}
```

#### PollOption
```prisma
model PollOption {
  id         String @id @default(cuid())
  pollId     String
  label      String
  orderIndex Int    @default(0)

  votes      Vote[]
}
```

#### Vote
```prisma
model Vote {
  id               String   @id @default(cuid())
  pollId           String
  optionId         String
  userId           String?
  voterFingerprint String?  // For anonymous vote tracking
  createdAt        DateTime @default(now())

  @@unique([pollId, optionId, voterFingerprint])
}
```

### AI Models
- **AIProvider** - Configurable AI backends (OpenAI, Hugging Face, etc.)
- **AIConfig** - Key-value AI settings
- **Voice** - Text-to-speech voice configurations
- **Language** - Supported languages
- **KnowledgeDocument** - AI training documents
- **AITool** - Custom AI tools
- **AIAgent** - AI agent configurations
- **LogicRule** - Automated action rules
- **CustomFunction** - User-defined functions
- **Webhook** - External integrations

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/polls` | List all polls |
| GET | `/api/polls/[id]` | Get poll details |
| POST | `/api/polls/[id]/vote` | Submit a vote |
| GET | `/api/polls/[id]/vote?visitorId=xxx` | Check if voted |
| DELETE | `/api/polls/[id]/vote` | Reset vote (testing) |
| GET | `/api/polls/[id]/messages` | Get chat messages |
| POST | `/api/polls/[id]/messages` | Send chat message |
| POST | `/api/chat` | AI chat response |

### Embedding Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/polls/[id]/embed` | JSON poll data for embedding |
| GET | `/api/polls/[id]/qrcode` | Generate QR code |
| GET | `/api/polls/[id]/preview.png` | Social media preview image |
| GET | `/api/oembed?url=xxx` | oEmbed response for WordPress |

### QR Code Parameters
```
GET /api/polls/[id]/qrcode?size=300&format=png&dark=#000000&light=#ffffff

- size: 100-1000 (default: 300)
- format: png or svg (default: png)
- dark: Dark color hex
- light: Light color hex
```

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/polls` | List polls (admin) |
| POST | `/api/admin/polls` | Create poll |
| GET | `/api/admin/polls/[id]` | Get poll (admin) |
| PUT | `/api/admin/polls/[id]` | Update poll |
| DELETE | `/api/admin/polls/[id]` | Delete poll |
| GET | `/api/admin/ai-providers` | List AI providers |
| PUT | `/api/admin/ai-providers/[id]` | Update provider |
| ... | ... | (See admin pages for full list) |

---

## Admin Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/admin` | Overview statistics |
| Polls | `/admin/polls` | Poll management |
| AI Providers | `/admin/ai-providers` | Configure AI backends |
| AI Config | `/admin/ai-config` | AI behavior settings |
| AI Tools | `/admin/ai-tools` | Custom AI tools |
| AI Agents | `/admin/ai-agents` | Agent configurations |
| Voices | `/admin/voices` | TTS voice settings |
| Knowledge Base | `/admin/knowledge-base` | Training documents |
| Logic Rules | `/admin/logic-rules` | Automation rules |
| Functions | `/admin/functions` | Custom functions |
| Webhooks | `/admin/webhooks` | External integrations |
| Settings | `/admin/settings` | System settings |

---

## Poll Sharing & Embedding

### ShareModal Component

The ShareModal (`src/components/ShareModal.tsx`) provides three tabs:

#### Tab 1: Share
- **Copy Link** - Direct poll URL
- **Social Media Buttons** - Facebook, X/Twitter, LinkedIn, Email
- **QR Code** - For Instagram Stories and printed materials

#### Tab 2: Embed
- **iFrame Code** - Works everywhere (WordPress, Joomla, Squarespace, Wix)
```html
<iframe
  src="https://yourdomain.com/embed/polls/[id]?theme=light"
  width="100%"
  height="450"
  frameborder="0"
  style="border-radius: 12px; max-width: 500px;">
</iframe>
```

- **JavaScript Widget** - Native embedding without iframes
```html
<div id="pollchat-[id]"></div>
<script src="https://yourdomain.com/widget.js"></script>
<script>
  PollChat.render({
    container: '#pollchat-[id]',
    pollId: '[id]',
    theme: 'light',      // 'light' or 'dark'
    showResults: true,   // Show results after voting
    allowVote: true,     // Enable/disable voting
    onVote: (optionId, optionText) => {}  // Callback
  });
</script>
```

- **WordPress oEmbed** - Just paste the poll URL in WordPress editor

#### Tab 3: Advanced
- **JSON API Endpoint** - For custom integrations
- **oEmbed Endpoint** - For CMS auto-discovery
- **Preview Image URL** - For social media cards
- **QR Code API** - Programmable QR generation

### Embed Page

The embed page (`/embed/polls/[id]`) supports URL parameters:
- `?theme=light|dark`
- `?showResults=true|false`
- `?allowVote=true|false`

### Meta Tags

Poll pages include Open Graph and Twitter Card meta tags for rich social sharing:
```html
<meta property="og:title" content="Poll: [title]" />
<meta property="og:description" content="[description or vote count]" />
<meta property="og:image" content="/api/polls/[id]/preview.png" />
<meta property="og:url" content="/polls/[id]" />
<meta name="twitter:card" content="summary_large_image" />
```

### oEmbed Discovery

Poll pages include oEmbed discovery for WordPress:
```html
<link
  rel="alternate"
  type="application/json+oembed"
  href="/api/oembed?url=[poll-url]"
  title="[poll-title]"
/>
```

---

## Authentication & Roles

### Roles

| Role | Permissions |
|------|------------|
| SUPER_ADMIN | Full access to everything |
| POLL_ADMIN | Create/edit/delete polls, view admin |
| USER | Vote on polls, chat |

### Demo Users (from login page)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@pollchat.com | super123 |
| Poll Admin | polladmin@pollchat.com | poll123 |
| User | user@pollchat.com | user123 |

### Vote Tracking

Votes are tracked using:
1. **userId** - For authenticated users
2. **voterFingerprint** - For anonymous users (stored in localStorage as `pollchat_visitor_id`)

Duplicate votes prevented by unique constraint on `[pollId, optionId, voterFingerprint]`.

---

## AI Integration

### Supported Providers
- OpenAI (GPT models)
- Hugging Face (configurable models)
- Custom endpoints

### Voice Transcription
- OpenAI Whisper for speech-to-text
- Supports audio recording in browser
- Real-time transcription

### Knowledge Base
- Upload custom documents to train AI
- Multi-language support
- Document types: text, URL, file

---

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@db:5432/pollchat"

# NextAuth
NEXTAUTH_URL="http://localhost:8610"
NEXTAUTH_SECRET="your-secret-key"

# OpenAI (for Whisper)
OPENAI_API_KEY="sk-..."

# Hugging Face (for chat)
HUGGINGFACE_API_KEY="hf_..."
```

### Docker Compose Ports

```yaml
services:
  app:
    ports:
      - "8610:8600"
  db:
    ports:
      - "5444:5432"
```

---

## Testing

### Test Embed Page

Visit `/test-embed` to test all sharing features:
- Select any poll
- Toggle theme (light/dark)
- Configure embed options
- Preview QR codes
- Test all API endpoints
- View social media preview image

---

## Future Roadmap

> **See `POLLING_ARCHITECTURE1.md` for detailed specifications and implementation plans.**

The following features are planned for future releases:

### Poll Types (Advanced)
- **Yes/No** - Binary choice with optional neutral
- **Rating Scale** - Stars, numbers, sliders
- **Ranked Choice** - Rank options by preference
- **NPS Survey** - Net Promoter Score (0-10)
- **Image Choice** - Vote on images
- **Open Text** - Free-form responses
- **Slider** - Continuous scale selection
- **Clickable Cards** - Visual card-based voting

### Poll Templates
- Quick Poll
- Customer Satisfaction
- Event RSVP
- Photo Contest
- Ranked Voting
- Open Feedback

### Advanced Features
- Poll scheduling (start/end dates)
- IP-based vote limiting
- CAPTCHA protection
- Password-protected polls
- Results display modes (pie chart, bar chart)
- CSV/PDF export
- Real-time results (WebSockets)
- Branching/conditional questions
- Multi-question surveys
- Analytics dashboard

---

## Quick Reference

### URLs

| Purpose | URL |
|---------|-----|
| Home | http://localhost:8610 |
| Public Polls | http://localhost:8610/polls |
| Admin Dashboard | http://localhost:8610/admin |
| Test Embed | http://localhost:8610/test-embed |
| Login | http://localhost:8610/login |

### Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Rebuild
docker-compose build --no-cache && docker-compose up -d

# View logs
docker logs pollchat-app

# Database access
docker exec -it pollchat-db psql -U postgres -d pollchat
```

### Prisma Commands (inside container)

```bash
# Generate client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

---

## Related Documentation

| Document | Description |
|----------|-------------|
| `POLLCHAT_DOCUMENTATION.md` | This file - Master documentation for current features |
| `POLL_SHARING_PLAN.md` | Poll sharing & embedding features (✅ Implemented) |
| `POLLING_ARCHITECTURE1.md` | Advanced polling system roadmap (Future) |

---

## Version History

| Version | Changes |
|---------|---------|
| 2.0.0 | Poll sharing (Phase 1-3), AI chat, voice input |
| 1.0.0 | Initial release with basic polling |

---

*Last Updated: January 2026*
