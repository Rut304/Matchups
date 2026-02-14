import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge' // Use edge for lowest latency
export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Track if we've already checked/created the table
let tableVerified = false

async function ensureTable(supabase: ReturnType<typeof getSupabase>) {
  if (tableVerified) return true
  
  // Quick check if table exists
  const { error } = await supabase.from('analytics_events').select('id').limit(1)
  if (!error) {
    tableVerified = true
    return true
  }
  
  // Table doesn't exist - store in admin_settings as fallback
  // The SQL migration needs to be run manually via Supabase Dashboard
  console.warn('[Analytics] analytics_events table not found. Run supabase/analytics-schema.sql in Supabase SQL Editor.')
  console.warn('[Analytics] URL: https://supabase.com/dashboard/project/cdfdmkntdsfylososgwo/sql')
  return false
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      type,
      page,
      data,
      sessionId,
      visitorId,
      timestamp,
      referrer,
      device,
      utm,
    } = body
    
    if (!type || !page) {
      return new NextResponse(null, { status: 204 }) // Don't error on bad data
    }
    
    // Get IP for geo (Vercel provides this)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Get country from Vercel geo headers
    const country = request.headers.get('x-vercel-ip-country') || null
    const region = request.headers.get('x-vercel-ip-country-region') || null
    const city = request.headers.get('x-vercel-ip-city') || null
    
    const supabase = getSupabase()
    
    // Ensure table exists
    const hasTable = await ensureTable(supabase)
    if (!hasTable) {
      // Fallback: store in admin_settings as buffered events
      try {
        const { data: current } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'analytics_buffer')
          .single()
        
        const buffer = current?.value 
          ? (typeof current.value === 'string' ? JSON.parse(current.value) : current.value) 
          : []
        
        // Keep last 500 events in buffer
        buffer.push({ type, page, sessionId, visitorId, timestamp, country, browser: device?.browser })
        if (buffer.length > 500) buffer.splice(0, buffer.length - 500)
        
        await supabase
          .from('admin_settings')
          .upsert({ key: 'analytics_buffer', value: buffer, updated_at: new Date().toISOString() })
      } catch { /* best effort */ }
      
      return new NextResponse(null, { status: 204 })
    }
    
    // Store event in analytics_events table
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: type,
        page,
        session_id: sessionId,
        visitor_id: visitorId,
        referrer: referrer || null,
        browser: device?.browser || null,
        os: device?.os || null,
        is_mobile: device?.isMobile || false,
        is_tablet: device?.isTablet || false,
        screen_width: device?.screenWidth || null,
        screen_height: device?.screenHeight || null,
        viewport_width: device?.viewportWidth || null,
        viewport_height: device?.viewportHeight || null,
        language: device?.language || null,
        timezone: device?.timezone || null,
        country,
        region,
        city,
        ip_hash: ip ? await hashIP(ip) : null, // Hash IP for privacy
        utm_source: utm?.utm_source || null,
        utm_medium: utm?.utm_medium || null,
        utm_campaign: utm?.utm_campaign || null,
        event_data: data || {},
        created_at: timestamp || new Date().toISOString(),
      })
    
    if (error) {
      console.error('[Analytics] Insert error:', error.message)
    }
    
    // Return 204 No Content (fastest response)
    return new NextResponse(null, { status: 204 })
  } catch {
    // Analytics should never return errors to the client
    return new NextResponse(null, { status: 204 })
  }
}

// Hash IP for privacy (don't store raw IPs)
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + 'matchups-salt-2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
