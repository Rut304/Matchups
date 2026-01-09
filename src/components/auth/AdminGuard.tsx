'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Shield, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface AdminGuardProps {
  children: ReactNode
}

// List of admin emails (can also be stored in database)
const ADMIN_EMAILS = [
  'admin@matchups.com',
  'rut@matchups.com',
  'rutrohd@gmail.com',
  // Add your admin emails here
]

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (loading) return
      
      if (!user) {
        setIsAdmin(false)
        setChecking(false)
        return
      }

      // Check admin status from multiple sources:
      // 1. User metadata (set via Supabase dashboard or auth hook)
      // 2. Admin emails list
      // 3. Database profile role

      const isAdminByMetadata = user.user_metadata?.is_admin === true
      const isAdminByEmail = ADMIN_EMAILS.includes(user.email || '')
      const isAdminByRole = user.app_metadata?.role === 'admin'

      // Also check profile table for role
      let isAdminByProfile = false
      try {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        isAdminByProfile = profile?.role === 'admin'
      } catch {
        // Profile might not exist yet
      }

      const adminStatus = isAdminByMetadata || isAdminByEmail || isAdminByRole || isAdminByProfile
      setIsAdmin(adminStatus)
      setChecking(false)
    }

    checkAdminStatus()
  }, [user, loading])

  // Loading state
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p style={{ color: '#808090' }}>Verifying access...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="text-center p-8 rounded-2xl max-w-md" style={{ background: '#12121A' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(255,51,102,0.1)' }}>
            <Lock className="w-8 h-8" style={{ color: '#FF3366' }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="mb-6" style={{ color: '#808090' }}>
            Please sign in to access the admin area.
          </p>
          <Link 
            href="/auth"
            className="inline-block px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)' }}
          >
            Sign In
          </Link>
          <Link href="/" className="block mt-4 text-sm" style={{ color: '#808090' }}>
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="text-center p-8 rounded-2xl max-w-md" style={{ background: '#12121A' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(255,51,102,0.1)' }}>
            <Shield className="w-8 h-8" style={{ color: '#FF3366' }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="mb-2" style={{ color: '#808090' }}>
            You don&apos;t have permission to access the admin area.
          </p>
          <p className="text-xs mb-6" style={{ color: '#606070' }}>
            Logged in as: {user.email}
          </p>
          <Link 
            href="/"
            className="inline-block px-6 py-3 rounded-xl font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #00FF88, #00A8FF)' }}
          >
            Go to Homepage
          </Link>
          <button 
            onClick={() => router.back()}
            className="block w-full mt-4 text-sm"
            style={{ color: '#808090' }}
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Admin access granted
  return <>{children}</>
}

// Hook to check admin status
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      if (authLoading) return
      
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const isAdminByMetadata = user.user_metadata?.is_admin === true
      const isAdminByEmail = ADMIN_EMAILS.includes(user.email || '')
      const isAdminByRole = user.app_metadata?.role === 'admin'

      let isAdminByProfile = false
      try {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        isAdminByProfile = profile?.role === 'admin'
      } catch {
        // Profile might not exist
      }

      setIsAdmin(isAdminByMetadata || isAdminByEmail || isAdminByRole || isAdminByProfile)
      setLoading(false)
    }

    check()
  }, [user, authLoading])

  return { isAdmin, loading }
}
