# Implementation Details

This document covers the technical architecture and implementation details of PollChat.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TailwindCSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL with Prisma ORM |
| Authentication | NextAuth.js |
| State Management | SWR (stale-while-revalidate) |
| AI | Hugging Face, OpenAI |
| Voice | OpenAI Whisper |
| Payments | Stripe, Braintree, Square, Authorize.net |
| Containerization | Docker, Docker Compose |

## Project Structure

```
MyPollingApp-Docker/
├── docs/                      # Documentation
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.js               # Database seeding
│   └── migrations/           # Migration files
├── public/
│   └── images/               # Static assets
├── src/
│   ├── components/
│   │   ├── admin/           # Admin panel components
│   │   ├── poll-inputs/     # Vote input components
│   │   └── poll-results/    # Results display components
│   ├── config/
│   │   └── plans.ts         # Subscription plan configuration
│   ├── hooks/
│   │   ├── usePolls.ts      # SWR poll hooks
│   │   ├── useSubscription.ts # Subscription hook
│   │   └── useSettings.ts   # System settings hook
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   └── auth.ts          # NextAuth configuration
│   ├── pages/
│   │   ├── admin/           # Admin panel pages
│   │   ├── api/             # API routes
│   │   └── polls/           # Poll pages
│   ├── services/
│   │   └── payments/        # Payment gateway modules
│   ├── styles/              # CSS styles
│   └── types/               # TypeScript definitions
├── docker-compose.yml        # Docker orchestration
├── Dockerfile               # Container build
└── docker-entrypoint.sh     # Startup script
```

## Database Schema

### Core Models

```prisma
model User {
  id           String       @id @default(cuid())
  email        String       @unique
  password     String
  name         String?
  role         Role         @default(USER)
  polls        Poll[]
  votes        Vote[]
  messages     ChatMessage[]
  subscription Subscription?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Poll {
  id          String       @id @default(cuid())
  title       String
  description String?
  type        String
  status      String       @default("open")
  creatorId   String
  creator     User         @relation(...)
  pollTypeId  String?
  pollType    PollType?    @relation(...)
  options     PollOption[]
  votes       Vote[]
  messages    ChatMessage[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model PollOption {
  id         String @id @default(cuid())
  pollId     String
  poll       Poll   @relation(...)
  label      String
  orderIndex Int    @default(0)
}

model Vote {
  id        String   @id @default(cuid())
  pollId    String
  poll      Poll     @relation(...)
  userId    String?
  user      User?    @relation(...)
  visitorId String?
  value     String   // JSON string
  createdAt DateTime @default(now())
}
```

### Subscription Model

```prisma
enum PlanType {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  PAST_DUE
  TRIALING
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  user                 User               @relation(...)
  plan                 PlanType           @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  paymentGateway       String?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  trialStart           DateTime?
  trialEnd             DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
}
```

## State Management with SWR

### Poll Hooks

```typescript
// src/hooks/usePolls.ts

export function usePolls() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/polls',
    fetcher,
    { refreshInterval: 10000 }  // Refresh every 10 seconds
  );

  return {
    polls: data?.polls || [],
    isLoading,
    isError: error,
    refresh: mutate
  };
}

export function usePoll(pollId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    pollId ? `/api/polls/${pollId}` : null,
    fetcher,
    { refreshInterval: 5000 }  // Refresh every 5 seconds
  );

  return {
    poll: data?.poll,
    isLoading,
    isError: error,
    refresh: mutate
  };
}
```

### Cache Invalidation

```typescript
export function invalidatePoll(pollId: string) {
  mutate(`/api/polls/${pollId}`);
}

export function invalidatePolls() {
  mutate('/api/polls');
}
```

## Poll Type System

### Type Registration

Poll types are stored in the database with their configuration:

```typescript
const pollTypes = [
  {
    code: 'single_choice',
    name: 'Single Choice',
    category: 'choice',
    icon: '⭕',
    defaultConfig: '{}'
  },
  {
    code: 'rating_scale',
    name: 'Rating Scale',
    category: 'rating',
    icon: '⭐',
    defaultConfig: '{"maxValue":5,"style":"stars"}'
  }
  // ...
];
```

### Vote Input Components

Dynamic component loading based on poll type:

```typescript
// src/components/poll-inputs/index.tsx

const inputComponents: Record<string, React.ComponentType> = {
  single_choice: SingleChoiceInput,
  multiple_choice: MultipleChoiceInput,
  yes_no: YesNoInput,
  rating_scale: RatingScaleInput,
  nps: NPSInput,
  ranked: RankedChoiceInput,
  open_text: OpenTextInput
};

export function PollInput({ pollType, ...props }) {
  const Component = inputComponents[pollType.code];
  return Component ? <Component {...props} /> : null;
}
```

### Results Display Components

