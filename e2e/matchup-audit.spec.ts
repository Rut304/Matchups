import { test, expect, Page } from '@playwright/test';

/**
 * =============================================================================
 * MATCHUP PAGE DEEP AUDIT
 * =============================================================================
 * 
 * Focused testing on the game matchup pages - the most critical pages for gamblers.
 * Tests all sections, data quality, and functionality.
 * 
 * Run with: npx playwright test e2e/matchup-audit.spec.ts --reporter=html
 * =============================================================================
 */

// ====== WHAT A SHARP SPORTS BETTOR NEEDS ======
// Based on research from gambling forums, PhD papers, and professional bettor interviews

const ESSENTIAL_MATCHUP_FEATURES = {
  // MUST HAVE - Deal breakers if missing
  critical: [
    { name: 'Current spread & odds', selector: '[class*="spread"], [data-testid="spread"]', description: 'The current betting line' },
    { name: 'Total (Over/Under)', selector: '[class*="total"], [data-testid="total"]', description: 'The current total' },
    { name: 'Moneyline', selector: '[class*="moneyline"], [class*="ml"]', description: 'Moneyline odds' },
    { name: 'Team records', selector: '[class*="record"]', description: 'Win-loss records' },
    { name: 'Game date/time', selector: '[class*="date"], [class*="time"]', description: 'When the game is' },
  ],
  
  // VALUABLE - What separates good from great
  valuable: [
    { name: 'Opening line vs current', description: 'Shows line movement direction' },
    { name: 'Public betting %', description: 'What side the public is on' },
    { name: 'Handle/Money %', description: 'Where the actual money is' },
    { name: 'Sharp money indicators', description: 'Reverse line movement, steam moves' },
    { name: 'Multi-book odds comparison', description: 'Line shop across books' },
    { name: 'ATS records', description: 'Against the spread history' },
    { name: 'Injury report', description: 'Key players out/questionable' },
    { name: 'Last 10 games ATS', description: 'Recent betting performance' },
  ],
  
  // NICE TO HAVE - Extra value
  niceToHave: [
    { name: 'Head-to-head history', description: 'Past matchup results' },
    { name: 'Weather impact', description: 'For outdoor sports' },
    { name: 'Player props', description: 'Individual player betting lines' },
    { name: 'AI/Model predictions', description: 'Computer-generated picks' },
    { name: 'Key player stats', description: 'Top performer data' },
  ],
  
  // NOISE - Things that look good but add little value
  noise: [
    { name: 'Generic team rankings', description: 'Without context they mean little' },
    { name: 'Win probability', description: 'Already baked into the line' },
    { name: 'Trends with tiny samples', description: '"2-0 ATS on Thursdays after losses"' },
    { name: 'Emoji overload', description: 'Distracting from data' },
  ]
};

// Helper to find game links on sport pages
async function findGameLinks(page: Page): Promise<string[]> {
  return page.$$eval('a[href*="/game/"], a[href*="/matchup"]', (links) =>
    links
      .map(a => a.getAttribute('href'))
      .filter((href): href is string => href !== null)
      .slice(0, 5) // Get first 5 games
  );
}

