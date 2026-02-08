# THE EDGE Algorithm

**Core Calculation:** [engine.ts](../src/lib/edge/engine.ts)

THE EDGE is a 0-100 composite score that measures betting opportunity strength by aggregating 7 distinct components. Each component contributes to the overall score based on its maximum weight.

---

## Score Components (100 points max)

### 1. CLV Value (0-15 points)

**Closing Line Value** - Measures if you're getting a better number than where the line will close.

| Grade | Points | Description |
|-------|--------|-------------|
| Excellent | 15 | Line significantly better than consensus |
| Good | 10 | Modest line advantage |
| Neutral | 5 | No significant CLV |
| Poor | 0 | Line worse than market average |

**Why it matters:** Sharp bettors consistently beat the closing line. Getting +3.5 when the line closes at +3 provides long-term edge.

---

### 2. Sharp Signal (0-20 points)

**Reverse Line Movement (RLM) Detection** - The strongest edge indicator.

| Factor | Points |
|--------|--------|
| Strong spread RLM | 10 |
| Moderate spread RLM | 7 |
| Weak spread RLM | 4 |
| Total RLM detected | +10 |
| Public/Sharp opposed | +5 |

**What is RLM?** When the line moves AGAINST the side receiving majority public bets. Example: 70% on Team A, but line moves from -3 to -2.5 toward Team B → sharp money on B.

**Why it matters:** Sportsbooks respect sharp money enough to move lines against public action. This is the clearest signal of professional betting activity.

---

### 3. Trend Alignment (0-20 points)

**O/U and ATS Trend Confluence** - Historical pattern strength.

**Calculation:**

```
trendAlignment = min(trendCount × 3 + avgConfidence / 10, 20)
```

| Trends Found | Avg Confidence | Points |
|--------------|----------------|--------|
| 5 trends | 80% | ~20 |
| 3 trends | 70% | ~16 |
| 2 trends | 60% | ~12 |
| 1 trend | 50% | ~8 |

**Trends include:**

- Team X is 8-2 O/U as home favorite
- Team Y is 6-1 ATS as road underdog
- Under 45 when both teams on short rest

---

### 4. Situational Edge (0-15 points)

**Situational Angles** - Context-based betting advantages.

**Calculation:**

```
situationalEdge = min(angleCount × 4 + avgROI / 2, 15)
```

**Situational factors:**

- Revenge game (team lost to opponent recently)
- Letdown spot (following emotional win)
- Short rest vs. full rest
- Travel disadvantage
- Playoff implications
- Division rivalry

---

### 5. Injury Advantage (0-10 points)

**Injury Impact Differential** - Line value from injury uncertainty.

**Calculation:**

```
diffScore = min(|awayInjuries - homeInjuries| / 8, 5)
impactScore = min(totalInjuries / 30, 5)  
injuryAdvantage = min(diffScore + impactScore × 0.5, 10)
```

**Why it matters:**

- Missing star player may be overpriced by public
- Key injuries not yet reflected in line
- Cumulative injuries to depth positions often overlooked

---

### 6. Weather Edge (0-10 points)

**Weather Impact Assessment** - Outdoor games only.

| Impact Level | Points | Examples |
|--------------|--------|----------|
| High | 10 | Snow, 30+ mph wind, extreme cold |
| Medium | 6 | Rain, 15-20 mph wind |
| Low | 3 | Minor conditions |
| None | 0 | Dome/neutral weather |

**Why it matters:** Weather heavily affects totals and passing-based offenses. Sharp bettors exploit public bias toward offense.

---

### 7. H2H Edge (0-10 points)

**Head-to-Head Historical Dominance** - Recent matchup history.

**Calculation (requires 5+ games):**

```
dominance = |homeWins - awayWins| / totalGames
h2hEdge = min(dominance × 20, 10)
```

| Dominance | Points |
|-----------|--------|
| 80%+ win rate | 10 |
| 70% win rate | 8 |
| 60% win rate | 4 |
| <60% | 0-3 |

**Why it matters:** Some teams have consistent stylistic advantages over specific opponents.

---

## Score Interpretation

| Score | Rating | Action |
|-------|--------|--------|
| 80-100 | Elite | Strong play, multiple edges aligned |
| 60-79 | Good | Solid opportunity, 2-3 edges present |
| 40-59 | Fair | Marginal edge, proceed cautiously |
| 20-39 | Weak | Limited edge, likely pass |
| 0-19 | None | No discernible betting advantage |

---

## Example Breakdown

**Super Bowl LX: Patriots vs Seahawks**

```
Edge Score: 33

Breakdown:
- CLV Value: 15 (Excellent - getting best available line)
- Sharp Signal: 5 (Some opposed consensus)
- Trend Alignment: 10 (O/U trends detected)
- Situational Edge: 0 (Limited situational data)
- Injury Advantage: 3 (Slight injury differential)
- Weather Edge: 0 (Dome game)
- H2H Edge: 0 (Insufficient recent history)
```

---

## Data Dependencies

THE EDGE requires these data sources:

| Component | Data Source | Status |
|-----------|-------------|--------|
| CLV | Opening lines + current lines | ✅ Action Network |
| Sharp Signal | Bet % + Money % + Line movement | ✅ Action Network |
| Trend Alignment | O/U trends from historical | ⚠️ Partial (134 NFL 2025 games) |
| Situational | ATS records, schedule context | ⚠️ Partial |
| Injury | Injury reports | ✅ ESPN API |
| Weather | Weather API | ✅ Weather service |
| H2H | Historical matchups | ⚠️ Limited |

**Note:** Limited historical data results in lower Situational/Trend/H2H scores. See [Data Architecture](DATA_ARCHITECTURE.md) for import status.

---

## Source Code

- **Engine:** [src/lib/edge/engine.ts](../src/lib/edge/engine.ts)
- **Integration:** [src/lib/betting-intelligence.ts](../src/lib/betting-intelligence.ts)
- **API Endpoint:** `/api/games/[gameId]/intelligence`
