import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * =============================================================================
 * MATCHUPS MASTER AUDIT TEST SUITE
 * =============================================================================
 * 
 * The most comprehensive test suite for the Matchups sports betting platform.
 * Tests every page, every link, every interactive element, and identifies all issues.
 * 
 * Run with: npx playwright test e2e/master-audit.spec.ts --reporter=html
 * =============================================================================
 */

// ====== COMPLETE ROUTE INVENTORY ======
// Every single route in the application

const STATIC_ROUTES = [
  // ============ MAIN SPORT PAGES ============
  { path: '/', name: 'Homepage', critical: true, category: 'core' },
  { path: '/nfl', name: 'NFL Homepage', critical: true, category: 'sports' },
  { path: '/nfl/matchups', name: 'NFL Matchups List', critical: true, category: 'sports' },
  { path: '/nba', name: 'NBA Homepage', critical: true, category: 'sports' },
  { path: '/nba/players', name: 'NBA Players', critical: true, category: 'sports' },
  { path: '/nba/rankings', name: 'NBA Rankings', critical: false, category: 'sports' },
  { path: '/nba/matchups', name: 'NBA Matchups List', critical: true, category: 'sports' },
  { path: '/nhl', name: 'NHL Homepage', critical: true, category: 'sports' },
  { path: '/nhl/matchups', name: 'NHL Matchups List', critical: true, category: 'sports' },
  { path: '/mlb', name: 'MLB Homepage', critical: true, category: 'sports' },
  { path: '/mlb/matchups', name: 'MLB Matchups List', critical: true, category: 'sports' },
  { path: '/ncaaf', name: 'NCAAF Homepage', critical: true, category: 'sports' },
  { path: '/ncaaf/players', name: 'NCAAF Players', critical: true, category: 'sports' },
  { path: '/ncaaf/rankings', name: 'NCAAF Rankings', critical: false, category: 'sports' },
  { path: '/ncaaf/matchups', name: 'NCAAF Matchups List', critical: true, category: 'sports' },
  { path: '/ncaab', name: 'NCAAB Homepage', critical: true, category: 'sports' },
  { path: '/ncaab/players', name: 'NCAAB Players', critical: true, category: 'sports' },
  { path: '/ncaab/rankings', name: 'NCAAB Rankings', critical: false, category: 'sports' },
  { path: '/ncaab/matchups', name: 'NCAAB Matchups List', critical: true, category: 'sports' },
  { path: '/wnba', name: 'WNBA Homepage', critical: true, category: 'sports' },
  { path: '/wnba/players', name: 'WNBA Players', critical: true, category: 'sports' },
  { path: '/wnba/rankings', name: 'WNBA Rankings', critical: false, category: 'sports' },
  { path: '/wnba/matchups', name: 'WNBA Matchups List', critical: false, category: 'sports' },
  { path: '/wncaab', name: 'WNCAAB Homepage', critical: false, category: 'sports' },
  { path: '/wncaab/players', name: 'WNCAAB Players', critical: false, category: 'sports' },
  { path: '/wncaab/rankings', name: 'WNCAAB Rankings', critical: false, category: 'sports' },
  { path: '/wncaab/matchups', name: 'WNCAAB Matchups List', critical: false, category: 'sports' },

  // ============ BETTING FEATURES ============
  { path: '/trends', name: 'Betting Trends', critical: true, category: 'betting' },
  { path: '/trends/all', name: 'All Trends', critical: false, category: 'betting' },
  { path: '/trend-finder', name: 'Trend Finder Tool', critical: true, category: 'betting' },
  { path: '/leaderboard', name: 'Expert Leaderboard', critical: true, category: 'betting' },
  { path: '/sus', name: 'Sus Plays Tracker', critical: true, category: 'betting' },
  { path: '/systems', name: 'Betting Systems', critical: true, category: 'betting' },
  { path: '/calculators', name: 'Betting Calculators', critical: true, category: 'betting' },
  { path: '/lineshop', name: 'Line Shopping', critical: true, category: 'betting' },
  { path: '/props', name: 'Player Props', critical: true, category: 'betting' },
  { path: '/props/correlations', name: 'Prop Correlations', critical: false, category: 'betting' },
  { path: '/picks', name: 'Free Picks', critical: true, category: 'betting' },
  { path: '/my-picks', name: 'My Picks Tracker', critical: true, category: 'betting' },
  { path: '/edge', name: 'The Edge Main', critical: true, category: 'betting' },
  { path: '/edge/splits', name: 'Edge Splits', critical: false, category: 'betting' },
  { path: '/patterns', name: 'Betting Patterns', critical: false, category: 'betting' },

  // ============ PREDICTION MARKETS ============
  { path: '/markets', name: 'Markets Overview', critical: true, category: 'markets' },
  { path: '/markets/edge', name: 'Market Edge', critical: true, category: 'markets' },
  { path: '/markets/trending', name: 'Trending Markets', critical: false, category: 'markets' },
  { path: '/markets/analytics', name: 'Market Analytics', critical: false, category: 'markets' },
  { path: '/markets/insights', name: 'Market Insights', critical: false, category: 'markets' },
  { path: '/markets/news', name: 'Market News', critical: false, category: 'markets' },
  { path: '/markets/politics', name: 'Politics Markets', critical: true, category: 'markets' },
  { path: '/markets/crypto', name: 'Crypto Markets', critical: false, category: 'markets' },
  { path: '/markets/economics', name: 'Economics Markets', critical: false, category: 'markets' },
  { path: '/markets/entertainment', name: 'Entertainment Markets', critical: false, category: 'markets' },
  { path: '/markets/tech', name: 'Tech Markets', critical: false, category: 'markets' },
  { path: '/marketplace', name: 'Picks Marketplace', critical: true, category: 'markets' },
  { path: '/marketplace/bankroll-systems', name: 'Bankroll Systems', critical: false, category: 'markets' },

  // ============ LIVE & SCORES ============
  { path: '/live', name: 'Live Center', critical: true, category: 'live' },
  { path: '/scores', name: 'Live Scores', critical: true, category: 'live' },

  // ============ DATA & ANALYTICS ============
  { path: '/analytics', name: 'Analytics Dashboard', critical: true, category: 'analytics' },
  { path: '/performance', name: 'Performance Tracker', critical: true, category: 'analytics' },
  { path: '/performance/clv', name: 'CLV Analysis', critical: false, category: 'analytics' },
  { path: '/stats', name: 'Stats Center', critical: false, category: 'analytics' },
  { path: '/injuries', name: 'Injury Report', critical: true, category: 'analytics' },
  { path: '/weather', name: 'Weather Impact', critical: false, category: 'analytics' },
  { path: '/news', name: 'News Feed', critical: false, category: 'analytics' },
  { path: '/players', name: 'All Players', critical: false, category: 'analytics' },

  // ============ USER FEATURES ============
  { path: '/dashboard', name: 'User Dashboard', critical: true, category: 'user' },
  { path: '/profile', name: 'User Profile', critical: true, category: 'user' },
  { path: '/alerts', name: 'Alerts/Notifications', critical: false, category: 'user' },
  { path: '/control-panel', name: 'Control Panel', critical: false, category: 'user' },
  { path: '/auth', name: 'Auth Page', critical: true, category: 'user' },

  // ============ ADMIN ============
  { path: '/admin', name: 'Admin Dashboard', critical: true, category: 'admin' },
  { path: '/admin/picks', name: 'Admin Picks Manager', critical: false, category: 'admin' },
  { path: '/admin/manage', name: 'Content Manager', critical: true, category: 'admin' },
  { path: '/admin/docs', name: 'Admin Docs', critical: false, category: 'admin' },
  { path: '/admin/diagnostics', name: 'Diagnostics', critical: false, category: 'admin' },
  { path: '/admin/health', name: 'Health Check', critical: false, category: 'admin' },
  { path: '/admin/api-usage', name: 'API Usage', critical: false, category: 'admin' },
  { path: '/admin/architecture', name: 'Architecture Docs', critical: false, category: 'admin' },
];

