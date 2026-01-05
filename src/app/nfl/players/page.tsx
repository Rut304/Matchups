'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Search, ChevronDown, ChevronUp, ArrowUpDown, Filter, 
  TrendingUp, TrendingDown, Target, Star, Activity,
  Users, Trophy, Flame, ExternalLink
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

type StatCategory = 'passing' | 'rushing' | 'receiving' | 'defense' | 'kicking' | 'returns'
type Season = '2025' | '2024' | '2023' | '2022' | 'career'
type SortDirection = 'asc' | 'desc'

interface PlayerStat {
  rank: number
  id: string
  name: string
  team: string
  teamFull: string
  position: string
  gp: number
  // Passing
  passYds?: number
  passTd?: number
  passInt?: number
  passAtt?: number
  passCmp?: number
  cmpPct?: number
  passRtg?: number
  sacked?: number
  ypa?: number
  // Rushing
  rushAtt?: number
  rushYds?: number
  rushTd?: number
  rushYpc?: number
  rushLong?: number
  fumbles?: number
  // Receiving
  targets?: number
  rec?: number
  recYds?: number
  recTd?: number
  recYpc?: number
  recLong?: number
  catchPct?: number
  yprr?: number
  // Defense
  tackles?: number
  soloTackles?: number
  sacks?: number
  tfl?: number
  ints?: number
  pdef?: number
  ff?: number
  fr?: number
  defTd?: number
  // Kicking
  fgm?: number
  fga?: number
  fgPct?: number
  fg50?: number
  xpm?: number
  xpa?: number
  pts?: number
  // Returns
  krAtt?: number
  krYds?: number
  krAvg?: number
  krTd?: number
  prAtt?: number
  prYds?: number
  prAvg?: number
  prTd?: number
  // Betting Props
  propLine?: number
  propHitRate?: number
  propTrend?: 'up' | 'down' | 'stable'
}

// =============================================================================
// MOCK DATA - In production, this comes from API
// =============================================================================

