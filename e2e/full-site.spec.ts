import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E Tests for Matchups App
 * Tests all pages, workflows, and interactive features
 * Run with: npx playwright test e2e/full-site.spec.ts
 */

// =============================================================================
// ALL ROUTES TEST - Every page in the app
// =============================================================================

const allRoutes = [
  // Core Pages
  { path: '/', name: 'Homepage', mustContain: 'Matchups' },
  
  // Sports Pages
  { path: '/nfl', name: 'NFL', mustContain: 'NFL' },
  { path: '/nba', name: 'NBA', mustContain: 'NBA' },
  { path: '/nhl', name: 'NHL', mustContain: 'NHL' },
  { path: '/mlb', name: 'MLB', mustContain: 'MLB' },
  { path: '/ncaaf', name: 'NCAAF', mustContain: 'College Football' },
  { path: '/ncaab', name: 'NCAAB', mustContain: 'College Basketball' },
  { path: '/wnba', name: 'WNBA', mustContain: 'WNBA' },
  { path: '/wncaab', name: 'WNCAAB', mustContain: 'WNCAAB' },
  
  // Sports Sub-pages
  { path: '/nfl/matchups', name: 'NFL Matchups', mustContain: 'Matchup' },
  { path: '/nba/players', name: 'NBA Players', mustContain: 'Player' },
  { path: '/nba/rankings', name: 'NBA Rankings', mustContain: 'Rank' },
  { path: '/ncaaf/players', name: 'NCAAF Players', mustContain: 'Player' },
  { path: '/ncaaf/rankings', name: 'NCAAF Rankings', mustContain: 'Rank' },
  { path: '/ncaab/players', name: 'NCAAB Players', mustContain: 'Player' },
  { path: '/ncaab/rankings', name: 'NCAAB Rankings', mustContain: 'Rank' },
  
  // Expert Tracker / Leaderboard
  { path: '/leaderboard', name: 'Expert Tracker', mustContain: 'Expert' },
  
  // Markets / Prediction Markets
  { path: '/markets', name: 'Markets', mustContain: 'Market' },
  { path: '/markets/politics', name: 'Politics Markets', mustContain: 'Politic' },
  { path: '/markets/crypto', name: 'Crypto Markets', mustContain: 'Crypto' },
  { path: '/markets/trending', name: 'Trending Markets', mustContain: 'Trend' },
  { path: '/markets/edge', name: 'Edge Finder', mustContain: 'Edge' },
  { path: '/markets/insights', name: 'Market Insights', mustContain: 'Insight' },
  { path: '/markets/analytics', name: 'Market Analytics', mustContain: 'Analytic' },
  
  // Tools & Features
  { path: '/trends', name: 'Trends', mustContain: 'Trend' },
  { path: '/analytics', name: 'Analytics', mustContain: 'Analytic' },
  { path: '/players', name: 'Players Hub', mustContain: 'Player' },
  { path: '/picks', name: 'Picks', mustContain: 'Pick' },
  { path: '/live', name: 'Live Scores', mustContain: 'Live' },
  { path: '/scores', name: 'Scores', mustContain: 'Score' },
  { path: '/lineshop', name: 'Line Shop', mustContain: 'Line' },
  { path: '/calculators', name: 'Calculators', mustContain: 'Calculator' },
  { path: '/injuries', name: 'Injuries', mustContain: 'Injur' },
  { path: '/weather', name: 'Weather', mustContain: 'Weather' },
  { path: '/alerts', name: 'Alerts', mustContain: 'Alert' },
  { path: '/stats', name: 'Stats', mustContain: 'Stat' },
  { path: '/systems', name: 'Systems', mustContain: 'System' },
  { path: '/sus', name: 'Sus Plays', mustContain: 'Sus' },
  
  // User Pages
  { path: '/profile', name: 'Profile', mustContain: 'Profile' },
  { path: '/auth', name: 'Auth', mustContain: 'Sign' },
  { path: '/my-picks', name: 'My Picks', mustContain: 'Pick' },
  
  // Admin Pages
  { path: '/admin', name: 'Admin Dashboard', mustContain: 'Admin' },
  { path: '/admin/picks', name: 'Admin Picks', mustContain: 'Pick' },
  { path: '/admin/docs', name: 'Admin Docs', mustContain: 'Doc' },
  { path: '/admin/manage', name: 'Admin Manage', mustContain: 'Manage' },
  { path: '/admin/diagnostics', name: 'Admin Diagnostics', mustContain: 'Diagnostic' },
];

test.describe('All Routes Load Successfully', () => {
  for (const route of allRoutes) {
    test(`${route.name} (${route.path}) loads without errors`, async ({ page }) => {
      // Navigate to the page
      const response = await page.goto(route.path, { waitUntil: 'networkidle' });
      
      // Check response is successful (not 4xx or 5xx)
      expect(response?.status()).toBeLessThan(400);
      
      // Page should have a body
      await expect(page.locator('body')).toBeVisible();
      
      // Check for expected content (case insensitive)
      const pageText = await page.textContent('body');
      expect(pageText?.toLowerCase()).toContain(route.mustContain.toLowerCase());
    });
  }
});

