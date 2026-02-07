import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Expert Picks Experts API
 * 
 * GET - Fetch all tracked experts and stats
 */

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch all experts
    const { data: experts, error: expertsError } = await supabase
      .from('expert_records')
      .select('*')
      .order('season_win_pct', { ascending: false })
    
    if (expertsError) {
      console.error('Error fetching experts:', expertsError)
      return NextResponse.json({ 
        experts: [],
        error: expertsError.message 
      })
    }
    
    // Calculate stats
    const totalExperts = experts?.length || 0
    const expertsWithTwitter = experts?.filter(e => e.twitter_handle).length || 0
    
    // Get tweet count
    const { count: totalTweets } = await supabase
      .from('expert_tweets')
      .select('*', { count: 'exact', head: true })
    
    // Get picks count
    const { count: totalPicks } = await supabase
      .from('expert_picks')
      .select('*', { count: 'exact', head: true })
    
    // Get last scrape time
    const { data: lastTweet } = await supabase
      .from('expert_tweets')
      .select('scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(1)
      .single()
    
    return NextResponse.json({
      experts: experts || [],
      stats: {
        totalExperts,
        expertsWithTwitter,
        totalTweets: totalTweets || 0,
        totalPicks: totalPicks || 0,
        lastScrapeTime: lastTweet?.scraped_at || null,
      }
    })
  } catch (error) {
    console.error('Expert picks experts API error:', error)
    return NextResponse.json({ 
      experts: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * POST - Add or update an expert
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, expert } = body
    
    const supabase = await createClient()
    
    switch (action) {
      case 'add':
        const { data, error } = await supabase
          .from('expert_records')
          .insert({
            name: expert.name,
            source: expert.source || 'manual',
            sport: expert.sport || 'NFL',
            title: expert.title,
            twitter_handle: expert.twitter_handle,
            is_verified: false,
          })
          .select()
          .single()
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        return NextResponse.json({ success: true, expert: data })
      
      case 'update':
        const { error: updateError } = await supabase
          .from('expert_records')
          .update({
            twitter_handle: expert.twitter_handle,
            title: expert.title,
          })
          .eq('id', expert.id)
        
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 })
        }
        
        return NextResponse.json({ success: true })
      
      case 'delete':
        const { error: deleteError } = await supabase
          .from('expert_records')
          .delete()
          .eq('id', expert.id)
        
        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 400 })
        }
        
        return NextResponse.json({ success: true })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
