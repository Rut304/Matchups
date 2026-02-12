import { test, expect, Page } from '@playwright/test';

/**
 * LINK VALIDATION TESTS
 * These tests crawl key pages and verify all links:
 * - Internal links navigate to valid pages
 * - Game links resolve properly (catches the an- issue we just fixed)
 * - No broken 404 links
 */

// Helper to get all unique internal links from a page
async function getInternalLinks(page: Page): Promise<string[]> {
  const links = await page.locator('a[href]').all();
  const hrefs: string[] = [];
  
  for (const link of links) {
    const href = await link.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      // Internal link
      if (!hrefs.includes(href)) {
        hrefs.push(href);
      }
    }
  }
  
  return hrefs;
}

// Helper to check if a URL works
async function checkLink(page: Page, url: string): Promise<{ url: string; status: number; error?: string }> {
  try {
    const response = await page.goto(url, { timeout: 10000 });
    return { url, status: response?.status() || 0 };
  } catch (error) {
    return { url, status: 0, error: String(error) };
  }
}

test.describe('🔗 Internal Link Validation', () => {
  
  test('homepage has no broken internal links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const links = await getInternalLinks(page);
    console.log(`Found ${links.length} unique internal links on homepage`);
    
    const brokenLinks: string[] = [];
    
    // Test each link (limit to first 20 to avoid long test times)
    const linksToTest = links.slice(0, 20);
    
    for (const href of linksToTest) {
      const result = await checkLink(page, href);
      
      if (result.status >= 400 || result.status === 0) {
        brokenLinks.push(`${href} (status: ${result.status})`);
        console.error(`Broken link: ${href} - status ${result.status}`);
      }
    }
    
    expect(brokenLinks, `Found ${brokenLinks.length} broken links: ${brokenLinks.join(', ')}`).toHaveLength(0);
  });

  test('sport pages have no broken game links', async ({ page }) => {
    const sportPages = ['/nba', '/nfl', '/nhl', '/mlb'];
    const brokenLinks: string[] = [];
    
    for (const sport of sportPages) {
      await page.goto(sport);
      await page.waitForLoadState('networkidle');
      
      // Get all game links specifically
      const gameLinks = await page.locator('a[href^="/game/"]').all();
      console.log(`Found ${gameLinks.length} game links on ${sport}`);
      
      // Test first 5 game links per sport
      const linksToTest = gameLinks.slice(0, 5);
      
      for (const link of linksToTest) {
        const href = await link.getAttribute('href');
        if (href) {
          const result = await checkLink(page, href);
          
          if (result.status >= 400) {
            brokenLinks.push(`${sport}: ${href} (status: ${result.status})`);
          }
        }
      }
    }
    
    if (brokenLinks.length > 0) {
      console.error('Broken game links found:', brokenLinks);
    }
    
    expect(brokenLinks).toHaveLength(0);
  });

  test('edge dashboard game links all work', async ({ page }) => {
    await page.goto('/markets/edge');
    await page.waitForLoadState('networkidle');
    
    // Collect hrefs first before navigating (elements become stale after navigation)
    const gameLinks = await page.locator('a[href^="/game/"]').all();
    const hrefs: string[] = [];
    for (const link of gameLinks) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }
    
    console.log(`Found ${hrefs.length} game links on edge dashboard`);
    
    const brokenLinks: string[] = [];
    const linksToTest = hrefs.slice(0, 10);
    
    for (const href of linksToTest) {
      const result = await checkLink(page, href);
      
      // Should not be 404 or 500
      if (result.status >= 400) {
        brokenLinks.push(`${href} (status: ${result.status})`);
      }
      
      // Also verify page content is not error
      if (result.status === 200) {
        const content = await page.locator('body').innerText();
        const isErrorPage = 
          content.toLowerCase().includes('not found') ||
          content.toLowerCase().includes('404') ||
          content.toLowerCase().includes('error loading');
        
        if (isErrorPage) {
          brokenLinks.push(`${href} (soft 404 - shows error content)`);
        }
      }
    }
    
    expect(brokenLinks).toHaveLength(0);
  });
});

