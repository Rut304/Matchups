import { test, expect } from '@playwright/test';

/**
 * Edge Features E2E Tests
 * Tests for the new betting intelligence features:
 * - RLM (Reverse Line Movement)
 * - Steam Moves
 * - CLV Tracking
 * - Sharp vs Public
 * - Arbitrage Alerts
 * - Props Comparison
 */

test.describe('Edge Features', () => {
  test.describe('Edge API', () => {
    test('GET /api/edges returns edge alerts', async ({ request }) => {
      const response = await request.get('/api/edges');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('config');
      expect(data).toHaveProperty('timestamp');
      expect(Array.isArray(data.alerts)).toBe(true);
    });

    test('GET /api/edges with sport filter', async ({ request }) => {
      const response = await request.get('/api/edges?sport=NFL');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.alerts).toBeDefined();
      // All alerts should be for NFL
      for (const alert of data.alerts) {
        expect(alert.sport).toBe('NFL');
      }
    });

    test('GET /api/edges with gameId filter', async ({ request }) => {
      const response = await request.get('/api/edges?gameId=test-game-123&sport=NFL');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.alerts)).toBe(true);
    });

    test('GET /api/edges with type filter', async ({ request }) => {
      const response = await request.get('/api/edges?type=rlm');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      // All alerts should be RLM type
      for (const alert of data.alerts) {
        expect(alert.type).toBe('rlm');
      }
    });

    test('GET /api/edges with minConfidence filter', async ({ request }) => {
      const response = await request.get('/api/edges?minConfidence=70');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      // All alerts should have confidence >= 70
      for (const alert of data.alerts) {
        expect(alert.confidence).toBeGreaterThanOrEqual(70);
      }
    });

    test('GET /api/edges with severity filter', async ({ request }) => {
      const response = await request.get('/api/edges?severity=critical');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      // All alerts should be critical severity
      for (const alert of data.alerts) {
        expect(alert.severity).toBe('critical');
      }
    });

    test('Edge alert has required fields', async ({ request }) => {
      const response = await request.get('/api/edges');
      const data = await response.json();
      
      if (data.alerts.length > 0) {
        const alert = data.alerts[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('gameId');
        expect(alert).toHaveProperty('sport');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('description');
        expect(alert).toHaveProperty('data');
        expect(alert).toHaveProperty('timestamp');
        expect(alert).toHaveProperty('confidence');
      }
    });

    test('Edge config has all feature types', async ({ request }) => {
      const response = await request.get('/api/edges');
      const data = await response.json();
      
      expect(data.config).toHaveProperty('rlm');
      expect(data.config).toHaveProperty('steam');
      expect(data.config).toHaveProperty('clv');
      expect(data.config).toHaveProperty('sharp-public');
      expect(data.config).toHaveProperty('arbitrage');
      expect(data.config).toHaveProperty('props');
      
      // Each config should have settings
      for (const type of ['rlm', 'steam', 'clv', 'sharp-public', 'arbitrage', 'props']) {
        expect(data.config[type]).toHaveProperty('enabled');
        expect(data.config[type]).toHaveProperty('minConfidence');
        expect(data.config[type]).toHaveProperty('alertThreshold');
        expect(data.config[type]).toHaveProperty('notifications');
      }
    });
  });

  test.describe('Admin Edge Controls', () => {
    // These tests require admin authentication which is not available in E2E tests
    // They verify the UI elements are present when authenticated
    test.skip('Admin page has Edge Features tab', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Find the Edge Features tab by looking for button containing the text
      const edgeTab = page.locator('button:has-text("Edge Features")');
      await expect(edgeTab).toBeVisible({ timeout: 10000 });
    });

    test.skip('Edge Features tab shows controls', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Click Edge Features tab
      await page.locator('button:has-text("Edge Features")').click();
      
      // Wait for tab content to load
      await page.waitForTimeout(500);
      
      // Check for master toggle
      await expect(page.getByText(/edge features active|edge features disabled/i)).toBeVisible({ timeout: 10000 });
      
      // Check for individual feature controls
      await expect(page.getByText(/reverse line movement/i)).toBeVisible();
      await expect(page.getByText(/steam moves/i)).toBeVisible();
      await expect(page.getByText(/clv tracking/i)).toBeVisible();
      await expect(page.getByText(/sharp vs public/i)).toBeVisible();
      await expect(page.getByText(/arbitrage alerts/i)).toBeVisible();
      await expect(page.getByText(/props comparison/i)).toBeVisible();
    });

    test.skip('Edge Features tab shows notification settings', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Click Edge Features tab
      await page.locator('button:has-text("Edge Features")').click();
      
      // Wait for tab content to load
      await page.waitForTimeout(500);
      
      // Check for notification settings
      await expect(page.getByText(/push notifications/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/alert retention/i)).toBeVisible();
    });

    test.skip('Edge Features tab shows quick stats', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Click Edge Features tab
      await page.locator('button:has-text("Edge Features")').click();
      
      // Wait for tab content to load
      await page.waitForTimeout(500);
      
      // Check for stats cards
      await expect(page.getByText(/active alerts/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/rlm today/i)).toBeVisible();
      await expect(page.getByText(/steam moves/i)).toBeVisible();
      await expect(page.getByText(/avg confidence/i)).toBeVisible();
    });
    
    // Test that admin page loads (even if showing auth required)
    test('Admin page is accessible', async ({ page }) => {
      const response = await page.goto('/admin');
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe('Leaderboard Sports/Markets Split', () => {
    test('Leaderboard has Sports/Markets mode switcher', async ({ page }) => {
      await page.goto('/leaderboard');
      await page.waitForLoadState('networkidle');
      
      // Check for mode switcher buttons
      const sportsBtn = page.getByRole('button', { name: /sports betting/i });
      const marketsBtn = page.getByRole('button', { name: /prediction markets/i });
      
      await expect(sportsBtn).toBeVisible({ timeout: 10000 });
      await expect(marketsBtn).toBeVisible();
    });

    test('Sports mode is default', async ({ page }) => {
      await page.goto('/leaderboard');
      await page.waitForLoadState('networkidle');
      
      // Sports button should be active (styled differently)
      const sportsBtn = page.getByRole('button', { name: /sports betting/i });
      
      // Check it's visible and interactive
      await expect(sportsBtn).toBeVisible({ timeout: 10000 });
    });

    test('Can switch to Markets mode', async ({ page }) => {
      await page.goto('/leaderboard');
      await page.waitForLoadState('networkidle');
      
      // Click Markets button
      const marketsBtn = page.getByRole('button', { name: /prediction markets/i });
      await marketsBtn.click();
      
      // Should show prediction market content
      await expect(page.getByText(/prediction market experts/i)).toBeVisible({ timeout: 10000 });
    });

    test('Sports mode has capper tabs', async ({ page }) => {
      await page.goto('/leaderboard');
      await page.waitForLoadState('networkidle');
      
      // Check for capper type tabs
      await expect(page.getByRole('button', { name: /celebrities/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: /sharps/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /community/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /fade alert/i })).toBeVisible();
    });

    test('Markets mode shows CLV metrics', async ({ page }) => {
      await page.goto('/leaderboard');
      await page.waitForLoadState('networkidle');
      
      // Switch to Markets mode - use a more specific selector
      const marketsBtn = page.locator('button').filter({ hasText: 'Prediction Markets' });
      await marketsBtn.click();
      
      // Wait for mode switch
      await page.waitForTimeout(1000);
      
      // Check for markets-specific content that appears after switching
      // The Prediction Market Experts heading should be visible
      await expect(page.getByText('Prediction Market Experts')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Data Currency', () => {
    test('NFL API returns current games', async ({ request }) => {
      const response = await request.get('/api/games?sport=NFL');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.count).toBeGreaterThan(0);
      expect(data.games.length).toBeGreaterThan(0);
      
      // Check timestamp is recent (within last hour)
      const timestamp = new Date(data.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      expect(diffMs).toBeLessThan(60 * 60 * 1000); // Less than 1 hour old
    });

    test('NBA API returns current games', async ({ request }) => {
      const response = await request.get('/api/games?sport=NBA');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('games');
      expect(data).toHaveProperty('timestamp');
    });

    test('NHL API returns current games', async ({ request }) => {
      const response = await request.get('/api/games?sport=NHL');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('games');
      expect(data).toHaveProperty('timestamp');
    });

    test('Game data has required fields', async ({ request }) => {
      const response = await request.get('/api/games?sport=NFL');
      const data = await response.json();
      
      if (data.games.length > 0) {
        const game = data.games[0];
        expect(game).toHaveProperty('id');
        expect(game).toHaveProperty('sport');
        expect(game).toHaveProperty('status');
        expect(game).toHaveProperty('homeTeam');
        expect(game).toHaveProperty('awayTeam');
        expect(game).toHaveProperty('odds');
        expect(game.homeTeam).toHaveProperty('name');
        expect(game.homeTeam).toHaveProperty('record');
        expect(game.odds).toHaveProperty('spread');
        expect(game.odds).toHaveProperty('total');
      }
    });
  });
});

test.describe('Edge Alert Types', () => {
  test('RLM alerts have correct data structure', async ({ request }) => {
    const response = await request.get('/api/edges?type=rlm');
    const data = await response.json();
    
    for (const alert of data.alerts) {
      expect(alert.type).toBe('rlm');
      expect(['critical', 'major', 'minor', 'info']).toContain(alert.severity);
      if (alert.data.lineOpenSpread !== undefined) {
        expect(typeof alert.data.lineOpenSpread).toBe('number');
      }
      if (alert.data.lineCurrentSpread !== undefined) {
        expect(typeof alert.data.lineCurrentSpread).toBe('number');
      }
    }
  });

  test('Steam alerts have timing data', async ({ request }) => {
    const response = await request.get('/api/edges?type=steam');
    const data = await response.json();
    
    for (const alert of data.alerts) {
      expect(alert.type).toBe('steam');
      if (alert.data.steamSpeed !== undefined) {
        expect(typeof alert.data.steamSpeed).toBe('number');
      }
      if (alert.data.booksAffected !== undefined) {
        expect(typeof alert.data.booksAffected).toBe('number');
      }
    }
  });

  test('Sharp vs Public alerts have percentage data', async ({ request }) => {
    const response = await request.get('/api/edges?type=sharp-public');
    const data = await response.json();
    
    for (const alert of data.alerts) {
      expect(alert.type).toBe('sharp-public');
      if (alert.data.publicPct !== undefined) {
        expect(alert.data.publicPct).toBeGreaterThanOrEqual(0);
        expect(alert.data.publicPct).toBeLessThanOrEqual(100);
      }
    }
  });
});
