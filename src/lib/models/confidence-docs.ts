// =============================================================================
// CONFIDENCE SCORE DOCUMENTATION
// =============================================================================
// Provides detailed explanations of the confidence scoring model
// Used for tooltips and documentation throughout the app

export const CONFIDENCE_WEIGHTS = {
  injury: {
    weight: 0.20,
    name: 'Injury Impact',
    description: 'Analyzes injured/questionable players, their importance, and expected point swing. Key players OUT can shift lines 2-5 points.',
    emoji: '🏥',
    color: '#FF4455'
  },
  pace: {
    weight: 0.15,
    name: 'Pace & Tempo',
    description: 'Measures pace of play (possessions/plays per game). Fast vs slow matchups are key for O/U predictions.',
    emoji: '⚡',
    color: '#FFD700'
  },
  location: {
    weight: 0.12,
    name: 'Home Field Advantage',
    description: 'Home teams get ~3pt advantage in NFL/NBA. Factors in altitude (Denver), travel distance, and rest days.',
    emoji: '🏠',
    color: '#00A8FF'
  },
  matchup: {
    weight: 0.18,
    name: 'Matchup Analysis',
    description: 'Head-to-head history, offensive vs defensive rank matchups, and key player matchup advantages.',
    emoji: '⚔️',
    color: '#9B59B6'
  },
  weather: {
    weight: 0.08,
    name: 'Weather Impact',
    description: 'Temperature, wind, and precipitation effects on outdoor games. Wind >15mph significantly impacts totals.',
    emoji: '🌤️',
    color: '#00D9FF'
  },
  trend: {
    weight: 0.12,
    name: 'Historical Trends',
    description: 'Team ATS/OU performance in similar situations (home favorites, division games, etc.).',
    emoji: '📊',
    color: '#00FF88'
  },
  sharp: {
    weight: 0.15,
    name: 'Sharp Money',
    description: 'Follows professional bettor action. Sharp money moves lines and is typically 54-56% accurate long-term.',
    emoji: '💰',
    color: '#FF6B00'
  }
}

export const CONFIDENCE_THRESHOLDS = {
  high: {
    threshold: 72,
    label: 'HIGH CONFIDENCE',
    description: 'Strong edge detected. Multiple factors align favorably. Historical win rate: 58-62%',
    color: '#00FF88',
    emoji: '🔥'
  },
  medium: {
    threshold: 55,
    label: 'MEDIUM CONFIDENCE',
    description: 'Moderate edge. Some factors favorable, others neutral. Historical win rate: 52-55%',
    color: '#FFD700',
    emoji: '⚡'
  },
  low: {
    threshold: 45,
    label: 'LOW CONFIDENCE',
    description: 'Lean only. Mixed signals across factors. Consider avoiding or smaller unit size.',
    color: '#FF6B00',
    emoji: '⚠️'
  },
  avoid: {
    threshold: 0,
    label: 'AVOID',
    description: 'No clear edge or negative factors. Pass on this game.',
    color: '#FF4455',
    emoji: '🚫'
  }
}

export const SPORT_MULTIPLIERS = {
  nfl: { multiplier: 1.0, description: 'Most predictable major sport. Lower variance.' },
  nba: { multiplier: 0.95, description: 'Higher variance due to back-to-backs and load management.' },
  nhl: { multiplier: 0.90, description: 'Highest variance. Goaltending heavily affects outcomes.' },
  mlb: { multiplier: 0.85, description: 'Starting pitching dominant. Less predictable day-to-day.' },
  ncaaf: { multiplier: 1.05, description: 'Less parity than NFL. Talent gaps more predictable.' },
  ncaab: { multiplier: 0.80, description: 'Lots of variance. Young players inconsistent.' }
}

export const RSI_LEARNING_INFO = {
  learningRate: 0.03,
  description: 'Recursive Self-Improvement (RSI) adjusts model weights after each completed game. If a factor correctly predicted the outcome, its weight increases slightly. If wrong, it decreases.',
  updates: 'Weights update automatically after game results are recorded.',
  minWeight: 0.05,
  maxWeight: 0.35,
  explanation: 'A learning rate of 0.03 means weights shift by up to 3% per game. This prevents overcorrection while allowing the model to adapt to changing patterns.'
}

export function getConfidenceLevel(score: number): {
  label: string
  color: string
  emoji: string
  description: string
} {
  if (score >= CONFIDENCE_THRESHOLDS.high.threshold) {
    return CONFIDENCE_THRESHOLDS.high
  } else if (score >= CONFIDENCE_THRESHOLDS.medium.threshold) {
    return CONFIDENCE_THRESHOLDS.medium
  } else if (score >= CONFIDENCE_THRESHOLDS.low.threshold) {
    return CONFIDENCE_THRESHOLDS.low
  }
  return CONFIDENCE_THRESHOLDS.avoid
}

export function formatWeightAsPercent(weight: number): string {
  return `${(weight * 100).toFixed(0)}%`
}
