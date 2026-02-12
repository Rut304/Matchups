import { test, expect, Page } from '@playwright/test';

/**
 * USER FLOW TESTS
 * These tests simulate actual user behavior and catch real issues like:
 * - Broken game links (the issue we just fixed)
 * - Content that doesn't load
 * - API failures that break pages
 */

test.describe('🎯 Game Click Flow - Home Page to Game Page', () => {
  test('clicking a game card from homepage navigates to working game page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find the first clickable game link
    const gameLinks = page.locator('a[href^="/game/"]');
    const linkCount = await gameLinks.count();
    
    if (linkCount === 0) {
      // If no game links, check if there's a "no games" message (this is OK)
      const noGamesMessage = page.locator('text=/no games|no matchups|check back/i');
      if (await noGamesMessage.count() > 0) {
        console.log('No games available - this is acceptable');
        return;
      }
      throw new Error('No game links found and no "no games" message displayed');
    }
    
    // Get the first game link's href
    const firstLink = gameLinks.first();
    const href = await firstLink.getAttribute('href');
    console.log(`Testing game link: ${href}`);
    
    // Click the game and wait for navigation
    await Promise.all([
      page.waitForURL(/\/game\//, { timeout: 10000 }),
      firstLink.click()
    ]);
    
    // Verify we're on a game page
    expect(page.url()).toContain('/game/');
    
    // Game page should show actual content, not error states
    const errorIndicators = [
      'text=404',
      'text=Game not found',
      'text=Error loading',
      'text=Something went wrong',
      'text=Unable to load',
    ];
    
    for (const errorSelector of errorIndicators) {
      const errorElement = page.locator(errorSelector);
      const errorCount = await errorElement.count();
      expect(errorCount, `Game page should not show error: ${errorSelector}`).toBe(0);
    }
    
    // Game page should have actual game content
    // Look for team names, scores, or matchup indicators
    const gameContentIndicators = [
      'h1', // Main heading
      '[data-testid="game-header"]',
      'text=/vs|at|@/i', // "Team X vs Team Y" or "Team X at Team Y"
    ];
    
    let hasContent = false;
    for (const selector of gameContentIndicators) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        hasContent = true;
        break;
      }
    }
    
    expect(hasContent, 'Game page should display actual game content').toBe(true);
  });

  test('clicking games from sport pages works', async ({ page }) => {
    const sportPages = ['/nba', '/nfl', '/nhl', '/mlb'];
    
    for (const sportPage of sportPages) {
      await page.goto(sportPage);
      await page.waitForLoadState('networkidle');
      
      const gameLinks = page.locator('a[href^="/game/"]');
      const linkCount = await gameLinks.count();
      
      if (linkCount > 0) {
        const firstLink = gameLinks.first();
        const href = await firstLink.getAttribute('href');
        console.log(`Testing ${sportPage} game link: ${href}`);
        
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should not show 404 or error
        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('404');
        expect(pageContent.toLowerCase()).not.toContain('not found');
        
        // Navigate back for next sport
        await page.goBack();
        await page.waitForLoadState('networkidle');
      } else {
        console.log(`No games on ${sportPage} - acceptable if out of season`);
      }
    }
  });
});

test.describe('🔗 Edge Dashboard Game Links', () => {
  test('edge dashboard game links resolve correctly', async ({ page }) => {
    await page.goto('/markets/edge');
    await page.waitForLoadState('networkidle');
    
    // Find game links in the edge dashboard
    const gameLinks = page.locator('a[href^="/game/"]');
    const linkCount = await gameLinks.count();
    
    console.log(`Found ${linkCount} game links on edge dashboard`);
    
    if (linkCount === 0) {
      // Check if there's a legitimate "no edges" state
      const noEdgesMessage = page.locator('text=/no edges|no games|loading/i');
      if (await noEdgesMessage.count() > 0) {
        return; // Acceptable
      }
    }
    
    // Test first 3 game links (don't test all to save time)
    const linksToTest = Math.min(linkCount, 3);
    
    for (let i = 0; i < linksToTest; i++) {
      await page.goto('/markets/edge');
      await page.waitForLoadState('networkidle');
      
      const link = page.locator('a[href^="/game/"]').nth(i);
      const href = await link.getAttribute('href');
      console.log(`Testing edge link ${i + 1}: ${href}`);
      
      await link.click();
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded properly
      const response = await page.evaluate(() => ({
        title: document.title,
        hasH1: document.querySelector('h1') !== null,
        bodyText: document.body.innerText.substring(0, 500)
      }));
      
      expect(response.bodyText.toLowerCase()).not.toContain('404');
      expect(response.bodyText.toLowerCase()).not.toContain('error loading');
    }
  });
});