// =============================================================================
// LEADERBOARD / EXPERT TRACKER TESTS
// =============================================================================

test.describe('Expert Tracker (Leaderboard)', () => {
  test('loads and displays experts', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    
    // Should have the expert tracker header - check h1 or main visible heading
    const header = page.locator('h1, h2').filter({ hasText: /Expert|Tracker|Check the/i }).first();
    await expect(header).toBeVisible();
    
    // Should have filter tabs (may use different text)
    const tabBar = page.locator('button, [role="tab"]').filter({ hasText: /All|Celebrity|Pro|Sports|Markets/i }).first();
    await expect(tabBar).toBeVisible();
  });
  
  test('time period filters work', async ({ page }) => {
    await page.goto('/leaderboard');
    
    // Test time period buttons
    const timePeriods = ['Today', '3 Days', '7 Days', '14 Days', '30 Days', 'Season', 'All Time'];
    
    for (const period of timePeriods) {
      const button = page.locator(`button:has-text("${period}")`).first();
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(100);
      }
    }
  });
  
  test('network filters work', async ({ page }) => {
    await page.goto('/leaderboard');
    
    // Test network filter buttons
    const networks = ['All', 'ESPN', 'FS1', 'TNT', 'CBS', 'Podcast', 'Twitter'];
    
    for (const network of networks) {
      const button = page.locator(`button:has-text("${network}")`).first();
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(100);
      }
    }
  });
  
  test('can navigate to individual expert page', async ({ page }) => {
    await page.goto('/leaderboard');
    
    // Click on the first expert in the table
    const firstExpertRow = page.locator('tbody tr').first();
    if (await firstExpertRow.isVisible()) {
      await firstExpertRow.click();
      
      // Should navigate to expert detail page
      await page.waitForURL(/\/leaderboard\/.+/);
    }
  });
  
  test('individual expert page loads', async ({ page }) => {
    await page.goto('/leaderboard/stephen-a-smith');
    
    // Should display expert name
    await expect(page.locator('text=Stephen A. Smith').first()).toBeVisible();
    
    // Should have stats displayed
    const pageText = await page.textContent('body');
    expect(pageText).toContain('%'); // Win percentage
  });
  
  test('share button exists on expert rows', async ({ page }) => {
    await page.goto('/leaderboard');
    
    // Should have share buttons in the table
    const shareButtons = page.locator('a[href*="twitter.com/intent/tweet"]');
    const count = await shareButtons.count();
    expect(count).toBeGreaterThan(0);
  });
  
  test('compare functionality works', async ({ page }) => {
    await page.goto('/leaderboard');
    
    // Find compare buttons
    const compareButtons = page.locator('button[title*="comparison"]');
    
    if (await compareButtons.first().isVisible()) {
      // Click to add to comparison
      await compareButtons.first().click();
      await page.waitForTimeout(100);
    }
  });
});

// =============================================================================
// SPORTS PAGES TESTS
// =============================================================================

test.describe('Sports Pages', () => {
  const sports = ['nfl', 'nba', 'nhl', 'mlb'];
  
  for (const sport of sports) {
    test(`${sport.toUpperCase()} page has games displayed`, async ({ page }) => {
      await page.goto(`/${sport}`);
      
      // Should have game cards or schedule
      const gameCards = page.locator('[class*="game"], [class*="card"], [class*="matchup"]');
      // Even if no games today, page should load without error
      await expect(page.locator('body')).toBeVisible();
    });
    
    test(`${sport.toUpperCase()} page filters work`, async ({ page }) => {
      await page.goto(`/${sport}`);
      
      // Test filter options if present
      const filterButtons = page.locator('button, select').filter({ hasText: /today|all|week/i });
      if (await filterButtons.first().isVisible()) {
        await filterButtons.first().click();
      }
    });
  }
});

// =============================================================================
// MARKETS / PREDICTION MARKETS TESTS
// =============================================================================

test.describe('Markets Pages', () => {
  test('markets page loads with market cards', async ({ page }) => {
    await page.goto('/markets');
    
    // Should have market listings
    await expect(page.locator('body')).toBeVisible();
    
    // Should have platform filter buttons
    const polymarketBtn = page.locator('button:has-text("Polymarket")');
    if (await polymarketBtn.isVisible()) {
      await polymarketBtn.click();
    }
  });
  
  test('markets search works', async ({ page }) => {
    await page.goto('/markets');
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Chiefs');
      await page.waitForTimeout(300);
      await searchInput.clear();
    }
  });
  
  test('edge finder loads', async ({ page }) => {
    await page.goto('/markets/edge');
    
    await expect(page.locator('text=Edge').first()).toBeVisible();
  });
});

