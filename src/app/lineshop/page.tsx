'use client'

import { useState, useMemo } from 'react'
import { 
  ShoppingBag, 
  TrendingUp, 
  TrendingDown, 
  Zap,
  Filter,
  Star,
  ExternalLink,
  Bell,
  ChevronDown,
  Check,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

// Mock data for sportsbooks
const SPORTSBOOKS = [
  { id: 'draftkings', name: 'DraftKings', shortName: 'DK', color: '#00C853' },
  { id: 'fanduel', name: 'FanDuel', shortName: 'FD', color: '#1493FF' },
  { id: 'betmgm', name: 'BetMGM', shortName: 'MGM', color: '#C5A572' },
  { id: 'caesars', name: 'Caesars', shortName: 'CZR', color: '#CD9834' },
  { id: 'pointsbet', name: 'PointsBet', shortName: 'PB', color: '#FF4D00' },
  { id: 'bet365', name: 'Bet365', shortName: '365', color: '#027B5B' },
  { id: 'barstool', name: 'ESPN Bet', shortName: 'ESPN', color: '#FF0000' },
  { id: 'hardrock', name: 'Hard Rock', shortName: 'HR', color: '#8B0000' },
]

interface GameLine {
  id: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  spreadHome: Record<string, { line: number; odds: number }>
  spreadAway: Record<string, { line: number; odds: number }>
  totalOver: Record<string, { line: number; odds: number }>
  totalUnder: Record<string, { line: number; odds: number }>
  moneylineHome: Record<string, number>
  moneylineAway: Record<string, number>
}

// Generate mock game data with varying odds
const generateMockGames = (): GameLine[] => {
  const games: GameLine[] = [
    {
      id: '1',
      sport: 'NFL',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      gameTime: 'Today 4:25 PM',
      spreadHome: {
        draftkings: { line: -3, odds: -110 },
        fanduel: { line: -2.5, odds: -105 },
        betmgm: { line: -3, odds: -105 },
        caesars: { line: -3, odds: -112 },
        pointsbet: { line: -2.5, odds: -110 },
        bet365: { line: -3, odds: -108 },
        barstool: { line: -3, odds: -110 },
        hardrock: { line: -2.5, odds: -112 },
      },
      spreadAway: {
        draftkings: { line: 3, odds: -110 },
        fanduel: { line: 2.5, odds: -115 },
        betmgm: { line: 3, odds: -115 },
        caesars: { line: 3, odds: -108 },
        pointsbet: { line: 2.5, odds: -110 },
        bet365: { line: 3, odds: -112 },
        barstool: { line: 3, odds: -110 },
        hardrock: { line: 2.5, odds: -108 },
      },
      totalOver: {
        draftkings: { line: 47.5, odds: -110 },
        fanduel: { line: 47, odds: -110 },
        betmgm: { line: 47.5, odds: -105 },
        caesars: { line: 47.5, odds: -110 },
        pointsbet: { line: 47, odds: -105 },
        bet365: { line: 47.5, odds: -108 },
        barstool: { line: 47.5, odds: -112 },
        hardrock: { line: 47, odds: -110 },
      },
      totalUnder: {
        draftkings: { line: 47.5, odds: -110 },
        fanduel: { line: 47, odds: -110 },
        betmgm: { line: 47.5, odds: -115 },
        caesars: { line: 47.5, odds: -110 },
        pointsbet: { line: 47, odds: -115 },
        bet365: { line: 47.5, odds: -112 },
        barstool: { line: 47.5, odds: -108 },
        hardrock: { line: 47, odds: -110 },
      },
      moneylineHome: {
        draftkings: -150,
        fanduel: -145,
        betmgm: -148,
        caesars: -152,
        pointsbet: -142,
        bet365: -150,
        barstool: -155,
        hardrock: -147,
      },
      moneylineAway: {
        draftkings: 130,
        fanduel: 125,
        betmgm: 128,
        caesars: 132,
        pointsbet: 122,
        bet365: 130,
        barstool: 135,
        hardrock: 127,
      },
    },
    {
      id: '2',
      sport: 'NBA',
      homeTeam: 'Boston Celtics',
      awayTeam: 'LA Lakers',
      gameTime: 'Today 7:30 PM',
      spreadHome: {
        draftkings: { line: -6.5, odds: -110 },
        fanduel: { line: -6, odds: -110 },
        betmgm: { line: -6.5, odds: -108 },
        caesars: { line: -6.5, odds: -105 },
        pointsbet: { line: -6, odds: -112 },
        bet365: { line: -6.5, odds: -110 },
        barstool: { line: -6, odds: -108 },
        hardrock: { line: -6.5, odds: -115 },
      },
      spreadAway: {
        draftkings: { line: 6.5, odds: -110 },
        fanduel: { line: 6, odds: -110 },
        betmgm: { line: 6.5, odds: -112 },
        caesars: { line: 6.5, odds: -115 },
        pointsbet: { line: 6, odds: -108 },
        bet365: { line: 6.5, odds: -110 },
        barstool: { line: 6, odds: -112 },
        hardrock: { line: 6.5, odds: -105 },
      },
      totalOver: {
        draftkings: { line: 228.5, odds: -110 },
        fanduel: { line: 228, odds: -108 },
        betmgm: { line: 228.5, odds: -110 },
        caesars: { line: 229, odds: -110 },
        pointsbet: { line: 228, odds: -110 },
        bet365: { line: 228.5, odds: -105 },
        barstool: { line: 228, odds: -112 },
        hardrock: { line: 228.5, odds: -108 },
      },
      totalUnder: {
        draftkings: { line: 228.5, odds: -110 },
        fanduel: { line: 228, odds: -112 },
        betmgm: { line: 228.5, odds: -110 },
        caesars: { line: 229, odds: -110 },
        pointsbet: { line: 228, odds: -110 },
        bet365: { line: 228.5, odds: -115 },
        barstool: { line: 228, odds: -108 },
        hardrock: { line: 228.5, odds: -112 },
      },
      moneylineHome: {
        draftkings: -250,
        fanduel: -240,
        betmgm: -245,
        caesars: -255,
        pointsbet: -235,
        bet365: -250,
        barstool: -260,
        hardrock: -242,
      },
      moneylineAway: {
        draftkings: 205,
        fanduel: 195,
        betmgm: 200,
        caesars: 210,
        pointsbet: 190,
        bet365: 205,
        barstool: 215,
        hardrock: 198,
      },
    },
    {
      id: '3',
      sport: 'NHL',
      homeTeam: 'Toronto Maple Leafs',
      awayTeam: 'Montreal Canadiens',
      gameTime: 'Tomorrow 7:00 PM',
      spreadHome: {
        draftkings: { line: -1.5, odds: 145 },
        fanduel: { line: -1.5, odds: 150 },
        betmgm: { line: -1.5, odds: 140 },
        caesars: { line: -1.5, odds: 148 },
        pointsbet: { line: -1.5, odds: 155 },
        bet365: { line: -1.5, odds: 145 },
        barstool: { line: -1.5, odds: 142 },
        hardrock: { line: -1.5, odds: 152 },
      },
      spreadAway: {
        draftkings: { line: 1.5, odds: -175 },
        fanduel: { line: 1.5, odds: -180 },
        betmgm: { line: 1.5, odds: -170 },
        caesars: { line: 1.5, odds: -178 },
        pointsbet: { line: 1.5, odds: -185 },
        bet365: { line: 1.5, odds: -175 },
        barstool: { line: 1.5, odds: -172 },
        hardrock: { line: 1.5, odds: -182 },
      },
      totalOver: {
        draftkings: { line: 6.5, odds: -105 },
        fanduel: { line: 6.5, odds: -110 },
        betmgm: { line: 6, odds: -115 },
        caesars: { line: 6.5, odds: -108 },
        pointsbet: { line: 6, odds: -110 },
        bet365: { line: 6.5, odds: -105 },
        barstool: { line: 6.5, odds: -112 },
        hardrock: { line: 6, odds: -108 },
      },
      totalUnder: {
        draftkings: { line: 6.5, odds: -115 },
        fanduel: { line: 6.5, odds: -110 },
        betmgm: { line: 6, odds: -105 },
        caesars: { line: 6.5, odds: -112 },
        pointsbet: { line: 6, odds: -110 },
        bet365: { line: 6.5, odds: -115 },
        barstool: { line: 6.5, odds: -108 },
        hardrock: { line: 6, odds: -112 },
      },
      moneylineHome: {
        draftkings: -175,
        fanduel: -170,
        betmgm: -180,
        caesars: -178,
        pointsbet: -165,
        bet365: -175,
        barstool: -185,
        hardrock: -172,
      },
      moneylineAway: {
        draftkings: 150,
        fanduel: 145,
        betmgm: 155,
        caesars: 153,
        pointsbet: 140,
        bet365: 150,
        barstool: 160,
        hardrock: 148,
      },
    },
    {
      id: '4',
      sport: 'MLB',
      homeTeam: 'NY Yankees',
      awayTeam: 'Boston Red Sox',
      gameTime: 'Tomorrow 1:05 PM',
      spreadHome: {
        draftkings: { line: -1.5, odds: 135 },
        fanduel: { line: -1.5, odds: 140 },
        betmgm: { line: -1.5, odds: 130 },
        caesars: { line: -1.5, odds: 138 },
        pointsbet: { line: -1.5, odds: 145 },
        bet365: { line: -1.5, odds: 135 },
        barstool: { line: -1.5, odds: 132 },
        hardrock: { line: -1.5, odds: 142 },
      },
      spreadAway: {
        draftkings: { line: 1.5, odds: -160 },
        fanduel: { line: 1.5, odds: -165 },
        betmgm: { line: 1.5, odds: -155 },
        caesars: { line: 1.5, odds: -163 },
        pointsbet: { line: 1.5, odds: -170 },
        bet365: { line: 1.5, odds: -160 },
        barstool: { line: 1.5, odds: -157 },
        hardrock: { line: 1.5, odds: -167 },
      },
      totalOver: {
        draftkings: { line: 8.5, odds: -108 },
        fanduel: { line: 8.5, odds: -105 },
        betmgm: { line: 8, odds: -110 },
        caesars: { line: 8.5, odds: -110 },
        pointsbet: { line: 8, odds: -105 },
        bet365: { line: 8.5, odds: -108 },
        barstool: { line: 8.5, odds: -112 },
        hardrock: { line: 8, odds: -108 },
      },
      totalUnder: {
        draftkings: { line: 8.5, odds: -112 },
        fanduel: { line: 8.5, odds: -115 },
        betmgm: { line: 8, odds: -110 },
        caesars: { line: 8.5, odds: -110 },
        pointsbet: { line: 8, odds: -115 },
        bet365: { line: 8.5, odds: -112 },
        barstool: { line: 8.5, odds: -108 },
        hardrock: { line: 8, odds: -112 },
      },
      moneylineHome: {
        draftkings: -145,
        fanduel: -140,
        betmgm: -150,
        caesars: -148,
        pointsbet: -135,
        bet365: -145,
        barstool: -155,
        hardrock: -142,
      },
      moneylineAway: {
        draftkings: 125,
        fanduel: 120,
        betmgm: 130,
        caesars: 128,
        pointsbet: 115,
        bet365: 125,
        barstool: 135,
        hardrock: 122,
      },
    },
  ]
  return games
}

export default function LineShopPage() {
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [betType, setBetType] = useState<'spread' | 'total' | 'moneyline'>('spread')
  const [showBooks, setShowBooks] = useState<string[]>(SPORTSBOOKS.map(b => b.id))
  
  const games = useMemo(() => generateMockGames(), [])

  const filteredGames = useMemo(() => {
    if (selectedSport === 'all') return games
    return games.filter(g => g.sport === selectedSport)
  }, [games, selectedSport])

  const getBestOdds = (oddsMap: Record<string, number>) => {
    const entries = Object.entries(oddsMap).filter(([key]) => showBooks.includes(key))
    if (entries.length === 0) return { book: '', odds: 0 }
    const best = entries.reduce((a, b) => a[1] > b[1] ? a : b)
    return { book: best[0], odds: best[1] }
  }

  const getBestSpread = (spreadMap: Record<string, { line: number; odds: number }>, isHome: boolean) => {
    const entries = Object.entries(spreadMap).filter(([key]) => showBooks.includes(key))
    if (entries.length === 0) return { book: '', line: 0, odds: 0 }
    
    // For home (favorite), want smallest spread. For away (underdog), want largest
    const best = entries.reduce((a, b) => {
      if (isHome) {
        // Home favored: smaller spread is better (e.g., -2.5 better than -3)
        if (a[1].line > b[1].line) return a
        if (a[1].line === b[1].line && a[1].odds > b[1].odds) return a
        return b
      } else {
        // Away underdog: larger spread is better (e.g., +3 better than +2.5)  
        if (a[1].line > b[1].line) return a
        if (a[1].line === b[1].line && a[1].odds > b[1].odds) return a
        return b
      }
    })
    return { book: best[0], line: best[1].line, odds: best[1].odds }
  }

  const getBestTotal = (totalMap: Record<string, { line: number; odds: number }>, isOver: boolean) => {
    const entries = Object.entries(totalMap).filter(([key]) => showBooks.includes(key))
    if (entries.length === 0) return { book: '', line: 0, odds: 0 }
    
    // For over, want lower line. For under, want higher line.
    const best = entries.reduce((a, b) => {
      if (isOver) {
        if (a[1].line < b[1].line) return a
        if (a[1].line === b[1].line && a[1].odds > b[1].odds) return a
        return b
      } else {
        if (a[1].line > b[1].line) return a
        if (a[1].line === b[1].line && a[1].odds > b[1].odds) return a
        return b
      }
    })
    return { book: best[0], line: best[1].line, odds: best[1].odds }
  }

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`
  }

  const sports = ['all', 'NFL', 'NBA', 'NHL', 'MLB']

  const toggleBook = (bookId: string) => {
    if (showBooks.includes(bookId)) {
      setShowBooks(showBooks.filter(b => b !== bookId))
    } else {
      setShowBooks([...showBooks, bookId])
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #FF6B00, #FFD700)' }}>
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">Line Shop</h1>
              <p style={{ color: '#808090' }} className="text-sm">Compare odds across all major sportsbooks instantly</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Sport Filter */}
          <div className="flex gap-2">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: selectedSport === sport ? '#FF6B00' : '#12121A',
                  color: selectedSport === sport ? '#FFF' : '#808090'
                }}
              >
                {sport === 'all' ? 'All Sports' : sport}
              </button>
            ))}
          </div>
          
          {/* Bet Type Filter */}
          <div className="flex gap-2 ml-auto">
            {(['spread', 'total', 'moneyline'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setBetType(type)}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all capitalize"
                style={{
                  background: betType === type ? '#00A8FF' : '#12121A',
                  color: betType === type ? '#FFF' : '#808090'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Sportsbook Toggle */}
        <div className="mb-6 p-4 rounded-xl" style={{ background: '#12121A' }}>
          <p className="text-sm font-medium mb-3" style={{ color: '#808090' }}>Active Sportsbooks</p>
          <div className="flex flex-wrap gap-2">
            {SPORTSBOOKS.map((book) => (
              <button
                key={book.id}
                onClick={() => toggleBook(book.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: showBooks.includes(book.id) ? `${book.color}20` : '#0A0A0F',
                  color: showBooks.includes(book.id) ? book.color : '#808090',
                  border: `1px solid ${showBooks.includes(book.id) ? book.color : 'rgba(255,255,255,0.1)'}`
                }}
              >
                {showBooks.includes(book.id) && <Check className="w-3 h-3" />}
                {book.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#12121A' }}
            >
              {/* Game Header */}
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#FF6B0020', color: '#FF6B00' }}>
                    {game.sport}
                  </span>
                  <p className="text-lg font-bold text-white mt-2">{game.awayTeam} @ {game.homeTeam}</p>
                  <p className="text-sm" style={{ color: '#808090' }}>{game.gameTime}</p>
                </div>
                <button className="p-2 rounded-lg transition-all hover:bg-white/5">
                  <Bell className="w-5 h-5" style={{ color: '#808090' }} />
                </button>
              </div>

              {/* Odds Grid */}
              <div className="p-6">
                {betType === 'spread' && (
                  <div className="space-y-4">
                    {/* Away Team Spread */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">{game.awayTeam}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#00FF8820', color: '#00FF88' }}>
                          Best: {getBestSpread(game.spreadAway, false).line > 0 ? '+' : ''}{getBestSpread(game.spreadAway, false).line} ({formatOdds(getBestSpread(game.spreadAway, false).odds)})
                        </span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {SPORTSBOOKS.filter(b => showBooks.includes(b.id)).map((book) => {
                          const spread = game.spreadAway[book.id]
                          const best = getBestSpread(game.spreadAway, false)
                          const isBest = book.id === best.book
                          return (
                            <div
                              key={book.id}
                              className="p-3 rounded-xl text-center transition-all hover:scale-105 cursor-pointer"
                              style={{
                                background: isBest ? 'rgba(0,255,136,0.1)' : '#0A0A0F',
                                border: isBest ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.05)'
                              }}
                            >
                              <p className="text-[10px] font-medium mb-1" style={{ color: book.color }}>{book.shortName}</p>
                              <p className="text-sm font-bold text-white">{spread.line > 0 ? '+' : ''}{spread.line}</p>
                              <p className="text-xs" style={{ color: isBest ? '#00FF88' : '#808090' }}>{formatOdds(spread.odds)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Home Team Spread */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">{game.homeTeam}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#00FF8820', color: '#00FF88' }}>
                          Best: {getBestSpread(game.spreadHome, true).line > 0 ? '+' : ''}{getBestSpread(game.spreadHome, true).line} ({formatOdds(getBestSpread(game.spreadHome, true).odds)})
                        </span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {SPORTSBOOKS.filter(b => showBooks.includes(b.id)).map((book) => {
                          const spread = game.spreadHome[book.id]
                          const best = getBestSpread(game.spreadHome, true)
                          const isBest = book.id === best.book
                          return (
                            <div
                              key={book.id}
                              className="p-3 rounded-xl text-center transition-all hover:scale-105 cursor-pointer"
                              style={{
                                background: isBest ? 'rgba(0,255,136,0.1)' : '#0A0A0F',
                                border: isBest ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.05)'
                              }}
                            >
                              <p className="text-[10px] font-medium mb-1" style={{ color: book.color }}>{book.shortName}</p>
                              <p className="text-sm font-bold text-white">{spread.line > 0 ? '+' : ''}{spread.line}</p>
                              <p className="text-xs" style={{ color: isBest ? '#00FF88' : '#808090' }}>{formatOdds(spread.odds)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {betType === 'total' && (
                  <div className="space-y-4">
                    {/* Over */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">Over</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#00FF8820', color: '#00FF88' }}>
                          Best: O{getBestTotal(game.totalOver, true).line} ({formatOdds(getBestTotal(game.totalOver, true).odds)})
                        </span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {SPORTSBOOKS.filter(b => showBooks.includes(b.id)).map((book) => {
                          const total = game.totalOver[book.id]
                          const best = getBestTotal(game.totalOver, true)
                          const isBest = book.id === best.book
                          return (
                            <div
                              key={book.id}
                              className="p-3 rounded-xl text-center transition-all hover:scale-105 cursor-pointer"
                              style={{
                                background: isBest ? 'rgba(0,255,136,0.1)' : '#0A0A0F',
                                border: isBest ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.05)'
                              }}
                            >
                              <p className="text-[10px] font-medium mb-1" style={{ color: book.color }}>{book.shortName}</p>
                              <p className="text-sm font-bold text-white">O{total.line}</p>
                              <p className="text-xs" style={{ color: isBest ? '#00FF88' : '#808090' }}>{formatOdds(total.odds)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Under */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">Under</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#00FF8820', color: '#00FF88' }}>
                          Best: U{getBestTotal(game.totalUnder, false).line} ({formatOdds(getBestTotal(game.totalUnder, false).odds)})
                        </span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {SPORTSBOOKS.filter(b => showBooks.includes(b.id)).map((book) => {
                          const total = game.totalUnder[book.id]
                          const best = getBestTotal(game.totalUnder, false)
                          const isBest = book.id === best.book
                          return (
                            <div
                              key={book.id}
                              className="p-3 rounded-xl text-center transition-all hover:scale-105 cursor-pointer"
                              style={{
                                background: isBest ? 'rgba(0,255,136,0.1)' : '#0A0A0F',
                                border: isBest ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.05)'
                              }}
                            >
                              <p className="text-[10px] font-medium mb-1" style={{ color: book.color }}>{book.shortName}</p>
                              <p className="text-sm font-bold text-white">U{total.line}</p>
                              <p className="text-xs" style={{ color: isBest ? '#00FF88' : '#808090' }}>{formatOdds(total.odds)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {betType === 'moneyline' && (
                  <div className="space-y-4">
                    {/* Away ML */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">{game.awayTeam}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#00FF8820', color: '#00FF88' }}>
                          Best: {formatOdds(getBestOdds(game.moneylineAway).odds)}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {SPORTSBOOKS.filter(b => showBooks.includes(b.id)).map((book) => {
                          const ml = game.moneylineAway[book.id]
                          const best = getBestOdds(game.moneylineAway)
                          const isBest = book.id === best.book
                          return (
                            <div
                              key={book.id}
                              className="p-3 rounded-xl text-center transition-all hover:scale-105 cursor-pointer"
                              style={{
                                background: isBest ? 'rgba(0,255,136,0.1)' : '#0A0A0F',
                                border: isBest ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.05)'
                              }}
                            >
                              <p className="text-[10px] font-medium mb-1" style={{ color: book.color }}>{book.shortName}</p>
                              <p className="text-sm font-bold" style={{ color: isBest ? '#00FF88' : '#FFF' }}>{formatOdds(ml)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Home ML */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">{game.homeTeam}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#00FF8820', color: '#00FF88' }}>
                          Best: {formatOdds(getBestOdds(game.moneylineHome).odds)}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {SPORTSBOOKS.filter(b => showBooks.includes(b.id)).map((book) => {
                          const ml = game.moneylineHome[book.id]
                          const best = getBestOdds(game.moneylineHome)
                          const isBest = book.id === best.book
                          return (
                            <div
                              key={book.id}
                              className="p-3 rounded-xl text-center transition-all hover:scale-105 cursor-pointer"
                              style={{
                                background: isBest ? 'rgba(0,255,136,0.1)' : '#0A0A0F',
                                border: isBest ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.05)'
                              }}
                            >
                              <p className="text-[10px] font-medium mb-1" style={{ color: book.color }}>{book.shortName}</p>
                              <p className="text-sm font-bold" style={{ color: isBest ? '#00FF88' : '#FFF' }}>{formatOdds(ml)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
