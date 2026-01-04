'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Scale,
  Zap,
  Target,
  ArrowRight,
  Info,
  RefreshCw,
  Plus,
  Minus,
  Trash2
} from 'lucide-react'

type CalculatorType = 'parlay' | 'hedge' | 'kelly' | 'ev' | 'arbitrage' | 'odds'

interface ParlayLeg {
  id: string
  odds: number
  name: string
}

// Helper functions
const americanToDecimal = (odds: number): number => {
  if (odds > 0) return (odds / 100) + 1
  return (100 / Math.abs(odds)) + 1
}

const decimalToAmerican = (decimal: number): number => {
  if (decimal >= 2) return Math.round((decimal - 1) * 100)
  return Math.round(-100 / (decimal - 1))
}

const americanToImpliedProb = (odds: number): number => {
  if (odds > 0) return 100 / (odds + 100)
  return Math.abs(odds) / (Math.abs(odds) + 100)
}

const calculateParlayOdds = (legs: ParlayLeg[]): number => {
  const decimal = legs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1)
  return decimalToAmerican(decimal)
}

export default function CalculatorsPage() {
  const [activeCalc, setActiveCalc] = useState<CalculatorType>('parlay')
  
  // Parlay state
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([
    { id: '1', odds: -110, name: 'Leg 1' },
    { id: '2', odds: -110, name: 'Leg 2' }
  ])
  const [parlayStake, setParlayStake] = useState(100)

  // Hedge state
  const [hedgeOriginalOdds, setHedgeOriginalOdds] = useState(-110)
  const [hedgeOriginalStake, setHedgeOriginalStake] = useState(100)
  const [hedgeNewOdds, setHedgeNewOdds] = useState(150)

  // Kelly state
  const [kellyOdds, setKellyOdds] = useState(-110)
  const [kellyWinProb, setKellyWinProb] = useState(55)
  const [kellyBankroll, setKellyBankroll] = useState(1000)

  // EV state
  const [evOdds, setEvOdds] = useState(-110)
  const [evTrueProb, setEvTrueProb] = useState(52)
  const [evStake, setEvStake] = useState(100)

  // Odds converter state
  const [oddsAmerican, setOddsAmerican] = useState(-110)

  // Parlay calculations
  const parlayResult = useMemo(() => {
    if (parlayLegs.length < 2) return null
    const totalOdds = calculateParlayOdds(parlayLegs)
    const decimal = americanToDecimal(totalOdds)
    const payout = parlayStake * decimal
    const profit = payout - parlayStake
    const impliedProb = 1 / decimal
    return { totalOdds, decimal, payout, profit, impliedProb }
  }, [parlayLegs, parlayStake])

  // Hedge calculations
  const hedgeResult = useMemo(() => {
    const originalDecimal = americanToDecimal(hedgeOriginalOdds)
    const newDecimal = americanToDecimal(hedgeNewOdds)
    const originalPayout = hedgeOriginalStake * originalDecimal
    const hedgeStake = originalPayout / newDecimal
    const guaranteedProfit = originalPayout - hedgeOriginalStake - hedgeStake
    return { hedgeStake: Math.round(hedgeStake * 100) / 100, guaranteedProfit: Math.round(guaranteedProfit * 100) / 100, originalPayout }
  }, [hedgeOriginalOdds, hedgeOriginalStake, hedgeNewOdds])

  // Kelly calculations
  const kellyResult = useMemo(() => {
    const decimal = americanToDecimal(kellyOdds)
    const b = decimal - 1
    const p = kellyWinProb / 100
    const q = 1 - p
    const kelly = (b * p - q) / b
    const fullKelly = Math.max(0, kelly)
    const halfKelly = fullKelly / 2
    const quarterKelly = fullKelly / 4
    return {
      fullKelly: Math.round(fullKelly * 10000) / 100,
      halfKelly: Math.round(halfKelly * 10000) / 100,
      quarterKelly: Math.round(quarterKelly * 10000) / 100,
      fullAmount: Math.round(kellyBankroll * fullKelly * 100) / 100,
      halfAmount: Math.round(kellyBankroll * halfKelly * 100) / 100,
      quarterAmount: Math.round(kellyBankroll * quarterKelly * 100) / 100
    }
  }, [kellyOdds, kellyWinProb, kellyBankroll])

  // EV calculations
  const evResult = useMemo(() => {
    const decimal = americanToDecimal(evOdds)
    const trueProb = evTrueProb / 100
    const impliedProb = americanToImpliedProb(evOdds)
    const ev = (trueProb * (decimal - 1) * evStake) - ((1 - trueProb) * evStake)
    const evPercent = (ev / evStake) * 100
    const edge = (trueProb - impliedProb) * 100
    return {
      ev: Math.round(ev * 100) / 100,
      evPercent: Math.round(evPercent * 100) / 100,
      edge: Math.round(edge * 100) / 100,
      impliedProb: Math.round(impliedProb * 10000) / 100
    }
  }, [evOdds, evTrueProb, evStake])

  // Odds conversion
  const oddsConversion = useMemo(() => {
    const decimal = americanToDecimal(oddsAmerican)
    const fractional = decimal - 1
    const impliedProb = americanToImpliedProb(oddsAmerican)
    return {
      american: oddsAmerican,
      decimal: Math.round(decimal * 1000) / 1000,
      fractional: `${Math.round(fractional * 100)}/100`,
      impliedProb: Math.round(impliedProb * 10000) / 100
    }
  }, [oddsAmerican])

  const addParlayLeg = () => {
    setParlayLegs([...parlayLegs, { id: Date.now().toString(), odds: -110, name: `Leg ${parlayLegs.length + 1}` }])
  }

  const removeParlayLeg = (id: string) => {
    if (parlayLegs.length > 2) {
      setParlayLegs(parlayLegs.filter(leg => leg.id !== id))
    }
  }

  const updateParlayLeg = (id: string, odds: number) => {
    setParlayLegs(parlayLegs.map(leg => leg.id === id ? { ...leg, odds } : leg))
  }

  const calculators = [
    { id: 'parlay', name: 'Parlay', icon: Zap, color: '#FF6B00' },
    { id: 'hedge', name: 'Hedge', icon: Scale, color: '#00A8FF' },
    { id: 'kelly', name: 'Kelly', icon: Target, color: '#00FF88' },
    { id: 'ev', name: 'EV', icon: TrendingUp, color: '#FF3366' },
    { id: 'odds', name: 'Odds', icon: RefreshCw, color: '#FFD700' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #00A8FF, #00FF88)' }}>
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">Betting Calculators</h1>
              <p style={{ color: '#808090' }} className="text-sm">Professional tools for smart betting</p>
            </div>
          </div>
        </div>

        {/* Calculator Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {calculators.map((calc) => (
            <button
              key={calc.id}
              onClick={() => setActiveCalc(calc.id as CalculatorType)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all"
              style={{
                background: activeCalc === calc.id ? calc.color : '#12121A',
                color: activeCalc === calc.id ? '#000' : '#808090'
              }}
            >
              <calc.icon className="w-4 h-4" />
              {calc.name}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calculator Input */}
          <div className="rounded-2xl p-6" style={{ background: '#12121A' }}>
            {/* PARLAY CALCULATOR */}
            {activeCalc === 'parlay' && (
              <>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" style={{ color: '#FF6B00' }} />
                  Parlay Calculator
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Stake Amount ($)</label>
                    <input
                      type="number"
                      value={parlayStake}
                      onChange={(e) => setParlayStake(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium" style={{ color: '#808090' }}>Parlay Legs</label>
                    {parlayLegs.map((leg, i) => (
                      <div key={leg.id} className="flex items-center gap-2">
                        <span className="text-xs w-16" style={{ color: '#808090' }}>Leg {i + 1}</span>
                        <input
                          type="number"
                          value={leg.odds}
                          onChange={(e) => updateParlayLeg(leg.id, Number(e.target.value))}
                          placeholder="-110"
                          className="flex-1 px-4 py-2 rounded-xl text-white text-sm"
                          style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <button
                          onClick={() => removeParlayLeg(leg.id)}
                          disabled={parlayLegs.length <= 2}
                          className="p-2 rounded-lg transition-all hover:bg-red-500/20 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: '#FF3366' }} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addParlayLeg}
                      className="w-full py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/10"
                      style={{ border: '1px dashed rgba(255,255,255,0.2)', color: '#808090' }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Leg
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* HEDGE CALCULATOR */}
            {activeCalc === 'hedge' && (
              <>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5" style={{ color: '#00A8FF' }} />
                  Hedge Calculator
                </h2>
                
                <div className="space-y-4">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)' }}>
                    <p className="text-xs" style={{ color: '#00A8FF' }}>
                      Calculate the optimal hedge bet to guarantee profit
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Original Bet Odds</label>
                    <input
                      type="number"
                      value={hedgeOriginalOdds}
                      onChange={(e) => setHedgeOriginalOdds(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Original Stake ($)</label>
                    <input
                      type="number"
                      value={hedgeOriginalStake}
                      onChange={(e) => setHedgeOriginalStake(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Hedge Bet Odds (opposite side)</label>
                    <input
                      type="number"
                      value={hedgeNewOdds}
                      onChange={(e) => setHedgeNewOdds(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* KELLY CALCULATOR */}
            {activeCalc === 'kelly' && (
              <>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" style={{ color: '#00FF88' }} />
                  Kelly Criterion
                </h2>
                
                <div className="space-y-4">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                    <p className="text-xs" style={{ color: '#00FF88' }}>
                      Optimal bet sizing based on edge and bankroll
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Odds (American)</label>
                    <input
                      type="number"
                      value={kellyOdds}
                      onChange={(e) => setKellyOdds(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Your Win Probability (%)</label>
                    <input
                      type="number"
                      value={kellyWinProb}
                      onChange={(e) => setKellyWinProb(Number(e.target.value))}
                      min={0}
                      max={100}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Bankroll ($)</label>
                    <input
                      type="number"
                      value={kellyBankroll}
                      onChange={(e) => setKellyBankroll(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* EV CALCULATOR */}
            {activeCalc === 'ev' && (
              <>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" style={{ color: '#FF3366' }} />
                  Expected Value (EV)
                </h2>
                
                <div className="space-y-4">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
                    <p className="text-xs" style={{ color: '#FF3366' }}>
                      Calculate if a bet has positive expected value
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Odds (American)</label>
                    <input
                      type="number"
                      value={evOdds}
                      onChange={(e) => setEvOdds(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Your True Win Probability (%)</label>
                    <input
                      type="number"
                      value={evTrueProb}
                      onChange={(e) => setEvTrueProb(Number(e.target.value))}
                      min={0}
                      max={100}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>Bet Amount ($)</label>
                    <input
                      type="number"
                      value={evStake}
                      onChange={(e) => setEvStake(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ODDS CONVERTER */}
            {activeCalc === 'odds' && (
              <>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" style={{ color: '#FFD700' }} />
                  Odds Converter
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#808090' }}>American Odds</label>
                    <input
                      type="number"
                      value={oddsAmerican}
                      onChange={(e) => setOddsAmerican(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Calculator Results */}
          <div className="rounded-2xl p-6" style={{ background: '#12121A' }}>
            <h2 className="text-xl font-bold text-white mb-4">Results</h2>
            
            {/* PARLAY RESULTS */}
            {activeCalc === 'parlay' && parlayResult && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,51,102,0.2))' }}>
                  <p className="text-sm" style={{ color: '#808090' }}>Total Parlay Odds</p>
                  <p className="text-3xl font-black text-white">
                    {parlayResult.totalOdds > 0 ? '+' : ''}{parlayResult.totalOdds}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                    <p className="text-sm" style={{ color: '#808090' }}>Potential Payout</p>
                    <p className="text-2xl font-bold" style={{ color: '#00FF88' }}>
                      ${parlayResult.payout.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                    <p className="text-sm" style={{ color: '#808090' }}>Profit</p>
                    <p className="text-2xl font-bold" style={{ color: '#00FF88' }}>
                      +${parlayResult.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                  <p className="text-sm" style={{ color: '#808090' }}>Implied Probability</p>
                  <p className="text-xl font-bold text-white">
                    {(parlayResult.impliedProb * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            )}

            {/* HEDGE RESULTS */}
            {activeCalc === 'hedge' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,168,255,0.2), rgba(0,255,136,0.2))' }}>
                  <p className="text-sm" style={{ color: '#808090' }}>Hedge Bet Amount</p>
                  <p className="text-3xl font-black text-white">${hedgeResult.hedgeStake}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                  <p className="text-sm" style={{ color: '#808090' }}>Guaranteed Profit</p>
                  <p className="text-2xl font-bold" style={{ color: hedgeResult.guaranteedProfit > 0 ? '#00FF88' : '#FF3366' }}>
                    {hedgeResult.guaranteedProfit > 0 ? '+' : ''}${hedgeResult.guaranteedProfit}
                  </p>
                </div>
              </div>
            )}

            {/* KELLY RESULTS */}
            {activeCalc === 'kelly' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(0,255,136,0.1)' }}>
                    <p className="text-xs" style={{ color: '#808090' }}>Full Kelly</p>
                    <p className="text-lg font-bold" style={{ color: '#00FF88' }}>{kellyResult.fullKelly}%</p>
                    <p className="text-sm text-white">${kellyResult.fullAmount}</p>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,215,0,0.1)' }}>
                    <p className="text-xs" style={{ color: '#808090' }}>Half Kelly</p>
                    <p className="text-lg font-bold" style={{ color: '#FFD700' }}>{kellyResult.halfKelly}%</p>
                    <p className="text-sm text-white">${kellyResult.halfAmount}</p>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(0,168,255,0.1)' }}>
                    <p className="text-xs" style={{ color: '#808090' }}>Quarter Kelly</p>
                    <p className="text-lg font-bold" style={{ color: '#00A8FF' }}>{kellyResult.quarterKelly}%</p>
                    <p className="text-sm text-white">${kellyResult.quarterAmount}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#0A0A0F' }}>
                  <p className="text-xs" style={{ color: '#808090' }}>
                    💡 Most pros use 1/4 to 1/2 Kelly to reduce variance
                  </p>
                </div>
              </div>
            )}

            {/* EV RESULTS */}
            {activeCalc === 'ev' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: evResult.ev > 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)' }}>
                  <p className="text-sm" style={{ color: '#808090' }}>Expected Value</p>
                  <p className="text-3xl font-black" style={{ color: evResult.ev > 0 ? '#00FF88' : '#FF3366' }}>
                    {evResult.ev > 0 ? '+' : ''}${evResult.ev}
                  </p>
                  <p className="text-sm" style={{ color: evResult.ev > 0 ? '#00FF88' : '#FF3366' }}>
                    ({evResult.evPercent > 0 ? '+' : ''}{evResult.evPercent}% EV)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                    <p className="text-sm" style={{ color: '#808090' }}>Your Edge</p>
                    <p className="text-xl font-bold" style={{ color: evResult.edge > 0 ? '#00FF88' : '#FF3366' }}>
                      {evResult.edge > 0 ? '+' : ''}{evResult.edge}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                    <p className="text-sm" style={{ color: '#808090' }}>Book's Implied Prob</p>
                    <p className="text-xl font-bold text-white">{evResult.impliedProb}%</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: evResult.ev > 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)' }}>
                  <p className="text-xs" style={{ color: evResult.ev > 0 ? '#00FF88' : '#FF3366' }}>
                    {evResult.ev > 0 ? '✅ This is a +EV bet! The odds are in your favor long-term.' : '❌ This is a -EV bet. The house has the edge.'}
                  </p>
                </div>
              </div>
            )}

            {/* ODDS CONVERTER RESULTS */}
            {activeCalc === 'odds' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                    <p className="text-sm" style={{ color: '#808090' }}>American</p>
                    <p className="text-2xl font-bold text-white">
                      {oddsConversion.american > 0 ? '+' : ''}{oddsConversion.american}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                    <p className="text-sm" style={{ color: '#808090' }}>Decimal</p>
                    <p className="text-2xl font-bold text-white">{oddsConversion.decimal}</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                    <p className="text-sm" style={{ color: '#808090' }}>Fractional</p>
                    <p className="text-2xl font-bold text-white">{oddsConversion.fractional}</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: '#0A0A0F' }}>
                    <p className="text-sm" style={{ color: '#808090' }}>Implied Probability</p>
                    <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>{oddsConversion.impliedProb}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
