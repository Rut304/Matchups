'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, Zap, ArrowRight, Chrome } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'signin' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        if (error) throw error
        setMessage('Check your email for the confirmation link!')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'twitter' | 'discord') => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0A0F' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
                 style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)' }}>
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Matchups</span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: '#808090' }}>
            {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl p-8" style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Tab Toggle */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: '#0A0A0F' }}>
            <button
              onClick={() => setMode('signin')}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: mode === 'signin' ? 'linear-gradient(135deg, #FF6B00, #FF3366)' : 'transparent',
                color: mode === 'signin' ? '#FFF' : '#808090'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: mode === 'signup' ? 'linear-gradient(135deg, #FF6B00, #FF3366)' : 'transparent',
                color: mode === 'signup' ? '#FFF' : '#808090'
              }}
            >
              Sign Up
            </button>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold transition-all hover:bg-white/10 disabled:opacity-50"
              style={{ background: '#1A1A24', color: '#FFF' }}
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuthSignIn('twitter')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold transition-all hover:bg-white/10 disabled:opacity-50"
              style={{ background: '#1A1A24', color: '#FFF' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Continue with X
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2" style={{ background: '#12121A', color: '#808090' }}>or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#808090' }} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="sharpshooter123"
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-500"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#808090' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-500"
                  style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#808090' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-white placeholder-gray-500"
                  style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#808090' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(255,51,102,0.1)', color: '#FF3366' }}>
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #FF3366)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {mode === 'signin' && (
            <p className="mt-4 text-center text-sm" style={{ color: '#808090' }}>
              <Link href="/auth/reset" className="hover:underline" style={{ color: '#00A8FF' }}>
                Forgot your password?
              </Link>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: '#808090' }}>
          By continuing, you agree to our{' '}
          <Link href="/terms" className="hover:underline" style={{ color: '#00A8FF' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:underline" style={{ color: '#00A8FF' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
