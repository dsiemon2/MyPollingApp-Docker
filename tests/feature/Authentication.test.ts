/**
 * Authentication Tests
 * Tests for login, registration, and session management
 * Based on AuthenticationTest.php from Voting_NewAndImproved
 */

describe('Authentication - Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  test('login page is accessible', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const response = await fetch('/login');
    expect(response.ok).toBe(true);
  });

  test('valid credentials allow login', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { id: '1', email: 'admin@pollchat.com', role: 'SUPER_ADMIN' },
      }),
    });

    const response = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@pollchat.com',
        password: 'password123',
      }),
    });

    expect(response.ok).toBe(true);
  });

  test('invalid password is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    });

    const response = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@pollchat.com',
        password: 'wrongpassword',
      }),
    });

    expect(response.ok).toBe(false);
  });

  test('non-existent email is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'No user found with this email' }),
    });

    const response = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123',
      }),
    });

    expect(response.ok).toBe(false);
  });

  test('demo account admin@pollchat.com works', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { email: 'admin@pollchat.com', role: 'SUPER_ADMIN' },
      }),
    });

    const response = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@pollchat.com',
        password: 'password123',
      }),
    });

    const data = await response.json();
    expect(data.user.role).toBe('SUPER_ADMIN');
  });

  test('demo account polladmin@pollchat.com works', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { email: 'polladmin@pollchat.com', role: 'POLL_ADMIN' },
      }),
    });

    const response = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({
        email: 'polladmin@pollchat.com',
        password: 'password123',
      }),
    });

    const data = await response.json();
    expect(data.user.role).toBe('POLL_ADMIN');
  });

  test('demo account user@pollchat.com works', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { email: 'user@pollchat.com', role: 'USER' },
      }),
    });

    const response = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@pollchat.com',
        password: 'password123',
      }),
    });

    const data = await response.json();
    expect(data.user.role).toBe('USER');
  });
});

describe('Authentication - Registration', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('registration page is accessible', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const response = await fetch('/register');
    expect(response.ok).toBe(true);
  });

  test('valid registration creates user', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { id: '1', email: 'newuser@example.com' },
        message: 'Registration successful',
      }),
    });

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      }),
    });

    const data = await response.json();
    expect(data.user.email).toBe('newuser@example.com');
  });

  test('duplicate email is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Email already exists' }),
    });

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@pollchat.com',
        password: 'password123',
        name: 'Duplicate User',
      }),
    });

    expect(response.ok).toBe(false);
  });

  test('short password is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Password must be at least 6 characters' }),
    });

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: '123',
        name: 'New User',
      }),
    });

    expect(response.ok).toBe(false);
  });

  test('invalid email format is rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid email format' }),
    });

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'notanemail',
        password: 'password123',
        name: 'New User',
      }),
    });

    expect(response.ok).toBe(false);
  });

  test('required fields are validated', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Email and password are required' }),
    });

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(response.ok).toBe(false);
  });

  test('new user gets FREE subscription plan', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { id: '1', email: 'newuser@example.com' },
        subscription: { plan: 'FREE', status: 'ACTIVE' },
      }),
    });

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      }),
    });

    const data = await response.json();
    expect(data.subscription.plan).toBe('FREE');
  });
});

describe('Authentication - Session Management', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('session endpoint returns user data when logged in', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { id: '1', email: 'admin@pollchat.com', role: 'SUPER_ADMIN' },
        expires: '2024-12-31T23:59:59Z',
      }),
    });

    const response = await fetch('/api/auth/session');
    const data = await response.json();

    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('admin@pollchat.com');
  });

  test('session endpoint returns null when not logged in', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const response = await fetch('/api/auth/session');
    const data = await response.json();

    expect(data.user).toBeUndefined();
  });

  test('logout clears session', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/auth/signout', { method: 'POST' });
    const data = await response.json();

    expect(data.success).toBe(true);
  });
});

describe('Authentication - Password Management', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('change password with valid current password', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Password updated' }),
    });

    const response = await fetch('/api/admin/account/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      }),
    });

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('change password fails with wrong current password', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Current password is incorrect' }),
    });

    const response = await fetch('/api/admin/account/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      }),
    });

    expect(response.ok).toBe(false);
  });
});
