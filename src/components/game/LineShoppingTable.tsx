'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Info, Database } from 'lucide-react'

interface BookOdds {
  bookmaker: string
  spread: number
  spreadOdds: number
  total: number
  overOdds: number
  underOdds: number
  homeML: number
  awayML: number
}

interface BestLine {
  book: string
  odds: number
  line: number
  over?: number
}

interface MultiBookOdds {
  books: BookOdds[]
  bestSpread: BestLine
  bestTotal: BestLine
  bestHomeML: BestLine
  bestAwayML: BestLine
  loading: boolean
}

interface LineShoppingTableProps {
  gameId: string
  sport: string
  homeAbbr: string
  awayAbbr: string
}

function formatBookmakerName(key: string): string {
  const names: Record<string, string> = {
    draftkings: 'DraftKings', fanduel: 'FanDuel', betmgm: 'BetMGM',
    caesars: 'Caesars', pointsbet: 'PointsBet', betrivers: 'BetRivers',
    espnbet: 'ESPN BET', fanatics: 'Fanatics', bet365: 'bet365',
    unibet: 'Unibet', wynnbet: 'WynnBET', superbook: 'SuperBook',
    bovada: 'Bovada', betonlineag: 'BetOnline', mybookieag: 'MyBookie',
    williamhill_us: 'Caesars', consensus: 'Consensus'
  }
  return names[key?.toLowerCase()] || key?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

export default function LineShoppingTable({ gameId, sport, homeAbbr, awayAbbr }: LineShoppingTableProps) {
  const [multiBookOdds, setMultiBookOdds] = useState<MultiBookOdds>({
    books: [], loading: true,
    bestSpread: { book: '', odds: 0, line: 0 },
    bestTotal: { book: '', odds: 0, line: 0 },
    bestHomeML: { book: '', odds: 0, line: 0 },
    bestAwayML: { book: '', odds: 0, line: 0 },
  })

  useEffect(() => {
    const fetchOdds = async () => {
      try {
        // Try Action Network first for multi-book
        const anRes = await fetch(`/api/action-odds?sport=${sport}&gameId=${gameId}`)
        if (anRes.ok) {
          const anData = await anRes.json()
          if (anData.books?.length > 0) {
            setMultiBookOdds({ ...anData, loading: false })
            return
          }
        }
        // Fallback to The Odds API
        const oddsRes = await fetch(`/api/odds?sport=${sport}`)
        if (oddsRes.ok) {
          const oddsData = await oddsRes.json()
          if (oddsData.books?.length > 0) {
            setMultiBookOdds({ ...oddsData, loading: false })
            return
          }
        }
        setMultiBookOdds(prev => ({ ...prev, loading: false }))
      } catch {
        setMultiBookOdds(prev => ({ ...prev, loading: false }))
      }
    }
    fetchOdds()
  }, [gameId, sport])

  if (multiBookOdds.loading) return null
  if (multiBookOdds.books.length === 0) return null

  return (
    <div className="rounded-xl p-5 mb-6 bg-slate-900/50 border border-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-green-500/20">
          <DollarSign className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Shop the Best Lines
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-500 cursor-help" />
              <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 z-10 shadow-xl">
                <p className="font-semibold text-white mb-1">Why Line Shop?</p>
                <p>Different sportsbooks offer different odds. Getting -108 instead of -110 on every bet adds up to thousands in profit over time.</p>
              </div>
            </div>
          </h2>
          <p className="text-sm text-slate-400">Compare odds across {multiBookOdds.books.length} sportsbooks</p>
        </div>
      </div>

      {/* Best Lines Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-xs text-slate-500">Best {homeAbbr} Spread</p>
          <p className="text-lg font-bold text-green-400">{multiBookOdds.bestSpread.odds > 0 ? '+' : ''}{multiBookOdds.bestSpread.odds}</p>
          <p className="text-xs text-slate-400">{formatBookmakerName(multiBookOdds.bestSpread.book)}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-slate-500">Best {homeAbbr} ML</p>
          <p className="text-lg font-bold text-blue-400">{multiBookOdds.bestHomeML.odds > 0 ? '+' : ''}{multiBookOdds.bestHomeML.odds}</p>
          <p className="text-xs text-slate-400">{formatBookmakerName(multiBookOdds.bestHomeML.book)}</p>
        </div>
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <p className="text-xs text-slate-500">Best {awayAbbr} ML</p>
          <p className="text-lg font-bold text-orange-400">{multiBookOdds.bestAwayML.odds > 0 ? '+' : ''}{multiBookOdds.bestAwayML.odds}</p>
          <p className="text-xs text-slate-400">{formatBookmakerName(multiBookOdds.bestAwayML.book)}</p>
        </div>
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <p className="text-xs text-slate-500">Books Compared</p>
          <p className="text-lg font-bold text-purple-400">{multiBookOdds.books.length}</p>
          <p className="text-xs text-slate-400">Sportsbooks</p>
        </div>
      </div>

      {/* Odds Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left py-2 px-3">Book</th>
              <th className="text-center py-2 px-3">Spread</th>
              <th className="text-center py-2 px-3">Total</th>
              <th className="text-center py-2 px-3">{awayAbbr} ML</th>
              <th className="text-center py-2 px-3">{homeAbbr} ML</th>
            </tr>
          </thead>
          <tbody>
            {multiBookOdds.books.slice(0, 8).map((book, i) => (
              <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-2 px-3 font-medium text-white">{formatBookmakerName(book.bookmaker)}</td>
                <td className="py-2 px-3 text-center">
                  <span className="text-white font-mono">{book.spread > 0 ? '+' : ''}{book.spread}</span>
                  <span className="text-slate-500 ml-1">({book.spreadOdds > 0 ? '+' : ''}{book.spreadOdds})</span>
                </td>
                <td className="py-2 px-3 text-center">
                  <span className="text-white font-mono">{book.total}</span>
                  <span className="text-slate-500 ml-1">(o{book.overOdds}/u{book.underOdds})</span>
                </td>
                <td className={`py-2 px-3 text-center font-mono ${book.awayML > 0 ? 'text-green-400' : 'text-white'}`}>
                  {book.awayML > 0 ? '+' : ''}{book.awayML}
                </td>
                <td className={`py-2 px-3 text-center font-mono ${book.homeML > 0 ? 'text-green-400' : 'text-white'}`}>
                  {book.homeML > 0 ? '+' : ''}{book.homeML}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600 mt-3 flex items-center gap-1">
        <Database className="w-3 h-3" />
        Odds data from The Odds API • Updated in real-time
      </p>
    </div>
  )
}