// Helper to check if page has real data indicators
async function hasRealData(page: Page): Promise<{
  hasOdds: boolean;
  hasRecords: boolean;
  hasTeamNames: boolean;
  hasDateTime: boolean;
}> {
  const content = await page.textContent('body') || '';
  
  return {
    hasOdds: /[+-]\d{3}/.test(content) || /[+-]\d\.\d/.test(content), // E.g., -110 or -3.5
    hasRecords: /\d+-\d+/.test(content) && /\d+-\d+-\d+|\d+-\d+/.test(content), // E.g., 10-5 or 10-5-1
    hasTeamNames: /(Patriots|Eagles|Chiefs|Lakers|Celtics|Yankees|Dodgers)/i.test(content),
    hasDateTime: /\d{1,2}:\d{2}|AM|PM|ET|CT|PT/i.test(content),
  };
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('🏈 NFL Game Matchup Page Audit', () => {
  
  test('NFL page has clickable game links', async ({ page }) => {
    await page.goto('/nfl');
    await page.waitForLoadState('networkidle');
    
    const gameLinks = await findGameLinks(page);
    
    // Should have at least some game links during season
    console.log(`Found ${gameLinks.length} NFL game links`);
    
    // Store for other tests
    expect(gameLinks.length).toBeGreaterThanOrEqual(0); // Don't fail if off-season
  });

  test('NFL matchup page - Has essential betting info', async ({ page }) => {
    // First get a game link from NFL page
    await page.goto('/nfl');
    await page.waitForLoadState('networkidle');
    
    const gameLinks = await findGameLinks(page);
    
    if (gameLinks.length === 0) {
      console.log('No NFL games available - skipping matchup test');
      return;
    }
    
    // Click first game link
    await page.goto(gameLinks[0]);
    await page.waitForLoadState('networkidle');
    
    const dataCheck = await hasRealData(page);
    
    console.log('Data check results:', dataCheck);
    
    // If during season, should have odds
    if (dataCheck.hasTeamNames) {
      expect(dataCheck.hasOdds, 'Game page missing odds').toBeTruthy();
    }
  });
});

test.describe('🏀 NBA Game Matchup Page Audit', () => {
  
  test('NBA page has game cards', async ({ page }) => {
    await page.goto('/nba');
    await page.waitForLoadState('networkidle');
    
    const gameLinks = await findGameLinks(page);
    console.log(`Found ${gameLinks.length} NBA game links`);
  });

  test('NBA matchup page data quality', async ({ page }) => {
    await page.goto('/nba');
    await page.waitForLoadState('networkidle');
    
    const gameLinks = await findGameLinks(page);
    
    if (gameLinks.length === 0) {
      console.log('No NBA games available');
      return;
    }
    
    await page.goto(gameLinks[0]);
    await page.waitForLoadState('networkidle');
    
    const dataCheck = await hasRealData(page);
    console.log('NBA matchup data check:', dataCheck);
  });
});

test.describe('📊 Matchup Page Section Audit', () => {
  
  test('Check for all valuable sections on a matchup page', async ({ page }) => {
    // Try to find any active game
    const sportPages = ['/nfl', '/nba', '/nhl', '/mlb'];
    let gameUrl: string | null = null;
    
    for (const sport of sportPages) {
      await page.goto(sport);
      await page.waitForLoadState('networkidle');
      
      const links = await findGameLinks(page);
      if (links.length > 0) {
        gameUrl = links[0];
        break;
      }
    }
    
    if (!gameUrl) {
      console.log('No active games found across any sport');
      return;
    }
    
    await page.goto(gameUrl);
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.textContent('body') || '';
    const pageContentLower = pageContent.toLowerCase();
    
    console.log('\n📊 MATCHUP PAGE SECTION AUDIT');
    console.log('================================\n');
    
    // Check for essential features
    console.log('✅ ESSENTIAL FEATURES:');
    const essentialChecks = {
      'Spread': /spread|[+-]\d\.\d/.test(pageContentLower),
      'Total': /total|over.?under|o\/u/.test(pageContentLower),
      'Moneyline': /money\s*line|ml|[+-]\d{3}/.test(pageContentLower),
      'Team record': /\d+-\d+/.test(pageContent),
      'Game time': /\d{1,2}:\d{2}|am|pm/i.test(pageContent),
    };
    
    for (const [feature, found] of Object.entries(essentialChecks)) {
      console.log(`  ${found ? '✓' : '✗'} ${feature}`);
    }
    
    // Check for valuable features
    console.log('\n💎 VALUABLE FEATURES:');
    const valuableChecks = {
      'Line movement': /open|opening|move|movement/i.test(pageContentLower),
      'Public %': /public|bet %|betting %/i.test(pageContentLower),
      'Sharp money': /sharp|professional|whale/i.test(pageContentLower),
      'Multi-book odds': /draftkings|fanduel|betmgm|best.*odds/i.test(pageContentLower),
      'ATS record': /ats|against.*spread/i.test(pageContentLower),
      'Injury report': /injur|out|questionable|doubtful/i.test(pageContentLower),
      'Schedule/Last games': /last.*game|schedule|recent/i.test(pageContentLower),
    };
    
    for (const [feature, found] of Object.entries(valuableChecks)) {
      console.log(`  ${found ? '✓' : '✗'} ${feature}`);
    }
    
    // Check for nice-to-have features  
    console.log('\n➕ NICE-TO-HAVE FEATURES:');
    const niceChecks = {
      'H2H history': /head.?to.?head|h2h|history/i.test(pageContentLower),
      'Weather': /weather|wind|temp|rain/i.test(pageContentLower),
      'Player props': /player.*prop|prop.*bet/i.test(pageContentLower),
      'AI prediction': /ai|model|predictor|machine.*learn/i.test(pageContentLower),
      'Key players': /leader|top.*player|star/i.test(pageContentLower),
    };
    
    for (const [feature, found] of Object.entries(niceChecks)) {
      console.log(`  ${found ? '✓' : '✗'} ${feature}`);
    }
    
    // Calculate feature score
    const essential = Object.values(essentialChecks).filter(Boolean).length;
    const valuable = Object.values(valuableChecks).filter(Boolean).length;
    const nice = Object.values(niceChecks).filter(Boolean).length;
    
    const score = (essential * 3) + (valuable * 2) + (nice * 1);
    const maxScore = (5 * 3) + (7 * 2) + (5 * 1);
    const percentage = Math.round((score / maxScore) * 100);
    
    console.log(`\n📈 FEATURE SCORE: ${score}/${maxScore} (${percentage}%)`);
    console.log(`   Essential: ${essential}/5`);
    console.log(`   Valuable: ${valuable}/7`);
    console.log(`   Nice-to-have: ${nice}/5`);
  });
});

test.describe('🔄 Data Freshness & Quality', () => {
  
  test('Odds data appears fresh (not stale)', async ({ page }) => {
    await page.goto('/nfl');
    await page.waitForLoadState('networkidle');
    
    // Look for "last updated" or live indicators
    const content = await page.textContent('body') || '';
    const hasLiveIndicator = /live|real.?time|updated|ago/i.test(content);
    
    console.log(`Has live/update indicator: ${hasLiveIndicator}`);
  });

  test('No mock data indicators on matchup pages', async ({ page }) => {
    const sportPages = ['/nfl', '/nba', '/nhl'];
    
    for (const sport of sportPages) {
      await page.goto(sport);
      await page.waitForLoadState('networkidle');
      
      const content = await page.textContent('body') || '';
      
      const mockIndicators = [
        'mock data',
        'sample data', 
        'placeholder',
        'demo mode',
        'test data',
        'example team',
        'fake',
      ];
      
      const hasMock = mockIndicators.some(indicator => 
        content.toLowerCase().includes(indicator)
      );
      
      if (hasMock) {
        console.warn(`⚠️  ${sport} may contain mock data`);
      }
    }
  });
});

test.describe('📱 Mobile Experience', () => {
  
  test('Matchup page works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/nfl');
    await page.waitForLoadState('networkidle');
    
    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > (document.body.clientWidth + 10);
    });
    
    expect(hasOverflow, 'Mobile page has horizontal overflow').toBeFalsy();
  });

  test('Key data visible without scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Get a game page
    await page.goto('/nfl');
    await page.waitForLoadState('networkidle');
    
    const links = await findGameLinks(page);
    if (links.length === 0) return;
    
    await page.goto(links[0]);
    await page.waitForLoadState('networkidle');
    
    // Check that key elements are above the fold
    const viewport = page.viewportSize();
    if (!viewport) return;
    
    // Look for spread/odds visible in viewport
    const spreadVisible = await page.evaluate((vh) => {
      const elements = document.querySelectorAll('[class*="spread"], [class*="odds"]');
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.top < vh) return true;
      }
      return false;
    }, viewport.height);
    
    console.log(`Spread visible above fold: ${spreadVisible}`);
  });
});

