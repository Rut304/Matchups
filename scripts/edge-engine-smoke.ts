import calculateComprehensiveEdgeScore from '../src/lib/edge/engine'

async function run() {
  const sample = {
    clv: {
      openSpread: 0,
      currentSpread: 0,
      openTotal: 0,
      currentTotal: 0,
      openHomeML: 0,
      currentHomeML: 0,
      spreadCLV: 0,
      totalCLV: 0,
      mlCLV: 0,
      grade: 'neutral' as const,
      description: 'No CLV data'
    },
    lineMovement: {
      spread: { open:0,current:0,high:0,low:0,direction:'stable',magnitude:'minimal',steamMoveDetected:false },
      total: { open:0,current:0,high:0,low:0,direction:'stable',magnitude:'minimal' },
      moneyline: { homeOpen:0,homeCurrent:0,awayOpen:0,awayCurrent:0,impliedProbShift:0 },
      timeline: []
    },
    splits: {
      spread: { publicHomePct:0, publicAwayPct:0, moneyHomePct:0, moneyAwayPct:0, sharpSide:'neutral', reverseLineMovement:false, rlmStrength:'none' },
      total: { publicOverPct:0, publicUnderPct:0, moneyOverPct:0, moneyUnderPct:0, sharpSide:'neutral', reverseLineMovement:false },
      moneyline: { publicHomePct:0, publicAwayPct:0, moneyHomePct:0, moneyAwayPct:0 },
      consensus: { publicLean: 'Data unavailable', sharpLean: 'Data unavailable', alignment: 'split' }
    },
    injuries: { homeTeam: { outPlayers:[], questionablePlayers:[], totalImpactScore:0, positionImpacts:[] }, awayTeam: { outPlayers:[], questionablePlayers:[], totalImpactScore:0, positionImpacts:[] }, lineImpact: { spreadAdjustment:0, totalAdjustment:0, narrative:'None' } },
    weather: { venue:'', isOutdoor:false, isDome:true, conditions: { temperature:0, feelsLike:0, windSpeed:0, windDirection:'', precipitation:0, humidity:0, conditions:'N/A' }, bettingImpact: { level:'none', spreadImpact:0, totalImpact:0, affectedBets:[], narrative:'None' }, historicalInWeather: { homeTeamRecord:'', awayTeamRecord:'', avgTotalInConditions:0 } },
    situational: { home: { restDays:0,isBackToBack:false,travelMiles:0,afterWinLoss:'unknown',afterBlowout:false,afterOT:false,isRevenge:false,isDivisional:false,isPrimetime:false,isPlayoffs:false,letdownSpot:false,lookaheadSpot:false,sandwichSpot:false,trapGame:false,homeStandLength:0,roadTripLength:0 }, away: { restDays:0,isBackToBack:false,travelMiles:0,afterWinLoss:'unknown',afterBlowout:false,afterOT:false,isRevenge:false,isDivisional:false,isPrimetime:false,isPlayoffs:false,letdownSpot:false,lookaheadSpot:false,sandwichSpot:false,trapGame:false,homeStandLength:0,roadTripLength:0 }, angles: [] },
    ats: { homeTeam: { overall:{wins:0,losses:0,pushes:0,pct:0}, home:{wins:0,losses:0,pushes:0,pct:0}, asFavorite:{wins:0,losses:0,pushes:0,pct:0}, asUnderdog:{wins:0,losses:0,pushes:0,pct:0}, last10:{wins:0,losses:0,pushes:0,pct:0}, vsDivision:{wins:0,losses:0,pushes:0,pct:0}, inPrimetime:{wins:0,losses:0,pushes:0,pct:0} }, awayTeam: { overall:{wins:0,losses:0,pushes:0,pct:0}, away:{wins:0,losses:0,pushes:0,pct:0}, asFavorite:{wins:0,losses:0,pushes:0,pct:0}, asUnderdog:{wins:0,losses:0,pushes:0,pct:0}, last10:{wins:0,losses:0,pushes:0,pct:0}, vsDivision:{wins:0,losses:0,pushes:0,pct:0}, inPrimetime:{wins:0,losses:0,pushes:0,pct:0} }, h2hATS:{ homeWins:0, awayWins:0, pushes:0, homeRoi:0, awayRoi:0 } },
    ou: { homeTeam: { overall:{overs:0,unders:0,pushes:0,overPct:0}, home:{overs:0,unders:0,pushes:0,overPct:0}, asFavorite:{overs:0,unders:0,pushes:0,overPct:0}, asUnderdog:{overs:0,unders:0,pushes:0,overPct:0}, last10:{overs:0,unders:0,pushes:0,overPct:0}, avgTotal:0, avgActual:0, marginVsTotal:0 }, awayTeam: { overall:{overs:0,unders:0,pushes:0,overPct:0}, away:{overs:0,unders:0,pushes:0,overPct:0}, asFavorite:{overs:0,unders:0,pushes:0,overPct:0}, asUnderdog:{overs:0,unders:0,pushes:0,overPct:0}, last10:{overs:0,unders:0,pushes:0,overPct:0}, avgTotal:0, avgActual:0, marginVsTotal:0 }, combined: { h2hOvers:0, h2hUnders:0, h2hAvgTotal:0, projectedTotal:0, valueOnOver:false, valueOnUnder:false, edgePct:0 }, trends: [] },
    keyNumbers: { spread: { currentLine:0, nearKeyNumber:false, keyNumber:null, buyPointValue:0, sellPointValue:0, historicalPushRate:0, recommendation:null }, total: { currentLine:0, nearKeyNumber:false, keyNumber:null, buyPointValue:0, sellPointValue:0, historicalPushRate:0, recommendation:null }, sport:'NFL', keyNumbersForSport:[3,7,10], analysis:'None' },
    h2h: { gamesPlayed:0, homeTeamWins:0, awayTeamWins:0, ties:0, homeTeamATSRecord:'', awayTeamATSRecord:'', overUnderRecord:'', avgMargin:0, avgTotal:0, lastMeeting:null, recentGames:[], streaks:{ homeTeamStreak:0, awayTeamStreak:0, overStreak:0, underStreak:0 }, insights:[] },
    consensus: { spreadConsensus:{ pick:'', confidence:0, sources:[], agreement:0 }, totalConsensus:{ pick:'', confidence:0, sources:[], agreement:0 }, mlConsensus:{ pick:'', confidence:0, sources:[], agreement:0 }, sharpestPick:null }
  }

  const res = calculateComprehensiveEdgeScore(sample as any)
  console.log('Edge score smoke test:', res)
}

run().catch(err => { console.error(err); process.exit(1) })
