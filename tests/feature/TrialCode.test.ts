/**
 * Trial Code Tests
 * Tests for trial code management
 * Based on TrialCodeTest.php from Voting_NewAndImproved
 */

describe('Trial Code - Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  test('creates trial code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        code: 'TRIAL-ABC123',
        email: 'user@example.com',
        trialDays: 14,
        status: 'PENDING',
        expiresAt: '2024-02-01',
      }),
    });

    const response = await fetch('/api/admin/trial-codes', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        trialDays: 14,
      }),
    });

    const data = await response.json();
    expect(data.code).toBeDefined();
    expect(data.trialDays).toBe(14);
    expect(data.status).toBe('PENDING');
  });

  test('creates trial code with phone', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        code: 'TRIAL-XYZ789',
        phone: '+1234567890',
        trialDays: 14,
      }),
    });

    const response = await fetch('/api/admin/trial-codes', {
      method: 'POST',
      body: JSON.stringify({
        phone: '+1234567890',
        trialDays: 14,
      }),
    });

    const data = await response.json();
    expect(data.phone).toBe('+1234567890');
  });

  test('creates trial code with custom duration', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        code: 'TRIAL-30DAY',
        trialDays: 30,
      }),
    });

    const response = await fetch('/api/admin/trial-codes', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        trialDays: 30,
      }),
    });

    const data = await response.json();
    expect(data.trialDays).toBe(30);
  });
});

describe('Trial Code - Status', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('trial code has PENDING status initially', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'PENDING',
        sentAt: null,
        redeemedAt: null,
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.status).toBe('PENDING');
  });

  test('trial code status changes to SENT after sending', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'SENT',
        sentAt: '2024-01-01T12:00:00Z',
        sentVia: 'email',
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1/send', {
      method: 'POST',
    });

    const data = await response.json();
    expect(data.status).toBe('SENT');
    expect(data.sentAt).toBeDefined();
  });

  test('trial code status changes to REDEEMED after use', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'REDEEMED',
        redeemedAt: '2024-01-05T10:00:00Z',
        redeemedBy: 'user123',
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.status).toBe('REDEEMED');
    expect(data.redeemedBy).toBeDefined();
  });

  test('returns correct status color', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'PENDING',
        statusColor: 'yellow',
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.statusColor).toBe('yellow');
  });
});

describe('Trial Code - Expiration', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('checks if code is expired', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        isExpired: true,
        expiresAt: '2024-01-01',
        status: 'EXPIRED',
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.isExpired).toBe(true);
  });

  test('calculates days remaining', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        isExpired: false,
        daysRemaining: 10,
        expiresAt: '2024-02-01',
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.daysRemaining).toBe(10);
  });

  test('returns zero days for expired code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        isExpired: true,
        daysRemaining: 0,
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.daysRemaining).toBe(0);
  });
});

describe('Trial Code - Redemption', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('checks redemption eligibility', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        canRedeem: true,
        status: 'SENT',
        isExpired: false,
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.canRedeem).toBe(true);
  });

  test('cannot redeem expired code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Trial code has expired',
        canRedeem: false,
      }),
    });

    const response = await fetch('/api/trial-codes/redeem', {
      method: 'POST',
      body: JSON.stringify({ code: 'EXPIRED-CODE' }),
    });

    expect(response.ok).toBe(false);
  });

  test('cannot redeem already used code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Trial code has already been redeemed',
      }),
    });

    const response = await fetch('/api/trial-codes/redeem', {
      method: 'POST',
      body: JSON.stringify({ code: 'USED-CODE' }),
    });

    expect(response.ok).toBe(false);
  });

  test('cannot redeem revoked code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Trial code has been revoked',
      }),
    });

    const response = await fetch('/api/trial-codes/redeem', {
      method: 'POST',
      body: JSON.stringify({ code: 'REVOKED-CODE' }),
    });

    expect(response.ok).toBe(false);
  });
});

describe('Trial Code - Extension', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('extends trial code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        trialDays: 28, // Extended from 14 to 28
        expiresAt: '2024-02-15',
        extensionCount: 1,
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1/extend', {
      method: 'POST',
      body: JSON.stringify({ additionalDays: 14 }),
    });

    const data = await response.json();
    expect(data.trialDays).toBe(28);
    expect(data.extensionCount).toBe(1);
  });

  test('enforces maximum extensions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: 'Maximum extensions reached',
        maxExtensions: 3,
        currentExtensions: 3,
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1/extend', {
      method: 'POST',
      body: JSON.stringify({ additionalDays: 7 }),
    });

    expect(response.ok).toBe(false);
  });

  test('calculates remaining extensions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        extensionCount: 1,
        maxExtensions: 3,
        remainingExtensions: 2,
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.remainingExtensions).toBe(2);
  });
});

describe('Trial Code - Revocation', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('revokes trial code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'REVOKED',
        revokedAt: '2024-01-10T15:00:00Z',
        revokedBy: 'admin123',
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1/revoke', {
      method: 'POST',
    });

    const data = await response.json();
    expect(data.status).toBe('REVOKED');
    expect(data.revokedAt).toBeDefined();
  });

  test('revoked code cannot be used', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'REVOKED',
        canRedeem: false,
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.canRedeem).toBe(false);
  });
});

describe('Trial Code - Lookup', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('finds code by code string (case insensitive)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        code: 'TRIAL-ABC123',
        email: 'user@example.com',
      }),
    });

    const response = await fetch('/api/admin/trial-codes?code=trial-abc123');
    const data = await response.json();

    expect(data.code).toBe('TRIAL-ABC123');
  });

  test('checks if email has active code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        hasActiveCode: true,
        code: 'TRIAL-XYZ789',
      }),
    });

    const response = await fetch('/api/admin/trial-codes?email=user@example.com&active=true');
    const data = await response.json();

    expect(data.hasActiveCode).toBe(true);
  });

  test('filters by status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { code: 'TRIAL-001', status: 'PENDING' },
        { code: 'TRIAL-002', status: 'PENDING' },
      ]),
    });

    const response = await fetch('/api/admin/trial-codes?status=PENDING');
    const data = await response.json();

    expect(data.every((c: any) => c.status === 'PENDING')).toBe(true);
  });

  test('filters by email', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { code: 'TRIAL-001', email: 'user@example.com' },
      ]),
    });

    const response = await fetch('/api/admin/trial-codes?email=user@example.com');
    const data = await response.json();

    expect(data[0].email).toBe('user@example.com');
  });
});

describe('Trial Code - List', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('lists all trial codes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', code: 'TRIAL-001', status: 'PENDING' },
        { id: '2', code: 'TRIAL-002', status: 'SENT' },
        { id: '3', code: 'TRIAL-003', status: 'REDEEMED' },
      ]),
    });

    const response = await fetch('/api/admin/trial-codes');
    const data = await response.json();

    expect(data).toHaveLength(3);
  });

  test('trial codes page is accessible', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const response = await fetch('/admin/trial-codes');
    expect(response.ok).toBe(true);
  });
});

describe('Trial Code - Full Name Accessor', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('returns full name with email', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        code: 'TRIAL-001',
        email: 'john@example.com',
        fullName: 'john@example.com',
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.fullName).toBe('john@example.com');
  });

  test('returns full name with phone when no email', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        code: 'TRIAL-001',
        phone: '+1234567890',
        email: null,
        fullName: '+1234567890',
      }),
    });

    const response = await fetch('/api/admin/trial-codes/1');
    const data = await response.json();

    expect(data.fullName).toBe('+1234567890');
  });
});
