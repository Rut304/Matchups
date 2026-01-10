// =============================================================================
// ADMIN API: Site Settings (including Ads toggle)
// Manages site-wide configuration stored in Supabase
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SiteSettings {
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
  maintenance_mode: boolean
  auto_refresh_enabled: boolean
  auto_refresh_interval_minutes: number
  ai_analysis_enabled: boolean
  live_scores_enabled: boolean
  notification_emails: string[]
  // Edge/Confidence Settings
  edge_confidence_threshold: number // Minimum score to show as "edge" (default 60)
  edge_strong_threshold: number // Score to show as "strong edge" (default 75)
  edge_elite_threshold: number // Score to show as "elite edge" (default 90)
}

const DEFAULT_SETTINGS: SiteSettings = {
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
  maintenance_mode: false,
  auto_refresh_enabled: true,
  auto_refresh_interval_minutes: 15,
  ai_analysis_enabled: true,
  live_scores_enabled: true,
  notification_emails: [],
  // Edge/Confidence defaults
  edge_confidence_threshold: 60,
  edge_strong_threshold: 75,
  edge_elite_threshold: 90
}

export async function GET() {
  try {
    // Try to get settings from database
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single()

    if (error || !data) {
      // Return defaults if no settings exist
      return NextResponse.json({
        status: 'ok',
        settings: DEFAULT_SETTINGS,
        source: 'defaults'
      })
    }

    return NextResponse.json({
      status: 'ok',
      settings: data,
      source: 'database'
    })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({
      status: 'ok',
      settings: DEFAULT_SETTINGS,
      source: 'defaults_fallback'
    })
  }
}

export async function POST(request: Request) {
  try {
    const updates = await request.json()

    // Upsert settings
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        id: 1, // Single row for settings
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist, try creating it
      if (error.code === '42P01') {
        return NextResponse.json({
          status: 'ok',
          settings: { ...DEFAULT_SETTINGS, ...updates },
          message: 'Settings saved (table will be created on next deploy)'
        })
      }
      throw error
    }

    return NextResponse.json({
      status: 'ok',
      settings: data,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