const passingLeaders: PlayerStat[] = [
  { rank: 1, id: 'dak-prescott', name: 'Dak Prescott', team: 'DAL', teamFull: 'Dallas Cowboys', position: 'QB', gp: 16, passYds: 4516, passTd: 36, passInt: 9, passCmp: 410, passAtt: 590, cmpPct: 69.5, passRtg: 105.3, sacked: 28, ypa: 7.7, propLine: 275.5, propHitRate: 58, propTrend: 'up' },
  { rank: 2, id: 'josh-allen', name: 'Josh Allen', team: 'BUF', teamFull: 'Buffalo Bills', position: 'QB', gp: 16, passYds: 4306, passTd: 40, passInt: 6, passCmp: 392, passAtt: 568, cmpPct: 69.0, passRtg: 110.5, sacked: 21, ypa: 7.6, propLine: 265.5, propHitRate: 62, propTrend: 'up' },
  { rank: 3, id: 'jalen-hurts', name: 'Jalen Hurts', team: 'PHI', teamFull: 'Philadelphia Eagles', position: 'QB', gp: 16, passYds: 3858, passTd: 28, passInt: 5, passCmp: 310, passAtt: 460, cmpPct: 67.4, passRtg: 103.7, sacked: 32, ypa: 8.4, propLine: 235.5, propHitRate: 52, propTrend: 'stable' },
  { rank: 4, id: 'patrick-mahomes', name: 'Patrick Mahomes', team: 'KC', teamFull: 'Kansas City Chiefs', position: 'QB', gp: 16, passYds: 4183, passTd: 31, passInt: 11, passCmp: 378, passAtt: 545, cmpPct: 69.4, passRtg: 97.2, sacked: 25, ypa: 7.7, propLine: 260.5, propHitRate: 55, propTrend: 'down' },
  { rank: 5, id: 'jared-goff', name: 'Jared Goff', team: 'DET', teamFull: 'Detroit Lions', position: 'QB', gp: 16, passYds: 4575, passTd: 35, passInt: 7, passCmp: 398, passAtt: 562, cmpPct: 70.8, passRtg: 107.8, sacked: 19, ypa: 8.1, propLine: 280.5, propHitRate: 60, propTrend: 'up' },
  { rank: 6, id: 'lamar-jackson', name: 'Lamar Jackson', team: 'BAL', teamFull: 'Baltimore Ravens', position: 'QB', gp: 15, passYds: 3678, passTd: 32, passInt: 4, passCmp: 302, passAtt: 448, cmpPct: 67.4, passRtg: 110.2, sacked: 18, ypa: 8.2, propLine: 225.5, propHitRate: 48, propTrend: 'stable' },
  { rank: 7, id: 'tua-tagovailoa', name: 'Tua Tagovailoa', team: 'MIA', teamFull: 'Miami Dolphins', position: 'QB', gp: 13, passYds: 3421, passTd: 28, passInt: 6, passCmp: 310, passAtt: 425, cmpPct: 72.9, passRtg: 108.4, sacked: 15, ypa: 8.0, propLine: 255.5, propHitRate: 56, propTrend: 'up' },
  { rank: 8, id: 'joe-burrow', name: 'Joe Burrow', team: 'CIN', teamFull: 'Cincinnati Bengals', position: 'QB', gp: 16, passYds: 4475, passTd: 34, passInt: 9, passCmp: 402, passAtt: 580, cmpPct: 69.3, passRtg: 101.8, sacked: 35, ypa: 7.7, propLine: 270.5, propHitRate: 54, propTrend: 'stable' },
  { rank: 9, id: 'cj-stroud', name: 'C.J. Stroud', team: 'HOU', teamFull: 'Houston Texans', position: 'QB', gp: 16, passYds: 4108, passTd: 26, passInt: 5, passCmp: 365, passAtt: 530, cmpPct: 68.9, passRtg: 100.8, sacked: 42, ypa: 7.8, propLine: 250.5, propHitRate: 51, propTrend: 'down' },
  { rank: 10, id: 'jordan-love', name: 'Jordan Love', team: 'GB', teamFull: 'Green Bay Packers', position: 'QB', gp: 16, passYds: 3892, passTd: 29, passInt: 12, passCmp: 348, passAtt: 520, cmpPct: 66.9, passRtg: 95.2, sacked: 28, ypa: 7.5, propLine: 240.5, propHitRate: 49, propTrend: 'stable' },
]

