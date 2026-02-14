'use client'

/**
 * Custom Analytics Tracker
 * 
 * Lightweight client-side analytics that tracks:
 * - Page views with full URL, referrer, and UTM params
 * - Session duration and page time
 * - Device info (screen size, browser, OS, mobile)
 * - User identity (if logged in via Supabase)
 * - Click events on key elements
 * - Scroll depth
 * 
 * NO external services needed - stores directly in Supabase
 * Respects DNT (Do Not Track) header
 */

import { useEffect, useRef, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Generate a unique session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = sessionStorage.getItem('matchups_session_id')
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    sessionStorage.setItem('matchups_session_id', sessionId)
  }
  return sessionId
}

// Get or create a persistent visitor ID
function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  let visitorId = localStorage.getItem('matchups_visitor_id')
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem('matchups_visitor_id', visitorId)
  }
  return visitorId
}

// Detect device info
function getDeviceInfo() {
  if (typeof window === 'undefined') return {}
  const ua = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua)
  
  let browser = 'unknown'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'
  
  let os = 'unknown'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  
  return {
    browser,
    os,
    isMobile: isMobile && !isTablet,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

// Extract UTM parameters
function getUtmParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search)
  const utm: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const val = params.get(key)
    if (val) utm[key] = val
  }
  return utm
}

// Send event to our API
async function trackEvent(event: {
  type: string
  page: string
  data?: Record<string, unknown>
}) {
  try {
    // Respect Do Not Track
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return
    
    const payload = {
      ...event,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      timestamp: new Date().toISOString(),
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      device: getDeviceInfo(),
      utm: typeof window !== 'undefined' ? getUtmParams(window.location.search) : {},
    }
    
    // Use sendBeacon for reliability (doesn't block page unload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', JSON.stringify(payload))
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {}) // fire-and-forget
    }
  } catch {
    // Analytics should never break the app
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageLoadTime = useRef(Date.now())
  const maxScrollDepth = useRef(0)

  // Track page view on route change
  useEffect(() => {
    pageLoadTime.current = Date.now()
    maxScrollDepth.current = 0
    
    trackEvent({
      type: 'pageview',
      page: pathname,
      data: {
        search: searchParams.toString(),
        title: typeof document !== 'undefined' ? document.title : '',
      },
    })
  }, [pathname, searchParams])

  // Track time on page when leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - pageLoadTime.current) / 1000)
      trackEvent({
        type: 'page_exit',
        page: pathname,
        data: {
          timeOnPageSeconds: timeOnPage,
          scrollDepth: maxScrollDepth.current,
        },
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pathname])

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        const depth = Math.round((scrollTop / docHeight) * 100)
        if (depth > maxScrollDepth.current) {
          maxScrollDepth.current = depth
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track clicks on key elements
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      const button = target.closest('button')
      
      if (link) {
        trackEvent({
          type: 'click',
          page: pathname,
          data: {
            element: 'link',
            href: link.href,
            text: link.textContent?.slice(0, 100),
            isExternal: link.hostname !== window.location.hostname,
          },
        })
      } else if (button) {
        trackEvent({
          type: 'click',
          page: pathname,
          data: {
            element: 'button',
            text: button.textContent?.slice(0, 100),
            id: button.id || undefined,
          },
        })
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pathname])

  // Track session start
  useEffect(() => {
    const isNewSession = !sessionStorage.getItem('matchups_session_started')
    if (isNewSession) {
      sessionStorage.setItem('matchups_session_started', '1')
      trackEvent({
        type: 'session_start',
        page: pathname,
        data: {
          entryPage: pathname,
          referrer: document.referrer,
          isReturningVisitor: !!localStorage.getItem('matchups_visitor_id'),
        },
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null // This component renders nothing
}

// Export for manual tracking (e.g., custom events)
export { trackEvent }
