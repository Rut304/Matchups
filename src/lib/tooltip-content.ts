/**
 * Comprehensive tooltip content for every data concept on the site.
 * Used with the <Tooltip> component to educate users about betting metrics.
 */

export const TOOLTIPS = {
  // ─── Betting Action / Splits ─────────────────────────────────────────
  ticketPct:
    'The percentage of individual bets (tickets) placed on each side. This reflects what the general public is betting. When ticket % heavily favors one side, the other side often has contrarian value.',

  moneyPct:
    'The percentage of total dollars wagered on each side. When money % diverges from ticket %, it signals sharp (professional) action. Look for 60%+ money on the side with fewer tickets — that\'s where the big bettors are.',

  handlePct:
    'Handle is the total amount of money wagered on a game. Handle % shows how much of the total action is on each side in dollar terms. A lopsided handle can pressure sportsbooks to move a line.',

  sharpPct:
    'The estimated percentage of money coming from known sharp (professional) bettors and syndicate accounts. A sharp % above 70% is a strong signal. Sharps are long-term winners whose action sportsbooks respect and adjust lines for.',

  reverseLineMovement:
    'When a line moves AGAINST the side receiving the majority of bets. For example, 75% of tickets are on Team A -3, but the line moves to -2.5. This signals that sharps bet the other side with enough money to move the market the other way. One of the most reliable sharp indicators.',

  steamMove:
    'A sudden, sharp line movement across multiple sportsbooks within seconds. Steam moves are triggered by respected sharp bettors or syndicates placing large wagers simultaneously. They represent the strongest form of sharp action.',

  // ─── Line Movement ───────────────────────────────────────────────────
  lineMovement:
    'How a betting line has changed since it opened. Line movement reveals where the smart money is going. A line that moves from -3 to -4 means sharps and/or heavy action came in on that side. Track the direction and timing of moves to identify value.',

  openingLine:
    'The first line posted by a sportsbook, often set by market-making books like Pinnacle or Circa. Opening lines represent the earliest market opinion. Beating the opener (getting a better number before the line moves) is a hallmark of sharp betting.',

  closingLine:
    'The final line before a game starts. The closing line is considered the most accurate and efficient number because it incorporates all available information and sharp action. Consistently beating the closing line (CLV) is the gold standard of profitable betting.',

  // ─── Odds ────────────────────────────────────────────────────────────
  spread:
    'A point handicap assigned to each team to level the playing field. The favorite gives points (e.g., -6.5) and the underdog gets points (e.g., +6.5). If you bet the favorite at -6.5, they must win by 7+ for you to win. Key numbers in NFL are 3 and 7.',

  moneyline:
    'A straight-up bet on which team wins — no point spread involved. Odds like -150 mean you risk $150 to win $100. Odds like +130 mean you risk $100 to win $130. Moneylines are best for small underdogs where the payout justifies the risk.',

  overUnder:
    'Also called the "total." A bet on whether the combined score of both teams will be over or under a set number. Weather, pace of play, and recent scoring trends all affect totals. Unders tend to hit more often in bad weather for outdoor sports.',

  juice:
    'Also called "vig" or "vigorish." The commission the sportsbook charges on each bet, built into the odds. Standard juice is -110 (risk $110 to win $100). Lower juice means better value — always shop for the best price. Even small differences compound over hundreds of bets.',

  bestOdds:
    'The most favorable odds available across all tracked sportsbooks for a given bet. Always shop for the best line — a half-point or 10 cents of juice can be the difference between long-term profit and loss. This is the single easiest edge any bettor can get.',

  // ─── Performance Metrics ─────────────────────────────────────────────
  ats:
    'Against The Spread — whether a team covered the point spread, not just won the game. A team can lose the game but still cover as an underdog. ATS records are far more useful than straight-up win/loss for evaluating betting value.',

  atsRecord:
    'A team\'s win-loss record against the point spread. Example: 8-4 ATS means they covered in 8 of 12 games. Look for ATS records in specific situations (home, road, as dog, as favorite) to find persistent edges. Sample size matters — 20+ games is more reliable.',

  ouRecord:
    'A team\'s record against the over/under total. An O/U record of 9-3 means the over has hit in 9 of 12 games. Teams with consistently high-scoring or low-scoring profiles in specific spots can reveal total betting value.',

  coverPct:
    'The percentage of games a team has covered the spread. A cover rate above 55% in a meaningful sample (20+ games) suggests the market may be undervaluing that team. Below 45% suggests the market overvalues them.',

  roi:
    'Return On Investment — your net profit divided by total amount wagered, expressed as a percentage. An ROI of 5% means you profit $5 for every $100 wagered. In sports betting, a long-term ROI of 3-7% is considered excellent. Track ROI, not just win rate.',

  units:
    'A standardized way to measure profit independent of bet size. One unit equals your standard bet size (e.g., if you bet $50 per game, 1 unit = $50). Tracking in units lets you compare performance across different bankrolls and bet sizes. A positive unit count means profit.',

  clv:
    'Closing Line Value — the difference between the odds you bet and the closing line. If you bet Team A -3 and it closes at -4, you got 1 point of CLV. Consistently getting CLV is the strongest predictor of long-term profitability. Even a half-point of average CLV is significant.',

  // ─── Edge Metrics ────────────────────────────────────────────────────
  edgeScore:
    'A composite score combining multiple factors (sharp action, line value, trends, situational edges) into a single betting strength rating. Higher scores indicate a stronger overall edge. Use edge scores to prioritize which games deserve your biggest bets.',

  sharpSignal:
    'An indicator that professional bettors are on a specific side. Signals include reverse line movement, steam moves, heavy money % with fewer tickets, and bet timing patterns. Multiple sharp signals on the same side increase confidence significantly.',

  trendAlignment:
    'When multiple historical trends (ATS record, O/U trend, situational record) all point to the same side. Aligned trends are more reliable than isolated ones. When 3+ independent trends converge, the edge is typically stronger and more trustworthy.',

  situationalEdge:
    'Edges derived from game context: rest advantages, travel, schedule spots (look-ahead, letdown, revenge), and motivation. Situational factors can be as powerful as statistical edges. Teams on short rest playing a back-to-back on the road are in a notable negative spot.',

  // ─── Power Ratings ───────────────────────────────────────────────────
  eloRating:
    'An Elo rating system adapted for sports teams. Each team starts with a base rating, which adjusts after every game based on result and margin. Higher ratings mean stronger teams. The difference between two teams\' Elo ratings predicts win probability. Useful for identifying market mispricings.',

  powerRating:
    'A numerical ranking of team strength, aggregated from multiple statistical categories. Power ratings let you generate your own projected spreads and totals. If your power rating spread differs significantly from the market line, that\'s a potential betting edge.',

  offensiveRating:
    'A measure of how many points a team scores per 100 possessions (basketball) or their offensive efficiency metric. Higher is better. Compare offensive rating to the opponent\'s defensive rating to project scoring matchups and evaluate totals.',

  defensiveRating:
    'A measure of how many points a team allows per 100 possessions (basketball) or their defensive efficiency metric. Lower is better. Strong defensive teams in poor-weather spots are a classic under play. Defense also tends to be more stable and predictable than offense.',

  // ─── Game Context ────────────────────────────────────────────────────
  restDays:
    'The number of days since a team\'s last game. Rest advantages are one of the most proven situational edges in sports betting. In the NBA, teams on 2+ days rest vs. teams on a back-to-back have a historically significant ATS edge. Always factor rest into your analysis.',

  homeAway:
    'Home-court/field advantage. Home teams win roughly 55-60% of games across major sports, but the market accounts for this. The real edge is finding spots where home advantage is undervalued (e.g., altitude in Denver, dome teams in bad weather) or overvalued.',

  h2h:
    'Head-to-head record between the two teams. While recent H2H can reveal matchup-specific dynamics (one team\'s style exploiting another\'s weakness), small sample sizes make this less reliable than broader trends. Best used as a tiebreaker, not a primary factor.',

  weather:
    'Weather conditions for outdoor games — wind, rain, snow, temperature, humidity. Wind over 15 mph significantly impacts passing and kicking. Cold rain suppresses scoring. Weather is one of the most underrated factors in NFL totals betting. Always check forecasts before kickoff.',

  officials:
    'The assigned referees or umpires for a game. Different officials have measurable tendencies — some call more fouls (favoring overs in NBA), some let teams play. Official tendencies can affect foul rates, penalty rates, and total scoring. A niche but statistically valid angle.',

  // ─── Systems ─────────────────────────────────────────────────────────
  backtest:
    'Historical analysis of a betting system or strategy applied to past games. Backtesting reveals how a system would have performed. Look for consistent results over multiple seasons and large sample sizes. Be cautious of overfitting — systems that look amazing on paper may not hold going forward.',

  sampleSize:
    'The number of games or bets in a dataset. Small samples (under 30 games) are unreliable and heavily influenced by randomness. A system that goes 8-2 in 10 games could easily be luck. Aim for 100+ data points before drawing strong conclusions. Larger samples yield more trustworthy edges.',

  confidence:
    'A measure of how likely a predicted outcome is to occur, often expressed as a percentage. Higher confidence means stronger supporting evidence. No bet should be 100% confident — the goal is finding edges where your confidence exceeds the implied probability from the odds.',

  winPct:
    'Win percentage — the proportion of bets won. You need to win about 52.4% at standard -110 odds to break even. A true long-term win rate of 55%+ is elite. Don\'t chase high win rates with heavy favorites — what matters is win rate relative to the odds being bet.',

  maxDrawdown:
    'The largest peak-to-trough decline in your bankroll during a tracked period. A max drawdown of 30% means at your worst point, your bankroll dropped 30% from its peak. Understanding drawdowns helps you size bets appropriately and set realistic expectations for inevitable losing streaks.',

  // ─── Sharp / Pro Indicators ──────────────────────────────────────────
  sharpMoney:
    'Wagers placed by professional bettors who have a proven long-term edge. Sharp money is identified through bet timing, account flags, and money vs. ticket splits. When sharp money opposes public money, the sharps are historically more likely to be on the correct side.',

  publicMoney:
    'Money wagered by recreational (casual) bettors, who tend to favor favorites, home teams, overs, and popular teams. Fading the public (betting the opposite side) is a well-known strategy, especially in heavily bet games where public bias inflates a line beyond fair value.',

  smartMoney:
    'A broader term for money from informed bettors — sharps, syndicates, and respected analytics-driven bettors. Smart money is tracked by its impact on the line, not just the dollar amount. When smart money moves a line, pay attention even if it contradicts your initial lean.',

  // ─── Player Props ────────────────────────────────────────────────────
  propCorrelation:
    'How one prop bet outcome is statistically linked to another. For example, a quarterback\'s passing yards positively correlate with his receivers\' receiving yards. In same-game parlays, using correlated props (instead of independent ones) gives you a mathematical edge over the sportsbook\'s odds.',

  playerProp:
    'A bet on an individual player\'s statistical performance — points scored, yards gained, assists, strikeouts, etc. Props are often less efficiently priced than game lines because books have less sharp action to sharpen them. Look for props where your projection diverges from the posted line by 10%+.',

  // ─── Leaderboard ─────────────────────────────────────────────────────
  expertRecord:
    'A tracked bettor\'s or expert\'s win-loss record with verified results. Always evaluate records with context: sample size, average odds, ROI, and whether bets were tracked against the closing line. A 60% record on +100 average odds is far more impressive than 60% on -200 favorites.',

  streak:
    'A consecutive run of wins or losses. While streaks feel meaningful psychologically, they are statistically expected with any win rate. A 55% bettor will have 5+ game losing streaks regularly. Don\'t chase hot streaks or abandon cold ones without a fundamental reason.',

  // ─── General ─────────────────────────────────────────────────────────
  susPlay:
    'Short for "suspicious play" — a game flagged for unusual betting activity (massive steam moves, sharp action from multiple syndicates, or dramatic reverse line movement). Sus plays may indicate that sharps have information the market hasn\'t fully priced in. Worth monitoring closely.',

  injuryImpact:
    'A quantified estimate of how a player\'s absence or limited status affects the spread or total. Losing a starting quarterback might be worth 3-5 points in the NFL. The key is whether the market has already adjusted the line for the injury — if so, there\'s no edge left.',

  keyNumber:
    'Point spreads that games land on most often. In the NFL, 3 and 7 are the most important key numbers because games frequently end with a 3- or 7-point margin (due to field goals and touchdowns). Getting +3 instead of +2.5, or -6.5 instead of -7, can dramatically improve your win rate.',
} as const

/** Type helper for tooltip keys */
export type TooltipKey = keyof typeof TOOLTIPS