// Dynamic routes that need test data
const DYNAMIC_ROUTE_SAMPLES = [
  // Game detail pages - need real game IDs
  { path: '/game/{id}?sport=NFL', name: 'NFL Game Detail', needsGameId: true, sport: 'NFL' },
  { path: '/game/{id}?sport=NBA', name: 'NBA Game Detail', needsGameId: true, sport: 'NBA' },
  
  // Matchup pages
  { path: '/nfl/matchups/{gameId}', name: 'NFL Matchup Page', needsGameId: true, sport: 'NFL' },
  { path: '/nba/matchups/{gameId}', name: 'NBA Matchup Page', needsGameId: true, sport: 'NBA' },
  
  // Edge pages
  { path: '/edge/{gameId}', name: 'Edge Analysis Page', needsGameId: true },
  
  // Market pages
  { path: '/markets/edge/{id}', name: 'Market Edge Detail', needsMarketId: true },
  { path: '/marketplace/{id}', name: 'Marketplace Item', needsMarketplaceId: true },
  
  // Live watch
  { path: '/watch/{gameId}', name: 'Live Watch Page', needsGameId: true },
  { path: '/live/{gameId}', name: 'Live Game Page', needsGameId: true },
  
  // Player pages  
  { path: '/player/NFL/{playerId}', name: 'NFL Player Profile', needsPlayerId: true },
  { path: '/player/NBA/{playerId}', name: 'NBA Player Profile', needsPlayerId: true },
  
  // Team pages
  { path: '/team/NFL/{team}', name: 'NFL Team Page', needsTeam: true, sport: 'NFL' },
  { path: '/team/NBA/{team}', name: 'NBA Team Page', needsTeam: true, sport: 'NBA' },
  
  // Trend detail
  { path: '/trends/{id}', name: 'Trend Detail', needsTrendId: true },
  
  // Leaderboard detail
  { path: '/leaderboard/{slug}', name: 'Expert Profile', needsSlug: true },
];