const rushingLeaders: PlayerStat[] = [
  { rank: 1, id: 'derrick-henry', name: 'Derrick Henry', team: 'BAL', teamFull: 'Baltimore Ravens', position: 'RB', gp: 16, rushAtt: 325, rushYds: 1921, rushTd: 16, rushYpc: 5.9, rushLong: 87, fumbles: 2, propLine: 95.5, propHitRate: 62, propTrend: 'up' },
  { rank: 2, id: 'saquon-barkley', name: 'Saquon Barkley', team: 'PHI', teamFull: 'Philadelphia Eagles', position: 'RB', gp: 16, rushAtt: 295, rushYds: 1838, rushTd: 13, rushYpc: 6.2, rushLong: 72, fumbles: 1, propLine: 92.5, propHitRate: 58, propTrend: 'up' },
  { rank: 3, id: 'jahmyr-gibbs', name: 'Jahmyr Gibbs', team: 'DET', teamFull: 'Detroit Lions', position: 'RB', gp: 16, rushAtt: 228, rushYds: 1412, rushTd: 15, rushYpc: 6.2, rushLong: 65, fumbles: 1, propLine: 72.5, propHitRate: 55, propTrend: 'up' },
  { rank: 4, id: 'kyren-williams', name: 'Kyren Williams', team: 'LAR', teamFull: 'Los Angeles Rams', position: 'RB', gp: 16, rushAtt: 285, rushYds: 1298, rushTd: 12, rushYpc: 4.6, rushLong: 45, fumbles: 3, propLine: 75.5, propHitRate: 52, propTrend: 'stable' },
  { rank: 5, id: 'josh-jacobs', name: 'Josh Jacobs', team: 'GB', teamFull: 'Green Bay Packers', position: 'RB', gp: 16, rushAtt: 268, rushYds: 1329, rushTd: 10, rushYpc: 5.0, rushLong: 51, fumbles: 2, propLine: 78.5, propHitRate: 54, propTrend: 'stable' },
  { rank: 6, id: 'bijan-robinson', name: 'Bijan Robinson', team: 'ATL', teamFull: 'Atlanta Falcons', position: 'RB', gp: 16, rushAtt: 258, rushYds: 1256, rushTd: 8, rushYpc: 4.9, rushLong: 48, fumbles: 1, propLine: 70.5, propHitRate: 51, propTrend: 'down' },
  { rank: 7, id: 'james-cook', name: 'James Cook', team: 'BUF', teamFull: 'Buffalo Bills', position: 'RB', gp: 16, rushAtt: 245, rushYds: 1189, rushTd: 14, rushYpc: 4.9, rushLong: 56, fumbles: 2, propLine: 68.5, propHitRate: 53, propTrend: 'up' },
  { rank: 8, id: 'lamar-jackson-rb', name: 'Lamar Jackson', team: 'BAL', teamFull: 'Baltimore Ravens', position: 'QB', gp: 15, rushAtt: 148, rushYds: 915, rushTd: 5, rushYpc: 6.2, rushLong: 48, fumbles: 4, propLine: 55.5, propHitRate: 56, propTrend: 'stable' },
  { rank: 9, id: 'alvin-kamara', name: 'Alvin Kamara', team: 'NO', teamFull: 'New Orleans Saints', position: 'RB', gp: 14, rushAtt: 198, rushYds: 950, rushTd: 7, rushYpc: 4.8, rushLong: 42, fumbles: 1, propLine: 62.5, propHitRate: 50, propTrend: 'down' },
  { rank: 10, id: 'devon-achane', name: 'De\'Von Achane', team: 'MIA', teamFull: 'Miami Dolphins', position: 'RB', gp: 12, rushAtt: 168, rushYds: 905, rushTd: 8, rushYpc: 5.4, rushLong: 68, fumbles: 0, propLine: 58.5, propHitRate: 48, propTrend: 'up' },
]

