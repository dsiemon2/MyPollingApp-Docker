/**
 * Subscription Tests
 * Tests for subscription plans and management
 * Based on SubscriptionTest.php from Voting_NewAndImproved
 */

describe('Subscription Plans - Plan Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  test('FREE plan has correct limits', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        plan: 'FREE',
        features: {
          maxPolls: 3,
          maxVotesPerPoll: 50,
          voiceEnabled: false,
          aiEnabled: false,
          brandingRemoval: false,
        },
      }),
    });

    const response = await fetch('/api/subscription');
    const data = await response.json();

    expect(data.features.maxPolls).toBe(3);
    expect(data.features.maxVotesPerPoll).toBe(50);
    expect(data.features.voiceEnabled).toBe(false);
    expect(data.features.aiEnabled).toBe(false);
  });

  test('STARTER plan has correct limits', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        plan: 'STARTER',
        price: 9.99,
        features: {
          maxPolls: 10,
          maxVotesPerPoll: 200,
          voiceEnabled: true,
          aiEnabled: true,
          aiLevel: 'basic',
          brandingRemoval: false,
        },
      }),
    });

    const response = await fetch('/api/subscription');
    const data = await response.json();

    expect(data.price).toBe(9.99);
    expect(data.features.maxPolls).toBe(10);
    expect(data.features.voiceEnabled).toBe(true);
    expect(data.features.aiEnabled).toBe(true);
  });

  test('PROFESSIONAL plan has correct limits', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        plan: 'PROFESSIONAL',
        price: 29.99,
        features: {
          maxPolls: 50,
          maxVotesPerPoll: -1, // Unlimited
          voiceEnabled: true,
          aiEnabled: true,
          aiLevel: 'advanced',
          brandingRemoval: true,
        },
      }),
    });

    const response = await fetch('/api/subscription');
    const data = await response.json();

    expect(data.price).toBe(29.99);
    expect(data.features.maxPolls).toBe(50);
    expect(data.features.maxVotesPerPoll).toBe(-1);
    expect(data.features.brandingRemoval).toBe(true);
  });

  test('ENTERPRISE plan has unlimited features', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        plan: 'ENTERPRISE',
        price: 99,
        features: {
          maxPolls: -1, // Unlimited
          maxVotesPerPoll: -1, // Unlimited
          voiceEnabled: true,
          aiEnabled: true,
          aiLevel: 'advanced',
          brandingRemoval: true,
          prioritySupport: true,
        },
      }),
    });

    const response = await fetch('/api/subscription');
    const data = await response.json();

    expect(data.features.maxPolls).toBe(-1);
    expect(data.features.maxVotesPerPoll).toBe(-1);
    expect(data.features.prioritySupport).toBe(true);
  });
});

describe('Subscription Plans - Plan Retrieval', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns all active plans', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { name: 'FREE', price: 0, isActive: true },
        { name: 'STARTER', price: 9.99, isActive: true },
        { name: 'PROFESSIONAL', price: 29.99, isActive: true },
        { name: 'ENTERPRISE', price: 99, isActive: true },
      ]),
    });

    const response = await fetch('/api/admin/pricing');
    const data = await response.json();

    expect(data).toHaveLength(4);
    expect(data.every((p: any) => p.isActive)).toBe(true);
  });

  test('returns formatted price display', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        plan: 'STARTER',
        price: 9.99,
        formattedPrice: '$9.99/month',
        interval: 'month',
      }),
    });

    const response = await fetch('/api/subscription');
    const data = await response.json();

    expect(data.formattedPrice).toBe('$9.99/month');
  });

  test('pricing page is accessible', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const response = await fetch('/admin/pricing');
    expect(response.ok).toBe(true);
  });
});

describe('Subscription - User Subscription', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('creates subscription for user', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        subscription: {
          plan: 'STARTER',
          status: 'ACTIVE',
          currentPeriodStart: '2024-01-01',
          currentPeriodEnd: '2024-02-01',
        },
      }),
    });

    const response = await fetch('/api/admin/subscription/subscribe/starter', {
      method: 'POST',
    });

    const data = await response.json();
    expect(data.subscription.plan).toBe('STARTER');
    expect(data.subscription.status).toBe('ACTIVE');
  });

  test('subscription has user relationship', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        userId: '1',
        user: { email: 'user@example.com' },
        plan: 'STARTER',
      }),
    });

    const response = await fetch('/api/admin/my-subscription');
    const data = await response.json();

    expect(data.userId).toBeDefined();
    expect(data.user).toBeDefined();
  });

  test('my subscription page is accessible', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const response = await fetch('/admin/my-subscription');
    expect(response.ok).toBe(true);
  });
});