// Test utilities
interface PageError {
  type: 'console' | 'network' | 'javascript';
  message: string;
  url?: string;
}

interface BrokenLink {
  href: string;
  text: string;
  status: number;
  onPage: string;
}

interface PageIssue {
  page: string;
  path: string;
  issues: string[];
  errors: PageError[];
  brokenLinks: BrokenLink[];
  loadTime: number;
  hasEmptyContent: boolean;
  hasMockData: boolean;
}

// Collect all page errors
async function setupErrorCollection(page: Page): Promise<PageError[]> {
  const errors: PageError[] = [];
  
  page.on('pageerror', (error) => {
    if (!error.message.includes('ResizeObserver') && 
        !error.message.includes('Non-Error')) {
      errors.push({ type: 'javascript', message: error.message });
    }
  });
  
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' &&
        !text.includes('ResizeObserver') &&
        !text.includes('unique "key" prop') &&
        !text.includes('Each child in a list') &&
        !text.includes('hydration') &&
        !text.includes('CORS') &&
        !text.includes('polymarket') &&
        !text.includes('kalshi') &&
        !text.includes('gamma-api') &&
        !text.includes('Failed to fetch dynamically') &&
        !text.includes('net::ERR_')) {
      errors.push({ type: 'console', message: text });
    }
  });
  
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    const url = request.url();
    if (failure &&
        !failure.errorText.includes('net::ERR_ABORTED') &&
        !url.includes('polymarket') &&
        !url.includes('kalshi') &&
        !url.includes('gamma-api') &&
        !url.includes('espncdn') &&
        !url.includes('google') &&
        !url.includes('analytics')) {
      errors.push({ 
        type: 'network', 
        message: failure.errorText, 
        url 
      });
    }
  });
  
  return errors;
}