const receivingLeaders: PlayerStat[] = [
  { rank: 1, id: 'ja-marr-chase', name: 'Ja\'Marr Chase', team: 'CIN', teamFull: 'Cincinnati Bengals', position: 'WR', gp: 16, targets: 158, rec: 117, recYds: 1708, recTd: 17, recYpc: 14.6, recLong: 72, catchPct: 74.1, propLine: 85.5, propHitRate: 62, propTrend: 'up' },
  { rank: 2, id: 'amon-ra-st-brown', name: 'Amon-Ra St. Brown', team: 'DET', teamFull: 'Detroit Lions', position: 'WR', gp: 16, targets: 152, rec: 119, recYds: 1515, recTd: 12, recYpc: 12.7, recLong: 58, catchPct: 78.3, propLine: 78.5, propHitRate: 58, propTrend: 'up' },
  { rank: 3, id: 'ceedee-lamb', name: 'CeeDee Lamb', team: 'DAL', teamFull: 'Dallas Cowboys', position: 'WR', gp: 16, targets: 168, rec: 118, recYds: 1479, recTd: 10, recYpc: 12.5, recLong: 65, catchPct: 70.2, propLine: 82.5, propHitRate: 55, propTrend: 'stable' },
  { rank: 4, id: 'tyreek-hill', name: 'Tyreek Hill', team: 'MIA', teamFull: 'Miami Dolphins', position: 'WR', gp: 16, targets: 148, rec: 102, recYds: 1432, recTd: 9, recYpc: 14.0, recLong: 80, catchPct: 68.9, propLine: 75.5, propHitRate: 52, propTrend: 'down' },
  { rank: 5, id: 'mike-evans', name: 'Mike Evans', team: 'TB', teamFull: 'Tampa Bay Buccaneers', position: 'WR', gp: 16, targets: 142, rec: 92, recYds: 1255, recTd: 11, recYpc: 13.6, recLong: 62, catchPct: 64.8, propLine: 68.5, propHitRate: 54, propTrend: 'stable' },
  { rank: 6, id: 'davante-adams', name: 'Davante Adams', team: 'NYJ', teamFull: 'New York Jets', position: 'WR', gp: 15, targets: 138, rec: 98, recYds: 1210, recTd: 8, recYpc: 12.3, recLong: 55, catchPct: 71.0, propLine: 72.5, propHitRate: 53, propTrend: 'stable' },
  { rank: 7, id: 'nico-collins', name: 'Nico Collins', team: 'HOU', teamFull: 'Houston Texans', position: 'WR', gp: 12, targets: 102, rec: 72, recYds: 1185, recTd: 7, recYpc: 16.5, recLong: 75, catchPct: 70.6, propLine: 78.5, propHitRate: 56, propTrend: 'up' },
  { rank: 8, id: 'puka-nacua', name: 'Puka Nacua', team: 'LAR', teamFull: 'Los Angeles Rams', position: 'WR', gp: 14, targets: 128, rec: 96, recYds: 1155, recTd: 5, recYpc: 12.0, recLong: 48, catchPct: 75.0, propLine: 70.5, propHitRate: 55, propTrend: 'up' },
  { rank: 9, id: 'travis-kelce', name: 'Travis Kelce', team: 'KC', teamFull: 'Kansas City Chiefs', position: 'TE', gp: 16, targets: 125, rec: 95, recYds: 1052, recTd: 5, recYpc: 11.1, recLong: 45, catchPct: 76.0, propLine: 58.5, propHitRate: 50, propTrend: 'down' },
  { rank: 10, id: 'dj-moore', name: 'DJ Moore', team: 'CHI', teamFull: 'Chicago Bears', position: 'WR', gp: 16, targets: 135, rec: 88, recYds: 1025, recTd: 6, recYpc: 11.6, recLong: 52, catchPct: 65.2, propLine: 62.5, propHitRate: 48, propTrend: 'stable' },
]

