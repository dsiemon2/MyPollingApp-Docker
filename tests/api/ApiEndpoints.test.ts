/**
 * API Endpoint Tests
 * Tests for REST API endpoints
 * Based on ApiTest.php from Voting_NewAndImproved
 */

describe('Polls API - GET /api/polls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns list of active polls', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', title: 'Poll 1', status: 'open' },
        { id: '2', title: 'Poll 2', status: 'open' },
      ]),
    });

    const response = await fetch('/api/polls');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
  });

  test('returns polls with vote counts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', title: 'Poll 1', _count: { votes: 10 } },
      ]),
    });

    const response = await fetch('/api/polls');
    const data = await response.json();

    expect(data[0]._count.votes).toBe(10);
  });

  test('returns empty array when no polls exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const response = await fetch('/api/polls');
    const data = await response.json();

    expect(data).toEqual([]);
  });
});

describe('Poll Detail API - GET /api/polls/[id]', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns poll with options', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'Favorite Color',
        options: [
          { id: '1', label: 'Red' },
          { id: '2', label: 'Blue' },
        ],
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.title).toBe('Favorite Color');
    expect(data.options).toHaveLength(2);
  });

  test('returns 404 for non-existent poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Poll not found' }),
    });

    const response = await fetch('/api/polls/nonexistent');

    expect(response.status).toBe(404);
  });

  test('includes vote counts in response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'Test Poll',
        options: [
          { id: '1', label: 'Option A', _count: { votes: 5 } },
          { id: '2', label: 'Option B', _count: { votes: 3 } },
        ],
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.options[0]._count.votes).toBe(5);
  });
});

describe('Vote API - POST /api/polls/[id]/vote', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('casts vote successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Vote recorded' }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId: '1' }),
    });

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('rejects duplicate vote from same visitor', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'You have already voted on this poll' }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    expect(response.ok).toBe(false);
  });

  test('validates option exists', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid option' }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: 'invalid' }),
    });

    expect(response.ok).toBe(false);
  });

  test('rejects vote on closed poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Poll is closed' }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    expect(response.ok).toBe(false);
  });

  test('validates required fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'optionId is required' }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(response.ok).toBe(false);
  });

  test('enforces vote limit per poll based on subscription', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({
        error: 'Vote limit reached for this poll',
        limit: 50,
        current: 50,
      }),
    });

    const response = await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    expect(response.status).toBe(403);
  });
});

describe('Messages API - GET /api/polls/[id]/messages', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns chat messages for poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', content: 'Hello', role: 'user' },
        { id: '2', content: 'Hi there!', role: 'ai' },
      ]),
    });

    const response = await fetch('/api/polls/1/messages');
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });

  test('returns empty array for poll without messages', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const response = await fetch('/api/polls/1/messages');
    const data = await response.json();

    expect(data).toEqual([]);
  });
});

describe('Admin Polls API - /api/admin/polls', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('GET returns all polls for admin', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', title: 'Poll 1', status: 'open' },
        { id: '2', title: 'Poll 2', status: 'closed' },
      ]),
    });

    const response = await fetch('/api/admin/polls');
    const data = await response.json();

    expect(data).toHaveLength(2);
  });

  test('POST creates new poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'New Poll',
        options: [{ label: 'Option 1' }],
      }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Poll',
        options: ['Option 1', 'Option 2'],
      }),
    });

    const data = await response.json();
    expect(data.title).toBe('New Poll');
  });

  test('POST validates required fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Title is required' }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({ options: ['A', 'B'] }),
    });

    expect(response.ok).toBe(false);
  });

  test('POST enforces poll creation limit by subscription', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({
        error: 'Poll limit reached for your subscription',
        limit: 3,
        current: 3,
        plan: 'FREE',
      }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Poll' }),
    });

    expect(response.status).toBe(403);
  });
});

describe('Admin Poll Detail API - /api/admin/polls/[id]', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('PUT updates poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'Updated Poll',
        status: 'open',
      }),
    });

    const response = await fetch('/api/admin/polls/1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Poll' }),
    });

    const data = await response.json();
    expect(data.title).toBe('Updated Poll');
  });

  test('DELETE soft-deletes poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/admin/polls/1', {
      method: 'DELETE',
    });

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('PUT can close poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        status: 'closed',
        closedAt: '2024-01-01T00:00:00Z',
      }),
    });

    const response = await fetch('/api/admin/polls/1', {
      method: 'PUT',
      body: JSON.stringify({ status: 'closed' }),
    });

    const data = await response.json();
    expect(data.status).toBe('closed');
  });
});

describe('Export API - GET /api/admin/polls/[id]/export', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns CSV export', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => name === 'content-type' ? 'text/csv' : null,
      },
      text: () => Promise.resolve('Option,Votes\nRed,10\nBlue,5'),
    });

    const response = await fetch('/api/admin/polls/1/export');

    expect(response.ok).toBe(true);
  });

  test('includes proper content-disposition header', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'content-disposition') return 'attachment; filename="poll-export.csv"';
          return null;
        },
      },
      text: () => Promise.resolve('data'),
    });

    const response = await fetch('/api/admin/polls/1/export');
    expect(response.headers.get('content-disposition')).toContain('attachment');
  });
});

describe('Settings API - /api/admin/settings', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('GET returns all settings', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        businessName: 'My Poll App',
        logoUrl: '/images/logo.png',
        primaryColor: '#1e40af',
      }),
    });

    const response = await fetch('/api/admin/settings');
    const data = await response.json();

    expect(data.businessName).toBeDefined();
  });

  test('POST updates settings', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ businessName: 'New Name' }),
    });

    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

describe('Analytics API - GET /api/admin/analytics', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns analytics data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        totalPolls: 10,
        totalVotes: 500,
        activePolls: 5,
        votesOverTime: [],
        pollsOverTime: [],
      }),
    });

    const response = await fetch('/api/admin/analytics');
    const data = await response.json();

    expect(data.totalPolls).toBe(10);
    expect(data.totalVotes).toBe(500);
  });

  test('returns time-series data for charts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        votesOverTime: [
          { date: '2024-01-01', count: 10 },
          { date: '2024-01-02', count: 15 },
        ],
      }),
    });

    const response = await fetch('/api/admin/analytics');
    const data = await response.json();

    expect(data.votesOverTime).toHaveLength(2);
  });
});

describe('QR Code API - GET /api/polls/[id]/qrcode', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns QR code image', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => name === 'content-type' ? 'image/png' : null,
      },
      blob: () => Promise.resolve(new Blob(['image data'])),
    });

    const response = await fetch('/api/polls/1/qrcode');

    expect(response.ok).toBe(true);
  });
});

describe('Subscription API - /api/subscription', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('GET returns current subscription status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        plan: 'STARTER',
        status: 'ACTIVE',
        features: {
          maxPolls: 10,
          maxVotesPerPoll: 200,
          voiceEnabled: true,
          aiEnabled: true,
        },
      }),
    });

    const response = await fetch('/api/subscription');
    const data = await response.json();

    expect(data.plan).toBe('STARTER');
    expect(data.features.voiceEnabled).toBe(true);
  });
});
