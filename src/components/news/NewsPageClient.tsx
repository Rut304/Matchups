'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, ChevronDown, SortAsc, SortDesc, Calendar, Filter, X } from 'lucide-react'
import { NewsItem } from '@/lib/api/news'
import { formatTweetTime } from '@/lib/api/twitter'

// Team lists by sport for filtering
const TEAMS_BY_SPORT: Record<string, string[]> = {
  NFL: [
    'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
    'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
    'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
    'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
    'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
    'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
    'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
    'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
  ],
  NBA: [
    'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets',
    'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets',
    'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers',
    'LA Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat',
    'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks',
    'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns',
    'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors',
    'Utah Jazz', 'Washington Wizards'
  ],
  NHL: [
    'Anaheim Ducks', 'Arizona Coyotes', 'Boston Bruins', 'Buffalo Sabres',
    'Calgary Flames', 'Carolina Hurricanes', 'Chicago Blackhawks', 'Colorado Avalanche',
    'Columbus Blue Jackets', 'Dallas Stars', 'Detroit Red Wings', 'Edmonton Oilers',
    'Florida Panthers', 'Los Angeles Kings', 'Minnesota Wild', 'Montreal Canadiens',
    'Nashville Predators', 'New Jersey Devils', 'New York Islanders', 'New York Rangers',
    'Ottawa Senators', 'Philadelphia Flyers', 'Pittsburgh Penguins', 'San Jose Sharks',
    'Seattle Kraken', 'St. Louis Blues', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
    'Vancouver Canucks', 'Vegas Golden Knights', 'Washington Capitals', 'Winnipeg Jets'
  ],
  MLB: [
    'Arizona Diamondbacks', 'Atlanta Braves', 'Baltimore Orioles', 'Boston Red Sox',
    'Chicago Cubs', 'Chicago White Sox', 'Cincinnati Reds', 'Cleveland Guardians',
    'Colorado Rockies', 'Detroit Tigers', 'Houston Astros', 'Kansas City Royals',
    'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins', 'Milwaukee Brewers',
    'Minnesota Twins', 'New York Mets', 'New York Yankees', 'Oakland Athletics',
    'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres', 'San Francisco Giants',
    'Seattle Mariners', 'St. Louis Cardinals', 'Tampa Bay Rays', 'Texas Rangers',
    'Toronto Blue Jays', 'Washington Nationals'
  ]
}

interface NewsPageClientProps {
  initialNews: NewsItem[]
  initialSport?: string
}

type SortOption = 'newest' | 'oldest' | 'popular'

