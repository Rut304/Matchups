import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOdds(odds: number): string {
  if (odds >= 0) return `+${odds}`
  return odds.toString()
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function getTeamColors(sport: string, teamId: string): { primary: string; secondary: string } {
  // TODO: Implement team color mapping
  return { primary: '#f59e0b', secondary: '#0d9488' }
}

export function getSportIcon(sport: string): string {
  const icons: Record<string, string> = {
    nfl: '🏈',
    nba: '🏀',
    nhl: '🏒',
    mlb: '⚾',
  }
  return icons[sport.toLowerCase()] || '🎯'
}
