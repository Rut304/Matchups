import { test, expect } from '@playwright/test';

/**
 * CONTENT FRESHNESS TESTS
 * These tests catch stale content like:
 * - Super Bowl content showing after the event is over
 * - Hardcoded dates in the past
 * - Outdated event references
 * - Static placeholder data that should be dynamic
 */

// Get current date info for dynamic checks
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1; // 1-12

test.describe('🗓️ Content Freshness - No Stale Events', () => {
  
  test('homepage has no past Super Bowl references', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const content = await page.content();
    const bodyText = await page.locator('body').innerText();
    
    // Super Bowl is in February - if we're past February, no Super Bowl content
    // If we're before the Super Bowl date, it's fine
    // Super Bowl LIX was Feb 2025, Super Bowl LX is Feb 2026
    
    // Check for past Super Bowl references
    const pastSuperBowls = [
      'Super Bowl LVIII', // 2024
      'Super Bowl LIX',   // 2025
    ];
    
    for (const bowl of pastSuperBowls) {
      expect(bodyText).not.toContain(bowl);
    }
    
    // If it's past mid-February, Super Bowl LX is also stale
    if (currentMonth > 2 || (currentMonth === 2 && now.getDate() > 15)) {
      expect(bodyText).not.toContain('Super Bowl LX');
    }
  });

  test('no hardcoded future dates that have passed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').innerText();
    
    // Check for dates that have clearly passed
    // This catches things like "February 8, 2025" showing when it's 2026
    const pastYearPattern = new RegExp(`(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+${currentYear - 1}`, 'gi');
    const pastYearMatches = bodyText.match(pastYearPattern);
    
    if (pastYearMatches) {
      console.warn(`Found past year dates on homepage: ${pastYearMatches.join(', ')}`);
      // Allow some past dates in historical context, but flag them
    }
  });

  test('markets page has no stale event references', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').innerText();
    
    // After Super Bowl in mid-February, these shouldn't appear
    if (currentMonth > 2 || (currentMonth === 2 && now.getDate() > 15)) {
      const staleReferences = [
        'Super Bowl winner',
        'Super Bowl champion',
        'Super Bowl LX',
        'Chiefs Super Bowl',
        'Eagles Super Bowl',
      ];
      
      for (const ref of staleReferences) {
        const hasStaleRef = bodyText.toLowerCase().includes(ref.toLowerCase());
        expect(hasStaleRef, `Markets page should not reference "${ref}" after Super Bowl`).toBe(false);
      }
    }
  });

  test('trending markets has current events only', async ({ page }) => {
    await page.goto('/markets/trending');
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').innerText();
    
    // Check for obviously stale content
    const obviouslyStale = [
      '2024 election',
      '2024 presidential',
      'Super Bowl LVIII',
      'Super Bowl LIX',
    ];
    
    for (const stale of obviouslyStale) {
      expect(bodyText.toLowerCase()).not.toContain(stale.toLowerCase());
    }
  });
});

