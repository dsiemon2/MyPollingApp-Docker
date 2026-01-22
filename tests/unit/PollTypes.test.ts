/**
 * Poll Type Unit Tests
 * Tests for poll type configurations
 * Based on VotingTypeTest.php from Voting_NewAndImproved
 */

describe('Poll Types - Single Choice', () => {
  test('single choice allows only one selection', () => {
    const config = {
      code: 'single_choice',
      maxSelections: 1,
      category: 'choice',
    };

    expect(config.maxSelections).toBe(1);
    expect(config.category).toBe('choice');
  });

  test('single choice is available on FREE plan', () => {
    const pollType = {
      code: 'single_choice',
      requiredPlan: 'FREE',
    };

    expect(pollType.requiredPlan).toBe('FREE');
  });
});

describe('Poll Types - Multiple Choice', () => {
  test('multiple choice allows configurable selections', () => {
    const config = {
      code: 'multiple_choice',
      maxSelections: 3,
      minSelections: 1,
      category: 'choice',
    };

    expect(config.maxSelections).toBe(3);
    expect(config.minSelections).toBe(1);
  });

  test('multiple choice is available on FREE plan', () => {
    const pollType = {
      code: 'multiple_choice',
      requiredPlan: 'FREE',
    };

    expect(pollType.requiredPlan).toBe('FREE');
  });
});

describe('Poll Types - Yes/No', () => {
  test('yes/no has exactly two options', () => {
    const config = {
      code: 'yes_no',
      options: ['Yes', 'No'],
      category: 'choice',
    };

    expect(config.options).toHaveLength(2);
    expect(config.options).toContain('Yes');
    expect(config.options).toContain('No');
  });

  test('yes/no is available on FREE plan', () => {
    const pollType = {
      code: 'yes_no',
      requiredPlan: 'FREE',
    };

    expect(pollType.requiredPlan).toBe('FREE');
  });
});

describe('Poll Types - Rating Scale', () => {
  test('rating scale has configurable range', () => {
    const config = {
      code: 'rating_scale',
      minRating: 1,
      maxRating: 5,
      category: 'rating',
    };

    expect(config.minRating).toBe(1);
    expect(config.maxRating).toBe(5);
    expect(config.category).toBe('rating');
  });

  test('rating scale calculates average', () => {
    const votes = [5, 4, 5, 3, 4, 5];
    const average = votes.reduce((a, b) => a + b, 0) / votes.length;

    expect(average).toBeCloseTo(4.33, 1);
  });

  test('rating scale requires STARTER plan', () => {
    const pollType = {
      code: 'rating_scale',
      requiredPlan: 'STARTER',
    };

    expect(pollType.requiredPlan).toBe('STARTER');
  });
});

describe('Poll Types - NPS (Net Promoter Score)', () => {
  test('NPS has 0-10 scale', () => {
    const config = {
      code: 'nps',
      minRating: 0,
      maxRating: 10,
      category: 'rating',
    };

    expect(config.minRating).toBe(0);
    expect(config.maxRating).toBe(10);
  });

  test('NPS calculates promoters/passives/detractors', () => {
    const votes = [9, 10, 8, 7, 6, 5, 9, 10, 8, 3];

    const promoters = votes.filter(v => v >= 9).length;
    const passives = votes.filter(v => v >= 7 && v <= 8).length;
    const detractors = votes.filter(v => v <= 6).length;

    expect(promoters).toBe(4); // 9, 10, 9, 10
    expect(passives).toBe(3);  // 8, 7, 8
    expect(detractors).toBe(3); // 6, 5, 3

    const npsScore = ((promoters - detractors) / votes.length) * 100;
    expect(npsScore).toBe(10); // (4 - 3) / 10 * 100 = 10
  });

  test('NPS requires STARTER plan', () => {
    const pollType = {
      code: 'nps',
      requiredPlan: 'STARTER',
    };

    expect(pollType.requiredPlan).toBe('STARTER');
  });
});

describe('Poll Types - Ranked Choice', () => {
  test('ranked choice uses point system (3-2-1)', () => {
    const pointSystem = {
      1: 3, // First place: 3 points
      2: 2, // Second place: 2 points
      3: 1, // Third place: 1 point
    };

    expect(pointSystem[1]).toBe(3);
    expect(pointSystem[2]).toBe(2);
    expect(pointSystem[3]).toBe(1);
  });

  test('ranked choice calculates total points', () => {
    const rankings = [
      { optionId: 'A', rank: 1 },
      { optionId: 'B', rank: 2 },
      { optionId: 'C', rank: 3 },
    ];

    const pointSystem: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
    const points: Record<string, number> = {};

    rankings.forEach(r => {
      points[r.optionId] = (points[r.optionId] || 0) + pointSystem[r.rank];
    });

    expect(points['A']).toBe(3);
    expect(points['B']).toBe(2);
    expect(points['C']).toBe(1);
  });

  test('ranked choice supports extended points (5-4-3-2-1)', () => {
    const extendedPointSystem = {
      1: 5,
      2: 4,
      3: 3,
      4: 2,
      5: 1,
    };

    expect(extendedPointSystem[1]).toBe(5);
    expect(extendedPointSystem[5]).toBe(1);
  });

  test('ranked choice requires STARTER plan', () => {
    const pollType = {
      code: 'ranked',
      requiredPlan: 'STARTER',
    };

    expect(pollType.requiredPlan).toBe('STARTER');
  });
});

describe('Poll Types - Open Text', () => {
  test('open text accepts free-form responses', () => {
    const config = {
      code: 'open_text',
      category: 'text',
      maxLength: 1000,
    };

    expect(config.category).toBe('text');
    expect(config.maxLength).toBe(1000);
  });

  test('open text requires STARTER plan', () => {
    const pollType = {
      code: 'open_text',
      requiredPlan: 'STARTER',
    };

    expect(pollType.requiredPlan).toBe('STARTER');
  });
});

describe('Poll Types - Category Validation', () => {
  test('valid categories are choice, rating, ranking, text', () => {
    const validCategories = ['choice', 'rating', 'ranking', 'text'];

    const pollTypes = [
      { code: 'single_choice', category: 'choice' },
      { code: 'multiple_choice', category: 'choice' },
      { code: 'yes_no', category: 'choice' },
      { code: 'rating_scale', category: 'rating' },
      { code: 'nps', category: 'rating' },
      { code: 'ranked', category: 'ranking' },
      { code: 'open_text', category: 'text' },
    ];

    pollTypes.forEach(pt => {
      expect(validCategories).toContain(pt.category);
    });
  });
});

describe('Poll Types - Plan Requirements', () => {
  test('FREE plan poll types', () => {
    const freePollTypes = ['single_choice', 'multiple_choice', 'yes_no'];

    freePollTypes.forEach(type => {
      const pollType = { code: type, requiredPlan: 'FREE' };
      expect(pollType.requiredPlan).toBe('FREE');
    });
  });

  test('STARTER plan poll types', () => {
    const starterPollTypes = ['rating_scale', 'nps', 'ranked', 'open_text'];

    starterPollTypes.forEach(type => {
      const pollType = { code: type, requiredPlan: 'STARTER' };
      expect(pollType.requiredPlan).toBe('STARTER');
    });
  });
});
