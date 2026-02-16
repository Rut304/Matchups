/**
 * Sport Configuration — Central config for all sport-specific settings
 * Used by matchup pages, Edge engine, and shared components
 */

export interface SportConfig {
  /** Sport key */
  key: string
  /** Display name */
  name: string
  /** Spread label: ATS (default), RL (MLB), PL (NHL) */
  spreadLabel: string
  /** Score unit: PTS, RUNS (MLB), GOALS (NHL) */
  scoreUnit: string
  /** Whether this sport is played outdoors (weather matters) */
  outdoor: boolean
  /** Whether back-to-back matters for this sport */
  hasB2B: boolean
  /** B2B stat note for display */
  b2bNote: string
  /** Whether to show officials panel */
  hasOfficials: boolean
  /** Whether to show power ratings comparison */
  hasPowerRatings: boolean
  /** Key numbers for spread betting (null = no key numbers) */
  keyNumbers: number[] | null
  /** Key number sport description */
  keyNumberDesc: string
  /** Recent form window (number of past games) */
  formWindow: number
  /** Whether rest days are tracked */
  hasRestDays: boolean
  /** Quick links for sidebar */
  quickLinks: Array<{ label: string; href: string; icon: 'trends' | 'lineshop' | 'live' }>
  /** The Odds API sport key */
  oddsApiKey: string
}

export const SPORT_CONFIGS: Record<string, SportConfig> = {
  nfl: {
    key: 'nfl',
    name: 'NFL',
    spreadLabel: 'ATS',
    scoreUnit: 'PTS',
    outdoor: true,
    hasB2B: false,
    b2bNote: '',
    hasOfficials: true,
    hasPowerRatings: true,
    keyNumbers: null,
    keyNumberDesc: '',
    formWindow: 5,
    hasRestDays: false,
    quickLinks: [
      { label: 'All NFL Trends', href: '/trends?sport=nfl', icon: 'trends' },
      { label: 'Line Shop', href: '/lineshop', icon: 'lineshop' },
    ],
    oddsApiKey: 'americanfootball_nfl',
  },
  nba: {
    key: 'nba',
    name: 'NBA',
    spreadLabel: 'ATS',
    scoreUnit: 'PTS',
    outdoor: false,
    hasB2B: true,
    b2bNote: 'NBA B2B teams cover ~47% ATS',
    hasOfficials: true,
    hasPowerRatings: true,
    keyNumbers: null,
    keyNumberDesc: '',
    formWindow: 5,
    hasRestDays: true,
    quickLinks: [
      { label: 'All NBA Trends', href: '/trends?sport=nba', icon: 'trends' },
      { label: 'Live Alerts', href: '/live', icon: 'live' },
    ],
    oddsApiKey: 'basketball_nba',
  },
  mlb: {
    key: 'mlb',
    name: 'MLB',
    spreadLabel: 'RL',
    scoreUnit: 'RUNS',
    outdoor: true,
    hasB2B: false,
    b2bNote: '',
    hasOfficials: true,
    hasPowerRatings: true,
    keyNumbers: null,
    keyNumberDesc: '',
    formWindow: 10,
    hasRestDays: false,
    quickLinks: [
      { label: 'All MLB Trends', href: '/trends?sport=mlb', icon: 'trends' },
      { label: 'Line Shop', href: '/lineshop', icon: 'lineshop' },
    ],
    oddsApiKey: 'baseball_mlb',
  },
  nhl: {
    key: 'nhl',
    name: 'NHL',
    spreadLabel: 'PL',
    scoreUnit: 'GOALS',
    outdoor: false,
    hasB2B: true,
    b2bNote: 'NHL B2B: ~48% PL cover rate',
    hasOfficials: true,
    hasPowerRatings: true,
    keyNumbers: null,
    keyNumberDesc: '',
    formWindow: 5,
    hasRestDays: true,
    quickLinks: [
      { label: 'All NHL Trends', href: '/trends?sport=nhl', icon: 'trends' },
      { label: 'Line Shop', href: '/lineshop', icon: 'lineshop' },
    ],
    oddsApiKey: 'icehockey_nhl',
  },
  ncaab: {
    key: 'ncaab',
    name: 'NCAAB',
    spreadLabel: 'ATS',
    scoreUnit: 'PTS',
    outdoor: false,
    hasB2B: false,
    b2bNote: '',
    hasOfficials: false,
    hasPowerRatings: true,
    keyNumbers: [3, 5, 7, 10],
    keyNumberDesc: 'common CBB margin of victory',
    formWindow: 5,
    hasRestDays: false,
    quickLinks: [
      { label: 'All NCAAB Trends', href: '/trends?sport=ncaab', icon: 'trends' },
    ],
    oddsApiKey: 'basketball_ncaab',
  },
  ncaaf: {
    key: 'ncaaf',
    name: 'NCAAF',
    spreadLabel: 'ATS',
    scoreUnit: 'PTS',
    outdoor: true,
    hasB2B: false,
    b2bNote: '',
    hasOfficials: false,
    hasPowerRatings: true,
    keyNumbers: [3, 7, 10, 14, 17, 21],
    keyNumberDesc: 'common CFB margin of victory',
    formWindow: 5,
    hasRestDays: false,
    quickLinks: [
      { label: 'All NCAAF Trends', href: '/trends?sport=ncaaf', icon: 'trends' },
    ],
    oddsApiKey: 'americanfootball_ncaaf',
  },
  wnba: {
    key: 'wnba',
    name: 'WNBA',
    spreadLabel: 'ATS',
    scoreUnit: 'PTS',
    outdoor: false,
    hasB2B: true,
    b2bNote: 'WNBA B2B performance varies with travel',
    hasOfficials: false,
    hasPowerRatings: false,
    keyNumbers: null,
    keyNumberDesc: '',
    formWindow: 5,
    hasRestDays: true,
    quickLinks: [
      { label: 'All WNBA Trends', href: '/trends?sport=wnba', icon: 'trends' },
    ],
    oddsApiKey: 'basketball_wnba',
  },
  wncaab: {
    key: 'wncaab',
    name: 'WNCAAB',
    spreadLabel: 'ATS',
    scoreUnit: 'PTS',
    outdoor: false,
    hasB2B: false,
    b2bNote: '',
    hasOfficials: false,
    hasPowerRatings: false,
    keyNumbers: [3, 5, 7, 10],
    keyNumberDesc: 'common WCBB margin of victory',
    formWindow: 5,
    hasRestDays: false,
    quickLinks: [
      { label: 'All WNCAAB Trends', href: '/trends?sport=wncaab', icon: 'trends' },
    ],
    oddsApiKey: 'basketball_wncaab',
  },
}

export function getSportConfig(sport: string): SportConfig {
  return SPORT_CONFIGS[sport.toLowerCase()] || SPORT_CONFIGS.nfl
}
