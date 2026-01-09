'use client'

import { useEffect, useState, useRef } from 'react'
import Script from 'next/script'

type AdPosition = 'header' | 'sidebar' | 'inline' | 'footer'
type AdSize = 'banner' | 'leaderboard' | 'rectangle' | 'skyscraper' | 'mobile'

interface AdSlotProps {
  position: AdPosition
  size?: AdSize
  className?: string
}

interface AdSettings {
  ads_enabled: boolean
  ads_header_enabled: boolean
  ads_sidebar_enabled: boolean
  ads_inline_enabled: boolean
  ads_footer_enabled: boolean
  adsense_publisher_id: string | null
  adsense_slot_header: string | null
  adsense_slot_sidebar: string | null
  adsense_slot_inline: string | null
  adsense_slot_footer: string | null
}

const AD_SIZES: Record<AdSize, { width: number; height: number; label: string }> = {
  banner: { width: 468, height: 60, label: '468x60 Banner' },
  leaderboard: { width: 728, height: 90, label: '728x90 Leaderboard' },
  rectangle: { width: 300, height: 250, label: '300x250 Rectangle' },
  skyscraper: { width: 160, height: 600, label: '160x600 Skyscraper' },
  mobile: { width: 320, height: 50, label: '320x50 Mobile Banner' }
}

const DEFAULT_SIZES: Record<AdPosition, AdSize> = {
  header: 'leaderboard',
  sidebar: 'rectangle',
  inline: 'rectangle',
  footer: 'leaderboard'
}

// Cache settings to avoid repeated API calls
let settingsCache: AdSettings | null = null
let settingsFetched = false

// Track if AdSense script is loaded
let adsenseScriptLoaded = false

const DEFAULT_AD_SETTINGS: AdSettings = {
  ads_enabled: false,
  ads_header_enabled: true,
  ads_sidebar_enabled: true,
  ads_inline_enabled: true,
  ads_footer_enabled: true,
  adsense_publisher_id: null,
  adsense_slot_header: null,
  adsense_slot_sidebar: null,
  adsense_slot_inline: null,
  adsense_slot_footer: null,
}

export function AdSlot({ position, size, className = '' }: AdSlotProps) {
  const [settings, setSettings] = useState<AdSettings | null>(settingsCache)
  const [isVisible, setIsVisible] = useState(false)
  const adRef = useRef<HTMLModElement>(null)
  const adInitialized = useRef(false)

  const adSize = size || DEFAULT_SIZES[position]
  const dimensions = AD_SIZES[adSize]

  useEffect(() => {
    // Fetch settings if not cached
    if (!settingsFetched) {
      settingsFetched = true
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => {
          settingsCache = data.settings
          setSettings(data.settings)
        })
        .catch(() => {
          settingsCache = DEFAULT_AD_SETTINGS
          setSettings(settingsCache)
        })
    } else if (settingsCache) {
      setSettings(settingsCache)
    }
  }, [])

  useEffect(() => {
    if (!settings) return

    // Check if ads are enabled globally and for this position
    const globalEnabled = settings.ads_enabled
    const positionKey = `ads_${position}_enabled` as keyof AdSettings
    const positionEnabled = settings[positionKey] as boolean

    setIsVisible(globalEnabled && positionEnabled)
  }, [settings, position])

  // Initialize AdSense ad when visible and publisher ID is set
  useEffect(() => {
    if (!isVisible || !settings?.adsense_publisher_id || adInitialized.current) return
    
    // Wait for AdSense script to load
    const initAd = () => {
      if (typeof window !== 'undefined' && (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle && adRef.current) {
        try {
          ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({})
          adInitialized.current = true
        } catch (e) {
          console.error('AdSense error:', e)
        }
      }
    }

    // If script is already loaded, init immediately
    if (adsenseScriptLoaded) {
      initAd()
    } else {
      // Wait a bit for script to load
      const timer = setTimeout(initAd, 1000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, settings?.adsense_publisher_id])

  // Don't render anything if ads are disabled
  if (!isVisible) return null

  // Get slot ID for this position
  const slotKey = `adsense_slot_${position}` as keyof AdSettings
  const slotId = settings?.[slotKey] as string | null
  const publisherId = settings?.adsense_publisher_id
  const hasAdSense = publisherId && publisherId.startsWith('ca-pub-')

  return (
    <div 
      className={`ad-slot ad-slot-${position} ${className}`}
      data-ad-position={position}
      data-ad-size={adSize}
    >
      {/* Load AdSense script once */}
      {hasAdSense && !adsenseScriptLoaded && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
          onLoad={() => { adsenseScriptLoaded = true }}
        />
      )}

      {hasAdSense ? (
        // Real AdSense Ad
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: dimensions.width,
            height: dimensions.height,
          }}
          data-ad-client={publisherId}
          data-ad-slot={slotId || ''}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        // Placeholder when no AdSense configured
        <div 
          className={`relative bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center w-full ${
            adSize === 'leaderboard' ? 'max-w-[728px] h-[90px]' :
            adSize === 'rectangle' ? 'max-w-[300px] h-[250px]' :
            adSize === 'banner' ? 'max-w-[468px] h-[60px]' :
            adSize === 'skyscraper' ? 'max-w-[160px] h-[600px]' :
            'max-w-[320px] h-[50px]'
          }`}
        >
          <div className="text-center text-zinc-600 text-sm">
            <div className="text-xs uppercase tracking-wide mb-1">Advertisement</div>
            <div className="text-zinc-700 text-xs">{dimensions.label}</div>
            <div className="text-zinc-800 text-xs mt-1">Configure AdSense in Admin</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export for cache invalidation when settings change
export function invalidateAdSettings() {
  settingsCache = null
  settingsFetched = false
}

// Export hook for components that need to check ad status
export function useAdsEnabled(): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (settingsCache) {
      setEnabled(settingsCache.ads_enabled)
    } else {
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => {
          settingsCache = data.settings
          setEnabled(data.settings?.ads_enabled || false)
        })
        .catch(() => setEnabled(false))
    }
  }, [])

  return enabled
}