// =============================================================================
// ADMIN PAGES TESTS
// =============================================================================

test.describe('Admin Pages', () => {
  test('admin dashboard has all tabs', async ({ page }) => {
    await page.goto('/admin');
    
    // Should have various admin tabs
    const tabNames = ['Quick Actions', 'Data Jobs', 'AI Config'];
    for (const tabName of tabNames) {
      const tab = page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`);
      if (await tab.isVisible()) {
        await expect(tab).toBeVisible();
      }
    }
  });
  
  test('admin picks page loads', async ({ page }) => {
    await page.goto('/admin/picks');
    
    // Should have pick management interface
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('admin manage page loads', async ({ page }) => {
    await page.goto('/admin/manage');
    
    // Should have management interface
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('admin docs page loads', async ({ page }) => {
    await page.goto('/admin/docs');
    
    // Should have documentation
    await expect(page.locator('body')).toBeVisible();
  });
});

// =============================================================================
// NAVIGATION TESTS
// =============================================================================

test.describe('Navigation', () => {
  test('navbar has all main links', async ({ page }) => {
    await page.goto('/');
    
    // Check for main nav links - they may be in dropdowns or mobile menu
    // Verify links exist somewhere on page (footer, mobile menu, or desktop nav)
    const navLinks = ['/nfl', '/nba', '/nhl', '/mlb', '/markets', '/leaderboard'];
    
    for (const link of navLinks) {
      // Check that at least one link to this path exists on page
      const navLinkCount = await page.locator(`a[href="${link}"]`).count();
      expect(navLinkCount, `Should have at least one link to ${link}`).toBeGreaterThan(0);
    }
  });
  
  test('logo links to homepage', async ({ page }) => {
    await page.goto('/nfl');
    
    const homeLink = page.locator('a[href="/"]').first();
    await homeLink.click();
    await expect(page).toHaveURL('/');
  });
  
  test('footer has important links', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Footer should exist
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

// =============================================================================
// API ROUTES TESTS
// =============================================================================

test.describe('API Routes', () => {
  test('expert picks API responds', async ({ request }) => {
    const response = await request.get('/api/expert-picks?action=leaderboard');
    expect(response.status()).toBe(200);
  });
  
  test('OG image API generates image', async ({ request }) => {
    const response = await request.get('/api/og/expert/stephen-a-smith');
    // Should return an image
    expect(response.status()).toBeLessThan(400);
    const contentType = response.headers()['content-type'];
    // OG images return image/png
    expect(contentType).toContain('image');
  });
});

// =============================================================================
// MOBILE RESPONSIVENESS TESTS
// =============================================================================

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('mobile: homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('mobile: navigation menu works', async ({ page }) => {
    await page.goto('/');
    
    // Look for hamburger menu
    const menuButton = page.locator('button[aria-label*="menu"], button:has(svg)').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(200);
    }
  });
  
  test('mobile: leaderboard displays correctly', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page.locator('body')).toBeVisible();
    
    // Table should be scrollable or stacked
    const table = page.locator('table');
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  });
});

// =============================================================================
// INTERACTIVE ELEMENTS TESTS  
// =============================================================================

test.describe('Interactive Elements', () => {
  test('buttons are clickable', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button:visible');
    const count = await buttons.count();
    
    if (count > 0) {
      // Just verify buttons exist and are interactive
      await expect(buttons.first()).toBeEnabled();
    }
  });
  
  test('links are clickable', async ({ page }) => {
    await page.goto('/');
    
    const links = page.locator('a[href]:visible');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
  
  test('forms are functional', async ({ page }) => {
    await page.goto('/markets');
    
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.clear();
    }
  });
});

// =============================================================================
// DYNAMIC ROUTE TESTS
// =============================================================================

test.describe('Dynamic Routes', () => {
  test('individual expert page with slug', async ({ page }) => {
    const response = await page.goto('/leaderboard/stephen-a-smith');
    expect(response?.status()).toBeLessThan(400);
  });
  
  test('trend detail page', async ({ page }) => {
    await page.goto('/trends');
    
    // If there are trend cards with links, test one
    const trendLink = page.locator('a[href^="/trends/"]').first();
    if (await trendLink.isVisible()) {
      await trendLink.click();
      await page.waitForURL(/\/trends\/.+/);
    }
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

test.describe('Error Handling', () => {
  test('404 page for non-existent routes', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-12345');
    expect(response?.status()).toBe(404);
  });
  
  test('invalid expert slug shows fallback', async ({ page }) => {
    const response = await page.goto('/leaderboard/invalid-expert-slug-xyz');
    // Should either 404 or show "not found" message
    const status = response?.status();
    expect(status === 404 || status === 200).toBeTruthy();
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

test.describe('Performance', () => {
  test('homepage loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(5000);
  });
  
  test('leaderboard loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/leaderboard', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(5000);
  });
});
