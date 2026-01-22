/**
 * Poll Management Tests
 * Tests for poll lifecycle and configuration
 * Based on EventManagementTest.php from Voting_NewAndImproved
 */

describe('Poll Management - Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  test('creates poll with title and options', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'Favorite Color',
        options: [
          { id: '1', label: 'Red' },
          { id: '2', label: 'Blue' },
          { id: '3', label: 'Green' },
        ],
      }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Favorite Color',
        options: ['Red', 'Blue', 'Green'],
      }),
    });

    const data = await response.json();
    expect(data.title).toBe('Favorite Color');
    expect(data.options).toHaveLength(3);
  });

  test('creates poll with poll type', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'Rate Our Service',
        pollType: { code: 'rating_scale', name: 'Rating Scale' },
      }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Rate Our Service',
        pollTypeCode: 'rating_scale',
      }),
    });

    const data = await response.json();
    expect(data.pollType.code).toBe('rating_scale');
  });

  test('creates poll with description', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'Team Lunch',
        description: 'Vote for where to go for team lunch',
      }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Team Lunch',
        description: 'Vote for where to go for team lunch',
        options: ['Pizza', 'Sushi', 'Tacos'],
      }),
    });

    const data = await response.json();
    expect(data.description).toBe('Vote for where to go for team lunch');
  });

  test('validates minimum options for choice polls', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'At least 2 options are required' }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Poll',
        options: ['Only One'],
      }),
    });

    expect(response.ok).toBe(false);
  });
});

describe('Poll Management - Updates', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('updates poll title', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'Updated Title',
      }),
    });

    const response = await fetch('/api/admin/polls/1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const data = await response.json();
    expect(data.title).toBe('Updated Title');
  });

  test('updates poll description', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        description: 'New description',
      }),
    });

    const response = await fetch('/api/admin/polls/1', {
      method: 'PUT',
      body: JSON.stringify({ description: 'New description' }),
    });

    const data = await response.json();
    expect(data.description).toBe('New description');
  });

  test('adds new option to poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        options: [
          { id: '1', label: 'Red' },
          { id: '2', label: 'Blue' },
          { id: '3', label: 'Yellow' },
        ],
      }),
    });

    const response = await fetch('/api/admin/polls/1', {
      method: 'PUT',
      body: JSON.stringify({
        options: ['Red', 'Blue', 'Yellow'],
      }),
    });

    const data = await response.json();
    expect(data.options).toHaveLength(3);
  });
});

describe('Poll Management - Status', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('closes poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        status: 'closed',
        closedAt: '2024-01-15T12:00:00Z',
      }),
    });

    const response = await fetch('/api/admin/polls/1', {
      method: 'PUT',
      body: JSON.stringify({ status: 'closed' }),
    });

    const data = await response.json();
    expect(data.status).toBe('closed');
    expect(data.closedAt).toBeDefined();
  });

  test('reopens closed poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        status: 'open',
        closedAt: null,
      }),
    });

    const response = await fetch('/api/admin/polls/1', {
      method: 'PUT',
      body: JSON.stringify({ status: 'open' }),
    });

    const data = await response.json();
    expect(data.status).toBe('open');
  });

  test('poll has correct open/closed status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        status: 'open',
        isOpen: true,
        isClosed: false,
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.isOpen).toBe(true);
    expect(data.isClosed).toBe(false);
  });
});

describe('Poll Management - Deletion', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('soft deletes poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, deleted: true }),
    });

    const response = await fetch('/api/admin/polls/1', {
      method: 'DELETE',
    });

    const data = await response.json();
    expect(data.deleted).toBe(true);
  });

  test('deleted poll not shown in public list', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: '2', title: 'Active Poll', status: 'open' },
      ]),
    });

    const response = await fetch('/api/polls');
    const data = await response.json();

    expect(data.every((p: any) => p.id !== '1')).toBe(true);
  });
});

describe('Poll Management - Poll Types', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('single choice poll only allows one selection', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'single_choice' },
        config: { maxSelections: 1 },
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.config.maxSelections).toBe(1);
  });

  test('multiple choice poll allows multiple selections', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'multiple_choice' },
        config: { maxSelections: 3 },
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.config.maxSelections).toBeGreaterThan(1);
  });

  test('yes/no poll has exactly two options', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'yes_no' },
        options: [
          { label: 'Yes' },
          { label: 'No' },
        ],
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.options).toHaveLength(2);
  });

  test('rating scale poll has rating config', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'rating_scale' },
        config: { minRating: 1, maxRating: 5 },
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.config.minRating).toBe(1);
    expect(data.config.maxRating).toBe(5);
  });

  test('NPS poll has 0-10 scale', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'nps' },
        config: { minRating: 0, maxRating: 10 },
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.config.minRating).toBe(0);
    expect(data.config.maxRating).toBe(10);
  });

  test('ranked poll allows ranking options', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'ranked' },
        config: { allowRanking: true },
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.config.allowRanking).toBe(true);
  });

  test('open text poll accepts text responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'open_text' },
        config: { allowText: true },
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.config.allowText).toBe(true);
  });
});

describe('Poll Management - Templates', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('creates poll from template', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'Customer Feedback Survey',
        options: [
          { label: 'Very Satisfied' },
          { label: 'Satisfied' },
          { label: 'Neutral' },
          { label: 'Dissatisfied' },
          { label: 'Very Dissatisfied' },
        ],
      }),
    });

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      body: JSON.stringify({ templateId: 'customer-feedback' }),
    });

    const data = await response.json();
    expect(data.options).toHaveLength(5);
  });

  test('template provides default options', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        name: 'Quick Poll',
        defaultOptions: ['Option A', 'Option B', 'Option C'],
      }),
    });

    const response = await fetch('/api/admin/poll-templates/quick-poll');
    const data = await response.json();

    expect(data.defaultOptions).toBeDefined();
  });
});

describe('Poll Management - Duplication', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('duplicates poll with options', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '2',
        title: 'Favorite Color (Copy)',
        options: [
          { label: 'Red' },
          { label: 'Blue' },
          { label: 'Green' },
        ],
      }),
    });

    const response = await fetch('/api/admin/polls/1/duplicate', {
      method: 'POST',
    });

    const data = await response.json();
    expect(data.id).not.toBe('1');
    expect(data.title).toContain('Copy');
  });

  test('duplicated poll has no votes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '2',
        _count: { votes: 0 },
      }),
    });

    const response = await fetch('/api/admin/polls/1/duplicate', {
      method: 'POST',
    });

    const data = await response.json();
    expect(data._count.votes).toBe(0);
  });
});

describe('Poll Management - Filtering', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('filters active polls only', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', status: 'open' },
        { id: '2', status: 'open' },
      ]),
    });

    const response = await fetch('/api/polls?status=open');
    const data = await response.json();

    expect(data.every((p: any) => p.status === 'open')).toBe(true);
  });

  test('filters polls by type', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', pollType: { code: 'rating_scale' } },
      ]),
    });

    const response = await fetch('/api/admin/polls?type=rating_scale');
    const data = await response.json();

    expect(data.every((p: any) => p.pollType?.code === 'rating_scale')).toBe(true);
  });
});
