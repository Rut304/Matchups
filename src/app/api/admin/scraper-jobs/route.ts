import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Scraper Jobs API
 * 
 * Manages scheduled scraper jobs for expert picks
 * Jobs are stored in admin_settings table as JSON
 */

interface ScraperJob {
  id: string
  name: string
  source: 'espn' | 'covers' | 'twitter' | 'all'
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'disabled'
  lastRun: string | null
  nextRun: string | null
  schedule: string
  enabled: boolean
}

const DEFAULT_JOBS: ScraperJob[] = [
  {
    id: 'morning',
    name: 'Morning Scrape (X + Covers)',
    source: 'all',
    status: 'scheduled',
    lastRun: null,
    nextRun: '8:00 AM ET',
    schedule: '0 8 * * *',
    enabled: true,
  },
  {
    id: 'pregame-nfl',
    name: 'Pre-game NFL Sunday',
    source: 'all',
    status: 'scheduled',
    lastRun: null,
    nextRun: '11:00 AM ET (Sunday)',
    schedule: '0 11 * * 0',
    enabled: true,
  },
  {
    id: 'pregame-weekday',
    name: 'Pre-game Weekday',
    source: 'all',
    status: 'scheduled',
    lastRun: null,
    nextRun: '6:30 PM ET (Mon-Fri)',
    schedule: '30 18 * * 1-5',
    enabled: true,
  },
  {
    id: 'postgame',
    name: 'Post-game Scrape',
    source: 'twitter',
    status: 'scheduled',
    lastRun: null,
    nextRun: '11:30 PM ET',
    schedule: '30 23 * * *',
    enabled: true,
  },
]

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Try to get jobs from admin_settings
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'scraper_jobs')
      .single()
    
    if (error || !data) {
      // Return default jobs if not saved yet
      return NextResponse.json({ jobs: DEFAULT_JOBS })
    }
    
    const jobs = typeof data.value === 'string' 
      ? JSON.parse(data.value) 
      : data.value
    
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Scraper jobs GET error:', error)
    return NextResponse.json({ jobs: DEFAULT_JOBS })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, jobId, enabled, jobs: newJobs } = body
    
    const supabase = await createClient()
    
    // Get current jobs
    const { data: current } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'scraper_jobs')
      .single()
    
    let jobs: ScraperJob[] = current?.value 
      ? (typeof current.value === 'string' ? JSON.parse(current.value) : current.value)
      : DEFAULT_JOBS
    
    switch (action) {
      case 'toggle':
        // Toggle a specific job's enabled state
        jobs = jobs.map(j => j.id === jobId ? { ...j, enabled } : j)
        break
      
      case 'update-status':
        // Update job status after a run
        jobs = jobs.map(j => j.id === jobId ? { 
          ...j, 
          status: body.status,
          lastRun: body.lastRun || j.lastRun,
        } : j)
        break
      
      case 'update-all':
        // Replace all jobs
        if (newJobs) {
          jobs = newJobs
        }
        break
      
      case 'add':
        // Add a new job
        if (body.job) {
          jobs = [...jobs, body.job]
        }
        break
      
      case 'delete':
        // Remove a job
        jobs = jobs.filter(j => j.id !== jobId)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Save to database
    const { error: saveError } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'scraper_jobs',
        value: jobs,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
    
    if (saveError) {
      console.error('Failed to save scraper jobs:', saveError)
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, jobs })
  } catch (error) {
    console.error('Scraper jobs POST error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
