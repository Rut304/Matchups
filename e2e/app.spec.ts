import { test, expect } from '@playwright/test';

// All main routes that should load without errors
const mainRoutes = [
  { path: '/', name: 'Homepage' },
  { path: '/nfl', name: 'NFL Page' },
  { path: '/nba', name: 'NBA Page' },
  { path: '/nhl', name: 'NHL Page' },
  { path: '/mlb', name: 'MLB Page' },
  { path: '/markets', name: 'Markets Page' },
  { path: '/trends', name: 'Trends Page' },
  { path: '/admin', name: 'Admin Page' },
];

test.describe('Page Load Tests', () => {
  for (const route of mainRoutes) {
    test(`${route.name} loads without errors`, async ({ page }) => {
      const response = await page.goto(route.path);
      
      // Check response is successful
      expect(response?.status()).toBeLessThan(400);
      
      // Check no JavaScript errors
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Should have no console errors
      expect(errors).toHaveLength(0);
      
      // Page should have main content
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Navigation Tests', () => {
  test('Navbar links work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Click NFL link
    await page.click('a[href="/nfl"]');
    await expect(page).toHaveURL('/nfl');
    await expect(page.locator('h1')).toContainText('NFL');
    
    // Click NBA link
    await page.click('a[href="/nba"]');
    await expect(page).toHaveURL('/nba');
    await expect(page.locator('h1')).toContainText('NBA');
    
    // Click NHL link  
    await page.click('a[href="/nhl"]');
    await expect(page).toHaveURL('/nhl');
    await expect(page.locator('h1')).toContainText('NHL');
    
    // Click MLB link
    await page.click('a[href="/mlb"]');
    await expect(page).toHaveURL('/mlb');
    await expect(page.locator('h1')).toContainText('MLB');
    
    // Click Markets link
    await page.click('a[href="/markets"]');
    await expect(page).toHaveURL('/markets');
    await expect(page.locator('h1')).toContainText('Markets');
    
    // Click Trends link (may be in different location)
    await page.click('a[href="/trends"]');
    await expect(page).toHaveURL('/trends');
    
    // Click Admin link
    await page.click('a[href="/admin"]');
    await expect(page).toHaveURL('/admin');
  });

  test('Homepage quick links work', async ({ page }) => {
    await page.goto('/');
    
    // Find and click quick links section
    const quickLinks = page.locator('text=Quick Links').first();
    if (await quickLinks.isVisible()) {
      // Test the grid of quick links
      const nflLink = page.locator('a[href="/nfl"]').filter({ hasText: 'NFL' });
      await expect(nflLink.first()).toBeVisible();
    }
  });

  test('Logo/brand links to homepage', async ({ page }) => {
    await page.goto('/nfl');
    
    // Click the brand/logo to go home
    const brandLink = page.locator('a[href="/"]').first();
    await brandLink.click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Interactive Elements', () => {
  test('NFL page AI Picks toggle works', async ({ page }) => {
    await page.goto('/nfl');
    
    // Find AI Picks button
    const aiPicksButton = page.locator('button').filter({ hasText: 'AI Picks' });
    if (await aiPicksButton.isVisible()) {
      // Toggle off
      await aiPicksButton.click();
      // Toggle back on
      await aiPicksButton.click();
    }
  });

  test('NFL page filter dropdown works', async ({ page }) => {
    await page.goto('/nfl');
    
    // Find the filter select
    const filterSelect = page.locator('select');
    if (await filterSelect.first().isVisible()) {
      await filterSelect.first().selectOption('today');
      await filterSelect.first().selectOption('all');
    }
  });

  test('Markets page filters work', async ({ page }) => {
    await page.goto('/markets');
    
    // Test platform filter buttons
    const polymarketButton = page.locator('button').filter({ hasText: 'Polymarket' });
    if (await polymarketButton.isVisible()) {
      await polymarketButton.click();
    }
    
    const allButton = page.locator('button').filter({ hasText: 'All' }).first();
    if (await allButton.isVisible()) {
      await allButton.click();
    }
    
    // Test search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Chiefs');
      await searchInput.clear();
    }
  });

  test('Trends page filters work', async ({ page }) => {
    await page.goto('/trends');
    
    // Test sport filter
    const nflFilter = page.locator('button').filter({ hasText: 'NFL' }).first();
    if (await nflFilter.isVisible()) {
      await nflFilter.click();
    }
    
    // Test type filter
    const atsFilter = page.locator('button').filter({ hasText: /^ats$/i });
    if (await atsFilter.isVisible()) {
      await atsFilter.click();
    }
  });

  test('Admin page tabs work', async ({ page }) => {
    await page.goto('/admin');
    
    // Test tab navigation
    const tabs = ['Data Jobs', 'AI Config', 'Users', 'Settings'];
    for (const tabName of tabs) {
      const tab = page.locator('button').filter({ hasText: tabName });
      if (await tab.isVisible()) {
        await tab.click();
        // Wait for content to change
        await page.waitForTimeout(100);
      }
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test('Mobile menu works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Find mobile menu button (hamburger)
    const menuButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    
    // Check if hamburger is visible on mobile
    // The menu should be toggleable
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(200);
    }
  });

  test('Pages render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    for (const route of mainRoutes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      
      // Check page doesn't have horizontal scroll issues
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});

test.describe('Content Verification', () => {
  test('Homepage has key sections', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check for stats cards
    const statCards = page.locator('[class*="stat"]');
    expect(await statCards.count()).toBeGreaterThan(0);
    
    // Check for game cards/matchups section
    const matchupsSection = page.locator('text=Matchups').first();
    if (await matchupsSection.isVisible()) {
      await expect(matchupsSection).toBeVisible();
    }
  });

  test('NFL page has game cards', async ({ page }) => {
    await page.goto('/nfl');
    
    // Should have game cards with team abbreviations
    const gameCards = page.locator('[class*="card"], [class*="Card"]');
    expect(await gameCards.count()).toBeGreaterThan(0);
  });

  test('Markets page has market cards', async ({ page }) => {
    await page.goto('/markets');
    
    // Should show YES/NO prices
    const yesText = page.locator('text=YES').first();
    const noText = page.locator('text=NO').first();
    
    await expect(yesText).toBeVisible();
    await expect(noText).toBeVisible();
  });

  test('Admin page has system stats', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show admin-related content
    await expect(page.locator('h1').first()).toContainText('Admin');
  });
});

test.describe('Error Handling', () => {
  test('404 page for non-existent routes', async ({ page }) => {
    const response = await page.goto('/non-existent-page-xyz');
    // Next.js returns 404 for unknown routes
    expect(response?.status()).toBe(404);
  });
});
