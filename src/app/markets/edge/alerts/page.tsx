'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  BellOff,
  AlertTriangle,
  ChevronRight,
  Target,
  Volume2,
  Newspaper,
  Clock,
  BarChart3,
  Mail,
  Smartphone,
  MessageSquare,
  Settings,
  CheckCircle,
  XCircle,
  Zap,
  ArrowLeft
} from 'lucide-react'

/**
 * ALERT PREFERENCES PAGE
 * Configure high-confidence signal alerts for prediction market edges
 */

interface AlertPreference {
  id: string
  name: string
  description: string
  enabled: boolean
  minConfidence: number
  channels: ('email' | 'push' | 'sms')[]
}

interface EdgeAlert {
  id: string
  type: 'bias' | 'volume' | 'news' | 'arbitrage' | 'time'
  market: string
  signal: 'buy' | 'sell'
  confidence: number
  edge: number
  timestamp: Date
  read: boolean
}

const defaultPreferences: AlertPreference[] = [
  {
    id: 'bias',
    name: 'Bias Edge Alerts',
    description: 'Favorite-longshot bias detection at extreme probabilities',
    enabled: true,
    minConfidence: 75,
    channels: ['email', 'push']
  },
  {
    id: 'volume',
    name: 'Volume Spike Alerts',
    description: 'Unusual trading volume indicating informed activity',
    enabled: true,
    minConfidence: 70,
    channels: ['push']
  },
  {
    id: 'news',
    name: 'News Lag Alerts',
    description: 'Markets slow to integrate breaking news events',
    enabled: true,
    minConfidence: 65,
    channels: ['push', 'sms']
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage Alerts',
    description: 'Cross-platform price discrepancies',
    enabled: false,
    minConfidence: 80,
    channels: ['email']
  },
  {
    id: 'time',
    name: 'Time Bias Alerts',
    description: 'Long-dated markets with time preference mispricing',
    enabled: true,
    minConfidence: 70,
    channels: ['email']
  }
]

const recentAlerts: EdgeAlert[] = [
  {
    id: '1',
    type: 'news',
    market: 'Ukraine Ceasefire by March 2026',
    signal: 'buy',
    confidence: 68,
    edge: -8,
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    read: false
  },
  {
    id: '2',
    type: 'bias',
    market: 'Trump wins 2028 Republican Primary',
    signal: 'sell',
    confidence: 78,
    edge: 3.5,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true
  },
  {
    id: '3',
    type: 'volume',
    market: 'Fed Cuts Rates in January 2026',
    signal: 'buy',
    confidence: 72,
    edge: -6,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true
  }
]

const typeConfig = {
  bias: { color: '#00FF88', icon: Target, label: 'Bias' },
  volume: { color: '#00A8FF', icon: Volume2, label: 'Volume' },
  news: { color: '#FF6B00', icon: Newspaper, label: 'News' },
  arbitrage: { color: '#9B59B6', icon: BarChart3, label: 'Arbitrage' },
  time: { color: '#FFD700', icon: Clock, label: 'Time' },
}

