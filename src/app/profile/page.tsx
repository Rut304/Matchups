'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  User,
  Mail,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  Save,
  Camera,
  CheckCircle,
  Settings,
  Smartphone,
  Globe,
  Moon,
  Sun,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'preferences' | 'subscription'>('profile')
  const [isSaving, setIsSaving] = useState(false)
  
  // Form states
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [notifications, setNotifications] = useState({
    lineMovements: true,
    sharpAction: true,
    injuries: true,
    dailyPicks: false,
    weeklyDigest: true,
    promotions: false
  })
  const [preferences, setPreferences] = useState({
    darkMode: true,
    timezone: 'America/New_York',
    defaultSport: 'all',
    oddsFormat: 'american'
  })

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || '')
      setEmail(user.email || '')
      setBio(user.user_metadata?.bio || '')
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="text-center p-8 rounded-2xl" style={{ background: '#12121A' }}>
          <User className="w-16 h-16 mx-auto mb-4" style={{ color: '#808090' }} />
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="mb-6" style={{ color: '#808090' }}>Please sign in to access your profile</p>
          <Link 
            href="/auth"
            className="inline-block px-6 py-3 rounded-xl font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FF6B00)' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">Account Settings</h1>
            <p style={{ color: '#808090' }}>Manage your profile and preferences</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ background: 'rgba(255,51,102,0.1)', color: '#FF3366' }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: activeTab === tab.id ? '#FF6B0020' : 'transparent',
                    color: activeTab === tab.id ? '#FF6B00' : '#808090'
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              )
            })}
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="rounded-2xl p-6" style={{ background: '#12121A' }}>
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>
                  
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                         style={{ background: 'linear-gradient(135deg, #FF6B00, #FFD700)' }}>
                      {displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                            style={{ background: '#0A0A0F', color: '#808090' }}>
                      <Camera className="w-4 h-4" />
                      Change Avatar
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Display Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white"
                        style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Email</label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl text-white opacity-50"
                        style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <p className="text-xs mt-1" style={{ color: '#808090' }}>Contact support to change email</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl text-white resize-none"
                        style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white mb-4">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'lineMovements', label: 'Line Movements', desc: 'Get alerts when lines move significantly' },
                      { key: 'sharpAction', label: 'Sharp Action', desc: 'Notifications about professional bettor activity' },
                      { key: 'injuries', label: 'Injury Updates', desc: 'Breaking news about player injuries' },
                      { key: 'dailyPicks', label: 'Daily Picks', desc: 'Daily top pick recommendations' },
                      { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of trends and performance' },
                      { key: 'promotions', label: 'Promotions', desc: 'Special offers and new features' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                        <div>
                          <p className="font-medium text-white">{item.label}</p>
                          <p className="text-sm" style={{ color: '#808090' }}>{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                          className="w-12 h-6 rounded-full transition-all"
                          style={{ 
                            background: notifications[item.key as keyof typeof notifications] ? '#00FF88' : '#333',
                          }}
                        >
                          <div 
                            className="w-5 h-5 rounded-full bg-white transition-transform"
                            style={{ 
                              transform: notifications[item.key as keyof typeof notifications] ? 'translateX(26px)' : 'translateX(2px)'
                            }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white mb-4">App Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Moon className="w-5 h-5" style={{ color: '#808090' }} />
                          <div>
                            <p className="font-medium text-white">Dark Mode</p>
                            <p className="text-sm" style={{ color: '#808090' }}>Use dark theme</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                          className="w-12 h-6 rounded-full transition-all"
                          style={{ background: preferences.darkMode ? '#00FF88' : '#333' }}
                        >
                          <div 
                            className="w-5 h-5 rounded-full bg-white transition-transform"
                            style={{ transform: preferences.darkMode ? 'translateX(26px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Odds Format</label>
                      <select
                        value={preferences.oddsFormat}
                        onChange={(e) => setPreferences(prev => ({ ...prev, oddsFormat: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-white"
                        style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <option value="american">American (-110)</option>
                        <option value="decimal">Decimal (1.91)</option>
                        <option value="fractional">Fractional (10/11)</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Default Sport</label>
                      <select
                        value={preferences.defaultSport}
                        onChange={(e) => setPreferences(prev => ({ ...prev, defaultSport: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-white"
                        style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <option value="all">All Sports</option>
                        <option value="nfl">NFL</option>
                        <option value="nba">NBA</option>
                        <option value="nhl">NHL</option>
                        <option value="mlb">MLB</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Timezone</label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-white"
                        style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <option value="America/New_York">Eastern (ET)</option>
                        <option value="America/Chicago">Central (CT)</option>
                        <option value="America/Denver">Mountain (MT)</option>
                        <option value="America/Los_Angeles">Pacific (PT)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white mb-4">Subscription</h2>
                  
                  <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,107,0,0.1))', border: '1px solid rgba(255,215,0,0.3)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#FFD700' }}>Current Plan</p>
                        <p className="text-2xl font-bold text-white">Free</p>
                      </div>
                      <Shield className="w-10 h-10" style={{ color: '#FFD700' }} />
                    </div>
                    <p className="text-sm mb-4" style={{ color: '#808090' }}>
                      Upgrade to Pro for real-time alerts, advanced analytics, and unlimited picks tracking.
                    </p>
                    <button className="w-full px-6 py-3 rounded-xl font-bold text-black transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #FFD700, #FF6B00)' }}>
                      Upgrade to Pro - $9.99/mo
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                      <p className="font-medium text-white mb-2">Pro Features</p>
                      <ul className="space-y-2 text-sm" style={{ color: '#808090' }}>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" style={{ color: '#00FF88' }} /> Real-time line alerts</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" style={{ color: '#00FF88' }} /> Sharp money tracking</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" style={{ color: '#00FF88' }} /> Unlimited picks</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" style={{ color: '#00FF88' }} /> Advanced analytics</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                      <p className="font-medium text-white mb-2">Billing</p>
                      <p className="text-sm" style={{ color: '#808090' }}>No active subscription</p>
                      <Link href="#" className="text-sm mt-2 block" style={{ color: '#00A8FF' }}>
                        View billing history →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-black transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #00FF88, #00A8FF)' }}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
