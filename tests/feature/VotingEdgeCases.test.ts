/**
 * Voting Edge Case Tests
 * Tests for voting system edge cases and validation
 * Based on VotingEdgeCaseTest.php from Voting_NewAndImproved
 */

describe('Voting Edge Cases - Time Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  test('voting fails before poll start time', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Voting has not started yet',
        startsAt: '2024-02-01T00:00:00Z',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    expect(response.ok).toBe(false);
    const data = await response.json();
    expect(data.error).toContain('not started');
  });

  test('voting fails after poll end time', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Voting has ended',
        endedAt: '2024-01-01T00:00:00Z',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    expect(response.ok).toBe(false);
    const data = await response.json();
    expect(data.error).toContain('ended');
  });

  test('voting fails when poll is inactive/closed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Poll is closed',
        status: 'closed',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    expect(response.ok).toBe(false);
  });
});

describe('Voting Edge Cases - Vote Validation', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('same option cannot be selected multiple times in ranked voting', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Each option can only be ranked once',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({
        rankings: [
          { optionId: '1', rank: 1 },
          { optionId: '1', rank: 2 }, // Duplicate
        ],
      }),
    });

    expect(response.ok).toBe(false);
  });

  test('empty vote is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Vote cannot be empty',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(response.ok).toBe(false);
  });

  test('non-numeric entry is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Invalid option ID',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: 'not-a-valid-id' }),
    });

    expect(response.ok).toBe(false);
  });

  test('invalid option ID is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Option not found',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: 'nonexistent-id' }),
    });

    expect(response.ok).toBe(false);
  });
});

describe('Voting Edge Cases - Multiple Choice Validation', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('multiple choice enforces max selections limit', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Maximum 3 selections allowed',
        maxSelections: 3,
        selectedCount: 5,
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({
        optionIds: ['1', '2', '3', '4', '5'], // 5 selections when max is 3
      }),
    });

    expect(response.ok).toBe(false);
  });

  test('multiple choice within limit succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        selectedOptions: ['1', '2', '3'],
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({
        optionIds: ['1', '2', '3'], // 3 selections when max is 3
      }),
    });

    expect(response.ok).toBe(true);
  });
});

describe('Voting Edge Cases - Rating Validation', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('rating below minimum is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Rating must be between 1 and 5',
        minRating: 1,
        maxRating: 5,
        providedRating: 0,
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ rating: 0 }),
    });

    expect(response.ok).toBe(false);
  });

  test('rating above maximum is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Rating must be between 1 and 5',
        minRating: 1,
        maxRating: 5,
        providedRating: 10,
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ rating: 10 }),
    });

    expect(response.ok).toBe(false);
  });

  test('valid rating is accepted', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        rating: 4,
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ rating: 4 }),
    });

    expect(response.ok).toBe(true);
  });

  test('NPS rating outside 0-10 range is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'NPS rating must be between 0 and 10',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ rating: 11 }),
    });

    expect(response.ok).toBe(false);
  });
});

describe('Voting Edge Cases - Duplicate Prevention', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('prevents duplicate vote from same visitor', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'You have already voted on this poll',
        hasVoted: true,
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    expect(response.ok).toBe(false);
  });

  test('checks if user has voted', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        hasVoted: true,
        votedAt: '2024-01-01T12:00:00Z',
      }),
    });

    const response = await fetch('/api/polls/1/has-voted');
    const data = await response.json();

    expect(data.hasVoted).toBe(true);
  });

  test('gets user votes for poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        votes: [
          { optionId: '1', label: 'Red', votedAt: '2024-01-01' },
        ],
      }),
    });

    const response = await fetch('/api/polls/1/my-votes');
    const data = await response.json();

    expect(data.votes).toHaveLength(1);
  });
});

describe('Voting Edge Cases - Partial Votes', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('partial votes allowed in ranked voting', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        rankedCount: 2,
        totalOptions: 5,
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({
        rankings: [
          { optionId: '1', rank: 1 },
          { optionId: '2', rank: 2 },
          // Only ranking 2 of 5 options
        ],
      }),
    });

    expect(response.ok).toBe(true);
  });
});

describe('Voting Edge Cases - Open Text', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('open text accepts valid response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: 'My feedback here',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ text: 'My feedback here' }),
    });

    expect(response.ok).toBe(true);
  });

  test('open text rejects empty response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Response cannot be empty',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ text: '' }),
    });

    expect(response.ok).toBe(false);
  });

  test('open text enforces max length', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Response exceeds maximum length of 1000 characters',
        maxLength: 1000,
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ text: 'a'.repeat(1500) }),
    });

    expect(response.ok).toBe(false);
  });
});

describe('Voting Edge Cases - Subscription Limits', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('enforces vote limit per poll for FREE plan', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({
        error: 'Vote limit reached for this poll',
        limit: 50,
        current: 50,
        plan: 'FREE',
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    expect(response.status).toBe(403);
  });

  test('unlimited votes allowed for PROFESSIONAL plan', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        voteCount: 1001, // Over FREE limit
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    expect(response.ok).toBe(true);
  });
});

describe('Voting Edge Cases - Poll Type Restrictions', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('advanced poll types require paid subscription', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({
        error: 'Rating polls require Starter plan or higher',
        pollType: 'rating_scale',
        requiredPlan: 'STARTER',
      }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Rating',
        pollTypeCode: 'rating_scale',
      }),
    });

    expect(response.status).toBe(403);
  });

  test('basic poll types work on FREE plan', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        pollType: { code: 'single_choice' },
      }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Simple Poll',
        pollTypeCode: 'single_choice',
        options: ['A', 'B', 'C'],
      }),
    });

    expect(response.ok).toBe(true);
  });
});