const defenseLeaders: PlayerStat[] = [
  { rank: 1, id: 'tj-watt', name: 'T.J. Watt', team: 'PIT', teamFull: 'Pittsburgh Steelers', position: 'EDGE', gp: 16, tackles: 68, soloTackles: 52, sacks: 17.5, tfl: 22, ints: 0, pdef: 4, ff: 4, fr: 2, defTd: 0 },
  { rank: 2, id: 'myles-garrett', name: 'Myles Garrett', team: 'CLE', teamFull: 'Cleveland Browns', position: 'EDGE', gp: 15, tackles: 58, soloTackles: 45, sacks: 14.0, tfl: 18, ints: 0, pdef: 2, ff: 3, fr: 1, defTd: 0 },
  { rank: 3, id: 'micah-parsons', name: 'Micah Parsons', team: 'DAL', teamFull: 'Dallas Cowboys', position: 'LB', gp: 16, tackles: 72, soloTackles: 55, sacks: 12.5, tfl: 20, ints: 1, pdef: 5, ff: 2, fr: 0, defTd: 1 },
  { rank: 4, id: 'roquan-smith', name: 'Roquan Smith', team: 'BAL', teamFull: 'Baltimore Ravens', position: 'LB', gp: 16, tackles: 145, soloTackles: 98, sacks: 4.0, tfl: 12, ints: 2, pdef: 8, ff: 1, fr: 1, defTd: 0 },
  { rank: 5, id: 'sauce-gardner', name: 'Sauce Gardner', team: 'NYJ', teamFull: 'New York Jets', position: 'CB', gp: 16, tackles: 62, soloTackles: 48, sacks: 0.0, tfl: 4, ints: 4, pdef: 18, ff: 1, fr: 0, defTd: 0 },
  { rank: 6, id: 'maxx-crosby', name: 'Maxx Crosby', team: 'LV', teamFull: 'Las Vegas Raiders', position: 'EDGE', gp: 16, tackles: 78, soloTackles: 58, sacks: 11.5, tfl: 19, ints: 0, pdef: 3, ff: 3, fr: 2, defTd: 0 },
  { rank: 7, id: 'patrick-surtain', name: 'Patrick Surtain II', team: 'DEN', teamFull: 'Denver Broncos', position: 'CB', gp: 16, tackles: 55, soloTackles: 42, sacks: 0.0, tfl: 2, ints: 6, pdef: 16, ff: 0, fr: 0, defTd: 1 },
  { rank: 8, id: 'fred-warner', name: 'Fred Warner', team: 'SF', teamFull: 'San Francisco 49ers', position: 'LB', gp: 16, tackles: 138, soloTackles: 92, sacks: 2.5, tfl: 10, ints: 3, pdef: 7, ff: 2, fr: 2, defTd: 0 },
  { rank: 9, id: 'quinnen-williams', name: 'Quinnen Williams', team: 'NYJ', teamFull: 'New York Jets', position: 'DT', gp: 16, tackles: 52, soloTackles: 35, sacks: 10.0, tfl: 15, ints: 0, pdef: 2, ff: 2, fr: 0, defTd: 0 },
  { rank: 10, id: 'derwin-james', name: 'Derwin James Jr.', team: 'LAC', teamFull: 'Los Angeles Chargers', position: 'S', gp: 15, tackles: 108, soloTackles: 75, sacks: 3.0, tfl: 8, ints: 5, pdef: 12, ff: 2, fr: 1, defTd: 1 },
]

const kickingLeaders: PlayerStat[] = [
  { rank: 1, id: 'brandon-aubrey', name: 'Brandon Aubrey', team: 'DAL', teamFull: 'Dallas Cowboys', position: 'K', gp: 16, fgm: 36, fga: 38, fgPct: 94.7, fg50: 8, xpm: 48, xpa: 48, pts: 156 },
  { rank: 2, id: 'chris-boswell', name: 'Chris Boswell', team: 'PIT', teamFull: 'Pittsburgh Steelers', position: 'K', gp: 16, fgm: 34, fga: 37, fgPct: 91.9, fg50: 6, xpm: 42, xpa: 44, pts: 144 },
  { rank: 3, id: 'ka-imi-fairbairn', name: 'Ka\'imi Fairbairn', team: 'HOU', teamFull: 'Houston Texans', position: 'K', gp: 16, fgm: 32, fga: 35, fgPct: 91.4, fg50: 5, xpm: 45, xpa: 46, pts: 141 },
  { rank: 4, id: 'justin-tucker', name: 'Justin Tucker', team: 'BAL', teamFull: 'Baltimore Ravens', position: 'K', gp: 16, fgm: 28, fga: 32, fgPct: 87.5, fg50: 4, xpm: 52, xpa: 52, pts: 136 },
  { rank: 5, id: 'jake-moody', name: 'Jake Moody', team: 'SF', teamFull: 'San Francisco 49ers', position: 'K', gp: 14, fgm: 26, fga: 29, fgPct: 89.7, fg50: 5, xpm: 38, xpa: 40, pts: 116 },
]

