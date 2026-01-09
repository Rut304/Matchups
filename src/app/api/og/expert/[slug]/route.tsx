/**
 * Dynamic OG Image for Expert Stats Cards
 * Generates shareable images for Twitter/X with expert records
 * 
 * Usage: /api/og/expert/[slug]?timeframe=week
 */

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { cappers, getCapperStatsByDays } from '@/lib/leaderboard-data'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get('timeframe') || 'season'
  
  // Map timeframe to days
  const daysMap: Record<string, number | null> = {
    today: 1,
    '3days': 3,
    week: 7,
    '2weeks': 14,
    month: 30,
    season: 120,
    all: null,
  }
  
  const daysBack = daysMap[timeframe] ?? 120
  
  // Find the capper
  const capper = cappers.find(c => c.slug === slug)
  
  if (!capper) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#050508',
            color: '#FF4455',
            fontSize: 48,
            fontWeight: 'bold',
          }}
        >
          Expert Not Found
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }
  
  // Get stats
  const stats = getCapperStatsByDays(capper.id, daysBack)
  const winPct = stats.winPercentage
  
  // Determine embarrassment level
  const getEmbarrassmentLevel = (pct: number) => {
    if (pct < 45) return { level: 'YIKES', color: '#FF4455', emoji: '💀' }
    if (pct < 48) return { level: 'BAD', color: '#FF6B00', emoji: '😬' }
    if (pct < 52) return { level: 'MEH', color: '#FFD700', emoji: '😐' }
    if (pct < 55) return { level: 'GOOD', color: '#00FF88', emoji: '👍' }
    return { level: 'ELITE', color: '#00FF88', emoji: '🔥' }
  }
  
  const embarrassment = getEmbarrassmentLevel(winPct)
  
  // Generate timeframe label
  const timeframeLabels: Record<string, string> = {
    today: 'Today',
    '3days': 'Last 3 Days',
    week: 'Last 7 Days',
    '2weeks': 'Last 14 Days',
    month: 'Last 30 Days',
    season: 'This Season',
    all: 'All Time',
  }
  
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#050508',
          padding: '40px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '48px' }}>{capper.avatarEmoji}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '42px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}
              >
                {capper.name}
              </span>
              <span style={{ fontSize: '24px', color: '#808090' }}>
                {capper.network} • {capper.role}
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <span
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: embarrassment.color,
              }}
            >
              {embarrassment.emoji} {embarrassment.level}
            </span>
            <span style={{ fontSize: '18px', color: '#606070' }}>
              {timeframeLabels[timeframe] || 'Season'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flex: 1,
          }}
        >
          {/* Record */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '20px',
              padding: '30px',
            }}
          >
            <span style={{ fontSize: '24px', color: '#606070' }}>RECORD</span>
            <span
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#FFFFFF',
              }}
            >
              {stats.wins}-{stats.losses}
            </span>
            {stats.pushes > 0 && (
              <span style={{ fontSize: '20px', color: '#808090' }}>
                ({stats.pushes} pushes)
              </span>
            )}
          </div>

          {/* Win % */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                winPct >= 52
                  ? 'rgba(0,255,136,0.1)'
                  : winPct < 48
                    ? 'rgba(255,68,85,0.1)'
                    : 'rgba(255,215,0,0.1)',
              borderRadius: '20px',
              padding: '30px',
            }}
          >
            <span style={{ fontSize: '24px', color: '#606070' }}>WIN %</span>
            <span
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color:
                  winPct >= 52
                    ? '#00FF88'
                    : winPct < 48
                      ? '#FF4455'
                      : '#FFD700',
              }}
            >
              {winPct.toFixed(1)}%
            </span>
            <span style={{ fontSize: '20px', color: '#808090' }}>
              {winPct >= 52 ? 'Profitable' : winPct < 48 ? 'Losing' : 'Break-even'}
            </span>
          </div>

          {/* Units */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                stats.netUnits >= 0
                  ? 'rgba(0,255,136,0.1)'
                  : 'rgba(255,68,85,0.1)',
              borderRadius: '20px',
              padding: '30px',
            }}
          >
            <span style={{ fontSize: '24px', color: '#606070' }}>UNITS</span>
            <span
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: stats.netUnits >= 0 ? '#00FF88' : '#FF4455',
              }}
            >
              {stats.netUnits >= 0 ? '+' : ''}
              {stats.netUnits.toFixed(1)}
            </span>
            <span style={{ fontSize: '20px', color: '#808090' }}>
              {stats.roiPercentage >= 0 ? '+' : ''}
              {stats.roiPercentage.toFixed(1)}% ROI
            </span>
          </div>

          {/* Streak */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,107,0,0.1)',
              borderRadius: '20px',
              padding: '30px',
            }}
          >
            <span style={{ fontSize: '24px', color: '#606070' }}>STREAK</span>
            <span
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: stats.recentForm.startsWith('W') ? '#00FF88' : '#FF4455',
              }}
            >
              {stats.recentForm || 'N/A'}
            </span>
            <span style={{ fontSize: '20px', color: '#808090' }}>
              Recent Form
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '32px' }}>🎯</span>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#FFD700',
              }}
            >
              MATCHUPS.APP
            </span>
            <span style={{ fontSize: '20px', color: '#606070' }}>
              • Expert Tracker
            </span>
          </div>
          <span style={{ fontSize: '18px', color: '#404050' }}>
            Receipts don't lie • Every pick tracked
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
