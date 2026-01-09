/**
 * Share Expert Stats Button
 * Generates shareable content for Twitter/X
 * Perfect for viral exposure of expert records
 */

'use client'

import { useState } from 'react'
import { Share2, Twitter, Copy, Check, ExternalLink } from 'lucide-react'

interface ShareExpertButtonProps {
  expertName: string
  expertSlug: string
  record: string
  winPct: number
  units: number
  roi: number
  streak: string
  network?: string
  timeframe?: string
}

export function ShareExpertButton({
  expertName,
  expertSlug,
  record,
  winPct,
  units,
  roi,
  streak,
  network,
  timeframe = 'season',
}: ShareExpertButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Determine tone based on performance
  const isEmbarrassing = winPct < 48 || units < 0
  const isElite = winPct >= 55 && units > 10
  
  // Generate share text
  const generateShareText = () => {
    const emoji = isEmbarrassing ? '🚨' : isElite ? '🔥' : '📊'
    const headline = isEmbarrassing 
      ? 'RECEIPTS EXPOSED' 
      : isElite 
        ? 'ELITE RECORD ALERT'
        : 'EXPERT TRACKER UPDATE'
    
    const verdict = isEmbarrassing
      ? `The "experts" don't want you to see this...`
      : isElite
        ? `Actually knows what they're doing 👀`
        : `Tracked and verified.`
    
    const text = `${emoji} ${headline} ${emoji}

${expertName}${network ? ` (${network})` : ''}:
📊 Record: ${record} (${winPct.toFixed(1)}%)
💰 Units: ${units >= 0 ? '+' : ''}${units.toFixed(1)}
📈 ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%
🔥 Streak: ${streak}

${verdict}

Track every TV "expert" at matchups.app/leaderboard/${expertSlug}`

    return text
  }
  
  const shareText = generateShareText()
  const ogImageUrl = `https://matchups.app/api/og/expert/${expertSlug}?timeframe=${timeframe}`
  const shareUrl = `https://matchups.app/leaderboard/${expertSlug}`
  
  // Twitter/X share URL
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
        style={{
          background: isEmbarrassing 
            ? 'rgba(255,68,85,0.2)' 
            : isElite 
              ? 'rgba(0,255,136,0.2)'
              : 'rgba(255,215,0,0.2)',
          color: isEmbarrassing ? '#FF4455' : isElite ? '#00FF88' : '#FFD700',
          border: `1px solid ${isEmbarrassing ? 'rgba(255,68,85,0.3)' : isElite ? 'rgba(0,255,136,0.3)' : 'rgba(255,215,0,0.3)'}`,
        }}
      >
        <Share2 className="w-3.5 h-3.5" />
        {isEmbarrassing ? 'Expose' : 'Share'}
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50 shadow-2xl"
          style={{ 
            background: '#0c0c14', 
            border: '1px solid rgba(255,255,255,0.1)' 
          }}
        >
          {/* Preview */}
          <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#606070' }}>
              PREVIEW
            </p>
            <div 
              className="p-3 rounded-lg text-xs whitespace-pre-wrap"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                color: '#A0A0B0',
                maxHeight: '150px',
                overflow: 'auto',
              }}
            >
              {shareText}
            </div>
          </div>
          
          {/* OG Image Preview */}
          <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#606070' }}>
              CARD PREVIEW
            </p>
            <div 
              className="rounded-lg overflow-hidden"
              style={{ 
                background: 'rgba(255,255,255,0.05)',
                aspectRatio: '1200/630',
              }}
            >
              <img 
                src={ogImageUrl} 
                alt="Stats Card Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-3 flex gap-2">
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
              style={{ 
                background: 'rgba(29,161,242,0.2)', 
                color: '#1DA1F2',
                border: '1px solid rgba(29,161,242,0.3)',
              }}
            >
              <Twitter className="w-4 h-4" />
              Post to X
            </a>
            
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
              style={{ 
                background: copied ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.1)', 
                color: copied ? '#00FF88' : '#A0A0B0',
                border: `1px solid ${copied ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>
          
          {/* View Full Profile */}
          <div className="p-3 pt-0">
            <a
              href={shareUrl}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10 w-full"
              style={{ 
                background: 'rgba(255,215,0,0.1)', 
                color: '#FFD700',
                border: '1px solid rgba(255,215,0,0.2)',
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Full Profile
            </a>
          </div>
          
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: '#606070' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Quick Share Row Component - for table rows
 */
export function QuickShareButton({
  expertName,
  expertSlug,
  winPct,
  units,
}: Pick<ShareExpertButtonProps, 'expertName' | 'expertSlug' | 'winPct' | 'units'>) {
  const isEmbarrassing = winPct < 48 || units < 0
  
  const quickShareText = isEmbarrassing
    ? `📉 ${expertName}: ${winPct.toFixed(1)}% win rate, ${units >= 0 ? '+' : ''}${units.toFixed(1)} units. Receipts at matchups.app/leaderboard/${expertSlug}`
    : `📈 ${expertName}: ${winPct.toFixed(1)}% win rate, +${units.toFixed(1)} units. Stats at matchups.app/leaderboard/${expertSlug}`
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(quickShareText)}`
  
  return (
    <a
      href={twitterUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="p-1.5 rounded-lg transition-all hover:scale-110"
      style={{
        background: isEmbarrassing ? 'rgba(255,68,85,0.2)' : 'rgba(0,255,136,0.2)',
        color: isEmbarrassing ? '#FF4455' : '#00FF88',
      }}
      title={isEmbarrassing ? 'Expose this expert' : 'Share this expert'}
    >
      <Share2 className="w-3.5 h-3.5" />
    </a>
  )
}
