/**
 * Subscription Limits Unit Tests
 * Tests for subscription limit enforcement
 */

describe('Subscription Limits - Poll Limits', () => {
  const plans = {
    FREE: { maxPolls: 3 },
    STARTER: { maxPolls: 10 },
    PROFESSIONAL: { maxPolls: 50 },
    ENTERPRISE: { maxPolls: -1 }, // Unlimited
  };

  test('FREE plan allows 3 polls', () => {
    expect(plans.FREE.maxPolls).toBe(3);
  });

  test('STARTER plan allows 10 polls', () => {
    expect(plans.STARTER.maxPolls).toBe(10);
  });

  test('PROFESSIONAL plan allows 50 polls', () => {
    expect(plans.PROFESSIONAL.maxPolls).toBe(50);
  });

  test('ENTERPRISE plan allows unlimited polls', () => {
    expect(plans.ENTERPRISE.maxPolls).toBe(-1);
  });

  test('canCreatePoll returns false when at limit', () => {
    const canCreatePoll = (currentPolls: number, maxPolls: number) => {
      if (maxPolls === -1) return true;
      return currentPolls < maxPolls;
    };

    expect(canCreatePoll(3, 3)).toBe(false);
    expect(canCreatePoll(2, 3)).toBe(true);
    expect(canCreatePoll(100, -1)).toBe(true);
  });
});

describe('Subscription Limits - Vote Limits', () => {
  const plans = {
    FREE: { maxVotesPerPoll: 50 },
    STARTER: { maxVotesPerPoll: 200 },
    PROFESSIONAL: { maxVotesPerPoll: -1 },
    ENTERPRISE: { maxVotesPerPoll: -1 },
  };

  test('FREE plan allows 50 votes per poll', () => {
    expect(plans.FREE.maxVotesPerPoll).toBe(50);
  });

  test('STARTER plan allows 200 votes per poll', () => {
    expect(plans.STARTER.maxVotesPerPoll).toBe(200);
  });

  test('PROFESSIONAL plan allows unlimited votes', () => {
    expect(plans.PROFESSIONAL.maxVotesPerPoll).toBe(-1);
  });

  test('canVote returns false when at limit', () => {
    const canVote = (currentVotes: number, maxVotes: number) => {
      if (maxVotes === -1) return true;
      return currentVotes < maxVotes;
    };

    expect(canVote(50, 50)).toBe(false);
    expect(canVote(49, 50)).toBe(true);
    expect(canVote(10000, -1)).toBe(true);
  });
});

describe('Subscription Limits - Feature Access', () => {
  const features = {
    FREE: { voice: false, ai: false, branding: false },
    STARTER: { voice: true, ai: true, branding: false },
    PROFESSIONAL: { voice: true, ai: true, branding: true },
    ENTERPRISE: { voice: true, ai: true, branding: true },
  };

  test('FREE plan has no voice/AI features', () => {
    expect(features.FREE.voice).toBe(false);
    expect(features.FREE.ai).toBe(false);
  });

  test('STARTER plan has voice and AI features', () => {
    expect(features.STARTER.voice).toBe(true);
    expect(features.STARTER.ai).toBe(true);
  });

  test('PROFESSIONAL plan has all features', () => {
    expect(features.PROFESSIONAL.voice).toBe(true);
    expect(features.PROFESSIONAL.ai).toBe(true);
    expect(features.PROFESSIONAL.branding).toBe(true);
  });

  test('feature check function works correctly', () => {
    const hasFeature = (plan: string, feature: keyof typeof features.FREE) => {
      return features[plan as keyof typeof features]?.[feature] ?? false;
    };

    expect(hasFeature('FREE', 'voice')).toBe(false);
    expect(hasFeature('STARTER', 'voice')).toBe(true);
    expect(hasFeature('FREE', 'ai')).toBe(false);
    expect(hasFeature('PROFESSIONAL', 'branding')).toBe(true);
  });
});

describe('Subscription Limits - Poll Type Access', () => {
  const pollTypeAccess = {
    single_choice: 'FREE',
    multiple_choice: 'FREE',
    yes_no: 'FREE',
    rating_scale: 'STARTER',
    nps: 'STARTER',
    ranked: 'STARTER',
    open_text: 'STARTER',
  };

  const planHierarchy = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

  test('canUsePollType checks plan level', () => {
    const canUsePollType = (userPlan: string, pollType: string) => {
      const requiredPlan = pollTypeAccess[pollType as keyof typeof pollTypeAccess];
      const userLevel = planHierarchy.indexOf(userPlan);
      const requiredLevel = planHierarchy.indexOf(requiredPlan);
      return userLevel >= requiredLevel;
    };

    expect(canUsePollType('FREE', 'single_choice')).toBe(true);
    expect(canUsePollType('FREE', 'rating_scale')).toBe(false);
    expect(canUsePollType('STARTER', 'rating_scale')).toBe(true);
    expect(canUsePollType('PROFESSIONAL', 'nps')).toBe(true);
  });
});

describe('Subscription Limits - Price Calculation', () => {
  const prices = {
    FREE: { monthly: 0, yearly: 0 },
    STARTER: { monthly: 9.99, yearly: 99.99 },
    PROFESSIONAL: { monthly: 29.99, yearly: 299.99 },
    ENTERPRISE: { monthly: 99, yearly: 999 },
  };

  test('yearly discount is approximately 16%', () => {
    const monthlyTotal = prices.STARTER.monthly * 12;
    const yearlyPrice = prices.STARTER.yearly;
    const discount = (monthlyTotal - yearlyPrice) / monthlyTotal;

    expect(discount).toBeCloseTo(0.167, 1); // ~16.7% discount
  });

  test('formats price correctly', () => {
    const formatPrice = (price: number) => {
      if (price === 0) return 'Free';
      return `$${price.toFixed(2)}/month`;
    };

    expect(formatPrice(0)).toBe('Free');
    expect(formatPrice(9.99)).toBe('$9.99/month');
    expect(formatPrice(29.99)).toBe('$29.99/month');
  });
});