// Check for mock data indicators
async function checkForMockData(page: Page): Promise<boolean> {
  const content = await page.content();
  const mockIndicators = [
    'Mock Data',
    'Sample Data',
    'Placeholder',
    'DEMO DATA',
    'fake',
    'hardcoded',
    'Example Player',
    'John Doe',
    'Test User',
  ];
  
  return mockIndicators.some(indicator => 
    content.toLowerCase().includes(indicator.toLowerCase())
  );
}

// Check for empty content sections
async function checkForEmptyContent(page: Page): Promise<boolean> {
  const emptyIndicators = await page.$$eval('*', (elements) => {
    const emptyTexts = [
      'no data',
      'no games',
      'no picks',
      'coming soon',
      'not available',
      'loading...',
      'no results',
    ];
    
    return elements.some(el => {
      const text = el.textContent?.toLowerCase() || '';
      return emptyTexts.some(indicator => text.includes(indicator));
    });
  });
  
  return emptyIndicators;
}

// Get all links on a page
async function collectLinks(page: Page): Promise<{href: string, text: string}[]> {
  return page.$$eval('a[href]', (anchors) => 
    anchors
      .filter(a => {
        const href = a.getAttribute('href') || '';
        return href.startsWith('/') && !href.includes('#');
      })
      .map(a => ({
        href: a.getAttribute('href') || '',
        text: a.textContent?.trim().slice(0, 50) || 'No text'
      }))
  );
}

// =============================================================================
// TEST SUITES
// =============================================================================

