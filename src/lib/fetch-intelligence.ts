/**
 * Shared intelligence fetcher for sport matchup pages.
 * Maps /api/games/[id]/intelligence response → TheEdgeSection's IntelligenceData shape.
 * 
 * v2 (2026-03-05): Now passes through the FULL intelligence payload so the frontend
 * can render all 12 data points, full edge breakdown, situational badges, key numbers, etc.
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

  const intel = data.intelligence

  return {
    // --- Core display props (existing) ---
    edgeScore: intel?.edgeScore?.overall || 0,
    edgeLabel: data.summary?.edgeLabel || 'Analyzing',
    edgeColor: data.summary?.edgeColor || 'gray',
    topDataPoints: data.summary?.topDataPoints || [],
    quickTakes: data.summary?.quickTakes || { spread: '', spreadConfidence: 0, total: '', totalConfidence: 0, sharpestPick: '' },
    clv: intel?.clv ? { 
      grade: intel.clv.grade, 
      description: intel.clv.description,
      spreadCLV: intel.clv.spreadCLV,
      totalCLV: intel.clv.totalCLV,
      mlCLV: intel.clv.mlCLV,
      openSpread: intel.clv.openSpread,
      currentSpread: intel.clv.currentSpread,
      openTotal: intel.clv.openTotal,
      currentTotal: intel.clv.currentTotal,
    } : undefined,
    sharpMoney: intel?.publicSharpSplits?.spread ? {
      side: intel.publicSharpSplits.spread.sharpSide,
      reverseLineMovement: intel.publicSharpSplits.spread.reverseLineMovement,
      strength: intel.publicSharpSplits.spread.rlmStrength,
    } : undefined,
    aiAnalysis: intel?.aiAnalysis || undefined,
    loading: false,
    error: null,

    // --- Full edge breakdown (NEW) ---
    edgeBreakdown: intel?.edgeScore?.breakdown || null,
    topEdge: intel?.edgeScore?.topEdge || null,

    // --- Full betting splits: spread + total + ML (NEW) ---
    splits: intel?.publicSharpSplits || null,

    // --- Situational spots (NEW) ---
    situational: intel?.situational || null,

    // --- Key numbers (NEW) ---
    keyNumbers: intel?.keyNumbers || null,

    // --- Line movement detail (NEW) ---
    lineMovement: intel?.lineMovement || null,

    // --- O/U trends + combined analysis (NEW) ---
    ouTrends: intel?.ouTrends || null,

    // --- ATS records (NEW) ---
    atsRecords: intel?.atsRecords || null,

    // --- H2H full data (NEW) ---
    h2hFull: intel?.h2h || null,

    // --- Injury data (NEW) ---
    injuries: intel?.injuryImpact || null,

    // --- Weather (NEW) ---
    weather: intel?.weather || null,
  }
}
