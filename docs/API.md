# API Reference

MyPollingApp provides a comprehensive REST API for all operations. All endpoints return JSON responses.

## Base URL

```
http://localhost:8610/api
```

## Authentication

Most endpoints require authentication via NextAuth.js session cookies. Admin endpoints require admin roles.

### Session Check

```http
GET /api/auth/session
```

Returns current session or `null` if not authenticated.

## Polls API

### List All Polls

```http
GET /api/polls
```

**Response:**
```json
{
  "polls": [
    {
      "id": "poll-id",
      "title": "Poll Title",
      "description": "Description",
      "type": "single",
      "status": "open",
      "createdAt": "2026-01-15T00:00:00.000Z",
      "_count": {
        "votes": 42
      }
    }
  ]
}
```

### Get Single Poll

```http
GET /api/polls/{id}
```

**Response:**
```json
{
  "poll": {
    "id": "poll-id",
    "title": "Poll Title",
    "description": "Description",
    "type": "single",
    "status": "open",
    "options": [
      { "id": "opt-1", "label": "Option A", "orderIndex": 0 }
    ],
    "votes": [
      { "id": "vote-1", "value": "{\"selectedOption\":\"opt-1\"}" }
    ],
    "pollType": {
      "code": "single_choice",
      "name": "Single Choice"
    }
  }
}
```

### Submit Vote

```http
POST /api/polls/{id}/vote
Content-Type: application/json

{
  "value": {
    "selectedOption": "option-id"
  },
  "visitorId": "unique-visitor-id"
}
```

**Vote Value Formats by Poll Type:**

| Poll Type | Value Format |
|-----------|--------------|
| single_choice | `{ "selectedOption": "opt-id" }` |
| multiple_choice | `{ "selectedOptions": ["opt-1", "opt-2"] }` |
| yes_no | `{ "selectedOption": "yes" }` or `{ "selectedOption": "no" }` |
| rating_scale | `{ "rating": 4 }` |
| nps | `{ "score": 9 }` |
| ranked | `{ "rankings": ["opt-1", "opt-3", "opt-2"] }` |
| open_text | `{ "text": "User's response" }` |

**Response:**
```json
{
  "success": true,
  "vote": {
    "id": "vote-id",
    "pollId": "poll-id",
    "value": "{...}"
  }
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| `VOTE_LIMIT_REACHED` | Poll has reached maximum votes for owner's plan |
| `ALREADY_VOTED` | Visitor has already voted (if applicable) |
| `POLL_CLOSED` | Poll is no longer accepting votes |

### Get Vote Status

```http
GET /api/polls/{id}/vote-status?visitorId={visitorId}
```

**Response:**
```json
{
  "hasVoted": true,
  "vote": {
    "id": "vote-id",
    "value": "{...}"
  }
}
```

## Chat API

### Get Poll Messages

```http
GET /api/polls/{id}/messages
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-id",
      "content": "Message content",
      "role": "user",
      "createdAt": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

### Send Chat Message

```http
POST /api/chat
Content-Type: application/json

{
  "message": "Your question about the poll",
  "pollId": "poll-id"
}
```

**Response:**
```json
{
  "reply": "AI assistant's response",
  "messageId": "msg-id"
}
```

**Error:** `AI_INSIGHTS_NOT_ALLOWED` if user's plan doesn't include AI features.

## Voice API

### Transcribe Audio

```http
POST /api/voice/transcribe
Content-Type: multipart/form-data

audio: <audio-file>
```

**Response:**
```json
{
  "text": "Transcribed text from audio",
  "confidence": 0.95
}
```

**Error:** `VOICE_CHAT_NOT_ALLOWED` if user's plan doesn't include voice features.

## Subscription API

### Get Current Subscription

```http
GET /api/subscription
```

**Response:**
```json
{
  "id": "sub-id",
  "plan": "PROFESSIONAL",
  "status": "ACTIVE",
  "currentPeriodStart": "2026-01-15T00:00:00.000Z",
  "currentPeriodEnd": "2026-02-15T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "features": {
    "maxActivePolls": 50,
    "maxVotesPerPoll": -1,
    "voiceChat": true,
    "basicAiInsights": true,
    "advancedAiInsights": true,
    "customBranding": true
  },
  "usage": {
    "activePolls": 12
  }
}
```

## Admin API

All admin endpoints require `SUPER_ADMIN` or `POLL_ADMIN` role.

### Polls Management

#### List Admin Polls

```http
GET /api/admin/polls
```

#### Create Poll

```http
POST /api/admin/polls
Content-Type: application/json

{
  "title": "Poll Title",
  "description": "Description",
  "type": "single",
  "pollTypeId": "poll-type-id",
  "options": [
    { "label": "Option A", "orderIndex": 0 },
    { "label": "Option B", "orderIndex": 1 }
  ],
  "enableScheduling": true,
  "scheduledAt": "2026-01-25T09:00:00.000Z",
  "closedAt": "2026-01-30T17:00:00.000Z"
}
```

**Scheduling Options:**
- `enableScheduling` - Enable scheduling features
- `scheduledAt` - When to auto-open the poll (optional)
- `closedAt` - When to auto-close the poll (optional)
- If `scheduledAt` is in the future, poll status will be "scheduled"

**Error:** `POLL_LIMIT_REACHED` or `POLL_TYPE_NOT_ALLOWED` based on subscription.