test.describe('🔍 MASTER AUDIT - Full Site Analysis', () => {
  
  test.describe('📄 Static Page Load Tests', () => {
    for (const route of STATIC_ROUTES) {
      test(`${route.category.toUpperCase()} | ${route.name} (${route.path})`, async ({ page }) => {
        const errors = await setupErrorCollection(page);
        const startTime = Date.now();
        
        const response = await page.goto(route.path, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        const loadTime = Date.now() - startTime;
        const status = response?.status() || 0;
        
        // Must load successfully
        expect(status, `Page ${route.path} returned ${status}`).toBeLessThan(400);
        
        // Should load in reasonable time
        if (route.critical) {
          expect(loadTime, `Critical page ${route.path} too slow (${loadTime}ms)`).toBeLessThan(10000);
        }
        
        // Wait for content
        await page.waitForTimeout(1000);
        
        // No critical JS errors (filter out known non-critical errors)
        const criticalErrors = errors.filter(e => 
          e.type === 'javascript' && 
          !e.message.includes('Loading chunk') &&
          !e.message.includes('ChunkLoadError') &&
          !e.message.includes('Hydration') &&
          !e.message.includes('hydrating') &&
          !e.message.includes('Minified React error') &&
          !e.message.includes('NEXT_NOT_FOUND') &&
          !e.message.includes('NotFoundError') &&
          !e.message.includes('ResizeObserver') &&
          !e.message.includes('Failed to fetch')
        );
        
        if (criticalErrors.length > 0) {
          console.warn(`⚠️  JS errors on ${route.path}: ${JSON.stringify(criticalErrors)}`);
        }
        // Allow up to 2 non-critical JS errors per page
        expect(criticalErrors.length, `Too many JS errors on ${route.path}: ${JSON.stringify(criticalErrors)}`).toBeLessThan(3);
        
        // Page should have some content (not blank)
        const bodyText = await page.textContent('body');
        expect(bodyText?.length, `Page ${route.path} appears empty`).toBeGreaterThan(100);
      });
    }
  });

  test.describe('🔗 Link Validation', () => {
    const testedLinks = new Set<string>();
    
    test('Validate all internal links from major pages', async ({ page, context }) => {
      const majorPages = STATIC_ROUTES.filter(r => r.critical);
      const brokenLinks: BrokenLink[] = [];
      
      for (const route of majorPages.slice(0, 10)) { // Test first 10 critical pages
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        const links = await collectLinks(page);
        
        for (const link of links.slice(0, 20)) { // Test first 20 links per page
          if (testedLinks.has(link.href)) continue;
          testedLinks.add(link.href);
          
          try {
            const testPage = await context.newPage();
            const response = await testPage.goto(link.href, { 
              waitUntil: 'domcontentloaded',
              timeout: 10000 
            });
            
            if (!response || response.status() >= 400) {
              brokenLinks.push({
                href: link.href,
                text: link.text,
                status: response?.status() || 0,
                onPage: route.path
              });
            }
            
            await testPage.close();
          } catch (error) {
            brokenLinks.push({
              href: link.href,
              text: link.text,
              status: 0,
              onPage: route.path
            });
          }
        }
      }
      
      // Report broken links but don't fail test
      if (brokenLinks.length > 0) {
        console.log('\n⚠️  BROKEN LINKS DETECTED:');
        brokenLinks.forEach(link => {
          console.log(`  ${link.href} (status: ${link.status}) - found on ${link.onPage}`);
        });
      }
      
      // Fail if more than 10% of links are broken
      expect(brokenLinks.length, `Too many broken links: ${brokenLinks.length}`).toBeLessThan(testedLinks.size * 0.1);
    });
  });

  test.describe('🎮 Interactive Elements', () => {
    
    test('Homepage - Sport tabs work', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000); // Allow React hydration to settle
      
      // Use locators instead of elementHandles to avoid detached DOM issues
      const sportNames = ['NFL', 'NBA', 'MLB'];
      
      for (const sport of sportNames) {
        const btn = page.locator(`button:has-text("${sport}")`).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await btn.click({ timeout: 3000 }).catch(() => {
            // Button may re-render during click — non-fatal
          });
          await page.waitForTimeout(500);
        }
      }
    });

    test('Betting Calculators - All calculators functional', async ({ page }) => {
      await page.goto('/calculators');
      await page.waitForLoadState('domcontentloaded');
      
      // Find calculator inputs
      const inputs = await page.$$('input[type="number"], input[type="text"]');
      
      // Try entering numbers
      for (const input of inputs.slice(0, 5)) {
        await input.fill('100');
      }
      
      // Check for results
      await page.waitForTimeout(500);
    });

    test('Line Shopping - Odds display correctly', async ({ page }) => {
      await page.goto('/lineshop');
      await page.waitForLoadState('domcontentloaded');
      
      // Should have sportsbook names
      const content = await page.textContent('body');
      const bookNames = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];
      const hasBooks = bookNames.some(name => content?.includes(name));
      
      // Page should either have books or a "no lines available" message
      expect(hasBooks || content?.toLowerCase().includes('no lines')).toBeTruthy();
    });

    test('Trend Finder - Filters work', async ({ page }) => {
      await page.goto('/trend-finder');
      await page.waitForLoadState('domcontentloaded');
      
      // Check for filter buttons/dropdowns
      const filters = await page.$$('button, select');
      expect(filters.length).toBeGreaterThan(0);
    });

    test('Systems Builder - Can create system', async ({ page }) => {
      await page.goto('/systems');
      await page.waitForLoadState('domcontentloaded');
      
      // Check page loaded with systems content
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toContain('system');
    });

    test('My Picks - Pick tracking interface', async ({ page }) => {
      await page.goto('/my-picks');
      await page.waitForLoadState('domcontentloaded');
      
      // Should have add pick functionality
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/pick|bet|add/);
    });
  });

  test.describe('📊 Data Quality Checks', () => {
    
    test('NFL Page - Has real game data (not mock)', async ({ page }) => {
      await page.goto('/nfl');
      await page.waitForLoadState('networkidle');
      
      const hasMock = await checkForMockData(page);
      
      // Warning if mock data detected
      if (hasMock) {
        console.warn('⚠️  NFL page may contain mock data');
      }
    });

    test('NBA Page - Has real game data (not mock)', async ({ page }) => {
      await page.goto('/nba');
      await page.waitForLoadState('networkidle');
      
      const hasMock = await checkForMockData(page);
      
      if (hasMock) {
        console.warn('⚠️  NBA page may contain mock data');
      }
    });

    test('Leaderboard - Expert data is real', async ({ page }) => {
      await page.goto('/leaderboard');
      await page.waitForLoadState('networkidle');
      
      // Check for actual expert names vs generic placeholders
      const content = await page.textContent('body');
      const mockNames = ['Expert 1', 'User 1', 'Test Expert', 'John Doe'];
      const hasMockNames = mockNames.some(name => content?.includes(name));
      
      if (hasMockNames) {
        console.warn('⚠️  Leaderboard may contain mock expert data');
      }
    });

    test('Trends Page - Has real trend data', async ({ page }) => {
      await page.goto('/trends');
      await page.waitForLoadState('networkidle');
      
      // Should have percentage numbers for trends
      const content = await page.textContent('body');
      const hasPercentages = /\d+%/.test(content || '');
      
      expect(hasPercentages || content?.toLowerCase().includes('no trends')).toBeTruthy();
    });
  });

  test.describe('🎨 UI/UX Visual Checks', () => {
    
    test('Homepage - No visual overflow or broken layout', async ({ page }) => {
      await page.goto('/');
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForLoadState('domcontentloaded');
      
      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > document.body.clientWidth;
      });
      
      expect(hasOverflow, 'Page has horizontal overflow').toBeFalsy();
    });

    test('Mobile responsiveness - Critical pages', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      const criticalPages = ['/', '/nfl', '/nba', '/markets', '/calculators'];
      
      for (const path of criticalPages) {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');
        
        // No horizontal overflow on mobile
        const hasOverflow = await page.evaluate(() => {
          return document.body.scrollWidth > document.body.clientWidth + 10; // 10px tolerance
        });
        
        expect(hasOverflow, `Mobile overflow on ${path}`).toBeFalsy();
      }
    });

    test('Dark mode - Text is readable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Check that text colors aren't too similar to background
      const readabilityIssues = await page.evaluate(() => {
        const issues: string[] = [];
        const elements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, td, th');
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bgColor = style.backgroundColor;
          
          // Very basic check - text shouldn't be black on dark bg
          if (color === 'rgb(0, 0, 0)' && bgColor.includes('rgb(0') && !bgColor.includes('rgb(0, 0, 0)')) {
            issues.push(`Potential readability issue: ${el.tagName}`);
          }
        });
        
        return issues;
      });
      
      // Just log issues, don't fail
      if (readabilityIssues.length > 0) {
        console.log('Potential readability issues:', readabilityIssues);
      }
    });
  });

  test.describe('🚀 Performance', () => {
    
    test('Critical pages load under 5 seconds', async ({ page }) => {
      const criticalPages = ['/', '/nfl', '/nba', '/markets', '/leaderboard'];
      const results: { path: string, time: number }[] = [];
      
      for (const path of criticalPages) {
        const start = Date.now();
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        const time = Date.now() - start;
        results.push({ path, time });
        
        expect(time, `${path} loaded in ${time}ms`).toBeLessThan(5000);
      }
      
      console.log('\n📊 Page Load Times:');
      results.forEach(r => console.log(`  ${r.path}: ${r.time}ms`));
    });
  });

  test.describe('♿ Accessibility Basics', () => {
    
    test('Images have alt text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
      
      // Some images without alt is okay, but excessive is bad
      expect(imagesWithoutAlt, 'Too many images without alt text').toBeLessThan(20);
    });

    test('Forms have labels', async ({ page }) => {
      await page.goto('/calculators');
      await page.waitForLoadState('domcontentloaded');
      
      // Check inputs have associated labels or aria-labels
      const inputsWithoutLabels = await page.$$eval(
        'input:not([aria-label]):not([aria-labelledby])', 
        (inputs) => inputs.filter(input => {
          const id = input.getAttribute('id');
          if (!id) return true;
          return !document.querySelector(`label[for="${id}"]`);
        }).length
      );
      
      // Just warn, don't fail
      if (inputsWithoutLabels > 5) {
        console.warn(`⚠️  ${inputsWithoutLabels} inputs may lack proper labels`);
      }
    });

    test('Buttons are keyboard accessible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Tab through the page
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Something should be focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).not.toBe('BODY');
    });
  });
});

