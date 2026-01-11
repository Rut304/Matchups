'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FavoritePlayer {
  id: string;
  sport: string;
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  teamLogo?: string;
  position?: string;
  jerseyNumber?: string;
  headshotUrl?: string;
  stats?: {
    label: string;
    value: string;
  }[];
  recentNews?: {
    title: string;
    date: string;
  };
  injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'ir';
  notificationsEnabled: boolean;
}

interface PlayersWidgetProps {
  players: FavoritePlayer[];
  onToggleFavorite: (playerId: string, sport: string) => void;
  onToggleNotifications: (playerId: string) => void;
  onViewPlayer: (playerId: string, sport: string) => void;
  onViewNews: (playerId: string) => void;
  isLoading?: boolean;
}

export function PlayersWidget({
  players,
  onToggleFavorite,
  onToggleNotifications,
  onViewPlayer,
  onViewNews,
  isLoading = false,
}: PlayersWidgetProps) {
  const [filterSport, setFilterSport] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'injured'>('all');

  const sportColors: Record<string, { bg: string; text: string; border: string }> = {
    NFL: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    NBA: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    NHL: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    MLB: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    NCAAF: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    NCAAB: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  };

  const injuryColors: Record<string, { bg: string; text: string }> = {
    healthy: { bg: 'bg-green-500/20', text: 'text-green-400' },
    questionable: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    doubtful: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    out: { bg: 'bg-red-500/20', text: 'text-red-400' },
    ir: { bg: 'bg-red-600/20', text: 'text-red-500' },
  };

  const uniqueSports = [...new Set(players.map((p) => p.sport))];

  const filteredPlayers = players.filter((player) => {
    if (filterSport !== 'all' && player.sport !== filterSport) return false;
    if (filterStatus === 'injured' && (!player.injuryStatus || player.injuryStatus === 'healthy')) return false;
    return true;
  });

  const injuredCount = players.filter((p) => p.injuryStatus && p.injuryStatus !== 'healthy').length;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-semibold text-white">My Players</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full">
              {players.length}
            </span>
            {injuredCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                {injuredCount} injured
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/players'}
            className="text-slate-400 hover:text-white"
          >
            Browse Players
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterSport('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filterSport === 'all'
                ? 'bg-purple-500 text-white'
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
          {injuredCount > 0 && (
            <button
              onClick={() => setFilterStatus(filterStatus === 'injured' ? 'all' : 'injured')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filterStatus === 'injured'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              🩹 Injured Only
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-slate-400 mb-2">
              {filterStatus === 'injured' ? 'No injured players' : 'No favorite players yet'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.href = '/players'}
            >
              Find Players to Follow
            </Button>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const colors = sportColors[player.sport] || { bg: 'bg-slate-600', text: 'text-slate-300', border: 'border-slate-600' };
            const injuryStyle = player.injuryStatus ? injuryColors[player.injuryStatus] : null;

            return (
              <div
                key={player.id}
                className={`bg-slate-900/50 rounded-lg border ${colors.border} overflow-hidden hover:border-opacity-60 transition-colors`}
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    {player.headshotUrl ? (
                      <img
                        src={player.headshotUrl}
                        alt={player.playerName}
                        className="w-14 h-14 rounded-full object-cover bg-slate-700"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-full ${colors.bg} flex items-center justify-center`}>
                        <span className={`text-lg font-bold ${colors.text}`}>
                          {player.playerName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium">{player.playerName}</span>
                        {player.jerseyNumber && (
                          <span className="text-slate-500 text-sm">#{player.jerseyNumber}</span>
                        )}
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}>
                          {player.sport}
                        </span>
                        {player.injuryStatus && player.injuryStatus !== 'healthy' && injuryStyle && (
                          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${injuryStyle.bg} ${injuryStyle.text} uppercase`}>
                            {player.injuryStatus === 'ir' ? 'IR' : player.injuryStatus}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
                        {player.position && <span>{player.position}</span>}
                        {player.position && player.teamName && <span>·</span>}
                        {player.teamName && (
                          <div className="flex items-center gap-1">
                            {player.teamLogo && (
                              <img src={player.teamLogo} alt="" className="w-4 h-4" />
                            )}
                            <span>{player.teamName}</span>
                          </div>
                        )}
                      </div>

                      {player.stats && player.stats.length > 0 && (
                        <div className="flex gap-3 mt-2">
                          {player.stats.slice(0, 3).map((stat, i) => (
                            <div key={i} className="text-center">
                              <div className="text-sm font-semibold text-white">{stat.value}</div>
                              <div className="text-xs text-slate-500">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => onToggleNotifications(player.playerId)}
                        className={`p-1.5 rounded transition-colors ${
                          player.notificationsEnabled
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-slate-500 hover:text-slate-400'
                        }`}
                        title={player.notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                      >
                        <svg className="w-4 h-4" fill={player.notificationsEnabled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onToggleFavorite(player.playerId, player.sport)}
                        className="p-1.5 rounded text-red-400 hover:text-red-300 transition-colors"
                        title="Remove from favorites"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {player.recentNews && (
                    <div
                      className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded cursor-pointer hover:bg-blue-500/15 transition-colors"
                      onClick={() => onViewNews(player.playerId)}
                    >
                      <div className="flex items-start gap-2 text-sm">
                        <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-blue-300 line-clamp-1">{player.recentNews.title}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{player.recentNews.date}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onViewPlayer(player.playerId, player.sport)}
                    >
                      Full Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onViewNews(player.playerId)}
                    >
                      News & Updates
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