const returnLeaders: PlayerStat[] = [
  { rank: 1, id: 'kadarius-toney', name: 'Kadarius Toney', team: 'KC', teamFull: 'Kansas City Chiefs', position: 'WR', gp: 16, krAtt: 28, krYds: 785, krAvg: 28.0, krTd: 2, prAtt: 15, prYds: 142, prAvg: 9.5, prTd: 0 },
  { rank: 2, id: 'marcus-jones', name: 'Marcus Jones', team: 'NE', teamFull: 'New England Patriots', position: 'CB', gp: 16, krAtt: 25, krYds: 652, krAvg: 26.1, krTd: 1, prAtt: 28, prYds: 315, prAvg: 11.3, prTd: 1 },
  { rank: 3, id: 'britain-covey', name: 'Britain Covey', team: 'PHI', teamFull: 'Philadelphia Eagles', position: 'WR', gp: 16, krAtt: 18, krYds: 425, krAvg: 23.6, krTd: 0, prAtt: 32, prYds: 358, prAvg: 11.2, prTd: 1 },
]

// =============================================================================
// COMPONENT
// =============================================================================

export default function NFLPlayerStatsPage() {
  const [category, setCategory] = useState<StatCategory>('passing')
  const [season, setSeason] = useState<Season>('2025')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortCol, setSortCol] = useState<string>('rank')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [posFilter, setPosFilter] = useState<string>('all')

  // Get data based on category
  const getData = () => {
    switch(category) {
      case 'passing': return passingLeaders
      case 'rushing': return rushingLeaders
      case 'receiving': return receivingLeaders
      case 'defense': return defenseLeaders
      case 'kicking': return kickingLeaders
      case 'returns': return returnLeaders
      default: return passingLeaders
    }
  }

  // Get columns based on category
  const getColumns = () => {
    switch(category) {
      case 'passing':
        return [
          { key: 'rank', label: 'RK', width: 'w-12' },
          { key: 'name', label: 'PLAYER', width: 'w-48' },
          { key: 'gp', label: 'GP', width: 'w-12' },
          { key: 'passCmp', label: 'CMP', width: 'w-16' },
          { key: 'passAtt', label: 'ATT', width: 'w-16' },
          { key: 'cmpPct', label: 'CMP%', width: 'w-16' },
          { key: 'passYds', label: 'YDS', width: 'w-20', primary: true },
          { key: 'ypa', label: 'Y/A', width: 'w-14' },
          { key: 'passTd', label: 'TD', width: 'w-14' },
          { key: 'passInt', label: 'INT', width: 'w-14' },
          { key: 'sacked', label: 'SCK', width: 'w-14' },
          { key: 'passRtg', label: 'RTG', width: 'w-16' },
          { key: 'propLine', label: 'PROP', width: 'w-20', betting: true },
        ]
      case 'rushing':
        return [
          { key: 'rank', label: 'RK', width: 'w-12' },
          { key: 'name', label: 'PLAYER', width: 'w-48' },
          { key: 'gp', label: 'GP', width: 'w-12' },
          { key: 'rushAtt', label: 'ATT', width: 'w-16' },
          { key: 'rushYds', label: 'YDS', width: 'w-20', primary: true },
          { key: 'rushYpc', label: 'Y/A', width: 'w-14' },
          { key: 'rushLong', label: 'LNG', width: 'w-16' },
          { key: 'rushTd', label: 'TD', width: 'w-14' },
          { key: 'fumbles', label: 'FUM', width: 'w-14' },
          { key: 'propLine', label: 'PROP', width: 'w-20', betting: true },
        ]
      case 'receiving':
        return [
          { key: 'rank', label: 'RK', width: 'w-12' },
          { key: 'name', label: 'PLAYER', width: 'w-48' },
          { key: 'gp', label: 'GP', width: 'w-12' },
          { key: 'targets', label: 'TGT', width: 'w-14' },
          { key: 'rec', label: 'REC', width: 'w-14' },
          { key: 'recYds', label: 'YDS', width: 'w-20', primary: true },
          { key: 'recYpc', label: 'Y/R', width: 'w-14' },
          { key: 'recLong', label: 'LNG', width: 'w-16' },
          { key: 'recTd', label: 'TD', width: 'w-14' },
          { key: 'catchPct', label: 'CATCH%', width: 'w-18' },
          { key: 'propLine', label: 'PROP', width: 'w-20', betting: true },
        ]
      case 'defense':
        return [
          { key: 'rank', label: 'RK', width: 'w-12' },
          { key: 'name', label: 'PLAYER', width: 'w-48' },
          { key: 'gp', label: 'GP', width: 'w-12' },
          { key: 'tackles', label: 'TCKL', width: 'w-16', primary: true },
          { key: 'soloTackles', label: 'SOLO', width: 'w-14' },
          { key: 'sacks', label: 'SACK', width: 'w-16' },
          { key: 'tfl', label: 'TFL', width: 'w-14' },
          { key: 'ints', label: 'INT', width: 'w-14' },
          { key: 'pdef', label: 'PD', width: 'w-14' },
          { key: 'ff', label: 'FF', width: 'w-12' },
          { key: 'fr', label: 'FR', width: 'w-12' },
          { key: 'defTd', label: 'TD', width: 'w-12' },
        ]
      case 'kicking':
        return [
          { key: 'rank', label: 'RK', width: 'w-12' },
          { key: 'name', label: 'PLAYER', width: 'w-48' },
          { key: 'gp', label: 'GP', width: 'w-12' },
          { key: 'fgm', label: 'FGM', width: 'w-14' },
          { key: 'fga', label: 'FGA', width: 'w-14' },
          { key: 'fgPct', label: 'FG%', width: 'w-16', primary: true },
          { key: 'fg50', label: '50+', width: 'w-14' },
          { key: 'xpm', label: 'XPM', width: 'w-14' },
          { key: 'xpa', label: 'XPA', width: 'w-14' },
          { key: 'pts', label: 'PTS', width: 'w-16' },
        ]
      case 'returns':
        return [
          { key: 'rank', label: 'RK', width: 'w-12' },
          { key: 'name', label: 'PLAYER', width: 'w-48' },
          { key: 'gp', label: 'GP', width: 'w-12' },
          { key: 'krAtt', label: 'KR', width: 'w-14' },
          { key: 'krYds', label: 'KR YDS', width: 'w-20', primary: true },
          { key: 'krAvg', label: 'KR AVG', width: 'w-18' },
          { key: 'krTd', label: 'KR TD', width: 'w-16' },
          { key: 'prAtt', label: 'PR', width: 'w-14' },
          { key: 'prYds', label: 'PR YDS', width: 'w-18' },
          { key: 'prAvg', label: 'PR AVG', width: 'w-18' },
          { key: 'prTd', label: 'PR TD', width: 'w-16' },
        ]
      default:
        return []
    }
  }

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = getData()
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      data = data.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.team.toLowerCase().includes(q) ||
        p.teamFull.toLowerCase().includes(q)
      )
    }
    
    // Team filter
    if (teamFilter !== 'all') {
      data = data.filter(p => p.team === teamFilter)
    }
    
    // Position filter
    if (posFilter !== 'all') {
      data = data.filter(p => p.position === posFilter)
    }
    
    // Sort
    if (sortCol !== 'rank') {
      data = [...data].sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[sortCol]
        const bVal = (b as unknown as Record<string, unknown>)[sortCol]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal
        }
        return 0
      })
    }
    
    return data
  }, [category, searchQuery, teamFilter, posFilter, sortCol, sortDir])

  const columns = getColumns()
  const teams = [...new Set(getData().map(p => p.team))].sort()
  const positions = [...new Set(getData().map(p => p.position))].sort()

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a12]">
        <div className="max-w-[1800px] mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🏈</span>
            <div>
              <h1 className="text-3xl font-black text-white">NFL Player Statistics</h1>
              <p className="text-sm text-gray-500">Complete stats with betting prop insights</p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { id: 'passing', label: 'Passing', icon: '🎯' },
              { id: 'rushing', label: 'Rushing', icon: '🏃' },
              { id: 'receiving', label: 'Receiving', icon: '🙌' },
              { id: 'defense', label: 'Defense', icon: '🛡️' },
              { id: 'kicking', label: 'Kicking', icon: '🦵' },
              { id: 'returns', label: 'Returns', icon: '⚡' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id as StatCategory); setSortCol('rank'); setSortDir('asc') }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  category === cat.id 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/5 bg-[#0a0a12]/50">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Season */}
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as Season)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm cursor-pointer"
            >
              <option value="2025">2025 Season</option>
              <option value="2024">2024 Season</option>
              <option value="2023">2023 Season</option>
              <option value="career">Career</option>
            </select>

            {/* Team Filter */}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm cursor-pointer"
            >
              <option value="all">All Teams</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Position Filter */}
            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm cursor-pointer"
            >
              <option value="all">All Positions</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Quick Links */}
            <div className="ml-auto flex items-center gap-2">
              <Link href="/nfl" className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-all">
                Team Stats →
              </Link>
              <Link href="/nfl/matchups" className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-all">
                Matchups →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0c0c14]">
          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-3 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-all ${col.width} ${
                        col.betting ? 'bg-orange-500/10 text-orange-500' : 'text-gray-500'
                      } ${col.primary ? 'text-white' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortCol === col.key && (
                          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.map((player, idx) => (
                  <tr 
                    key={player.id} 
                    className="hover:bg-white/[0.02] transition-all cursor-pointer"
                  >
                    {columns.map((col) => {
                      const value = (player as unknown as Record<string, unknown>)[col.key]
                      
                      // Special rendering for player name
                      if (col.key === 'name') {
                        return (
                          <td key={col.key} className="px-3 py-3">
                            <Link href={`/nfl/players/${player.id}`} className="flex items-center gap-3 group">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                                {player.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <div className="font-semibold text-white group-hover:text-orange-500 transition-colors flex items-center gap-2">
                                  {player.name}
                                  {player.propTrend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                  {player.propTrend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                                </div>
                                <div className="text-xs text-gray-500">{player.team} · {player.position}</div>
                              </div>
                            </Link>
                          </td>
                        )
                      }
                      
                      // Prop line with hit rate
                      if (col.key === 'propLine' && player.propLine) {
                        return (
                          <td key={col.key} className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-orange-500">{player.propLine}</span>
                              {player.propHitRate && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  player.propHitRate >= 55 ? 'bg-green-500/20 text-green-400' : 
                                  player.propHitRate >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {player.propHitRate}%
                                </span>
                              )}
                            </div>
                          </td>
                        )
                      }
                      
                      // Primary stat highlight
                      if (col.primary) {
                        return (
                          <td key={col.key} className="px-3 py-3 font-bold text-white">
                            {typeof value === 'number' ? value.toLocaleString() : value?.toString() ?? '-'}
                          </td>
                        )
                      }
                      
                      // Default rendering
                      return (
                        <td key={col.key} className={`px-3 py-3 text-sm ${col.key === 'rank' ? 'text-gray-500 font-mono' : 'text-gray-300'}`}>
                          {typeof value === 'number' ? (
                            Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1)
                          ) : value?.toString() ?? '-'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[#0c0c14] border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-white">Hot Props 🔥</h3>
            </div>
            <div className="space-y-2">
              {filteredData.filter(p => p.propTrend === 'up').slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{p.name}</span>
                  <span className="text-green-400">O {p.propLine} ({p.propHitRate}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c0c14] border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-white">Consistent Overs</h3>
            </div>
            <div className="space-y-2">
              {filteredData.filter(p => (p.propHitRate ?? 0) >= 58).slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{p.name}</span>
                  <span className="text-green-400">{p.propHitRate}% hit rate</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c0c14] border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-white">Fade Alert</h3>
            </div>
            <div className="space-y-2">
              {filteredData.filter(p => p.propTrend === 'down').slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{p.name}</span>
                  <span className="text-red-400">U {p.propLine} ({100 - (p.propHitRate ?? 50)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
