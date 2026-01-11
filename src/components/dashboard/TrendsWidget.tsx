'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface UserSystem {
  id: string;
  name: string;
  description?: string;
  sport: string;
  criteria: string[];
  totalPicks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  roi: number;
  streak: number;
  isStreakWin: boolean;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  marketplaceListing?: {
    id: string;
    status: 'active' | 'paused' | 'removed';
    isFree: boolean;
    priceCents: number;
    views: number;
    likes: number;
    copies: number;
  };
}

interface TrendsWidgetProps {
  systems: UserSystem[];
  onCreateSystem: () => void;
  onEditSystem: (systemId: string) => void;
  onDeleteSystem: (systemId: string) => void;
  onPublishToMarketplace: (systemId: string) => void;
  onUnpublish: (systemId: string) => void;
  onViewMarketplace: () => void;
  onTestSystem: (systemId: string) => void;
  marketplaceMonetizationEnabled: boolean;
  isLoading?: boolean;
}

export function TrendsWidget({
  systems,
  onCreateSystem,
  onEditSystem,
  onDeleteSystem,
  onPublishToMarketplace,
  onUnpublish,
  onViewMarketplace,
  onTestSystem,
  marketplaceMonetizationEnabled,
  isLoading = false,
}: TrendsWidgetProps) {
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished' | 'winning'>('all');
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  const sportColors: Record<string, { bg: string; text: string }> = {
    NFL: { bg: 'bg-green-500/20', text: 'text-green-400' },
    NBA: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    NHL: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    MLB: { bg: 'bg-red-500/20', text: 'text-red-400' },
    NCAAF: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    NCAAB: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    ALL: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  };

  const filteredSystems = systems.filter((system) => {
    switch (filter) {
      case 'published':
        return system.isPublished;
      case 'unpublished':
        return !system.isPublished;
      case 'winning':
        return system.winRate >= 52;
      default:
        return true;
    }
  });

  const canPublish = (system: UserSystem) => {
    return system.totalPicks >= 5 && system.winRate >= 52 && !system.isPublished;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const totalStats = systems.reduce(
    (acc, s) => ({
      picks: acc.picks + s.totalPicks,
      wins: acc.wins + s.wins,
      losses: acc.losses + s.losses,
    }),
    { picks: 0, wins: 0, losses: 0 }
  );

  const overallWinRate = totalStats.picks > 0 
    ? ((totalStats.wins / (totalStats.wins + totalStats.losses)) * 100).toFixed(1)
    : '0.0';

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 className="text-lg font-semibold text-white">My Systems & Trends</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 rounded-full">
              {systems.length}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewMarketplace}
              className="text-slate-400 hover:text-white"
            >
              Marketplace
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateSystem}
            >
              + New System
            </Button>
          </div>
        </div>

        {/* Overall Stats */}
        {systems.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-slate-900/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{systems.length}</div>
              <div className="text-xs text-slate-500">Systems</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{totalStats.picks}</div>
              <div className="text-xs text-slate-500">Total Picks</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${Number(overallWinRate) >= 52 ? 'text-green-400' : 'text-slate-300'}`}>
                {overallWinRate}%
              </div>
              <div className="text-xs text-slate-500">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">
                {systems.filter((s) => s.isPublished).length}
              </div>
              <div className="text-xs text-slate-500">Published</div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {(['all', 'published', 'unpublished', 'winning'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {f === 'winning' ? '🔥 Winning (52%+)' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSystems.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-slate-400 mb-2">
              {filter !== 'all' ? `No ${filter} systems` : 'No systems created yet'}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Create a betting system to track your trends and share winning strategies
            </p>
            <Button variant="primary" onClick={onCreateSystem}>
              Create Your First System
            </Button>
          </div>
        ) : (
          filteredSystems.map((system) => {
            const colors = sportColors[system.sport] || sportColors.ALL;
            const isQualified = system.totalPicks >= 5 && system.winRate >= 52;

            return (
              <div
                key={system.id}
                className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
              >
                <div className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium truncate">{system.name}</span>
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}>
                          {system.sport}
                        </span>
                        {system.isPublished && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                            Published
                          </span>
                        )}
                        {isQualified && !system.isPublished && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded animate-pulse">
                            Ready to Publish!
                          </span>
                        )}
                      </div>
                      {system.description && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-1">{system.description}</p>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedSystem(expandedSystem === system.id ? null : system.id)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title={expandedSystem === system.id ? "Collapse details" : "Expand details"}
                      aria-label={expandedSystem === system.id ? "Collapse details" : "Expand details"}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${expandedSystem === system.id ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-sm font-bold text-white">{system.totalPicks}</div>
                      <div className="text-xs text-slate-500">Picks</div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-sm font-bold text-green-400">{system.wins}</div>
                      <div className="text-xs text-slate-500">Wins</div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-sm font-bold text-red-400">{system.losses}</div>
                      <div className="text-xs text-slate-500">Losses</div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className={`text-sm font-bold ${system.winRate >= 52 ? 'text-green-400' : system.winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {system.winRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">Win Rate</div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className={`text-sm font-bold ${system.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {system.roi >= 0 ? '+' : ''}{system.roi.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">ROI</div>
                    </div>
                  </div>

                  {/* Streak */}
                  {system.streak > 0 && (
                    <div className={`mt-2 text-xs text-center ${system.isStreakWin ? 'text-green-400' : 'text-red-400'}`}>
                      {system.isStreakWin ? '🔥' : '❄️'} {system.streak} {system.isStreakWin ? 'win' : 'loss'} streak
                    </div>
                  )}

                  {/* Marketplace Stats (if published) */}
                  {system.marketplaceListing && (
                    <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">
                            👁 {system.marketplaceListing.views}
                          </span>
                          <span className="text-slate-400">
                            ❤️ {system.marketplaceListing.likes}
                          </span>
                          <span className="text-slate-400">
                            📋 {system.marketplaceListing.copies}
                          </span>
                        </div>
                        {marketplaceMonetizationEnabled && (
                          <span className={`font-medium ${system.marketplaceListing.isFree ? 'text-green-400' : 'text-yellow-400'}`}>
                            {system.marketplaceListing.isFree ? 'Free' : formatCurrency(system.marketplaceListing.priceCents)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Section */}
                {expandedSystem === system.id && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-700 space-y-3">
                    {/* Criteria */}
                    {system.criteria.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">System Criteria:</div>
                        <div className="flex flex-wrap gap-1">
                          {system.criteria.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quality Gate Info */}
                    {!isQualified && (
                      <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <div className="text-yellow-400 font-medium">Not yet eligible for Marketplace</div>
                            <div className="text-slate-400 mt-1">
                              Requirements: {system.totalPicks < 5 && `${5 - system.totalPicks} more picks needed`}
                              {system.totalPicks >= 5 && system.winRate < 52 && `Win rate needs to reach 52% (currently ${system.winRate.toFixed(1)}%)`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => onEditSystem(system.id)}>
                        Edit System
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => onTestSystem(system.id)}>
                        Test Against Today
                      </Button>
                      {system.isPublished ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => onUnpublish(system.id)}
                        >
                          Unpublish
                        </Button>
                      ) : canPublish(system) ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onPublishToMarketplace(system.id)}
                        >
                          🚀 Publish to Marketplace
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 ml-auto"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this system? This cannot be undone.')) {
                            onDeleteSystem(system.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="p-3 border-t border-slate-700 bg-slate-900/30">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/trends'}
            className="text-cyan-400 hover:text-cyan-300"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Trend Finder
          </Button>
          <span className="text-xs text-slate-500">
            {systems.filter(s => canPublish(s)).length} systems ready to publish
          </span>
        </div>
      </div>
    </Card>
  );
}