test.describe('🏆 Leaderboard Expert Links', () => {
  test('clicking expert from leaderboard shows their profile', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    
    // Look for clickable expert links/rows
    const expertLinks = page.locator('a[href^="/profile/"], tr[data-expert], [role="row"]');
    const linkCount = await expertLinks.count();
    
    if (linkCount > 0) {
      // Click first expert
      const firstExpert = expertLinks.first();
      await firstExpert.click();
      await page.waitForLoadState('networkidle');
      
      // Should show expert profile or picks
      const pageUrl = page.url();
      const isValidPage = 
        pageUrl.includes('/profile/') || 
        pageUrl.includes('/expert/') ||
        pageUrl.includes('/leaderboard'); // May stay on leaderboard with expanded view
      
      expect(isValidPage).toBe(true);
    }
  });
});

test.describe('📊 Dynamic Data Loading', () => {
  test('homepage shows live games or appropriate empty state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should either have games or show a meaningful message
    const gameCards = page.locator('[data-testid="game-card"], a[href^="/game/"], .game-card');
    const gameCount = await gameCards.count();
    
    if (gameCount === 0) {
      // Must show appropriate message
      const emptyStateMessages = [
        'text=/no games today/i',
        'text=/check back/i',
        'text=/no matchups/i',
        'text=/games will appear/i',
      ];
      
      let hasEmptyState = false;
      for (const msg of emptyStateMessages) {
        if (await page.locator(msg).count() > 0) {
          hasEmptyState = true;
          break;
        }
      }
      
      // If no games and no empty state message, that's a bug
      // But also check if page just shows content without games
      const hasOtherContent = await page.locator('h1, h2, h3').count() > 0;
      expect(hasEmptyState || hasOtherContent, 'Page should show games or meaningful content').toBe(true);
    }
    
    console.log(`Homepage shows ${gameCount} game(s)`);
  });

  test('live scores page fetches real data', async ({ page }) => {
    await page.goto('/scores');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for API calls
    await page.waitForTimeout(2000);
    
    // Should show scores or "no games" - NOT stuck on loading
    const loadingIndicators = page.locator('text=/loading\\.\\.\\.$/i');
    const stillLoading = await loadingIndicators.count();
    
    // After 2 seconds, shouldn't still be showing "Loading..."
    expect(stillLoading, 'Scores page should finish loading within 2 seconds').toBe(0);
  });

  test('markets page loads prediction market data', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should have market data or show empty state - not loading forever
    const content = await page.content();
    const hasMarketContent = 
      content.includes('Polymarket') || 
      content.includes('Kalshi') ||
      content.includes('%') || // Probability percentages
      content.includes('$'); // Dollar amounts
    
    const hasEmptyState = content.toLowerCase().includes('no markets');
    const stillLoading = content.toLowerCase().includes('loading...');
    
    expect(hasMarketContent || hasEmptyState, 'Markets page should load data or show empty state').toBe(true);
    expect(stillLoading, 'Markets page should not be stuck loading').toBe(false);
  });
});

test.describe('📍 API Route Validation', () => {
  test('games API returns valid data', async ({ request }) => {
    // Test the games endpoint
    const response = await request.get('/api/games?sport=nba');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.error).toBeUndefined();
  });

  test('edges API returns valid structure', async ({ request }) => {
    const response = await request.get('/api/edges');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(Array.isArray(data) || (data && typeof data === 'object')).toBe(true);
  });

  test('game detail API handles different ID formats', async ({ request }) => {
    // Test with ESPN-style numeric ID (404 is OK if game doesn't exist)
    const espnResponse = await request.get('/api/games/401772988');
    expect(espnResponse.status()).toBeLessThan(500); // Should not error

    // Test with Action Network ID format
    const anResponse = await request.get('/api/games/an-267287?sport=nba');
    expect(anResponse.status()).toBeLessThan(500); // Should not error
  });
});
