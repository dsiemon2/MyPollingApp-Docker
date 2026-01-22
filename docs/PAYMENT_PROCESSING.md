# Payment Processing

MyPollingApp supports multiple payment gateways for subscription management. Configure the gateway that best fits your needs.

## Supported Gateways

| Gateway | Status | Best For |
|---------|--------|----------|
| Stripe | Production Ready | Global businesses |
| Braintree | Production Ready | PayPal integration |
| Square | Production Ready | Retail/POS businesses |
| Authorize.net | Production Ready | Enterprise/legacy systems |

## Configuration

### Admin Panel Setup

1. Go to **Admin Panel** → **Settings** → **Payment**
2. Select your preferred gateway
3. Enter API credentials
4. Enable/disable test mode
5. Save settings

### Environment Variables

Add credentials to your `.env` file:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Braintree
BRAINTREE_MERCHANT_ID=your_merchant_id
BRAINTREE_PUBLIC_KEY=your_public_key
BRAINTREE_PRIVATE_KEY=your_private_key
BRAINTREE_ENVIRONMENT=sandbox  # or production

# Square
SQUARE_ACCESS_TOKEN=your_access_token
SQUARE_APPLICATION_ID=your_app_id
SQUARE_LOCATION_ID=your_location_id
SQUARE_ENVIRONMENT=sandbox  # or production

# Authorize.net
AUTHNET_API_LOGIN_ID=your_login_id
AUTHNET_TRANSACTION_KEY=your_transaction_key
AUTHNET_ENVIRONMENT=sandbox  # or production
```

## Stripe Integration

### Setup

1. Create a [Stripe account](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Configure webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`

### Features

- Automatic subscription management
- Built-in customer portal
- SCA/3D Secure support
- Invoicing and receipts
- Multiple payment methods

### Webhook Events

Configure these events in Stripe Dashboard:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Price IDs

Create products and prices in Stripe Dashboard, then map them in the admin panel:

| Plan | Monthly Price ID |
|------|------------------|
| Starter | price_starter_monthly |
| Professional | price_professional_monthly |
| Enterprise | price_enterprise_monthly |

## Braintree Integration

### Setup

1. Create a [Braintree account](https://www.braintreepayments.com)
2. Get credentials from Settings → API
3. Configure webhook destination

### Features

- PayPal integration built-in
- Venmo support
- Drop-in UI components
- Vault for saved cards
- Recurring billing

### Payment Methods

- Credit/Debit cards
- PayPal
- Venmo
- Apple Pay
- Google Pay

## Square Integration

### Setup

1. Create a [Square Developer account](https://developer.squareup.com)
2. Create an application
3. Get credentials from Developer Dashboard

### Features

- Integrated with Square POS
- Customer directory
- Recurring payments
- Inventory sync (if applicable)

### Location Setup

Square requires a Location ID for payments:

1. Go to Square Dashboard → Locations
2. Copy the Location ID
3. Add to environment variables

## Authorize.net Integration

### Setup

1. Create an [Authorize.net account](https://www.authorize.net)
2. Get credentials from Account → Settings → Security Settings → API Credentials & Keys

### Features

- Established enterprise gateway
- ACH/eCheck support
- ARB (Automated Recurring Billing)
- Fraud detection suite

### Transaction Types

- `AUTH_CAPTURE` - Authorize and capture in one step
- `AUTH_ONLY` - Authorization only
- `CAPTURE_ONLY` - Capture a previous authorization

## Implementation Details

### Payment Service Architecture

```
src/services/payments/
├── stripe.ts         # Stripe implementation
├── braintree.ts      # Braintree implementation
├── square.ts         # Square implementation
├── authorizenet.ts   # Authorize.net implementation
└── index.ts          # Gateway factory
```

### Gateway Interface

All gateways implement a common interface:

```typescript
interface PaymentGateway {
  createCustomer(email: string, name: string): Promise<string>;
  createSubscription(customerId: string, planId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  updateSubscription(subscriptionId: string, newPlanId: string): Promise<Subscription>;
  getSubscription(subscriptionId: string): Promise<Subscription>;
  handleWebhook(payload: any, signature: string): Promise<WebhookResult>;
}
```

### Subscription Flow

```
1. User selects plan
   ↓
2. Frontend calls /api/checkout
   ↓
3. Backend creates checkout session with selected gateway
   ↓
4. User completes payment on gateway's checkout page
   ↓
5. Gateway sends webhook to /api/webhooks/{gateway}
   ↓
6. Backend updates Subscription in database
   ↓
7. User gains access to new features
```

## Testing

### Test Mode

Enable test mode in Admin Panel → Settings → Payment → Enable Test Mode

### Test Cards

**Stripe:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

**Braintree:**
- Success: `4111 1111 1111 1111`
- Decline: `4000 1111 1111 1115`

**Square:**
- Success: `4532 0000 0000 0000`
- Decline: `4000 0000 0000 0001`

**Authorize.net:**
- Success: `4111 1111 1111 1111`
- Decline: `4222 2222 2222 2220`

## Error Handling

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `CARD_DECLINED` | Card was declined | Try different card |
| `INSUFFICIENT_FUNDS` | Not enough balance | Use different card |
| `EXPIRED_CARD` | Card has expired | Update card details |
| `INVALID_CVC` | CVC code incorrect | Re-enter CVC |
| `PROCESSING_ERROR` | Gateway error | Retry later |

### Webhook Failures

Webhooks are automatically retried by payment gateways. If persistent failures occur:

1. Check webhook URL is correct
2. Verify webhook secret/signature
3. Check server logs for errors
4. Test with gateway's webhook testing tools

## Security Best Practices

1. **Never store full card numbers** - Use gateway tokens
2. **Use HTTPS** - Required for payment pages
3. **Validate webhooks** - Always verify signatures
4. **Keep keys secret** - Never commit to version control
5. **Use test mode** - For development and staging
6. **PCI compliance** - Let gateways handle card data

## Subscription Management API

### Create Checkout Session

```
POST /api/checkout
Content-Type: application/json

{
  "planId": "PROFESSIONAL",
  "successUrl": "https://yourdomain.com/success",
  "cancelUrl": "https://yourdomain.com/pricing"
}
```

### Cancel Subscription

```
POST /api/subscription/cancel
```

### Get Current Subscription

```
GET /api/subscription
```

Response:
```json
{
  "plan": "PROFESSIONAL",
  "status": "ACTIVE",
  "currentPeriodEnd": "2026-02-15T00:00:00.000Z",
  "cancelAtPeriodEnd": false
}
```
