// =============================================================================
// ADMIN API: User Management
// List, manage, and moderate users via Supabase Auth Admin API
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''

  try {
    // List users using admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: limit
    })

    if (error) throw error

    // Filter by search if provided
    let filteredUsers = users
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = users.filter(user => 
        user.email?.toLowerCase().includes(searchLower) ||
        user.user_metadata?.name?.toLowerCase().includes(searchLower)
      )
    }

    // Get user stats from profiles table if exists
    const userIds = filteredUsers.map(u => u.id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Combine auth users with profile data
    const usersWithProfiles = filteredUsers.map(user => {
      const profile = profileMap.get(user.id)
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed: user.email_confirmed_at != null,
        banned: (user as unknown as { banned_until?: string }).banned_until != null,
        role: profile?.role || 'user',
        display_name: profile?.display_name,
      }
    })

    return NextResponse.json({
      status: 'ok',
      users: usersWithProfiles,
      page,
      limit,
      total: users.length
    })
  } catch (error) {
    console.error('Failed to list users:', error)
    return NextResponse.json({ 
      error: 'Failed to list users',
      users: [],
      page: 1,
      total: 0
    }, { status: 200 }) // Return 200 with empty array for UI compatibility
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const { action, userId, data } = body

  try {
    switch (action) {
      case 'ban':
        const banUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        await supabase.auth.admin.updateUserById(userId, {
          ban_duration: '8760h' // 1 year in hours
        })
        return NextResponse.json({ status: 'ok', message: 'User banned' })

      case 'unban':
        await supabase.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        })
        return NextResponse.json({ status: 'ok', message: 'User unbanned' })

      case 'delete':
        await supabase.auth.admin.deleteUser(userId)
        return NextResponse.json({ status: 'ok', message: 'User deleted' })

      case 'update_role':
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            role: data.role,
            updated_at: new Date().toISOString()
          })
        return NextResponse.json({ status: 'ok', message: 'Role updated' })

      case 'send_password_reset':
        const { data: user } = await supabase.auth.admin.getUserById(userId)
        if (user?.user?.email) {
          await supabase.auth.resetPasswordForEmail(user.user.email)
          return NextResponse.json({ status: 'ok', message: 'Password reset email sent' })
        }
        return NextResponse.json({ error: 'User email not found' }, { status: 400 })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('User action failed:', error)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}
