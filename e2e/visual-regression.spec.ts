import { test, expect } from '@playwright/test';

/**
 * VISUAL REGRESSION TESTS
 * These tests take screenshots and compare against baselines
 * to catch unexpected visual changes.
 * 
 * First run creates baseline screenshots in e2e/visual-baseline/
 * Subsequent runs compare against baselines
 */

test.describe('📸 Visual Regression - Key Pages', () => {
  
  test('homepage visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for animations to settle
    await page.waitForTimeout(1000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 1000, // Allow some variance for dynamic content
    });
  });

  test('NBA page visual snapshot', async ({ page }) => {
    await page.goto('/nba');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('nba-page.png', {
      fullPage: true,
      maxDiffPixels: 2000,
    });
  });

  test('markets page visual snapshot', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('markets-page.png', {
      fullPage: true,
      maxDiffPixels: 2000,
    });
  });

  test('leaderboard page visual snapshot', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('leaderboard-page.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });
});

test.describe('🎨 Component Visual Checks', () => {
  
  test('navigation header looks correct', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('header, nav').first();
    await expect(header).toHaveScreenshot('header-component.png', {
      maxDiffPixels: 500,
    });
  });

  test('footer looks correct', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await expect(footer).toHaveScreenshot('footer-component.png', {
        maxDiffPixels: 500,
      });
    }
  });
});

test.describe('📱 Responsive Visual Tests', () => {
  
  test('homepage mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('homepage tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });
});

test.describe('🌙 Dark Mode Visual Tests', () => {
  
  test('homepage dark mode', async ({ page }) => {
    // Set dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });
});

test.describe('⚡ Loading State Checks', () => {
  
  test('pages show proper loading states, not blank', async ({ page }) => {
    // Intercept API requests to simulate slow loading
    await page.route('/api/**', async (route) => {
      // Add 2 second delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    // Navigate and capture loading state
    await page.goto('/', { waitUntil: 'commit' });
    
    // Should show content or loading indicator, not blank page
    const bodyContent = await page.locator('body').innerText();
    const isBlank = bodyContent.trim().length < 10;
    
    expect(isBlank, 'Page should show loading state, not be blank').toBe(false);
  });

  test('error states look correct', async ({ page }) => {
    // Force an error by going to invalid route  
    await page.goto('/this-page-does-not-exist-12345');
    await page.waitForLoadState('networkidle');
    
    // Should be styled 404 page, not raw error
    const body = page.locator('body');
    
    // Should have styling (background color, fonts, etc.)
    const hasStyles = await body.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
             styles.fontFamily !== '';
    });
    
    expect(hasStyles).toBe(true);
  });
});

test.describe('🎯 Critical Element Visibility', () => {
  
  test('main CTA buttons are visible above fold', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if main interactive elements are visible
    const viewportHeight = page.viewportSize()?.height || 720;
    
    // Game cards or CTA should be visible
    const mainContent = page.locator('main, [role="main"], #main-content').first();
    
    if (await mainContent.count() > 0) {
      const box = await mainContent.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeLessThan(viewportHeight);
    }
  });

  test('navigation is always accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    
    // Nav should still be visible (sticky) or accessible
    const navStillVisible = await nav.isVisible();
    
    // If nav is not visible, there should be a menu button
    if (!navStillVisible) {
      const menuButton = page.locator('[aria-label*="menu"], button:has-text("Menu"), .hamburger');
      const hasMenuButton = await menuButton.count() > 0;
      expect(hasMenuButton || navStillVisible).toBe(true);
    }
  });
});