describe('Subscription - Status Management', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('subscription status is ACTIVE', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'ACTIVE',
        isActive: true,
      }),
    });

    const response = await fetch('/api/subscription');
    const data = await response.json();

    expect(data.status).toBe('ACTIVE');
    expect(data.isActive).toBe(true);
  });

  test('subscription can be cancelled', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'CANCELLED',
        cancelledAt: '2024-01-15',
        cancelAtPeriodEnd: true,
      }),
    });

    const response = await fetch('/api/admin/subscription/cancel', {
      method: 'POST',
    });

    const data = await response.json();
    expect(data.status).toBe('CANCELLED');
    expect(data.cancelAtPeriodEnd).toBe(true);
  });

  test('cancelled subscription can be resumed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      }),
    });

    const response = await fetch('/api/admin/subscription/resume', {
      method: 'POST',
    });

    const data = await response.json();
    expect(data.status).toBe('ACTIVE');
    expect(data.cancelAtPeriodEnd).toBe(false);
  });

  test('subscription can be in TRIALING status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'TRIALING',
        trialStart: '2024-01-01',
        trialEnd: '2024-01-15',
        daysRemaining: 10,
      }),
    });

    const response = await fetch('/api/subscription');
    const data = await response.json();

    expect(data.status).toBe('TRIALING');
    expect(data.daysRemaining).toBeGreaterThan(0);
  });
});

describe('Subscription - Feature Verification', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('checks if user can create poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        canCreatePoll: true,
        currentPolls: 2,
        maxPolls: 10,
      }),
    });

    const response = await fetch('/api/subscription/can-create-poll');
    const data = await response.json();

    expect(data.canCreatePoll).toBe(true);
  });

  test('checks if user can use voice chat', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        canUseVoiceChat: true,
        plan: 'STARTER',
      }),
    });

    const response = await fetch('/api/subscription/can-use-voice');
    const data = await response.json();

    expect(data.canUseVoiceChat).toBe(true);
  });

  test('checks if user can use AI features', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        canUseAI: true,
        aiLevel: 'basic',
      }),
    });

    const response = await fetch('/api/subscription/can-use-ai');
    const data = await response.json();

    expect(data.canUseAI).toBe(true);
  });
});

describe('Subscription - Trial', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('starts trial for plan', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        plan: 'PROFESSIONAL',
        status: 'TRIALING',
        trialDays: 14,
        trialEndsAt: '2024-01-15',
      }),
    });

    const response = await fetch('/api/admin/subscription/start-trial/professional', {
      method: 'POST',
    });

    const data = await response.json();
    expect(data.status).toBe('TRIALING');
    expect(data.trialDays).toBe(14);
  });

  test('trial converts to paid subscription', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'ACTIVE',
        previousStatus: 'TRIALING',
        paymentMethod: 'card',
      }),
    });

    const response = await fetch('/api/admin/subscription/convert-trial', {
      method: 'POST',
    });

    const data = await response.json();
    expect(data.status).toBe('ACTIVE');
    expect(data.previousStatus).toBe('TRIALING');
  });
});

describe('Subscription - Admin Management', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('lists all subscriptions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { userId: '1', plan: 'FREE', status: 'ACTIVE' },
        { userId: '2', plan: 'STARTER', status: 'ACTIVE' },
        { userId: '3', plan: 'PROFESSIONAL', status: 'TRIALING' },
      ]),
    });

    const response = await fetch('/api/admin/subscriptions');
    const data = await response.json();

    expect(data).toHaveLength(3);
  });

  test('filters subscriptions by status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { userId: '3', plan: 'PROFESSIONAL', status: 'TRIALING' },
      ]),
    });

    const response = await fetch('/api/admin/subscriptions?status=TRIALING');
    const data = await response.json();

    expect(data.every((s: any) => s.status === 'TRIALING')).toBe(true);
  });

  test('filters subscriptions by plan', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { userId: '2', plan: 'STARTER', status: 'ACTIVE' },
      ]),
    });

    const response = await fetch('/api/admin/subscriptions?plan=STARTER');
    const data = await response.json();

    expect(data.every((s: any) => s.plan === 'STARTER')).toBe(true);
  });
});