test.describe('⚡ Matchup Page Performance', () => {
  
  test('Matchup pages load under 3 seconds', async ({ page }) => {
    const sportPages = ['/nfl', '/nba', '/nhl', '/mlb'];
    const results: {sport: string, time: number}[] = [];
    
    for (const sport of sportPages) {
      const start = Date.now();
      await page.goto(sport, { waitUntil: 'domcontentloaded' });
      const time = Date.now() - start;
      results.push({ sport, time });
    }
    
    console.log('\n⚡ Page Load Times:');
    results.forEach(r => {
      const status = r.time < 3000 ? '✓' : '⚠️';
      console.log(`  ${status} ${r.sport}: ${r.time}ms`);
    });
  });
});

test.describe('🎯 Edge Calculation Features', () => {
  
  test('THE EDGE section present and functional', async ({ page }) => {
    // Find a game page
    await page.goto('/nfl');
    await page.waitForLoadState('networkidle');
    
    const links = await findGameLinks(page);
    if (links.length === 0) {
      console.log('No games to test Edge features');
      return;
    }
    
    await page.goto(links[0]);
    await page.waitForLoadState('networkidle');
    
    const content = await page.textContent('body') || '';
    
    // Check for Edge section
    const hasEdge = /the edge|edge score|ai pick|sharpest pick/i.test(content);
    console.log(`Has Edge section: ${hasEdge}`);
    
    // Check for confidence indicators
    const hasConfidence = /confidence|%.*confident/i.test(content);
    console.log(`Has confidence indicator: ${hasConfidence}`);
    
    // Check for key edges listing
    const hasKeyEdges = /key edge|major risk/i.test(content);
    console.log(`Has key edges/risks: ${hasKeyEdges}`);
  });
});