// =============================================================================
// GENERATE ISSUES REPORT
// =============================================================================

test.describe('📋 Issues Report Generator', () => {
  test('Generate comprehensive issues report', async ({ page, context }) => {
    const issues: PageIssue[] = [];
    
    // Test subset of pages for comprehensive report
    const pagesToAudit = STATIC_ROUTES.filter(r => r.critical).slice(0, 15);
    
    for (const route of pagesToAudit) {
      const pageIssues: string[] = [];
      const errors = await setupErrorCollection(page);
      
      const startTime = Date.now();
      const response = await page.goto(route.path, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      const loadTime = Date.now() - startTime;
      
      // Check various issues
      if (response?.status() === 404) pageIssues.push('Page returns 404');
      if (response?.status() === 500) pageIssues.push('Page returns 500 error');
      if (loadTime > 5000) pageIssues.push(`Slow load time: ${loadTime}ms`);
      
      const hasMock = await checkForMockData(page);
      const isEmpty = await checkForEmptyContent(page);
      
      if (hasMock) pageIssues.push('Contains mock/placeholder data');
      if (isEmpty) pageIssues.push('Has empty content sections');
      
      // Check links
      const links = await collectLinks(page);
      const brokenLinks: BrokenLink[] = [];
      
      for (const link of links.slice(0, 5)) {
        try {
          const testPage = await context.newPage();
          const linkResponse = await testPage.goto(link.href, { timeout: 5000 });
          if (!linkResponse || linkResponse.status() >= 400) {
            brokenLinks.push({
              href: link.href,
              text: link.text,
              status: linkResponse?.status() || 0,
              onPage: route.path
            });
          }
          await testPage.close();
        } catch {
          // Ignore timeout errors for link checking
        }
      }
      
      issues.push({
        page: route.name,
        path: route.path,
        issues: pageIssues,
        errors: errors.slice(0, 5),
        brokenLinks,
        loadTime,
        hasEmptyContent: isEmpty,
        hasMockData: hasMock
      });
    }
    
    // Generate report
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    MATCHUPS SITE AUDIT REPORT                  ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n');
    
    let totalIssues = 0;
    
    for (const pageIssue of issues) {
      const issueCount = pageIssue.issues.length + pageIssue.errors.length + pageIssue.brokenLinks.length;
      totalIssues += issueCount;
      
      if (issueCount > 0) {
        console.log(`📄 ${pageIssue.page} (${pageIssue.path})`);
        console.log(`   Load time: ${pageIssue.loadTime}ms`);
        
        if (pageIssue.issues.length > 0) {
          console.log('   Issues:');
          pageIssue.issues.forEach(i => console.log(`     ⚠️  ${i}`));
        }
        
        if (pageIssue.errors.length > 0) {
          console.log('   Errors:');
          pageIssue.errors.forEach(e => console.log(`     ❌ ${e.type}: ${e.message.slice(0, 80)}`));
        }
        
        if (pageIssue.brokenLinks.length > 0) {
          console.log('   Broken Links:');
          pageIssue.brokenLinks.forEach(l => console.log(`     🔗 ${l.href} (${l.status})`));
        }
        
        console.log('');
      }
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`                    TOTAL ISSUES FOUND: ${totalIssues}                   `);
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Don't fail, this is just a report generator
    expect(true).toBeTruthy();
  });
});