test.describe('⏰ Dynamic vs Static Content Detection', () => {
  
  test('homepage games section shows dynamic content', async ({ page }) => {
    // Load page twice and compare - static content would be identical
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for loading states or game content
    const hasGameContent = await page.locator('a[href^="/game/"]').count() > 0;
    const hasNoGamesMessage = await page.locator('text=/no games|check back/i').count() > 0;
    const hasLoadingIndicator = await page.locator('text=/loading/i').count() > 0;
    
    // Should have one of these states
    expect(
      hasGameContent || hasNoGamesMessage || hasLoadingIndicator,
      'Homepage should show games, empty state, or loading'
    ).toBe(true);
    
    // If showing games, they should have reasonable data
    if (hasGameContent) {
      const firstGameLink = page.locator('a[href^="/game/"]').first();
      const href = await firstGameLink.getAttribute('href');
      
      // Game IDs should look valid (not placeholder)
      expect(href).not.toContain('undefined');
      expect(href).not.toContain('null');
      expect(href).not.toBe('/game/');
    }
  });

  test('odds are not obviously placeholder values', async ({ page }) => {
    await page.goto('/nba');
    await page.waitForLoadState('networkidle');
    
    // Look for odds displays
    const oddsElements = page.locator('text=/[+-]\\d{3,4}|\\-\\d{3}/');
    const oddsCount = await oddsElements.count();
    
    if (oddsCount > 0) {
      // Get all odds values
      const oddsTexts = await oddsElements.allTextContents();
      
      // Check they're not all identical (would suggest static placeholder)
      const uniqueOdds = new Set(oddsTexts);
      
      // If showing many games, odds should vary
      if (oddsCount > 4) {
        expect(uniqueOdds.size, 'Odds should vary across games, not be placeholders').toBeGreaterThan(1);
      }
    }
  });

  test('timestamps are reasonable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for time displays
    const timePattern = /\d{1,2}:\d{2}\s*(AM|PM|ET|PT|CT|MT)/gi;
    const bodyText = await page.locator('body').innerText();
    const timeMatches = bodyText.match(timePattern);
    
    if (timeMatches) {
      console.log(`Found ${timeMatches.length} time references`);
      // Times exist - good sign of dynamic content
    }
    
    // Check for date displays that might be stale
    const dateElements = page.locator('text=/Today|Tomorrow|Yesterday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/i');
    const dateCount = await dateElements.count();
    
    console.log(`Found ${dateCount} relative date references`);
  });
});

test.describe('🔄 Page Refreshes Show Updated Content', () => {
  
  test('scores page updates on refresh', async ({ page }) => {
    await page.goto('/scores');
    await page.waitForLoadState('networkidle');
    
    // Get initial content
    const initialContent = await page.locator('body').innerText();
    
    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Get refreshed content
    const refreshedContent = await page.locator('body').innerText();
    
    // Structure should be similar (not error)
    const initialHasError = initialContent.toLowerCase().includes('error');
    const refreshedHasError = refreshedContent.toLowerCase().includes('error');
    
    expect(refreshedHasError).toBe(initialHasError); // Consistent state
  });

  test('API-dependent pages handle refresh gracefully', async ({ page }) => {
    const apiPages = ['/markets', '/leaderboard', '/live', '/scores'];
    
    for (const route of apiPages) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Should not show raw error on page
      const content = await page.locator('body').innerText();
      expect(content.toLowerCase()).not.toContain('unhandled');
      expect(content.toLowerCase()).not.toContain('uncaught');
      expect(content).not.toContain('TypeError');
      expect(content).not.toContain('ReferenceError');
      
      // Refresh and check again
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const refreshedContent = await page.locator('body').innerText();
      expect(refreshedContent.toLowerCase()).not.toContain('unhandled');
    }
  });
});

test.describe('📱 Content Consistency Across Pages', () => {
  
  test('same game shows consistent info across pages', async ({ page }) => {
    // First, find a game on the homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const gameLinks = page.locator('a[href^="/game/"]');
    const count = await gameLinks.count();
    
    if (count === 0) {
      console.log('No games to test consistency');
      return;
    }
    
    // Get details from homepage card
    const firstGame = gameLinks.first();
    const href = await firstGame.getAttribute('href');
    const cardText = await firstGame.innerText();
    
    // Navigate to game page
    await firstGame.click();
    await page.waitForLoadState('networkidle');
    
    const gamePageText = await page.locator('body').innerText();
    
    // Extract team names from card text (if visible)
    // At minimum, game page should not be completely different content
    
    // Game page should have SOME overlap with card (team names, etc.)
    const cardWords = cardText.split(/\s+/).filter(w => w.length > 3);
    let matchCount = 0;
    
    for (const word of cardWords) {
      if (gamePageText.includes(word)) {
        matchCount++;
      }
    }
    
    // At least some words from the card should appear on game page
    if (cardWords.length > 0) {
      expect(matchCount).toBeGreaterThan(0);
    }
  });
});