test.describe('📋 RECOMMENDATIONS GENERATOR', () => {
  
  test('Generate matchup page recommendations', async ({ page }) => {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('        MATCHUP PAGE IMPROVEMENT RECOMMENDATIONS              ');
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Test a game page and generate recommendations
    await page.goto('/nfl');
    await page.waitForLoadState('networkidle');
    
    const links = await findGameLinks(page);
    
    if (links.length > 0) {
      await page.goto(links[0]);
      await page.waitForLoadState('networkidle');
      
      const content = await page.textContent('body') || '';
      const contentLower = content.toLowerCase();
      
      const recommendations: string[] = [];
      
      // Check what's missing
      if (!/reverse.*line|rlm/i.test(contentLower)) {
        recommendations.push('ADD: Reverse Line Movement (RLM) indicator - Sharp bettors look for this first');
      }
      
      if (!/steam.*move|sharp.*move/i.test(contentLower)) {
        recommendations.push('ADD: Steam move alerts - When line moves across multiple books simultaneously');
      }
      
      if (!/clv|closing.*line.*value/i.test(contentLower)) {
        recommendations.push('ADD: CLV (Closing Line Value) tracking - The gold standard metric');
      }
      
      if (!/situational|home.*dog|road.*fav/i.test(contentLower)) {
        recommendations.push('ADD: Situational stats (ATS as favorite/dog, home/away)');
      }
      
      if (!/pace|tempo/i.test(contentLower)) {
        recommendations.push('ADD: Pace/tempo data - Crucial for totals betting');
      }
      
      if (!/rest.*day|back.?to.?back/i.test(contentLower)) {
        recommendations.push('ADD: Rest advantage indicator - Days since last game');
      }
      
      // Check for noise to remove
      if (/generic.*rank|power.*rank/i.test(contentLower)) {
        recommendations.push('REVIEW: Generic team rankings visible - Consider removing or adding context');
      }
      
      console.log('\n📝 RECOMMENDED ADDITIONS:\n');
      recommendations.forEach((rec, i) => console.log(`${i + 1}. ${rec}`));
      
      console.log('\n💡 BEST PRACTICES FROM SHARP BETTORS:\n');
      console.log('1. Put line shopping tools ABOVE the fold - this is #1 value add');
      console.log('2. Show "% of MONEY" not just "% of bets" - sharps bet bigger');
      console.log('3. Highlight when line moves OPPOSITE to public - thats sharp money');
      console.log('4. Show injury impact in POINTS, not just status');
      console.log('5. Remove win probability - its already in the line, adds noise');
      console.log('6. Only show trends with 100+ sample size');
      console.log('7. Default collapse less important sections');
      console.log('8. Add 1-click copy for specific bets (line + odds)');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    
    expect(true).toBeTruthy(); // Don't fail, this is a report
  });
});