```typescript
// src/components/poll-results/index.tsx

const resultComponents: Record<string, React.ComponentType> = {
  single_choice: SingleChoiceResults,
  multiple_choice: MultipleChoiceResults,
  yes_no: YesNoResults,
  rating_scale: RatingScaleResults,
  nps: NPSResults,
  ranked: RankedChoiceResults,
  open_text: OpenTextResults
};

export function PollResults({ pollType, ...props }) {
  const Component = resultComponents[pollType.code];
  return Component ? <Component {...props} /> : null;
}
```

## Subscription Feature Gating

### Plan Configuration

```typescript
// src/config/plans.ts

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  FREE: {
    name: 'FREE',
    displayName: 'Free',
    price: 0,
    features: {
      maxActivePolls: 3,
      maxVotesPerPoll: 50,
      basicPollTypes: true,
      allPollTypes: false,
      voiceChat: false,
      basicAiInsights: false,
      advancedAiInsights: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false
    }
  },
  // ... other plans
};
```

### Enforcement Points

| Feature | Location | Check Function |
|---------|----------|----------------|
| Poll creation | `/api/admin/polls` | `canCreatePoll()` |
| Vote submission | `/api/polls/[id]/vote` | `canAcceptVote()` |
| Poll types | `/api/admin/polls` | `canUsePollType()` |
| Voice chat | `/api/voice/transcribe` | `canUseVoiceChat()` |
| AI insights | `/api/chat` | `canUseAiInsights()` |

### API Enforcement Example

```typescript
// src/pages/api/admin/polls/index.ts

export async function POST(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Get user's subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id }
  });

  const plan = subscription?.plan || 'FREE';

  // Check poll limit
  const activePolls = await prisma.poll.count({
    where: { creatorId: session.user.id, status: 'open' }
  });

  if (!canCreatePoll(plan, activePolls)) {
    return res.status(403).json({
      error: 'Poll limit reached for your plan',
      code: 'POLL_LIMIT_REACHED'
    });
  }

  // Create poll...
}
```

## Authentication Flow

### NextAuth Configuration

```typescript
// src/lib/auth.ts

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return { id: user.id, email: user.email, role: user.role };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.userId;
      return session;
    }
  }
};
```

## Payment Integration

### Gateway Factory Pattern

```typescript
// src/services/payments/index.ts

export function getPaymentGateway(name: string): PaymentGateway {
  switch (name) {
    case 'stripe':
      return new StripeGateway();
    case 'braintree':
      return new BraintreeGateway();
    case 'square':
      return new SquareGateway();
    case 'authorizenet':
      return new AuthorizeNetGateway();
    default:
      throw new Error(`Unknown gateway: ${name}`);
  }
}
```

### Webhook Processing

```typescript
// src/pages/api/webhooks/stripe.ts

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'customer.subscription.updated':
      await updateSubscription(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await cancelSubscription(event.data.object);
      break;
  }

  res.json({ received: true });
}
```

## Docker Configuration

### Multi-Stage Build

```dockerfile
# Build stage
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libssl-dev
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y openssl
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./
CMD ["./docker-entrypoint.sh"]
```

### Entrypoint Script

```bash
#!/bin/sh
set -e

echo "Running database migrations..."
node ./node_modules/prisma/build/index.js db push --skip-generate

echo "Seeding database..."
node prisma/seed.js || echo "Seeding skipped"

echo "Starting application..."
exec node server.js
```

## Performance Optimizations

### SWR Configuration

- Poll list: 10-second refresh
- Single poll: 5-second refresh
- Chat messages: 3-second refresh
- Deduplication: Requests within 2 seconds share cache

### Database Indexes

Key indexes for query performance:

```prisma
@@index([creatorId])
@@index([pollId])
@@index([userId])
@@index([visitorId, pollId])
```

### Image Optimization

Next.js Image component with automatic:
- WebP conversion
- Lazy loading
- Responsive sizing

## Security Measures

1. **Password Hashing**: bcryptjs with salt rounds
2. **Session Management**: HTTP-only cookies
3. **CSRF Protection**: Built into NextAuth
4. **SQL Injection**: Prevented by Prisma ORM
5. **XSS Protection**: React escaping + CSP headers
6. **Rate Limiting**: Per-endpoint limits
7. **Webhook Verification**: Signature validation

## Error Handling

### API Error Format

```typescript
interface ApiError {
  error: string;
  code: string;
  details?: Record<string, any>;
}
```

### Client-Side Error Handling

```typescript
try {
  const response = await fetch('/api/...');
  if (!response.ok) {
    const { error, code } = await response.json();
    handleError(code, error);
  }
} catch (e) {
  handleNetworkError(e);
}
```

## Testing Strategy

### Unit Tests
- Utility functions
- Vote calculation logic
- Plan feature checks

### Integration Tests
- API endpoint responses
- Database operations
- Authentication flows

### E2E Tests
- Full voting flow
- Admin operations
- Subscription upgrades