#### Update Poll

```http
PUT /api/admin/polls/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "closed"
}
```

#### Delete Poll

```http
DELETE /api/admin/polls/{id}
```

### Poll Types Management

#### List Poll Types

```http
GET /api/admin/poll-types
```

#### Create Poll Type

```http
POST /api/admin/poll-types
Content-Type: application/json

{
  "code": "custom_type",
  "name": "Custom Type",
  "description": "A custom poll type",
  "icon": "🎯",
  "category": "custom",
  "defaultConfig": "{}",
  "sortOrder": 10
}
```

### Templates Management

#### List Templates

```http
GET /api/admin/templates
```

#### Create Template

```http
POST /api/admin/templates
Content-Type: application/json

{
  "name": "Customer Satisfaction",
  "pollTypeId": "nps-type-id",
  "defaultTitle": "How likely are you to recommend us?",
  "defaultDescription": "Rate from 0-10"
}
```

### Subscription Management (Super Admin)

#### List All Subscriptions

```http
GET /api/admin/subscriptions
```

**Response:**
```json
{
  "subscriptions": [
    {
      "id": "sub-id",
      "userId": "user-id",
      "plan": "PROFESSIONAL",
      "status": "ACTIVE",
      "user": {
        "email": "user@example.com",
        "name": "User Name"
      },
      "_count": {
        "user": {
          "polls": 12
        }
      }
    }
  ]
}
```

#### Update User Subscription

```http
POST /api/admin/subscriptions
Content-Type: application/json

{
  "userId": "user-id",
  "plan": "ENTERPRISE"
}
```

### AI Configuration

#### Get AI Providers

```http
GET /api/admin/ai/providers
```

#### Update AI Provider

```http
PUT /api/admin/ai/providers/{id}
Content-Type: application/json

{
  "isEnabled": true,
  "apiKey": "your-api-key"
}
```

### System Settings

#### Get All Settings

```http
GET /api/admin/settings
```

#### Update Setting

```http
POST /api/admin/settings
Content-Type: application/json

{
  "key": "businessName",
  "value": "My Company",
  "category": "branding"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not logged in |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Application Error Codes

| Code | Description |
|------|-------------|
| `POLL_LIMIT_REACHED` | User has reached their plan's poll limit |
| `VOTE_LIMIT_REACHED` | Poll has reached vote limit |
| `POLL_TYPE_NOT_ALLOWED` | Poll type not available in user's plan |
| `VOICE_CHAT_NOT_ALLOWED` | Voice features not in user's plan |
| `AI_INSIGHTS_NOT_ALLOWED` | AI features not in user's plan |
| `ALREADY_VOTED` | Visitor has already voted |
| `POLL_NOT_FOUND` | Poll does not exist |
| `POLL_CLOSED` | Poll is not accepting votes |
| `INVALID_VOTE_VALUE` | Vote format is incorrect |

## Rate Limiting

API endpoints are rate limited:

| Endpoint Category | Limit |
|-------------------|-------|
| Public polls | 100/minute |
| Voting | 10/minute per visitor |
| Chat | 20/minute |
| Admin | 60/minute |

## Checkout API

### Create Checkout Session

```http
POST /api/checkout/create-session
Content-Type: application/json

{
  "planId": "plan-id"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

### Verify Payment

```http
POST /api/checkout/verify
Content-Type: application/json

{
  "sessionId": "cs_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "plan": "PROFESSIONAL"
}
```

## Webhooks

### Payment Webhooks

```
POST /api/webhooks/stripe     - Stripe events (checkout, subscriptions, invoices)
POST /api/webhooks/paypal     - PayPal events (orders, subscriptions)
POST /api/webhooks/braintree  - Braintree subscription events
POST /api/webhooks/square     - Square payment events
POST /api/webhooks/authorize  - Authorize.net ARB events
```

Webhook payloads are verified using gateway-specific signatures.

**Stripe Events Handled:**
- `checkout.session.completed` - Activates subscription
- `customer.subscription.created` - Creates subscription
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Cancels subscription
- `invoice.payment_succeeded` - Sends receipt email
- `invoice.payment_failed` - Marks subscription past due

## Cron API

### Process Scheduled Polls

```http
GET /api/cron/process-polls
Authorization: Bearer {CRON_SECRET}
```

Opens scheduled polls and closes expired polls. Call periodically (e.g., every minute).

## SWR Integration

The frontend uses SWR for data fetching with automatic revalidation:

```typescript
// Poll list - refreshes every 10 seconds
const { polls } = usePolls();

// Single poll - refreshes every 5 seconds
const { poll } = usePoll(pollId);

// Messages - refreshes every 3 seconds
const { messages } = usePollMessages(pollId);

// Subscription data
const { subscription, features } = useSubscription();
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// Fetch polls
const response = await fetch('/api/polls');
const { polls } = await response.json();

// Submit vote
const voteResponse = await fetch(`/api/polls/${pollId}/vote`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    value: { selectedOption: optionId },
    visitorId: getVisitorId()
  })
});
```

### cURL

```bash
# Get polls
curl http://localhost:8610/api/polls

# Submit vote
curl -X POST http://localhost:8610/api/polls/poll-id/vote \
  -H "Content-Type: application/json" \
  -d '{"value":{"selectedOption":"opt-id"},"visitorId":"visitor-123"}'
```
