'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FavoriteTeam {
  id: string;
  sport: string;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  teamAbbr?: string;
  record?: string;
  standing?: string;
  nextGame?: {
    opponent: string;
    date: string;
    isHome: boolean;
  };
  notificationsEnabled: boolean;
}

interface TeamsWidgetProps {
  teams: FavoriteTeam[];
  onToggleFavorite: (teamId: string, sport: string) => void;
  onToggleNotifications: (teamId: string) => void;
  onViewTeam: (teamId: string, sport: string) => void;
  onViewSchedule: (teamId: string, sport: string) => void;
  isLoading?: boolean;
}

export function TeamsWidget({
  teams,
  onToggleFavorite,
  onToggleNotifications,
  onViewTeam,
  onViewSchedule,
  isLoading = false,
}: TeamsWidgetProps) {
  const [filterSport, setFilterSport] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'sport' | 'record'>('sport');

  const sportColors: Record<string, { bg: string; text: string; border: string }> = {
    NFL: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    NBA: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    NHL: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    MLB: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    NCAAF: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    NCAAB: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  };

  const uniqueSports = [...new Set(teams.map((t) => t.sport))];

  const filteredTeams = teams
    .filter((team) => filterSport === 'all' || team.sport === filterSport)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.teamName.localeCompare(b.teamName);
        case 'sport':
          return a.sport.localeCompare(b.sport) || a.teamName.localeCompare(b.teamName);
        case 'record':
          // Parse records like "10-5" and sort by win percentage
          const getWinPct = (record?: string) => {
            if (!record) return 0;
            const [wins, losses] = record.split('-').map(Number);
            return wins / (wins + losses) || 0;
          };
          return getWinPct(b.record) - getWinPct(a.record);
        default:
          return 0;
      }
    });

  const formatNextGame = (nextGame?: FavoriteTeam['nextGame']) => {
    if (!nextGame) return null;
    const date = new Date(nextGame.date);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    let dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (isToday) dateStr = 'Today';
    if (isTomorrow) dateStr = 'Tomorrow';

    return `${nextGame.isHome ? 'vs' : '@'} ${nextGame.opponent} · ${dateStr}`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-white">My Teams</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full">
              {teams.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/teams'}
            className="text-slate-400 hover:text-white"
          >
            Browse Teams
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterSport('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filterSport === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            All Sports
          </button>
          {uniqueSports.map((sport) => (
            <button
              key={sport}
              onClick={() => setFilterSport(sport)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filterSport === sport
                  ? `${sportColors[sport]?.bg || 'bg-slate-600'} ${sportColors[sport]?.text || 'text-white'}`
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-slate-400 mb-2">No favorite teams yet</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.href = '/teams'}
            >
              Find Teams to Follow
            </Button>
          </div>
        ) : (
          filteredTeams.map((team) => {
            const colors = sportColors[team.sport] || { bg: 'bg-slate-600', text: 'text-slate-300', border: 'border-slate-600' };
            
            return (
              <div
                key={team.id}
                className={`bg-slate-900/50 rounded-lg border ${colors.border} overflow-hidden hover:border-opacity-60 transition-colors`}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {team.teamLogo ? (
                        <img src={team.teamLogo} alt={team.teamName} className="w-10 h-10 object-contain" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                          <span className={`text-sm font-bold ${colors.text}`}>
                            {team.teamAbbr || team.teamName.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{team.teamName}</span>
                          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}>
                            {team.sport}
                          </span>
                        </div>
                        {team.record && (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span>{team.record}</span>
                            {team.standing && <span>· {team.standing}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleNotifications(team.teamId)}
                        className={`p-1.5 rounded transition-colors ${
                          team.notificationsEnabled
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-slate-500 hover:text-slate-400'
                        }`}
                        title={team.notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                      >
                        <svg className="w-4 h-4" fill={team.notificationsEnabled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onToggleFavorite(team.teamId, team.sport)}
                        className="p-1.5 rounded text-red-400 hover:text-red-300 transition-colors"
                        title="Remove from favorites"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {team.nextGame && (
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Next Game:</span>
                        <span className="text-slate-300">{formatNextGame(team.nextGame)}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onViewTeam(team.teamId, team.sport)}
                    >
                      Team Stats
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onViewSchedule(team.teamId, team.sport)}
                    >
                      Schedule
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {teams.length > 0 && (
        <div className="p-3 border-t border-slate-700 bg-slate-900/30">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sort by:</span>
            <div className="flex gap-2">
              {(['sport', 'name', 'record'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2 py-1 rounded transition-colors ${
                    sortBy === s ? 'bg-slate-700 text-white' : 'hover:text-slate-300'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
