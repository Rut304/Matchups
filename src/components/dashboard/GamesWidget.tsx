'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FollowedGame {
  id: string;
  gameId: string;
  sport: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  scheduledAt: string;
  status: 'scheduled' | 'in_progress' | 'final';
  homeScore?: number;
  awayScore?: number;
  spread?: string;
  total?: string;
  notificationsEnabled: boolean;
  betPlaced: boolean;
  betDetails?: {
    type: string;
    selection: string;
    odds: string;
    stake?: number;
  };
  notes?: string;
}

interface GamesWidgetProps {
  games: FollowedGame[];
  onToggleFollow: (gameId: string) => void;
  onToggleNotifications: (gameId: string) => void;
  onAddBet: (gameId: string, betDetails: FollowedGame['betDetails']) => void;
  onAddNote: (gameId: string, note: string) => void;
  onViewGame: (gameId: string) => void;
  isLoading?: boolean;
}

export function GamesWidget({
  games,
  onToggleFollow,
  onToggleNotifications,
  onAddBet,
  onAddNote,
  onViewGame,
  isLoading = false,
}: GamesWidgetProps) {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'live'>('all');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (isTomorrow) return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-full animate-pulse">LIVE</span>;
      case 'final':
        return <span className="px-2 py-0.5 text-xs font-medium bg-slate-500/20 text-slate-400 rounded-full">FINAL</span>;
      default:
        return null;
    }
  };

  const filteredGames = games.filter((game) => {
    const gameDate = new Date(game.scheduledAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case 'today':
        return gameDate >= today && gameDate < tomorrow;
      case 'upcoming':
        return gameDate > now && game.status === 'scheduled';
      case 'live':
        return game.status === 'in_progress';
      default:
        return true;
    }
  });

  const sportColors: Record<string, string> = {
    NFL: 'bg-green-500/20 text-green-400',
    NBA: 'bg-orange-500/20 text-orange-400',
    NHL: 'bg-blue-500/20 text-blue-400',
    MLB: 'bg-red-500/20 text-red-400',
    NCAAF: 'bg-yellow-500/20 text-yellow-400',
    NCAAB: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-white">My Games</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
              {games.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/schedule'}
            className="text-slate-400 hover:text-white"
          >
            Browse Games
          </Button>
        </div>

        <div className="flex gap-2">
          {(['all', 'today', 'upcoming', 'live'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'live' && games.filter(g => g.status === 'in_progress').length > 0 && (
                <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-400 mb-2">No games found</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.href = '/schedule'}
            >
              Find Games to Follow
            </Button>
          </div>
        ) : (
          filteredGames.map((game) => (
            <div
              key={game.id}
              className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${sportColors[game.sport] || 'bg-slate-500/20 text-slate-400'}`}>
                      {game.sport}
                    </span>
                    {getStatusBadge(game.status)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleNotifications(game.gameId)}
                      className={`p-1.5 rounded transition-colors ${
                        game.notificationsEnabled
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                      title={game.notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                    >
                      <svg className="w-4 h-4" fill={game.notificationsEnabled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onToggleFollow(game.gameId)}
                      className="p-1.5 rounded text-red-400 hover:text-red-300 transition-colors"
                      title="Unfollow game"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {game.awayTeamLogo && (
                        <img src={game.awayTeamLogo} alt="" className="w-6 h-6" />
                      )}
                      <span className="text-white font-medium">{game.awayTeamName}</span>
                      {game.status !== 'scheduled' && (
                        <span className="text-lg font-bold text-white ml-auto">{game.awayScore}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {game.homeTeamLogo && (
                        <img src={game.homeTeamLogo} alt="" className="w-6 h-6" />
                      )}
                      <span className="text-white font-medium">{game.homeTeamName}</span>
                      {game.status !== 'scheduled' && (
                        <span className="text-lg font-bold text-white ml-auto">{game.homeScore}</span>
                      )}
                    </div>
                  </div>

                  {game.status === 'scheduled' && (
                    <div className="text-right ml-4">
                      <div className="text-sm text-slate-400">{formatDate(game.scheduledAt)}</div>
                      {game.spread && (
                        <div className="text-xs text-slate-500 mt-1">
                          Spread: {game.spread} | O/U: {game.total}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {game.betPlaced && game.betDetails && (
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-400">Bet: {game.betDetails.selection}</span>
                      <span className="text-slate-400">@ {game.betDetails.odds}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                  className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-400 transition-colors"
                >
                  {expandedGame === game.id ? 'Show less' : 'Show more options'}
                </button>
              </div>

              {expandedGame === game.id && (
                <div className="px-3 pb-3 pt-2 border-t border-slate-700 space-y-2">
                  {!game.betPlaced && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => onAddBet(game.gameId, { type: 'spread', selection: game.homeTeamName, odds: '-110' })}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Log My Bet
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a note..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (noteInput.trim()) {
                          onAddNote(game.gameId, noteInput);
                          setNoteInput('');
                        }
                      }}
                    >
                      Save
                    </Button>
                  </div>

                  {game.notes && (
                    <div className="text-xs text-slate-400 bg-slate-800 rounded p-2">
                      <span className="text-slate-500">Note:</span> {game.notes}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-blue-400 hover:text-blue-300"
                    onClick={() => onViewGame(game.gameId)}
                  >
                    View Full Game Details →
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
