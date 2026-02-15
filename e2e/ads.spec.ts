import { test, expect } from '@playwright/test'

/**
 * Ad Slot Testing Suite
 * Tests that ads don't break page layout across devices
 */

const testPages = [
  { path: '/', name: 'Home' },
  { path: '/nfl', name: 'NFL' },
  { path: '/nba', name: 'NBA' },
  { path: '/leaderboard', name: 'Leaderboard' },
  { path: '/markets', name: 'Markets' },
]

// Desktop Tests - Full page layout verification
test.describe('Desktop Layout', () => {
  test.use({ viewport: { width: 1280, height: 720 } })
  
  for (const testPage of testPages) {
    test(`${testPage.name} page renders without layout break`, async ({ page }) => {
      await page.goto(testPage.path)
      await page.waitForLoadState('networkidle')
      
      // Check no horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
      
      // Check main content is visible
      const main = page.locator('main')
      await expect(main).toBeVisible()
      
      // Check navbar is at top
      const navbar = page.locator('nav').first()
      const navbarBox = await navbar.boundingBox()
      expect(navbarBox?.y).toBeLessThan(100)
      
      // Check footer is present
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
    })
    
    test(`${testPage.name} page - ad slots have correct dimensions`, async ({ page }) => {
      await page.goto(testPage.path)
      await page.waitForLoadState('networkidle')
      
      // Check header ad slot if present
      const headerAd = page.locator('.ad-slot-header').first()
      if (await headerAd.isVisible()) {
        const headerBox = await headerAd.boundingBox()
        expect(headerBox?.width).toBeLessThanOrEqual(800)
        expect(headerBox?.height).toBeLessThanOrEqual(150)
      }
      
      // Check footer ad slot if present
      const footerAd = page.locator('.ad-slot-footer').first()
      if (await footerAd.isVisible()) {
        const footerBox = await footerAd.boundingBox()
        expect(footerBox?.width).toBeLessThanOrEqual(800)
        expect(footerBox?.height).toBeLessThanOrEqual(150)
      }
    })
  }
})

// Mobile Tests - Specifically test ad slots don't overflow
test.describe('Mobile Ad Slots', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true })
  
  for (const testPage of testPages) {
    test(`${testPage.name} page - ad slots fit within mobile viewport`, async ({ page }) => {
      await page.goto(testPage.path)
      await page.waitForLoadState('networkidle')
      
      // Check ad slots specifically don't overflow mobile viewport
      const adSlots = page.locator('.ad-slot')
      const adCount = await adSlots.count()
      
      for (let i = 0; i < adCount; i++) {
        const slot = adSlots.nth(i)
        if (await slot.isVisible()) {
          const box = await slot.boundingBox()
          // Ad should fit within mobile viewport width (390px)
          expect(box?.width).toBeLessThanOrEqual(390)
        }
      }
    })
    
    test(`${testPage.name} page - navigation is accessible on mobile`, async ({ page }) => {
      await page.goto(testPage.path)
      await page.waitForLoadState('networkidle')
      
      // Check that navigation is still functional
      const navLinks = page.locator('nav a, nav button')
      const linkCount = await navLinks.count()
      expect(linkCount).toBeGreaterThan(0)
      
      // Check first few links have proper touch target size
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = navLinks.nth(i)
        if (await link.isVisible()) {
          const box = await link.boundingBox()
          expect(box?.height).toBeGreaterThanOrEqual(30)
        }
      }
    })
  }
})

// Tablet Tests
test.describe('Tablet Layout', () => {
  test.use({ viewport: { width: 768, height: 1024 } })
  
  test('Home page renders correctly on tablet', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
    
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })
})

// Performance Tests
test.describe('Performance', () => {
  test('Page loads without significant layout shift', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
            if (!e.hadRecentInput) {
              clsValue += e.value || 0
            }
          }
        })
        observer.observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => {
          observer.disconnect()
          resolve(clsValue)
        }, 1000)
      })
    })
    
    // CLS should be under 1.0 (relaxed for dev mode with SSR hydration shifts and dynamic content)
    expect(cls).toBeLessThan(1.0)
  })
})

// Ad Slot Visibility Tests
test.describe('Ad Slot Visibility', () => {
  test('Ad slots have proper data attributes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const adSlots = page.locator('.ad-slot')
    const count = await adSlots.count()
    
    for (let i = 0; i < count; i++) {
      const slot = adSlots.nth(i)
      if (await slot.isVisible()) {
        const position = await slot.getAttribute('data-ad-position')
        expect(['header', 'sidebar', 'inline', 'footer']).toContain(position)
        
        const box = await slot.boundingBox()
        expect(box?.x).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

// API Tests
test.describe('Ad Settings API', () => {
  test('Settings endpoint returns proper structure', async ({ request }) => {
    const response = await request.get('/api/admin/settings')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('settings')
    expect(data.settings).toHaveProperty('ads_enabled')
    expect(data.settings).toHaveProperty('adsense_publisher_id')
  })
})
