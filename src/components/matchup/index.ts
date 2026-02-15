/**
 * Shared matchup components
 * Import from '@/components/matchup' for consistent UI across all sports
 */

// Layout components
export { default as MatchupLayout, MatchupMainContent, MatchupSidebar, MatchupGrid, CollapsibleSection } from './MatchupLayout'

// Data display components
export { H2HHistory, H2HCompact } from './H2HHistory'
export type { H2HStats, H2HGame } from './H2HHistory'
export { default as InjuryReport } from './InjuryReport'
export { default as EdgeScoreCard } from './EdgeScoreCard'
export { default as TrendsCard } from './TrendsCard'
export { default as BettingMetrics } from './BettingMetrics'
export { default as AIPredictionCard } from './AIPredictionCard'
export { default as GameInfo } from './GameInfo'

// Error and loading states
export { default as ErrorDisplay, GameNotFound, DataLoadError } from './ErrorDisplay'
export {
  MatchupHeaderSkeleton,
  EdgeScoreSkeleton,
  BettingMetricsSkeleton,
  TrendsSkeleton,
  H2HSkeleton,
  InjuryReportSkeleton,
  GameInfoSkeleton,
  MatchupPageSkeleton,
} from './Skeletons'
