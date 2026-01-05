'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Filter,
  Settings,
  ChevronRight,
  AlertTriangle,
  Activity,
  Target,
  DollarSign,
  Users,
  RefreshCw
} from 'lucide-react'

interface Alert {
  id: string
  type: 'line_move' | 'sharp_action' | 'injury' | 'weather' | 'public_money'
  sport: 'NFL' | 'NBA' | 'NHL' | 'MLB'
  title: string
  description: string
  game: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  data?: {
    oldLine?: number
    newLine?: number
    movement?: number
    percentage?: number
  }
}

// Mock alerts
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'line_move',
    sport: 'NFL',
    title: 'Major Line Movement',
    description: 'Line moved 3.5 points in 2 hours',
    game: 'Chiefs @ Ravens',
    timestamp: '5 mins ago',
    severity: 'critical',
    data: { oldLine: -7, newLine: -3.5, movement: 3.5 }
  },
  {
    id: '2',
    type: 'sharp_action',
    sport: 'NBA',
    title: 'Sharp Money Detected',
    description: '65% of money on Celtics despite 40% of bets',
    game: 'Celtics @ Lakers',
    timestamp: '12 mins ago',
    severity: 'high',
    data: { percentage: 65 }
  },
  {
    id: '3',
    type: 'injury',
    sport: 'NBA',
    title: 'Star Player Out',
    description: 'Ja Morant ruled OUT - Line shifting',
    game: 'Grizzlies @ Suns',
    timestamp: '20 mins ago',
    severity: 'critical'
  },
  {
    id: '4',
    type: 'public_money',
    sport: 'NFL',
    title: 'Heavy Public Action',
    description: '85% of public bets on Cowboys',
    game: 'Cowboys @ Eagles',
    timestamp: '35 mins ago',
    severity: 'medium',
    data: { percentage: 85 }
  },
  {
    id: '5',
    type: 'line_move',
    sport: 'NHL',
    title: 'Reverse Line Movement',
    description: 'Line moving against public money',
    game: 'Oilers @ Flames',
    timestamp: '1 hour ago',
    severity: 'high',
    data: { oldLine: -150, newLine: -130, movement: 20 }
  },
  {
    id: '6',
    type: 'weather',
    sport: 'MLB',
    title: 'Weather Alert',
    description: 'High winds (25mph) at Wrigley Field',
    game: 'Cubs @ Cardinals',
    timestamp: '2 hours ago',
    severity: 'medium'
  },
  {
    id: '7',
    type: 'sharp_action',
    sport: 'NFL',
    title: 'Steam Move',
    description: 'Coordinated sharp action detected',
    game: 'Bills @ Dolphins',
    timestamp: '3 hours ago',
    severity: 'high',
    data: { percentage: 70 }
  }
]

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'line_move': return TrendingUp
    case 'sharp_action': return Zap
    case 'injury': return Activity
    case 'weather': return AlertTriangle
    case 'public_money': return Users
    default: return Bell
  }
}

const getAlertColor = (type: string) => {
  switch (type) {
    case 'line_move': return '#00A8FF'
    case 'sharp_action': return '#FFD700'
    case 'injury': return '#FF3366'
    case 'weather': return '#FF6B00'
    case 'public_money': return '#9B59B6'
    default: return '#808090'
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return '#FF3366'
    case 'high': return '#FF6B00'
    case 'medium': return '#FFD700'
    case 'low': return '#00FF88'
    default: return '#808090'
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  const filteredAlerts = alerts.filter(alert => {
    if (selectedType !== 'all' && alert.type !== selectedType) return false
    if (selectedSport !== 'all' && alert.sport !== selectedSport) return false
    return true
  })

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  const alertTypes = [
    { id: 'all', label: 'All Alerts', icon: Bell },
    { id: 'line_move', label: 'Line Moves', icon: TrendingUp },
    { id: 'sharp_action', label: 'Sharp Action', icon: Zap },
    { id: 'injury', label: 'Injuries', icon: Activity },
    { id: 'public_money', label: 'Public Money', icon: Users },
  ]

  const sports = ['all', 'NFL', 'NBA', 'NHL', 'MLB']

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const highCount = alerts.filter(a => a.severity === 'high').length

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #FFD700, #FF6B00)' }}>
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">Live Alerts</h1>
                <p style={{ color: '#808090' }} className="text-sm">Real-time betting intelligence</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)' }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#FF3366' }} />
                <span className="text-sm font-bold" style={{ color: '#FF3366' }}>{criticalCount} Critical</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all hover:scale-105"
              style={{ background: '#12121A', color: '#808090' }}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Alert Type Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {alertTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: selectedType === type.id ? getAlertColor(type.id) + '20' : '#12121A',
                  color: selectedType === type.id ? getAlertColor(type.id) : '#808090',
                  border: selectedType === type.id ? `1px solid ${getAlertColor(type.id)}40` : '1px solid transparent'
                }}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            )
          })}
        </div>

        {/* Sport Filters */}
        <div className="flex gap-2 mb-6">
          {sports.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: selectedSport === sport ? '#FF6B00' : '#12121A',
                color: selectedSport === sport ? '#FFF' : '#808090'
              }}
            >
              {sport === 'all' ? 'All Sports' : sport}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type)
            const color = getAlertColor(alert.type)
            const severityColor = getSeverityColor(alert.severity)
            
            return (
              <div
                key={alert.id}
                className="rounded-xl p-4 transition-all hover:scale-[1.01]"
                style={{ 
                  background: '#12121A',
                  borderLeft: `4px solid ${severityColor}`
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{alert.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#FF6B0020', color: '#FF6B00' }}>
                          {alert.sport}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ background: `${severityColor}20`, color: severityColor }}>
                          {alert.severity}
                        </span>
                      </div>
                      <span className="text-xs flex items-center gap-1" style={{ color: '#808090' }}>
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-2" style={{ color: '#808090' }}>{alert.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#FFF' }}>{alert.game}</span>
                      
                      {alert.data && (
                        <div className="flex items-center gap-3">
                          {alert.data.oldLine !== undefined && (
                            <div className="flex items-center gap-2 text-sm">
                              <span style={{ color: '#808090' }}>{alert.data.oldLine}</span>
                              <ChevronRight className="w-4 h-4" style={{ color: '#808090' }} />
                              <span className="font-bold" style={{ color: severityColor }}>{alert.data.newLine}</span>
                            </div>
                          )}
                          {alert.data.percentage && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" style={{ color: '#FFD700' }} />
                              <span className="font-bold" style={{ color: '#FFD700' }}>{alert.data.percentage}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: '#808090' }} />
              <p className="text-lg text-white mb-2">No alerts found</p>
              <p style={{ color: '#808090' }}>Adjust your filters or check back later</p>
            </div>
          )}
        </div>

        {/* Subscription CTA */}
        <div className="mt-8 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,107,0,0.1))', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Get Instant Notifications</h3>
              <p style={{ color: '#808090' }}>Never miss a sharp move. Get alerts via email, SMS, or push notifications.</p>
            </div>
            <button className="px-6 py-3 rounded-xl font-bold text-black transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #FFD700, #FF6B00)' }}>
              Enable Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
