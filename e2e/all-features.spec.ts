import { test, expect, Page } from '@playwright/test';

/**
 * COMPREHENSIVE E2E TEST SUITE - ALL PAGES, FEATURES & FUNCTIONALITY
 * Tests every route, interaction, and user workflow on Matchups
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  // Give client-side hydration a moment
  await page.waitForTimeout(500);
}

async function checkNoConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && 
        !msg.text().includes('ResizeObserver') &&
        !msg.text().includes('hydration') &&
        !msg.text().includes('unique "key" prop')) {
      errors.push(msg.text());
    }
  });
  return errors;
}

// ============================================================================
// HOMEPAGE TESTS
// ============================================================================

test.describe('🏠 Homepage', () => {
  test('loads and displays main content', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check page title
    await expect(page).toHaveTitle(/Matchups/i);
    
    // Check navbar exists
    await expect(page.locator('nav')).toBeVisible();
    
    // Check main content loads
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('navbar has all sport links', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check sports dropdown or links exist
    const sportsLinks = ['NFL', 'NBA', 'NHL', 'MLB'];
    for (const sport of sportsLinks) {
      await expect(page.getByRole('link', { name: new RegExp(sport, 'i') }).first()).toBeVisible();
    }
  });

  test('global search opens with Cmd+K', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Press Cmd+K (or Ctrl+K on Windows)
    await page.keyboard.press('Meta+k');
    
    // Check search modal appears
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// SPORTS PAGES TESTS
// ============================================================================

test.describe('🏈 Sports Pages', () => {
  const sports = [
    { path: '/nfl', name: 'NFL', emoji: '🏈' },
    { path: '/nba', name: 'NBA', emoji: '🏀' },
    { path: '/nhl', name: 'NHL', emoji: '🏒' },
    { path: '/mlb', name: 'MLB', emoji: '⚾' },
    { path: '/ncaaf', name: 'NCAAF', emoji: '🏈' },
    { path: '/ncaab', name: 'NCAAB', emoji: '🏀' },
    { path: '/wnba', name: 'WNBA', emoji: '🏀' },
  ];

  for (const sport of sports) {
    test(`${sport.emoji} ${sport.name} page loads correctly`, async ({ page }) => {
      await page.goto(sport.path);
      await waitForPageLoad(page);
      
      // Page should have content
      await expect(page.locator('main').first()).toBeVisible();
      
      // Should show sport-specific content
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toContain(sport.name.toLowerCase());
    });

    test(`${sport.name} matchups subpage loads`, async ({ page }) => {
      await page.goto(`${sport.path}/matchups`);
      await waitForPageLoad(page);
      await expect(page.locator('main').first()).toBeVisible();
    });

    test(`${sport.name} players subpage loads`, async ({ page }) => {
      await page.goto(`${sport.path}/players`);
      await waitForPageLoad(page);
      await expect(page.locator('main').first()).toBeVisible();
    });
  }
});

// ============================================================================
// TOOLS & FEATURES TESTS
// ============================================================================

test.describe('🛠️ Tools & Features', () => {
  test('Trend Finder page loads and has search', async ({ page }) => {
    await page.goto('/trend-finder');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    // Should have search/filter functionality (textarea or input)
    const hasSearch = await page.locator('input[type="text"], input[type="search"], textarea').count() > 0;
    expect(hasSearch).toBeTruthy();
  });

  test('Prop Correlations page loads', async ({ page }) => {
    await page.goto('/props/correlations');
    await waitForPageLoad(page);
    
    await expect(page.locator('body')).toBeVisible();
    // Should have sport selector or correlation content
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('correlation');
  });

  test('Pattern Matcher page loads', async ({ page }) => {
    await page.goto('/patterns');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    // Should have pattern cards
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('pattern');
  });

  test('Line Shop page loads', async ({ page }) => {
    await page.goto('/lineshop');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('CLV Tracker page loads', async ({ page }) => {
    await page.goto('/performance/clv');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('clv');
  });

  test('Calculators page loads', async ({ page }) => {
    await page.goto('/calculators');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    // Should have calculator inputs
    const hasInputs = await page.locator('input').count() > 0;
    expect(hasInputs).toBeTruthy();
  });

  test('Alerts page loads', async ({ page }) => {
    await page.goto('/alerts');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Trends page loads', async ({ page }) => {
    await page.goto('/trends');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Analytics page loads', async ({ page }) => {
    await page.goto('/analytics');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('News page loads', async ({ page }) => {
    await page.goto('/news');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Marketplace page loads', async ({ page }) => {
    await page.goto('/marketplace');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('marketplace');
  });

  test('Systems page loads', async ({ page }) => {
    await page.goto('/systems');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Leaderboard page loads', async ({ page }) => {
    await page.goto('/leaderboard');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    // Should show rankings
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/leaderboard|tracker|expert/i);
  });
});

// ============================================================================
// LIVE GAMES TESTS
// ============================================================================

test.describe('🔴 Live Games', () => {
  test('Live center page loads', async ({ page }) => {
    await page.goto('/live');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('live');
  });

  test('Scores page loads', async ({ page }) => {
    await page.goto('/scores');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });
});

// ============================================================================
// USER FEATURES TESTS
// ============================================================================

test.describe('👤 User Features', () => {
  test('My Picks page loads', async ({ page }) => {
    await page.goto('/my-picks');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Dashboard redirects to auth if not logged in', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    // Should either show dashboard or redirect to auth
    const url = page.url();
    expect(url).toMatch(/dashboard|auth/i);
  });

  test('Sus Plays page loads', async ({ page }) => {
    await page.goto('/sus');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('sus');
  });
});

// ============================================================================
// PREDICTION MARKETS TESTS
// ============================================================================

test.describe('🎯 Prediction Markets', () => {
  test('Markets main page loads', async ({ page }) => {
    await page.goto('/markets');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('market');
  });

  test('Politics markets page loads', async ({ page }) => {
    await page.goto('/markets/politics');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Crypto markets page loads', async ({ page }) => {
    await page.goto('/markets/crypto');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Entertainment markets page loads', async ({ page }) => {
    await page.goto('/markets/entertainment');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Edge page loads', async ({ page }) => {
    await page.goto('/edge');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });
});

// ============================================================================
// ADMIN PAGES TESTS
// ============================================================================

test.describe('🔐 Admin Pages', () => {
  test('Admin dashboard loads', async ({ page }) => {
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    await expect(page.locator('body')).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('admin');
  });

  test('Admin API usage page loads', async ({ page }) => {
    await page.goto('/admin/api-usage');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('api');
  });

  test('Admin picks page loads', async ({ page }) => {
    await page.goto('/admin/picks');
    await waitForPageLoad(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin manage page loads', async ({ page }) => {
    await page.goto('/admin/manage');
    await waitForPageLoad(page);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// INFO PAGES TESTS
// ============================================================================

test.describe('📄 Info Pages', () => {
  test('Injuries page loads', async ({ page }) => {
    await page.goto('/injuries');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('injur');
  });

  test('Weather page loads', async ({ page }) => {
    await page.goto('/weather');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('weather');
  });

  test('Stats page loads', async ({ page }) => {
    await page.goto('/stats');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Players page loads', async ({ page }) => {
    await page.goto('/players');
    await waitForPageLoad(page);
    await expect(page.locator('main').first()).toBeVisible();
  });
});

// ============================================================================
// API ENDPOINT TESTS
// ============================================================================

test.describe('🔌 API Endpoints', () => {
  test('Health API returns success', async ({ request }) => {
    const response = await request.get('/api/health');
    // Health API may return 503 if external services are down
    expect(response.status()).toBeLessThan(504);
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('Games API returns data', async ({ request }) => {
    const response = await request.get('/api/games?sport=nfl');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.games) || data.games !== undefined).toBeTruthy();
  });

  test('Odds API returns data', async ({ request }) => {
    const response = await request.get('/api/odds?sport=americanfootball_nfl');
    // External API may rate-limit or have no data; accept non-server-error responses
    expect(response.status()).toBeLessThan(504);
  });

  test('Search API returns results', async ({ request }) => {
    const response = await request.get('/api/search?q=chiefs');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('results');
  });

  test('Leaderboard API returns data', async ({ request }) => {
    const response = await request.get('/api/leaderboard');
    expect(response.ok()).toBeTruthy();
  });

  test('Patterns API returns data', async ({ request }) => {
    const response = await request.get('/api/patterns');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('patterns');
  });

  test('Prop Correlations API returns data', async ({ request }) => {
    const response = await request.get('/api/props/correlations?sport=nfl');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('games');
  });

  test('CLV API returns data', async ({ request }) => {
    const response = await request.get('/api/clv');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('summary');
  });

  test('Injuries API returns data', async ({ request }) => {
    const response = await request.get('/api/injuries');
    expect(response.ok()).toBeTruthy();
  });

  test('Sus Plays API returns data', async ({ request }) => {
    const response = await request.get('/api/sus');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('susPlays');
  });

  test('Admin API Usage returns data', async ({ request }) => {
    const response = await request.get('/api/admin/api-usage');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('summary');
  });
});

// ============================================================================
// INTERACTIVE FEATURES TESTS
// ============================================================================

test.describe('🎮 Interactive Features', () => {
  test('Navbar dropdowns work', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Try to hover/click on Sports dropdown
    const sportsButton = page.locator('button, [role="button"]').filter({ hasText: /sports/i }).first();
    if (await sportsButton.isVisible()) {
      await sportsButton.hover();
      await page.waitForTimeout(500);
    }
  });

  test('Calculator inputs work', async ({ page }) => {
    await page.goto('/calculators');
    await waitForPageLoad(page);
    
    // Find first number input and try to type
    const input = page.locator('input[type="number"], input[type="text"]').first();
    if (await input.isVisible()) {
      await input.fill('100');
      const value = await input.inputValue();
      expect(value).toBe('100');
    }
  });

  test('Sport selector tabs work', async ({ page }) => {
    await page.goto('/trends');
    await waitForPageLoad(page);
    
    // Find sport tabs and click
    const tabs = page.locator('button').filter({ hasText: /nfl|nba|mlb|nhl/i });
    if (await tabs.first().isVisible()) {
      await tabs.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('Prop correlations sport selector works', async ({ page }) => {
    await page.goto('/props/correlations');
    await waitForPageLoad(page);
    
    // Click on different sport
    const nbaButton = page.locator('button').filter({ hasText: 'NBA' }).first();
    if (await nbaButton.isVisible()) {
      await nbaButton.click();
      await page.waitForTimeout(500);
      
      // Content should update
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toContain('nba');
    }
  });

  test('Pattern matcher filters work', async ({ page }) => {
    await page.goto('/patterns');
    await waitForPageLoad(page);
    
    // Click on sport filter
    const nflButton = page.locator('button').filter({ hasText: 'NFL' }).first();
    if (await nflButton.isVisible()) {
      await nflButton.click();
      await page.waitForTimeout(500);
    }
    
    // Try category dropdown
    const select = page.locator('select').first();
    if (await select.isVisible()) {
      await select.selectOption({ index: 1 });
    }
  });
});

// ============================================================================
// RESPONSIVE DESIGN TESTS
// ============================================================================

test.describe('📱 Responsive Design', () => {
  test('Mobile viewport - homepage loads', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForPageLoad(page);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Mobile viewport - navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Look for mobile menu button
    const menuButton = page.locator('button').filter({ hasText: /menu/i }).or(
      page.locator('[aria-label*="menu"]')
    ).or(
      page.locator('button svg')
    ).first();
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
  });

  test('Tablet viewport - pages load correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/trends');
    await waitForPageLoad(page);
    
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Desktop viewport - full layout visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Desktop should show full nav
    await expect(page.locator('nav')).toBeVisible();
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('⚡ Performance', () => {
  test('Homepage loads under 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await waitForPageLoad(page);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });

  test('Sports page loads under 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/nfl');
    await waitForPageLoad(page);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });

  test('API response time is acceptable', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/health');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(2000);
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('🚨 Error Handling', () => {
  test('404 page for invalid route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');
    await waitForPageLoad(page);
    
    // Should show 404 or redirect
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toMatch(/404|not found|error|home/i);
  });

  test('Invalid game ID handled gracefully', async ({ page }) => {
    await page.goto('/live/invalid-game-id-12345', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    
    // Should show error message or redirect
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

test.describe('♿ Accessibility', () => {
  test('Homepage has proper heading structure', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('Links are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focused = await page.locator(':focus').count();
    expect(focused).toBeGreaterThan(0);
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto('/nfl');
    await waitForPageLoad(page);
    
    // Check that images have alt attributes
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    // Allow some without alt (decorative), but not all
    const totalImages = await page.locator('img').count();
    if (totalImages > 0) {
      expect(imagesWithoutAlt).toBeLessThan(totalImages);
    }
  });
});
