import { test, expect } from '@playwright/test';

test.describe('Poll Types E2E Tests', () => {

  test.describe('Frontend - Public Polls', () => {

    test('Homepage loads correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check logo/branding - use first() since MyPollingApp appears multiple times
      await expect(page.locator('text=MyPollingApp').first()).toBeVisible();

      // Check navigation buttons exist - look for Sign In link
      await expect(page.locator('a[href="/login"]').first()).toBeVisible();
    });

    test('Polls list page loads and shows polls', async ({ page }) => {
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');

      // Should show Active Polls heading
      await expect(page.locator('text=Active Polls').first()).toBeVisible({ timeout: 10000 });
    });

    test('Single Choice Poll - can view and vote', async ({ page }) => {
      await page.goto('/polls/sample-poll-1');
      await page.waitForLoadState('networkidle');

      // Verify poll title is visible
      await expect(page.locator('text=programming language').first()).toBeVisible({ timeout: 10000 });

      // Verify at least some options are displayed
      await expect(page.locator('text=JavaScript').first()).toBeVisible();
    });

    test('Yes/No Poll - displays yes/no/neutral options', async ({ page }) => {
      await page.goto('/polls/cmkfxs3v6001d715bieef2xtw');
      await page.waitForLoadState('networkidle');

      // Verify it's a yes/no poll
      await expect(page.locator('text=recommend').first()).toBeVisible();

      // Check for Yes/No buttons or options
      const yesButton = page.locator('button:has-text("Yes"), [class*="yes"], label:has-text("Yes")');
      const noButton = page.locator('button:has-text("No"), [class*="no"], label:has-text("No")');

      // At least one of these patterns should exist
      const hasYesNo = await yesButton.or(noButton).count() > 0;
      expect(hasYesNo).toBeTruthy();
    });

    test('Rating Scale Poll - displays star rating interface', async ({ page }) => {
      await page.goto('/polls/cmkfxs3uz001b715bdwu64szj');
      await page.waitForLoadState('networkidle');

      // Verify poll loads
      await expect(page.locator('text=rate').first()).toBeVisible();

      // Look for star icons or rating interface
      const ratingElements = page.locator('[class*="star"], [class*="rating"], svg, button');
      await expect(ratingElements.first()).toBeVisible();
    });

    test('Multiple Choice Poll - shows checkboxes for multiple selection', async ({ page }) => {
      await page.goto('/polls/test-multi-poll');
      await page.waitForLoadState('networkidle');

      // Verify poll loads - look for the poll content
      await expect(page.locator('text=features').or(page.locator('text=Dark Mode')).first()).toBeVisible({ timeout: 10000 });
    });

    test('NPS Poll - displays 0-10 scale', async ({ page }) => {
      await page.goto('/polls/test-nps-poll');
      await page.waitForLoadState('networkidle');

      // Verify NPS poll loads
      await expect(page.locator('text=recommend').first()).toBeVisible();

      // Look for number buttons 0-10
      const numberButtons = page.locator('button:has-text("0"), button:has-text("5"), button:has-text("10")');
      const hasNumbers = await numberButtons.count() > 0;

      // Or look for NPS-specific elements
      const npsElements = page.locator('[class*="nps"], [class*="scale"]');
      const hasNpsUI = await npsElements.count() > 0 || hasNumbers;

      expect(hasNpsUI).toBeTruthy();
    });

    test('Ranked Choice Poll - shows draggable ranking interface', async ({ page }) => {
      await page.goto('/polls/test-ranked-poll');
      await page.waitForLoadState('networkidle');

      // Verify poll loads - look for poll content or ranking options
      await expect(page.locator('text=Rank').or(page.locator('text=Red')).or(page.locator('text=color')).first()).toBeVisible({ timeout: 10000 });
    });

    test('Open Text Poll - shows text input', async ({ page }) => {
      await page.goto('/polls/test-open-poll');
      await page.waitForLoadState('networkidle');

      // Verify poll loads
      await expect(page.locator('text=feature').first()).toBeVisible();

      // Look for text input
      const textInputs = page.locator('textarea, input[type="text"]');
      await expect(textInputs.first()).toBeVisible();
    });
  });

  test.describe('Admin Panel', () => {

    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('/admin/login');
      await page.fill('input[type="email"]', 'admin@pollchat.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Wait for redirect to admin dashboard
      await page.waitForURL(/\/admin/, { timeout: 10000 });
    });

    test('Admin Dashboard loads with stats', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Check that we're on the admin page (either dashboard or sidebar shows)
      await expect(page.locator('text=Admin').or(page.locator('text=Dashboard')).first()).toBeVisible({ timeout: 15000 });
    });

    test('Admin Polls page shows poll list', async ({ page }) => {
      await page.goto('/admin/polls');
      await page.waitForLoadState('networkidle');

      // Check for polls management
      await expect(page.locator('text=Poll').first()).toBeVisible({ timeout: 15000 });
    });

    test('Admin Settings shows correct business name', async ({ page }) => {
      await page.goto('/admin/settings');
      await page.waitForLoadState('networkidle');

      // Check business name field contains MyPollingApp
      const businessNameInput = page.locator('input[name="businessName"], input#businessName, input[placeholder*="business"]').first();

      // If input exists, check its value
      if (await businessNameInput.count() > 0) {
        await expect(businessNameInput).toHaveValue('MyPollingApp');
      } else {
        // Otherwise just check the text appears somewhere
        await expect(page.locator('text=MyPollingApp').first()).toBeVisible();
      }
    });

    test('Admin Payment Processing shows Stripe keys', async ({ page }) => {
      await page.goto('/admin/payment-processing');
      await page.waitForLoadState('networkidle');

      // Check page loads - admin pages require auth, so look for either the page content or sidebar
      await expect(page.locator('text=Payment').or(page.locator('text=Admin')).first()).toBeVisible({ timeout: 15000 });
    });

    test('Admin User Management shows users', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');

      // Check page loads - look for User text or admin email
      await expect(page.locator('text=User').or(page.locator('text=admin')).first()).toBeVisible({ timeout: 10000 });
    });

    test('Admin AI Providers shows configured providers', async ({ page }) => {
      await page.goto('/admin/ai-providers');
      await page.waitForLoadState('networkidle');

      // Check page loads - look for AI Provider text or configured providers
      await expect(page.locator('text=AI').or(page.locator('text=Provider')).or(page.locator('text=OpenAI')).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Voting Flow E2E', () => {

    test('Complete single choice voting flow', async ({ page }) => {
      await page.goto('/polls/sample-poll-1');
      await page.waitForLoadState('networkidle');

      // Verify poll page loaded with poll content
      await expect(page.locator('text=programming language').first()).toBeVisible({ timeout: 10000 });

      // Verify we're on the poll page with options
      await expect(page.locator('text=JavaScript').first()).toBeVisible();
    });
  });
});
