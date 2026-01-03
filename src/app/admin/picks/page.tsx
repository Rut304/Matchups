'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Target,
  Calendar,
  Settings
} from 'lucide-react'
import { cappers, picks, capperStats } from '@/lib/leaderboard-data'
import { BetType, Sport, PickResult, Pick, Capper } from '@/types/leaderboard'

type AdminMode = 'picks' | 'cappers' | 'modify-record'

interface EditingPick {
  id?: string
  capperId: string
  sport: Sport
  betType: BetType
  pickDescription: string
  teamPicked?: string
  spreadLine?: number
  moneylineOdds?: number
  totalLine?: number
  overUnder?: 'over' | 'under'
  units: number
  oddsAtPick: number
  gameDate?: string
  result: PickResult
}

export default function AdminPicksPage() {
  const [mode, setMode] = useState<AdminMode>('picks')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCapper, setSelectedCapper] = useState<string>('all')
  const [isAddingPick, setIsAddingPick] = useState(false)
  const [editingPick, setEditingPick] = useState<EditingPick | null>(null)
  const [modifyRecordCapper, setModifyRecordCapper] = useState<string>('')
  
  // New pick form state
  const [newPick, setNewPick] = useState<EditingPick>({
    capperId: '',
    sport: 'NFL',
    betType: 'spread',
    pickDescription: '',
    units: 1,
    oddsAtPick: -110,
    result: 'pending'
  })
  
  // Record modification state
  const [recordMod, setRecordMod] = useState({
    wins: 0,
    losses: 0,
    reason: ''
  })
  
  // Filtered picks
  const filteredPicks = picks.filter(p => {
    if (selectedCapper !== 'all' && p.capperId !== selectedCapper) return false
    if (searchQuery && !p.pickDescription.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) => new Date(b.pickedAt).getTime() - new Date(a.pickedAt).getTime())
  
  const handleSaveNewPick = () => {
    // In a real app, this would save to Supabase
    console.log('Saving new pick:', newPick)
    alert('Pick saved! (In production, this would save to database)')
    setIsAddingPick(false)
    setNewPick({
      capperId: '',
      sport: 'NFL',
      betType: 'spread',
      pickDescription: '',
      units: 1,
      oddsAtPick: -110,
      result: 'pending'
    })
  }
  
  const handleUpdatePick = () => {
    if (!editingPick) return
    console.log('Updating pick:', editingPick)
    alert('Pick updated! (In production, this would update database)')
    setEditingPick(null)
  }
  
  const handleDeletePick = (pickId: string) => {
    if (confirm('Are you sure you want to delete this pick?')) {
      console.log('Deleting pick:', pickId)
      alert('Pick deleted! (In production, this would delete from database)')
    }
  }
  
  const handleModifyRecord = () => {
    if (!modifyRecordCapper || !recordMod.reason) {
      alert('Please select a capper and provide a reason')
      return
    }
    console.log('Modifying record for:', modifyRecordCapper, recordMod)
    alert(`Record modified for ${cappers.find(c => c.id === modifyRecordCapper)?.name}! (In production, this would update database and create audit log)`)
    setRecordMod({ wins: 0, losses: 0, reason: '' })
    setModifyRecordCapper('')
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>
      {/* Header */}
      <div className="border-b" style={{ background: '#0c0c14', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/leaderboard" 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-4 transition-all hover:bg-white/10"
                style={{ color: '#808090' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-3" style={{ color: '#FFF' }}>
                <Settings className="w-6 h-6" style={{ color: '#FF6B00' }} />
                Admin: Pick Management
              </h1>
              <p className="text-sm mt-1" style={{ color: '#808090' }}>
                Add, edit, or modify capper picks and records
              </p>
            </div>
            
            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {[
                { id: 'picks', label: 'Manage Picks', icon: Target },
                { id: 'cappers', label: 'Cappers', icon: Users },
                { id: 'modify-record', label: 'Modify Record', icon: Edit2 },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setMode(tab.id as AdminMode)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                  style={{ 
                    background: mode === tab.id ? 'rgba(255,107,0,0.2)' : 'transparent',
                    color: mode === tab.id ? '#FF6B00' : '#808090'
                  }}>
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PICKS MODE */}
        {mode === 'picks' && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#606070' }} />
                  <input
                    type="text"
                    placeholder="Search picks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg text-sm w-64"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                
                {/* Capper Filter */}
                <select
                  value={selectedCapper}
                  onChange={(e) => setSelectedCapper(e.target.value)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="all">All Cappers</option>
                  {cappers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Add Pick Button */}
              <button
                onClick={() => setIsAddingPick(true)}
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:opacity-80"
                style={{ background: '#00FF88', color: '#000' }}>
                <Plus className="w-4 h-4" />
                Add New Pick
              </button>
            </div>
            
            {/* Add Pick Form */}
            {isAddingPick && (
              <div className="rounded-2xl p-6 mb-6" style={{ background: '#0c0c14', border: '1px solid rgba(0,255,136,0.3)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg" style={{ color: '#FFF' }}>Add New Pick</h3>
                  <button onClick={() => setIsAddingPick(false)} style={{ color: '#808090' }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Capper *</label>
                    <select
                      value={newPick.capperId}
                      onChange={(e) => setNewPick({...newPick, capperId: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="">Select Capper</option>
                      {cappers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Sport *</label>
                    <select
                      value={newPick.sport}
                      onChange={(e) => setNewPick({...newPick, sport: e.target.value as Sport})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="NFL">NFL</option>
                      <option value="NBA">NBA</option>
                      <option value="MLB">MLB</option>
                      <option value="NHL">NHL</option>
                      <option value="NCAAF">NCAAF</option>
                      <option value="NCAAB">NCAAB</option>
                      <option value="Soccer">Soccer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Bet Type *</label>
                    <select
                      value={newPick.betType}
                      onChange={(e) => setNewPick({...newPick, betType: e.target.value as BetType})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="spread">Spread</option>
                      <option value="moneyline">Moneyline</option>
                      <option value="over_under">Over/Under</option>
                      <option value="prop">Prop</option>
                      <option value="parlay">Parlay</option>
                      <option value="teaser">Teaser</option>
                      <option value="futures">Futures</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Game Date</label>
                    <input
                      type="date"
                      value={newPick.gameDate || ''}
                      onChange={(e) => setNewPick({...newPick, gameDate: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Pick Description *</label>
                    <input
                      type="text"
                      placeholder="e.g., Chiefs -3.5"
                      value={newPick.pickDescription}
                      onChange={(e) => setNewPick({...newPick, pickDescription: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Odds *</label>
                    <input
                      type="number"
                      value={newPick.oddsAtPick}
                      onChange={(e) => setNewPick({...newPick, oddsAtPick: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Units *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newPick.units}
                      onChange={(e) => setNewPick({...newPick, units: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Result</label>
                    <select
                      value={newPick.result}
                      onChange={(e) => setNewPick({...newPick, result: e.target.value as PickResult})}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="win">✅ Win</option>
                      <option value="loss">❌ Loss</option>
                      <option value="push">➖ Push</option>
                    </select>
                  </div>
                  
                  {newPick.betType === 'spread' && (
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Spread Line</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="-3.5"
                        value={newPick.spreadLine || ''}
                        onChange={(e) => setNewPick({...newPick, spreadLine: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                  )}
                  
                  {newPick.betType === 'over_under' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Total Line</label>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="224.5"
                          value={newPick.totalLine || ''}
                          onChange={(e) => setNewPick({...newPick, totalLine: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Over/Under</label>
                        <select
                          value={newPick.overUnder || 'over'}
                          onChange={(e) => setNewPick({...newPick, overUnder: e.target.value as 'over' | 'under'})}
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <option value="over">Over</option>
                          <option value="under">Under</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddingPick(false)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#808090' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewPick}
                    disabled={!newPick.capperId || !newPick.pickDescription}
                    className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                    style={{ background: '#00FF88', color: '#000' }}>
                    <Save className="w-4 h-4" />
                    Save Pick
                  </button>
                </div>
              </div>
            )}
            
            {/* Picks List */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Capper</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Pick</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Sport</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Type</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Odds</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Units</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Result</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Date</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPicks.slice(0, 50).map((pick) => {
                      const capper = cappers.find(c => c.id === pick.capperId)
                      return (
                        <tr key={pick.id} className="transition-all hover:bg-white/[0.02]"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{capper?.avatarEmoji}</span>
                              <span className="text-xs font-semibold" style={{ color: '#FFF' }}>{capper?.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-xs" style={{ color: '#FFF' }}>{pick.pickDescription}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs" style={{ color: '#808090' }}>{pick.sport}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs capitalize px-2 py-0.5 rounded"
                                  style={{ background: 'rgba(255,255,255,0.05)', color: '#808090' }}>
                              {pick.betType.replace('_', '/')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs font-mono" style={{ color: '#808090' }}>
                              {(pick.oddsAtPick ?? 0) > 0 ? '+' : ''}{pick.oddsAtPick}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs font-bold" style={{ color: '#FFF' }}>{pick.units}u</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {pick.result === 'win' && <CheckCircle className="w-4 h-4 mx-auto" style={{ color: '#00FF88' }} />}
                            {pick.result === 'loss' && <XCircle className="w-4 h-4 mx-auto" style={{ color: '#FF4455' }} />}
                            {pick.result === 'push' && <AlertCircle className="w-4 h-4 mx-auto" style={{ color: '#FFD700' }} />}
                            {pick.result === 'pending' && <div className="w-2 h-2 mx-auto rounded-full animate-pulse" style={{ background: '#00A8FF' }} />}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[10px]" style={{ color: '#606070' }}>
                              {pick.gameDate ? new Date(pick.gameDate).toLocaleDateString() : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setEditingPick({
                                  ...pick, 
                                  oddsAtPick: pick.oddsAtPick ?? -110,
                                  result: pick.result ?? 'pending'
                                })}
                                className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                                style={{ color: '#00A8FF' }}>
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeletePick(pick.id)}
                                className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                                style={{ color: '#FF4455' }}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* CAPPERS MODE */}
        {mode === 'cappers' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold" style={{ color: '#FFF' }}>All Cappers ({cappers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Capper</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Type</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Network</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Picks</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Record</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Win %</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold uppercase" style={{ color: '#606070' }}>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {cappers.map((capper) => {
                    const stats = capperStats[capper.id]
                    return (
                      <tr key={capper.id} className="transition-all hover:bg-white/[0.02]"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{capper.avatarEmoji}</span>
                            <div>
                              <span className="font-semibold text-xs" style={{ color: '#FFF' }}>{capper.name}</span>
                              {capper.verified && (
                                <span className="ml-1 text-[8px] px-1 rounded" style={{ background: 'rgba(0,168,255,0.2)', color: '#00A8FF' }}>✓</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs capitalize px-2 py-0.5 rounded"
                                style={{ 
                                  background: capper.capperType === 'celebrity' ? 'rgba(255,215,0,0.2)' : 
                                             capper.capperType === 'pro' ? 'rgba(0,255,136,0.2)' : 'rgba(0,168,255,0.2)',
                                  color: capper.capperType === 'celebrity' ? '#FFD700' : 
                                         capper.capperType === 'pro' ? '#00FF88' : '#00A8FF'
                                }}>
                            {capper.capperType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs" style={{ color: '#808090' }}>{capper.network || '-'}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs font-bold" style={{ color: '#FFF' }}>{stats?.totalPicks || 0}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs font-mono" style={{ color: '#808090' }}>
                            {stats ? `${stats.totalWins}-${stats.totalLosses}` : '0-0'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs font-bold" style={{ 
                            color: (stats?.winPercentage || 0) >= 55 ? '#00FF88' : (stats?.winPercentage || 0) >= 50 ? '#FFD700' : '#FF4455' 
                          }}>
                            {stats?.winPercentage.toFixed(1) || '0.0'}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs font-bold" style={{ color: (stats?.netUnits || 0) > 0 ? '#00FF88' : '#FF4455' }}>
                            {(stats?.netUnits || 0) > 0 ? '+' : ''}{stats?.netUnits.toFixed(1) || '0.0'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* MODIFY RECORD MODE */}
        {mode === 'modify-record' && (
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,107,0,0.3)' }}>
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5" style={{ color: '#FF6B00' }} />
                <h2 className="font-bold text-lg" style={{ color: '#FFF' }}>Manually Modify Record</h2>
              </div>
              
              <p className="text-sm mb-6" style={{ color: '#808090' }}>
                Use this to manually adjust a capper&apos;s record if there was an error in tracking. 
                All modifications are logged for audit purposes.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Select Capper *</label>
                  <select
                    value={modifyRecordCapper}
                    onChange={(e) => setModifyRecordCapper(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="">Choose a capper...</option>
                    {cappers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                {modifyRecordCapper && capperStats[modifyRecordCapper] && (
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-xs mb-2" style={{ color: '#606070' }}>Current Record:</div>
                    <div className="font-bold text-lg" style={{ color: '#FFF' }}>
                      {capperStats[modifyRecordCapper].totalWins}-{capperStats[modifyRecordCapper].totalLosses}
                      <span className="text-sm ml-2" style={{ color: '#808090' }}>
                        ({capperStats[modifyRecordCapper].winPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Add/Remove Wins</label>
                    <input
                      type="number"
                      value={recordMod.wins}
                      onChange={(e) => setRecordMod({...recordMod, wins: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 rounded-lg text-sm"
                      placeholder="+1 or -1"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <div className="text-[10px] mt-1" style={{ color: '#606070' }}>Use negative to remove</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Add/Remove Losses</label>
                    <input
                      type="number"
                      value={recordMod.losses}
                      onChange={(e) => setRecordMod({...recordMod, losses: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 rounded-lg text-sm"
                      placeholder="+1 or -1"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <div className="text-[10px] mt-1" style={{ color: '#606070' }}>Use negative to remove</div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#808090' }}>Reason for Modification *</label>
                  <textarea
                    value={recordMod.reason}
                    onChange={(e) => setRecordMod({...recordMod, reason: e.target.value})}
                    rows={3}
                    placeholder="Explain why this record is being modified..."
                    className="w-full px-4 py-3 rounded-lg text-sm resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                
                {modifyRecordCapper && capperStats[modifyRecordCapper] && (recordMod.wins !== 0 || recordMod.losses !== 0) && (
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                    <div className="text-xs mb-2" style={{ color: '#00FF88' }}>New Record Will Be:</div>
                    <div className="font-bold text-lg" style={{ color: '#FFF' }}>
                      {capperStats[modifyRecordCapper].totalWins + recordMod.wins}-{capperStats[modifyRecordCapper].totalLosses + recordMod.losses}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleModifyRecord}
                  disabled={!modifyRecordCapper || !recordMod.reason || (recordMod.wins === 0 && recordMod.losses === 0)}
                  className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  style={{ background: '#FF6B00', color: '#FFF' }}>
                  <Save className="w-4 h-4" />
                  Apply Modification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Edit Pick Modal */}
      {editingPick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: '#FFF' }}>Edit Pick</h3>
              <button onClick={() => setEditingPick(null)} style={{ color: '#808090' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Pick Description</label>
                <input
                  type="text"
                  value={editingPick.pickDescription}
                  onChange={(e) => setEditingPick({...editingPick, pickDescription: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Odds</label>
                  <input
                    type="number"
                    value={editingPick.oddsAtPick}
                    onChange={(e) => setEditingPick({...editingPick, oddsAtPick: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Units</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingPick.units}
                    onChange={(e) => setEditingPick({...editingPick, units: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#808090' }}>Result</label>
                <select
                  value={editingPick.result}
                  onChange={(e) => setEditingPick({...editingPick, result: e.target.value as PickResult})}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="win">✅ Win</option>
                  <option value="loss">❌ Loss</option>
                  <option value="push">➖ Push</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingPick(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#808090' }}>
                Cancel
              </button>
              <button
                onClick={handleUpdatePick}
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                style={{ background: '#00A8FF', color: '#FFF' }}>
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