export default function AlertsPage() {
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [alerts, setAlerts] = useState(recentAlerts)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  const togglePreference = (id: string) => {
    setPreferences(prefs => 
      prefs.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
    )
  }
  
  const updateMinConfidence = (id: string, value: number) => {
    setPreferences(prefs =>
      prefs.map(p => p.id === id ? { ...p, minConfidence: value } : p)
    )
  }
  
  const toggleChannel = (prefId: string, channel: 'email' | 'push' | 'sms') => {
    setPreferences(prefs =>
      prefs.map(p => {
        if (p.id !== prefId) return p
        const channels = p.channels.includes(channel)
          ? p.channels.filter(c => c !== channel)
          : [...p.channels, channel]
        return { ...p, channels }
      })
    )
  }
  
  const markAllRead = () => {
    setAlerts(alerts => alerts.map(a => ({ ...a, read: true })))
  }
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, save to database
    setIsSubscribed(true)
  }
  
  const unreadCount = alerts.filter(a => !a.read).length
  
  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#050508]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href="/markets/edge"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to The Edge
        </Link>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 relative">
              <Bell className="w-8 h-8 text-orange-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">Edge Alerts</h1>
              <p className="text-gray-400">Configure high-confidence signal notifications</p>
            </div>
          </div>
        </div>
        
        {/* Subscription Form */}
        {!isSubscribed ? (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              Enable Real-Time Alerts
            </h2>
            <p className="text-gray-400 mb-4">
              Get instant notifications when high-confidence edge signals (75%+) are detected. 
              We only alert on the most actionable opportunities.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-orange-500/50 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone (optional for SMS)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-orange-500/50 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:scale-[1.01] transition-transform"
              >
                Enable Alerts
              </button>
            </form>
          </div>
        ) : (
          <div className="mb-8 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Alerts enabled for {email}</span>
            </div>
            <button 
              onClick={() => setIsSubscribed(false)}
              className="text-sm text-gray-400 hover:text-white"
            >
              Update
            </button>
          </div>
        )}
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Alert Preferences */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Alert Preferences
            </h2>
            <div className="space-y-4">
              {preferences.map((pref) => {
                const config = typeConfig[pref.id as keyof typeof typeConfig]
                const Icon = config.icon
                
                return (
                  <div 
                    key={pref.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      pref.enabled 
                        ? 'bg-white/5 border-white/20' 
                        : 'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-black/30">
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{pref.name}</h3>
                          <p className="text-xs text-gray-500">{pref.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePreference(pref.id)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          pref.enabled ? 'bg-green-500' : 'bg-gray-700'
                        }`}
                        aria-label={`Toggle ${pref.name}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          pref.enabled ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>
                    
                    {pref.enabled && (
                      <>
                        <div className="mb-3">
                          <label className="text-xs text-gray-400 mb-1 block">
                            Min Confidence: {pref.minConfidence}%
                          </label>
                          <input
                            type="range"
                            min="50"
                            max="90"
                            value={pref.minConfidence}
                            onChange={(e) => updateMinConfidence(pref.id, parseInt(e.target.value))}
                            className="w-full h-2 rounded-full bg-gray-700 appearance-none cursor-pointer"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Channels:</span>
                          <button
                            onClick={() => toggleChannel(pref.id, 'email')}
                            className={`p-1.5 rounded-lg transition-colors ${
                              pref.channels.includes('email') 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-white/5 text-gray-500'
                            }`}
                            title="Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleChannel(pref.id, 'push')}
                            className={`p-1.5 rounded-lg transition-colors ${
                              pref.channels.includes('push') 
                                ? 'bg-purple-500/20 text-purple-400' 
                                : 'bg-white/5 text-gray-500'
                            }`}
                            title="Push Notification"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleChannel(pref.id, 'sms')}
                            className={`p-1.5 rounded-lg transition-colors ${
                              pref.channels.includes('sms') 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-white/5 text-gray-500'
                            }`}
                            title="SMS"
                          >
                            <Smartphone className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Recent Alerts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-400" />
                Recent Alerts
              </h2>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <BellOff className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">No alerts yet</p>
                  <p className="text-xs text-gray-500">Configure your preferences to start receiving alerts</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const config = typeConfig[alert.type]
                  const Icon = config.icon
                  const timeAgo = Math.round((Date.now() - alert.timestamp.getTime()) / 60000)
                  const timeString = timeAgo < 60 
                    ? `${timeAgo}m ago` 
                    : `${Math.round(timeAgo / 60)}h ago`
                  
                  return (
                    <Link
                      key={alert.id}
                      href={`/markets/edge/${alert.id}`}
                      className={`block p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                        alert.read 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-orange-500/10 border-orange-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!alert.read && (
                          <span className="w-2 h-2 rounded-full bg-orange-400 mt-2" />
                        )}
                        <div className="p-2 rounded-lg bg-black/30">
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase" style={{ color: config.color }}>
                              {config.label} Signal
                            </span>
                            <span className="text-xs text-gray-500">{timeString}</span>
                          </div>
                          <h3 className="font-medium text-white text-sm mb-1">{alert.market}</h3>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`font-bold ${
                              alert.signal === 'buy' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {alert.signal.toUpperCase()}
                            </span>
                            <span className="text-gray-500">{alert.confidence}% conf</span>
                            <span className={alert.edge > 0 ? 'text-red-400' : 'text-green-400'}>
                              {alert.edge > 0 ? '+' : ''}{alert.edge}% edge
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
        
        {/* Info Section */}
        <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-bold text-white mb-2">How Alerts Work</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <span>We only send alerts for <strong className="text-white">high-confidence signals</strong> (default 75%+) to avoid notification fatigue</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <span>News-based alerts are time-sensitive and include the triggering headline</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <span>Each alert links to full analysis with methodology and research backing</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <span>You can customize minimum confidence threshold per alert type</span>
            </li>
          </ul>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-white mb-1">Disclaimer</h3>
              <p className="text-sm text-gray-400">
                Alerts are for informational purposes only and not financial advice. 
                Past performance does not guarantee future results. Always do your own research.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
