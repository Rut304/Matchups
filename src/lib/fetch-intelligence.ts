/**
 * Shared intelligence fetcher for sport matchup pages.
 * Maps /api/games/[id]/intelligence response → TheEdgeSection's IntelligenceData shape.
 */
export async function fetchIntelligence(
  gameId: string,
  sport: string,
  game: { homeTeam: { name: string; abbreviation: string }; awayTeam: { name: string; abbreviation: string }; odds?: { spread?: number; overUnder?: number } }
) {
  const params = new URLSearchParams({
    sport: sport.toUpperCase(),
    home: game.homeTeam.name,
    homeAbbr: game.homeTeam.abbreviation,
    away: game.awayTeam.name,
    awayAbbr: game.awayTeam.abbreviation,
    ai: 'true',
    live: 'false',
  })
  if (game.odds?.spread) params.set('spread', String(game.odds.spread))
  if (game.odds?.overUnder) params.set('total', String(game.odds.overUnder))

  const res = await fetch(`/api/games/${gameId}/intelligence?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  if (!data.success) return null

  return {
    edgeScore: data.intelligence?.edgeScore?.overall || 0,
    edgeLabel: data.summary?.edgeLabel || 'Analyzing',
    edgeColor: data.summary?.edgeColor || 'gray',
    topDataPoints: data.summary?.topDataPoints || [],
    quickTakes: data.summary?.quickTakes || { spread: '', spreadConfidence: 0, total: '', totalConfidence: 0, sharpestPick: '' },
    clv: data.intelligence?.clv ? { grade: data.intelligence.clv.grade, description: data.intelligence.clv.description } : undefined,
    sharpMoney: data.intelligence?.publicSharpSplits?.spread ? {
      side: data.intelligence.publicSharpSplits.spread.sharpSide,
      reverseLineMovement: data.intelligence.publicSharpSplits.spread.reverseLineMovement,
      strength: data.intelligence.publicSharpSplits.spread.rlmStrength,
    } : undefined,
    aiAnalysis: data.intelligence?.aiAnalysis || undefined,
    loading: false,
    error: null,
  }
}
