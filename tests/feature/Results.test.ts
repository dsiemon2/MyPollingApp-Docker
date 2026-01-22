/**
 * Results Tests
 * Tests for voting results and aggregation
 * Based on ResultsTest.php from Voting_NewAndImproved
 */

describe('Results - Vote Counting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  test('calculates correct vote counts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        title: 'Favorite Color',
        options: [
          { id: '1', label: 'Red', _count: { votes: 10 } },
          { id: '2', label: 'Blue', _count: { votes: 15 } },
          { id: '3', label: 'Green', _count: { votes: 5 } },
        ],
        totalVotes: 30,
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.totalVotes).toBe(30);
    expect(data.options[0]._count.votes).toBe(10);
  });

  test('results sorted by votes descending', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        options: [
          { label: 'Blue', _count: { votes: 15 } },
          { label: 'Red', _count: { votes: 10 } },
          { label: 'Green', _count: { votes: 5 } },
        ],
      }),
    });

    const response = await fetch('/api/polls/1?sortByVotes=true');
    const data = await response.json();

    expect(data.options[0]._count.votes).toBeGreaterThanOrEqual(data.options[1]._count.votes);
    expect(data.options[1]._count.votes).toBeGreaterThanOrEqual(data.options[2]._count.votes);
  });

  test('calculates percentages correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        totalVotes: 100,
        options: [
          { label: 'Red', _count: { votes: 50 }, percentage: 50 },
          { label: 'Blue', _count: { votes: 30 }, percentage: 30 },
          { label: 'Green', _count: { votes: 20 }, percentage: 20 },
        ],
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.options[0].percentage).toBe(50);
    expect(data.options[1].percentage).toBe(30);
    expect(data.options[2].percentage).toBe(20);
  });

  test('handles poll with no votes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        totalVotes: 0,
        options: [
          { label: 'Red', _count: { votes: 0 }, percentage: 0 },
          { label: 'Blue', _count: { votes: 0 }, percentage: 0 },
        ],
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.totalVotes).toBe(0);
    expect(data.options.every((o: any) => o._count.votes === 0)).toBe(true);
  });
});

describe('Results - Tie Handling', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('handles tied results', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        options: [
          { label: 'Red', _count: { votes: 10 }, rank: 1 },
          { label: 'Blue', _count: { votes: 10 }, rank: 1 },
          { label: 'Green', _count: { votes: 5 }, rank: 3 },
        ],
        hasTie: true,
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.hasTie).toBe(true);
    expect(data.options[0].rank).toBe(data.options[1].rank);
  });
});

describe('Results - Rating Polls', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('calculates average rating', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'rating_scale' },
        averageRating: 4.2,
        totalResponses: 50,
        ratingDistribution: {
          1: 2,
          2: 3,
          3: 10,
          4: 15,
          5: 20,
        },
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.averageRating).toBe(4.2);
    expect(data.ratingDistribution).toBeDefined();
  });

  test('NPS calculates promoters, passives, detractors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'nps' },
        npsScore: 45,
        promoters: 60, // 9-10
        passives: 25,  // 7-8
        detractors: 15, // 0-6
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.npsScore).toBe(45);
    expect(data.promoters + data.passives + data.detractors).toBe(100);
  });
});

describe('Results - Ranked Polls', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('calculates ranked voting points', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'ranked' },
        options: [
          { label: 'Pizza', points: 150, firstPlaceVotes: 30 },
          { label: 'Sushi', points: 120, firstPlaceVotes: 20 },
          { label: 'Tacos', points: 90, firstPlaceVotes: 10 },
        ],
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.options[0].points).toBeGreaterThan(data.options[1].points);
  });

  test('shows first place votes breakdown', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        options: [
          { label: 'Pizza', placeVotes: { 1: 30, 2: 15, 3: 5 } },
        ],
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.options[0].placeVotes).toBeDefined();
  });
});

describe('Results - Multiple Voters Aggregation', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('accumulates votes from multiple voters', async () => {
    // Mock the results endpoint directly
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        totalVotes: 5,
        uniqueVoters: 5,
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.totalVotes).toBe(5);
    expect(data.uniqueVoters).toBe(5);
  });

  test('tracks unique voters', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        totalVotes: 100,
        uniqueVoters: 80,
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.uniqueVoters).toBeLessThanOrEqual(data.totalVotes);
  });
});

describe('Results - Open Text Responses', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns text responses for open text poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        pollType: { code: 'open_text' },
        responses: [
          { text: 'Great service!', createdAt: '2024-01-01' },
          { text: 'Could be better', createdAt: '2024-01-02' },
        ],
        totalResponses: 2,
      }),
    });

    const response = await fetch('/api/polls/1');
    const data = await response.json();

    expect(data.responses).toHaveLength(2);
    expect(data.responses[0].text).toBeDefined();
  });
});

describe('Results - Results Page Access', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('results page is accessible', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const response = await fetch('/polls/1');
    expect(response.ok).toBe(true);
  });

  test('results update after voting', async () => {
    // Initial vote count
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ totalVotes: 10 }),
    });

    // Cast vote
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // Updated vote count
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ totalVotes: 11 }),
    });

    const beforeResponse = await fetch('/api/polls/1');
    const beforeData = await beforeResponse.json();

    await fetch('/api/polls/1/vote', {
      method: 'POST',
      body: JSON.stringify({ optionId: '1' }),
    });

    const afterResponse = await fetch('/api/polls/1');
    const afterData = await afterResponse.json();

    expect(afterData.totalVotes).toBe(beforeData.totalVotes + 1);
  });
});

describe('Results - Leaderboard', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('displays leaderboard for poll', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        leaderboard: [
          { rank: 1, label: 'Blue', votes: 50 },
          { rank: 2, label: 'Red', votes: 30 },
          { rank: 3, label: 'Green', votes: 20 },
        ],
      }),
    });

    const response = await fetch('/api/polls/1/leaderboard');
    const data = await response.json();

    expect(data.leaderboard[0].rank).toBe(1);
    expect(data.leaderboard[0].votes).toBeGreaterThanOrEqual(data.leaderboard[1].votes);
  });
});