// News Card Component
function NewsCard({ item }: { item: NewsItem }) {
  const timeAgo = formatTweetTime(item.publishedAt)
  
  const sourceColors: Record<string, string> = {
    espn: 'bg-red-500/20 text-red-400',
    twitter: 'bg-blue-500/20 text-blue-400',
    injury: 'bg-orange-500/20 text-orange-400',
    'api-sports': 'bg-green-500/20 text-green-400',
  }

  const sportColors: Record<string, string> = {
    NFL: 'bg-emerald-500/20 text-emerald-400',
    NBA: 'bg-orange-500/20 text-orange-400',
    NHL: 'bg-blue-500/20 text-blue-400',
    MLB: 'bg-red-500/20 text-red-400',
  }

  const statusColors: Record<string, string> = {
    out: 'text-red-400',
    doubtful: 'text-red-400',
    questionable: 'text-yellow-400',
    probable: 'text-green-400',
    'day-to-day': 'text-yellow-400',
    ir: 'text-red-500',
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-background-secondary border border-border rounded-lg overflow-hidden hover:border-accent transition-colors"
    >
      {item.imageUrl && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Tags row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full ${sportColors[item.sport] || 'bg-accent/20 text-accent'}`}>
            {item.sport}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${sourceColors[item.source]}`}>
            {item.source === 'twitter' ? '𝕏' : item.source.toUpperCase()}
          </span>
          {item.type === 'injury' && (
            <span className={`text-xs font-bold ${statusColors[item.title.split(' - ')[1]?.toLowerCase()] || 'text-yellow-400'}`}>
              INJURY
            </span>
          )}
          <span className="text-xs text-text-secondary ml-auto">{timeAgo}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-text-primary mb-1 line-clamp-2">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-2">
            {item.description}
          </p>
        )}

        {/* Author / Engagement */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          {item.author && (
            <div className="flex items-center gap-2">
              {item.author.avatarUrl && (
                <img
                  src={item.author.avatarUrl}
                  alt=""
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span>
                {item.author.handle || item.author.name}
                {item.author.verified && (
                  <span className="ml-1 text-blue-400">✓</span>
                )}
              </span>
            </div>
          )}
          
          {item.engagement && (
            <div className="flex items-center gap-3">
              <span>❤️ {item.engagement.likes.toLocaleString()}</span>
              <span>🔄 {item.engagement.shares.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

export function NewsPageClient({ initialNews, initialSport = 'ALL' }: NewsPageClientProps) {
  // Filter state
  const [activeSport, setActiveSport] = useState(initialSport)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)
  
  const sports = ['ALL', 'NFL', 'NBA', 'NHL', 'MLB']
  
  // Get available teams based on selected sport
  const availableTeams = useMemo(() => {
    if (activeSport === 'ALL') {
      return Object.values(TEAMS_BY_SPORT).flat().sort()
    }
    return TEAMS_BY_SPORT[activeSport] || []
  }, [activeSport])
  
  // Filter and sort news
  const filteredNews = useMemo(() => {
    let filtered = [...initialNews]
    
    // Filter by sport
    if (activeSport !== 'ALL') {
      filtered = filtered.filter(item => item.sport === activeSport)
    }
    
    // Filter by team
    if (selectedTeam) {
      const teamLower = selectedTeam.toLowerCase()
      // Check title, description, and teams array
      filtered = filtered.filter(item => {
        const inTitle = item.title.toLowerCase().includes(teamLower)
        const inDesc = item.description?.toLowerCase().includes(teamLower)
        const inTeams = item.teams?.some(t => t.toLowerCase().includes(teamLower))
        // Also match partial team name (e.g., "Lakers", "Chiefs")
        const teamWords = teamLower.split(' ')
        const partialMatch = teamWords.some(word => 
          word.length > 3 && (
            item.title.toLowerCase().includes(word) ||
            item.description?.toLowerCase().includes(word)
          )
        )
        return inTitle || inDesc || inTeams || partialMatch
      })
    }
    
    // Filter by search query (searches title, description, players, author)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => {
        const inTitle = item.title.toLowerCase().includes(query)
        const inDesc = item.description?.toLowerCase().includes(query)
        const inPlayers = item.players?.some(p => p.toLowerCase().includes(query))
        const inAuthor = item.author?.name.toLowerCase().includes(query) || 
                         item.author?.handle?.toLowerCase().includes(query)
        return inTitle || inDesc || inPlayers || inAuthor
      })
    }
    
    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
        break
      case 'popular':
        filtered.sort((a, b) => {
          const engA = (a.engagement?.likes || 0) + (a.engagement?.shares || 0)
          const engB = (b.engagement?.likes || 0) + (b.engagement?.shares || 0)
          return engB - engA
        })
        break
    }
    
    return filtered
  }, [initialNews, activeSport, selectedTeam, searchQuery, sortBy])
  
  // Reset team when sport changes
  const handleSportChange = useCallback((sport: string) => {
    setActiveSport(sport)
    setSelectedTeam('')
  }, [])
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveSport('ALL')
    setSelectedTeam('')
    setSearchQuery('')
    setSortBy('newest')
  }, [])
  
  const hasActiveFilters = activeSport !== 'ALL' || selectedTeam || searchQuery || sortBy !== 'newest'
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Latest Sports News
        </h1>
        <p className="text-text-secondary">
          Breaking news, injury updates, and social buzz from around the sports world
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search news, players, or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-background-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              title="Clear search"
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Sport Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => handleSportChange(sport)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSport === sport
                  ? 'bg-accent text-white'
                  : 'bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
              }`}
            >
              {sport}
            </button>
          ))}
          
          {/* Toggle more filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-accent/20 text-accent'
                : 'bg-background-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 p-4 bg-background-secondary rounded-lg border border-border">
            {/* Team Filter */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="team-filter" className="block text-xs font-medium text-text-tertiary mb-1">Team</label>
              <div className="relative">
                <select
                  id="team-filter"
                  title="Filter by team"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background-tertiary border border-border text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-accent"
                >
                  <option value="">All Teams</option>
                  {availableTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
              </div>
            </div>
            
            {/* Sort Filter */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="sort-filter" className="block text-xs font-medium text-text-tertiary mb-1">Sort By</label>
              <div className="relative">
                <select
                  id="sort-filter"
                  title="Sort news articles"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 rounded-lg bg-background-tertiary border border-border text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-accent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
              </div>
            </div>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">
          Showing {filteredNews.length} {filteredNews.length === 1 ? 'article' : 'articles'}
          {hasActiveFilters && (
            <span className="text-text-tertiary"> (filtered)</span>
          )}
        </p>
        
        {/* Quick sort buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary bg-background-secondary rounded-lg transition-colors"
          >
            {sortBy === 'oldest' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* News Grid */}
      {filteredNews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-2">No news found matching your filters.</p>
          <button
            onClick={clearFilters}
            className="text-accent hover:text-accent/80 text-sm font-medium"
          >
            Clear filters and try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.map(item => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Last updated */}
      <div className="mt-8 text-center text-sm text-text-tertiary">
        News refreshes automatically every 5 minutes
      </div>
    </div>
  )
}
