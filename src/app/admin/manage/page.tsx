'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Target,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react'

interface Capper {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  is_verified: boolean
  is_pro: boolean
  created_at: string
}

interface Pick {
  id: string
  capper_id: string
  sport: string
  pick_type: string
  selection: string
  odds: number
  units: number
  result: string
  created_at: string
  capper?: { username: string }
}

interface SusPlay {
  id: string
  title: string
  description: string
  sport: string
  player_name: string
  sus_votes: number
  legit_votes: number
  created_at: string
}

type TabType = 'cappers' | 'picks' | 'sus_plays'

export default function AdminCappersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('cappers')
  const [cappers, setCappers] = useState<Capper[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
  const [susPlays, setSusPlays] = useState<SusPlay[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form states
  const [capperForm, setCapperForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    is_verified: false,
    is_pro: false
  })

  const [pickForm, setPickForm] = useState({
    capper_id: '',
    sport: 'nfl',
    pick_type: 'spread',
    selection: '',
    odds: '-110',
    units: '1',
    result: 'pending'
  })

  const [susPlayForm, setSusPlayForm] = useState({
    title: '',
    description: '',
    sport: 'nfl',
    player_name: '',
  })

  const supabase = createClient()

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'cappers') {
        const { data } = await supabase
          .from('cappers')
          .select('*')
          .order('created_at', { ascending: false })
        setCappers(data || [])
      } else if (activeTab === 'picks') {
        const { data } = await supabase
          .from('picks')
          .select('*, capper:cappers(username)')
          .order('created_at', { ascending: false })
          .limit(100)
        setPicks(data || [])
      } else if (activeTab === 'sus_plays') {
        const { data } = await supabase
          .from('sus_plays')
          .select('*')
          .order('created_at', { ascending: false })
        setSusPlays(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
    setLoading(false)
  }

  // CRUD Operations for Cappers
  const createCapper = async () => {
    const { error } = await supabase.from('cappers').insert({
      username: capperForm.username,
      display_name: capperForm.display_name || capperForm.username,
      bio: capperForm.bio || null,
      is_verified: capperForm.is_verified,
      is_pro: capperForm.is_pro
    })
    if (!error) {
      setShowCreateForm(false)
      setCapperForm({ username: '', display_name: '', bio: '', is_verified: false, is_pro: false })
      fetchData()
    }
  }

  const updateCapper = async (id: string, updates: Partial<Capper>) => {
    const { error } = await supabase.from('cappers').update(updates).eq('id', id)
    if (!error) {
      setEditingId(null)
      fetchData()
    }
  }

  const deleteCapper = async (id: string) => {
    if (confirm('Delete this capper? This will also delete all their picks.')) {
      await supabase.from('cappers').delete().eq('id', id)
      fetchData()
    }
  }

  // CRUD Operations for Picks
  const createPick = async () => {
    const { error } = await supabase.from('picks').insert({
      capper_id: pickForm.capper_id,
      sport: pickForm.sport,
      pick_type: pickForm.pick_type,
      selection: pickForm.selection,
      odds: parseInt(pickForm.odds),
      units: parseFloat(pickForm.units),
      result: pickForm.result
    })
    if (!error) {
      setShowCreateForm(false)
      setPickForm({ capper_id: '', sport: 'nfl', pick_type: 'spread', selection: '', odds: '-110', units: '1', result: 'pending' })
      fetchData()
    }
  }

  const updatePickResult = async (id: string, result: string) => {
    await supabase.from('picks').update({ result }).eq('id', id)
    fetchData()
  }

  const deletePick = async (id: string) => {
    if (confirm('Delete this pick?')) {
      await supabase.from('picks').delete().eq('id', id)
      fetchData()
    }
  }

  // CRUD Operations for Sus Plays
  const createSusPlay = async () => {
    const { error } = await supabase.from('sus_plays').insert({
      title: susPlayForm.title,
      description: susPlayForm.description,
      sport: susPlayForm.sport,
      player_name: susPlayForm.player_name,
      sus_votes: 0,
      legit_votes: 0
    })
    if (!error) {
      setShowCreateForm(false)
      setSusPlayForm({ title: '', description: '', sport: 'nfl', player_name: '' })
      fetchData()
    }
  }

  const deleteSusPlay = async (id: string) => {
    if (confirm('Delete this sus play?')) {
      await supabase.from('sus_plays').delete().eq('id', id)
      fetchData()
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'won': return '#00FF88'
      case 'lost': return '#FF3366'
      case 'push': return '#FFD700'
      default: return '#808090'
    }
  }

  const tabs = [
    { id: 'cappers', label: 'Cappers', icon: Users, count: cappers.length },
    { id: 'picks', label: 'Picks', icon: Target, count: picks.length },
    { id: 'sus_plays', label: 'Sus Plays', icon: AlertTriangle, count: susPlays.length },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Content Management</h1>
            <p style={{ color: '#808090' }}>Manage cappers, picks, and sus plays</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #00FF88, #00A8FF)', color: '#000' }}
          >
            <Plus className="w-5 h-5" />
            Add New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
              style={{
                background: activeTab === tab.id ? '#FF6B00' : '#12121A',
                color: activeTab === tab.id ? '#FFF' : '#808090'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#808090' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-12 pr-4 py-3 rounded-xl text-white"
            style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin" style={{ color: '#FF6B00' }} />
          </div>
        ) : (
          <>
            {/* Cappers Table */}
            {activeTab === 'cappers' && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#12121A' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Username</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Display Name</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Status</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Created</th>
                      <th className="text-right py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cappers.filter(c => 
                      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((capper) => (
                      <tr key={capper.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="py-4 px-4 font-medium text-white">@{capper.username}</td>
                        <td className="py-4 px-4 text-white">{capper.display_name || '-'}</td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            {capper.is_verified && (
                              <span className="text-xs px-2 py-1 rounded" style={{ background: '#00A8FF20', color: '#00A8FF' }}>Verified</span>
                            )}
                            {capper.is_pro && (
                              <span className="text-xs px-2 py-1 rounded" style={{ background: '#FFD70020', color: '#FFD700' }}>PRO</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm" style={{ color: '#808090' }}>
                          {new Date(capper.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => updateCapper(capper.id, { is_verified: !capper.is_verified })}
                              className="p-2 rounded-lg transition-all hover:bg-white/5"
                              title="Toggle Verified"
                            >
                              <CheckCircle className="w-4 h-4" style={{ color: capper.is_verified ? '#00A8FF' : '#808090' }} />
                            </button>
                            <button
                              onClick={() => deleteCapper(capper.id)}
                              className="p-2 rounded-lg transition-all hover:bg-white/5"
                            >
                              <Trash2 className="w-4 h-4" style={{ color: '#FF3366' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Picks Table */}
            {activeTab === 'picks' && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#12121A' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Capper</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Selection</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Odds</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Result</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Date</th>
                      <th className="text-right py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {picks.filter(p =>
                      p.selection.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.capper?.username?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((pick) => (
                      <tr key={pick.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="py-4 px-4 font-medium text-white">@{pick.capper?.username || 'Unknown'}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white font-medium">{pick.selection}</p>
                            <p className="text-xs uppercase" style={{ color: '#808090' }}>{pick.sport} • {pick.pick_type}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span style={{ color: pick.odds > 0 ? '#00FF88' : '#FF6B00' }}>
                            {pick.odds > 0 ? `+${pick.odds}` : pick.odds}
                          </span>
                          <span className="text-xs ml-2" style={{ color: '#808090' }}>{pick.units}u</span>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={pick.result}
                            onChange={(e) => updatePickResult(pick.id, e.target.value)}
                            className="px-2 py-1 rounded text-sm"
                            style={{
                              background: '#0A0A0F',
                              color: getResultColor(pick.result),
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                            <option value="push">Push</option>
                          </select>
                        </td>
                        <td className="py-4 px-4 text-sm" style={{ color: '#808090' }}>
                          {new Date(pick.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => deletePick(pick.id)}
                            className="p-2 rounded-lg transition-all hover:bg-white/5"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: '#FF3366' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sus Plays Table */}
            {activeTab === 'sus_plays' && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#12121A' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Title</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Player</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Sport</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Votes</th>
                      <th className="text-left py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Date</th>
                      <th className="text-right py-4 px-4 text-sm font-medium" style={{ color: '#808090' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {susPlays.filter(s =>
                      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.player_name?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((sus) => (
                      <tr key={sus.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="py-4 px-4 font-medium text-white">{sus.title}</td>
                        <td className="py-4 px-4 text-white">{sus.player_name || '-'}</td>
                        <td className="py-4 px-4">
                          <span className="text-xs px-2 py-1 rounded uppercase" style={{ background: '#FF6B0020', color: '#FF6B00' }}>
                            {sus.sport}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span style={{ color: '#FF3366' }}>🚨 {sus.sus_votes}</span>
                            <span style={{ color: '#00FF88' }}>✓ {sus.legit_votes}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm" style={{ color: '#808090' }}>
                          {new Date(sus.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => deleteSusPlay(sus.id)}
                            className="p-2 rounded-lg transition-all hover:bg-white/5"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: '#FF3366' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#12121A' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Add New {activeTab === 'cappers' ? 'Capper' : activeTab === 'picks' ? 'Pick' : 'Sus Play'}
              </h2>
              <button onClick={() => setShowCreateForm(false)} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" style={{ color: '#808090' }} />
              </button>
            </div>

            {/* Capper Form */}
            {activeTab === 'cappers' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Username *</label>
                  <input
                    type="text"
                    value={capperForm.username}
                    onChange={(e) => setCapperForm({ ...capperForm, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Display Name</label>
                  <input
                    type="text"
                    value={capperForm.display_name}
                    onChange={(e) => setCapperForm({ ...capperForm, display_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Bio</label>
                  <textarea
                    value={capperForm.bio}
                    onChange={(e) => setCapperForm({ ...capperForm, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-white resize-none"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={capperForm.is_verified}
                      onChange={(e) => setCapperForm({ ...capperForm, is_verified: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span style={{ color: '#808090' }}>Verified</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={capperForm.is_pro}
                      onChange={(e) => setCapperForm({ ...capperForm, is_pro: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span style={{ color: '#808090' }}>Pro</span>
                  </label>
                </div>
                <button
                  onClick={createCapper}
                  className="w-full py-3 rounded-xl font-bold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #00FF88, #00A8FF)', color: '#000' }}
                >
                  Create Capper
                </button>
              </div>
            )}

            {/* Pick Form */}
            {activeTab === 'picks' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Capper *</label>
                  <select
                    value={pickForm.capper_id}
                    onChange={(e) => setPickForm({ ...pickForm, capper_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="">Select capper...</option>
                    {cappers.map(c => (
                      <option key={c.id} value={c.id}>@{c.username}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Sport</label>
                    <select
                      value={pickForm.sport}
                      onChange={(e) => setPickForm({ ...pickForm, sport: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="nfl">NFL</option>
                      <option value="nba">NBA</option>
                      <option value="nhl">NHL</option>
                      <option value="mlb">MLB</option>
                      <option value="ncaaf">NCAAF</option>
                      <option value="ncaab">NCAAB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Type</label>
                    <select
                      value={pickForm.pick_type}
                      onChange={(e) => setPickForm({ ...pickForm, pick_type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="spread">Spread</option>
                      <option value="moneyline">Moneyline</option>
                      <option value="total">Total</option>
                      <option value="prop">Prop</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Selection *</label>
                  <input
                    type="text"
                    value={pickForm.selection}
                    onChange={(e) => setPickForm({ ...pickForm, selection: e.target.value })}
                    placeholder="e.g., Chiefs -3"
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Odds</label>
                    <input
                      type="text"
                      value={pickForm.odds}
                      onChange={(e) => setPickForm({ ...pickForm, odds: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Units</label>
                    <input
                      type="number"
                      value={pickForm.units}
                      onChange={(e) => setPickForm({ ...pickForm, units: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
                <button
                  onClick={createPick}
                  className="w-full py-3 rounded-xl font-bold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #00FF88, #00A8FF)', color: '#000' }}
                >
                  Create Pick
                </button>
              </div>
            )}

            {/* Sus Play Form */}
            {activeTab === 'sus_plays' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Title *</label>
                  <input
                    type="text"
                    value={susPlayForm.title}
                    onChange={(e) => setSusPlayForm({ ...susPlayForm, title: e.target.value })}
                    placeholder="e.g., Player drops easy catch in key moment"
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Player Name</label>
                  <input
                    type="text"
                    value={susPlayForm.player_name}
                    onChange={(e) => setSusPlayForm({ ...susPlayForm, player_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Sport</label>
                  <select
                    value={susPlayForm.sport}
                    onChange={(e) => setSusPlayForm({ ...susPlayForm, sport: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="nfl">NFL</option>
                    <option value="nba">NBA</option>
                    <option value="nhl">NHL</option>
                    <option value="mlb">MLB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Description</label>
                  <textarea
                    value={susPlayForm.description}
                    onChange={(e) => setSusPlayForm({ ...susPlayForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-white resize-none"
                    style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <button
                  onClick={createSusPlay}
                  className="w-full py-3 rounded-xl font-bold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #FF3366, #FF6B00)', color: '#FFF' }}
                >
                  Create Sus Play
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