test.describe('🎯 Game ID Format Handling', () => {
  
  test('ESPN game IDs resolve correctly', async ({ page }) => {
    // Try a known ESPN format ID pattern
    const response = await page.goto('/game/401772988?sport=nba');
    
    // Should not 500 error
    expect(response?.status()).toBeLessThan(500);
  });

  test('Action Network game IDs resolve correctly', async ({ page }) => {
    // Try the an- prefixed format
    const response = await page.goto('/game/an-267287?sport=nba');
    
    // Should not 500 error
    expect(response?.status()).toBeLessThan(500);
    
    // Page should not show error
    const content = await page.locator('body').innerText();
    expect(content.toLowerCase()).not.toContain('error loading');
  });

  test('invalid game IDs show graceful error', async ({ page }) => {
    const response = await page.goto('/game/invalid-id-12345');
    
    // Should return proper page (200 with error message or 404)
    expect(response?.status()).toBeLessThan(500);
    
    // Should show user-friendly message, not crash
    const content = await page.locator('body').innerText();
    expect(content.toLowerCase()).not.toContain('uncaught');
    expect(content.toLowerCase()).not.toContain('typeerror');
  });
});

test.describe('🧭 Navigation Link Integrity', () => {
  
  test('navbar links all work', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all nav links
    const navLinks = await page.locator('nav a[href], header a[href]').all();
    const hrefs: string[] = [];
    
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/')) {
        hrefs.push(href);
      }
    }
    
    const uniqueHrefs = [...new Set(hrefs)];
    console.log(`Testing ${uniqueHrefs.length} nav links`);
    
    const brokenLinks: string[] = [];
    
    for (const href of uniqueHrefs) {
      const response = await page.goto(href, { timeout: 10000 });
      if (!response || response.status() >= 400) {
        brokenLinks.push(href);
      }
    }
    
    expect(brokenLinks).toHaveLength(0);
  });

  test('footer links all work', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    const footerLinks = await page.locator('footer a[href]').all();
    const hrefs: string[] = [];
    
    for (const link of footerLinks) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/')) {
        hrefs.push(href);
      }
    }
    
    const uniqueHrefs = [...new Set(hrefs)];
    console.log(`Testing ${uniqueHrefs.length} footer links`);
    
    const brokenLinks: string[] = [];
    
    for (const href of uniqueHrefs.slice(0, 15)) { // Limit to 15
      const response = await page.goto(href, { timeout: 10000 });
      if (!response || response.status() >= 400) {
        brokenLinks.push(href);
      }
    }
    
    expect(brokenLinks).toHaveLength(0);
  });
});

test.describe('🔍 Deep Link Validation', () => {
  
  test('profile pages handle missing users gracefully', async ({ page }) => {
    const response = await page.goto('/profile/nonexistent-user-12345');
    
    // Should not 500
    expect(response?.status()).toBeLessThan(500);
    
    // Should show user-friendly message
    const content = await page.locator('body').innerText();
    expect(content.toLowerCase()).not.toContain('uncaught');
  });

  test('player pages handle missing players gracefully', async ({ page }) => {
    const response = await page.goto('/player/nonexistent-player');
    
    expect(response?.status()).toBeLessThan(500);
  });

  test('sport-specific pages handle invalid routes gracefully', async ({ page }) => {
    const invalidRoutes = [
      '/nba/invalid-game',
      '/nfl/nonexistent',
      '/mlb/team/fake-team',
    ];
    
    for (const route of invalidRoutes) {
      const response = await page.goto(route);
      // Should not crash the server
      expect(response?.status()).toBeLessThan(500);
    }
  });
});

test.describe('📊 Leaderboard and Expert Links', () => {
  
  test('expert profile links from leaderboard work', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    
    // Look for profile links
    const profileLinks = await page.locator('a[href^="/profile/"]').all();
    console.log(`Found ${profileLinks.length} profile links`);
    
    if (profileLinks.length === 0) {
      // No profile links is OK if data is loading or empty
      return;
    }
    
    // Test first 3 profile links
    const linksToTest = profileLinks.slice(0, 3);
    
    for (const link of linksToTest) {
      const href = await link.getAttribute('href');
      if (href) {
        const response = await page.goto(href);
        expect(response?.status()).toBeLessThan(400);
        
        // Should show profile content
        const content = await page.locator('body').innerText();
        expect(content.toLowerCase()).not.toContain('not found');
      }
    }
  });
});
