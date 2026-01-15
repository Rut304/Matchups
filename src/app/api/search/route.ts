import { NextResponse } from 'next/server'

// Search API - Aggregates results from multiple sources
// Searches: Players, Teams, Games, Trends, Experts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.toLowerCase() || ''
  const type = searchParams.get('type') || 'all' // all, players, teams, games, experts
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], message: 'Query too short' })
  }

  try {
    const results: SearchResult[] = []

    // Search sports leagues for quick links
    const sportLinks = [
      { name: 'NFL', path: '/nfl', icon: '🏈', type: 'sport' },
      { name: 'NBA', path: '/nba', icon: '🏀', type: 'sport' },
      { name: 'NHL', path: '/nhl', icon: '🏒', type: 'sport' },
      { name: 'MLB', path: '/mlb', icon: '⚾', type: 'sport' },
      { name: 'College Football', path: '/ncaaf', icon: '🏈', type: 'sport' },
      { name: 'College Basketball', path: '/ncaab', icon: '🏀', type: 'sport' },
    ].filter(s => s.name.toLowerCase().includes(query))

    results.push(...sportLinks.map(s => ({
      id: s.path,
      title: s.name,
      subtitle: 'Sport',
      type: 'sport' as const,
      path: s.path,
      icon: s.icon,
    })))

    // Search features/pages
    const features = [
      { name: 'Line Shop', path: '/lineshop', icon: '🛒', desc: 'Compare odds across books' },
      { name: 'Expert Leaderboard', path: '/leaderboard', icon: '🏆', desc: 'Track expert picks' },
      { name: 'Trend Finder', path: '/trend-finder', icon: '📈', desc: 'AI-powered trend analysis' },
      { name: 'Live Scores', path: '/scores', icon: '📺', desc: 'Real-time scores and odds' },
      { name: 'Alerts', path: '/alerts', icon: '🔔', desc: 'Line movement alerts' },
      { name: 'Weather Impact', path: '/weather', icon: '🌤️', desc: 'Game weather conditions' },
      { name: 'Injuries', path: '/injuries', icon: '🏥', desc: 'Injury reports' },
      { name: 'Sus Plays', path: '/sus', icon: '🚨', desc: 'Suspicious betting activity' },
      { name: 'My Picks', path: '/my-picks', icon: '📋', desc: 'Track your bets' },
      { name: 'Calculators', path: '/calculators', icon: '🧮', desc: 'Betting calculators' },
    ].filter(f => 
      f.name.toLowerCase().includes(query) || 
      f.desc.toLowerCase().includes(query)
    )

    results.push(...features.map(f => ({
      id: f.path,
      title: f.name,
      subtitle: f.desc,
      type: 'feature' as const,
      path: f.path,
      icon: f.icon,
    })))

    // Search popular teams
    if (type === 'all' || type === 'teams') {
      const teams = getPopularTeams().filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.city.toLowerCase().includes(query) ||
        t.abbreviation.toLowerCase().includes(query)
      )

      results.push(...teams.slice(0, 5).map(t => ({
        id: t.id,
        title: `${t.city} ${t.name}`,
        subtitle: `${t.sport} • ${t.abbreviation}`,
        type: 'team' as const,
        path: `/team/${t.sport.toLowerCase()}/${t.abbreviation.toLowerCase()}`,
        icon: t.logo || '🏟️',
        meta: { sport: t.sport },
      })))
    }

    // Search popular players
    if (type === 'all' || type === 'players') {
      const players = getPopularPlayers().filter(p =>
        p.name.toLowerCase().includes(query)
      )

      results.push(...players.slice(0, 5).map(p => ({
        id: p.id,
        title: p.name,
        subtitle: `${p.team} • ${p.position}`,
        type: 'player' as const,
        path: `/player/${p.sport.toLowerCase()}/${p.id}`,
        icon: '👤',
        meta: { sport: p.sport, team: p.team },
      })))
    }

    // Sort results: exact matches first, then by type priority
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === query ? 1 : 0
      const bExact = b.title.toLowerCase() === query ? 1 : 0
      if (aExact !== bExact) return bExact - aExact

      const typePriority: Record<string, number> = { sport: 0, feature: 1, team: 2, player: 3, game: 4 }
      return (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99)
    })

    return NextResponse.json({
      results: sortedResults.slice(0, limit),
      total: sortedResults.length,
      query,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'sport' | 'feature' | 'team' | 'player' | 'game'
  path: string
  icon: string
  meta?: Record<string, string>
}

// Popular teams database for quick search
function getPopularTeams() {
  return [
    // NFL
    { id: 'kc', name: 'Chiefs', city: 'Kansas City', abbreviation: 'KC', sport: 'NFL', logo: '🔴' },
    { id: 'sf', name: '49ers', city: 'San Francisco', abbreviation: 'SF', sport: 'NFL', logo: '🔴' },
    { id: 'dal', name: 'Cowboys', city: 'Dallas', abbreviation: 'DAL', sport: 'NFL', logo: '⭐' },
    { id: 'buf', name: 'Bills', city: 'Buffalo', abbreviation: 'BUF', sport: 'NFL', logo: '🔵' },
    { id: 'phi', name: 'Eagles', city: 'Philadelphia', abbreviation: 'PHI', sport: 'NFL', logo: '🦅' },
    { id: 'det', name: 'Lions', city: 'Detroit', abbreviation: 'DET', sport: 'NFL', logo: '🦁' },
    { id: 'bal', name: 'Ravens', city: 'Baltimore', abbreviation: 'BAL', sport: 'NFL', logo: '🟣' },
    { id: 'mia', name: 'Dolphins', city: 'Miami', abbreviation: 'MIA', sport: 'NFL', logo: '🐬' },
    // NBA
    { id: 'bos', name: 'Celtics', city: 'Boston', abbreviation: 'BOS', sport: 'NBA', logo: '🍀' },
    { id: 'lal', name: 'Lakers', city: 'Los Angeles', abbreviation: 'LAL', sport: 'NBA', logo: '🟡' },
    { id: 'gsw', name: 'Warriors', city: 'Golden State', abbreviation: 'GSW', sport: 'NBA', logo: '💙' },
    { id: 'den', name: 'Nuggets', city: 'Denver', abbreviation: 'DEN', sport: 'NBA', logo: '⛰️' },
    { id: 'mil', name: 'Bucks', city: 'Milwaukee', abbreviation: 'MIL', sport: 'NBA', logo: '🦌' },
    { id: 'phx', name: 'Suns', city: 'Phoenix', abbreviation: 'PHX', sport: 'NBA', logo: '☀️' },
    // NHL
    { id: 'edm', name: 'Oilers', city: 'Edmonton', abbreviation: 'EDM', sport: 'NHL', logo: '🛢️' },
    { id: 'tor', name: 'Maple Leafs', city: 'Toronto', abbreviation: 'TOR', sport: 'NHL', logo: '🍁' },
    { id: 'bru', name: 'Bruins', city: 'Boston', abbreviation: 'BOS', sport: 'NHL', logo: '🐻' },
    { id: 'col', name: 'Avalanche', city: 'Colorado', abbreviation: 'COL', sport: 'NHL', logo: '❄️' },
    // MLB
    { id: 'lad', name: 'Dodgers', city: 'Los Angeles', abbreviation: 'LAD', sport: 'MLB', logo: '🔵' },
    { id: 'nyy', name: 'Yankees', city: 'New York', abbreviation: 'NYY', sport: 'MLB', logo: '⚾' },
    { id: 'hou', name: 'Astros', city: 'Houston', abbreviation: 'HOU', sport: 'MLB', logo: '⭐' },
    { id: 'atl', name: 'Braves', city: 'Atlanta', abbreviation: 'ATL', sport: 'MLB', logo: '🪓' },
  ]
}

// Popular players for quick search
function getPopularPlayers() {
  return [
    // NFL QBs
    { id: 'mahomes', name: 'Patrick Mahomes', team: 'KC', position: 'QB', sport: 'NFL' },
    { id: 'burrow', name: 'Joe Burrow', team: 'CIN', position: 'QB', sport: 'NFL' },
    { id: 'allen', name: 'Josh Allen', team: 'BUF', position: 'QB', sport: 'NFL' },
    { id: 'hurts', name: 'Jalen Hurts', team: 'PHI', position: 'QB', sport: 'NFL' },
    { id: 'lamar', name: 'Lamar Jackson', team: 'BAL', position: 'QB', sport: 'NFL' },
    // NBA Stars
    { id: 'lebron', name: 'LeBron James', team: 'LAL', position: 'SF', sport: 'NBA' },
    { id: 'curry', name: 'Stephen Curry', team: 'GSW', position: 'PG', sport: 'NBA' },
    { id: 'giannis', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', sport: 'NBA' },
    { id: 'luka', name: 'Luka Doncic', team: 'DAL', position: 'PG', sport: 'NBA' },
    { id: 'jokic', name: 'Nikola Jokic', team: 'DEN', position: 'C', sport: 'NBA' },
    { id: 'tatum', name: 'Jayson Tatum', team: 'BOS', position: 'SF', sport: 'NBA' },
    // NHL Stars
    { id: 'mcdavid', name: 'Connor McDavid', team: 'EDM', position: 'C', sport: 'NHL' },
    { id: 'matthews', name: 'Auston Matthews', team: 'TOR', position: 'C', sport: 'NHL' },
    { id: 'mackinnon', name: 'Nathan MacKinnon', team: 'COL', position: 'C', sport: 'NHL' },
    // MLB Stars
    { id: 'ohtani', name: 'Shohei Ohtani', team: 'LAD', position: 'DH', sport: 'MLB' },
    { id: 'trout', name: 'Mike Trout', team: 'LAA', position: 'CF', sport: 'MLB' },
    { id: 'judge', name: 'Aaron Judge', team: 'NYY', position: 'RF', sport: 'MLB' },
  ]
}
