# Subscription System

PollChat includes a comprehensive subscription management system with four tiers designed for different user needs.

## Plan Tiers

### Free ($0/month)
Perfect for trying out the platform.

**Limits:**
- 3 active polls
- 50 votes per poll
- Basic poll types only (Single Choice, Multiple Choice, Yes/No)

**Features:**
- Real-time results
- Basic analytics

**Restrictions:**
- No voice chat
- No AI insights
- No custom branding

### Starter ($9.99/month)
For small teams and individual users.

**Limits:**
- 10 active polls
- 200 votes per poll
- All poll types

**Features:**
- Real-time results
- Voice chat with Whisper transcription
- Basic AI insights
- Email support

### Professional ($29.99/month) - Most Popular
For growing organizations.

**Limits:**
- 50 active polls
- Unlimited votes per poll
- All poll types

**Features:**
- Everything in Starter
- Advanced AI insights
- Analytics dashboard
- Custom branding (logo, colors)
- Priority support

### Enterprise ($99/month)
For large organizations.

**Limits:**
- Unlimited polls
- Unlimited votes
- All poll types

**Features:**
- Everything in Professional
- White-label options
- API access
- Custom integrations
- Dedicated support

## Technical Implementation

### Database Schema

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

### Plan Configuration

Plans are configured in `src/config/plans.ts`:

```typescript
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
      // ...
    }
  },
  // ... other plans
};
```

### Enforcement Points

| Feature | Enforcement Location | Error Code |
|---------|---------------------|------------|
| Poll creation | `/api/admin/polls` | `POLL_LIMIT_REACHED` |
| Vote submission | `/api/polls/[id]/vote` | `VOTE_LIMIT_REACHED` |
| Poll type access | `/api/admin/polls` | `POLL_TYPE_NOT_ALLOWED` |
| Voice chat | `/api/voice/transcribe` | `VOICE_CHAT_NOT_ALLOWED` |
| AI insights | `/api/chat` | `AI_INSIGHTS_NOT_ALLOWED` |

### React Hook

Use the `useSubscription` hook in components:

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent() {
  const {
    subscription,
    planConfig,
    features,
    canCreatePoll,
    canUseVoiceChat,
    canUseAiInsights,
    remainingPolls
  } = useSubscription();

  if (!canUseVoiceChat) {
    return <UpgradePrompt feature="voice chat" />;
  }

  // ...
}
```

## Admin Management

Admins can manage subscriptions at `/admin/subscriptions`:

- View all user subscriptions
- Change user plans
- View plan usage statistics
- See feature availability per user

## API Endpoints

### Get Current Subscription
```
GET /api/subscription
```

Response:
```json
{
  "plan": "STARTER",
  "status": "ACTIVE",
  "activePolls": 5,
  "currentPeriodEnd": "2026-02-15T00:00:00.000Z"
}
```

### Admin: List All Subscriptions
```
GET /api/admin/subscriptions
```

### Admin: Update Subscription
```
POST /api/admin/subscriptions
Content-Type: application/json

{
  "userId": "user_id",
  "plan": "PROFESSIONAL"
}
```

## Upgrade Flow

1. User hits a feature limit
2. API returns error with upgrade prompt
3. Frontend shows upgrade modal
4. User selects new plan
5. Payment processed via configured gateway
6. Subscription updated in database
7. Features immediately available
