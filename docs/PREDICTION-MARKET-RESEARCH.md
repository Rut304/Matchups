# Prediction Market Research - Ultimate Analytics Platform Guide

> **Research Date:** January 3, 2026  
> **Purpose:** Deep research for building the ultimate prediction market analytics platform  
> **Focus:** Polymarket, Kalshi, trader analytics, API documentation, market metrics

---

## 📊 Executive Summary

Prediction markets have emerged as powerful forecasting tools, with academic research showing they often outperform experts, polls, and pundits. The two dominant platforms—**Polymarket** (offshore, crypto-based) and **Kalshi** (CFTC-regulated, USD-based)—offer different regulatory frameworks but similar opportunities for traders and analytics providers.

**Key Opportunity:** There's a significant gap in the market for comprehensive prediction market analytics. Traders want whale tracking, volume analysis, arbitrage detection, and cross-platform insights that neither platform currently provides natively.

---

## 🟣 Polymarket Deep Dive

### Overview

- **Type:** Crypto-based prediction market on Polygon (MATIC)
- **Currency:** USDC (stablecoin)
- **Regulation:** Offshore (not US-regulated for sports)
- **Market Size:** World's largest prediction market by volume
- **Key Volumes Observed (January 2026):**
  - Super Bowl 2026: $646M+
  - Fed Chair Nomination: $112M+
  - US-Venezuela Military Engagement: $56M+
  - Maduro Out Markets: $47M+
  - College Football Championship: $5M+
  - Fed January Decision: $124M+

### Market Categories

1. **Politics** - Elections, legislation, appointments, government actions
2. **Sports** - Championships, playoffs, game outcomes (live markets)
3. **Crypto** - Bitcoin/ETH price targets, ETF approvals
4. **Finance** - Fed rates, stock targets, commodities
5. **Geopolitics** - Conflicts, treaties, regime changes
6. **World Events** - Summits, international relations
7. **Tech** - Product launches, IPOs, acquisitions
8. **Climate & Science** - Weather events, records
9. **Culture** - Awards (Oscars, Grammys, Golden Globes)
10. **Mentions/Tweet Markets** - Elon Musk tweet counts, Trump statements

### API Architecture

#### Gamma API (Market Data - READ ONLY)

```
Base URL: https://gamma-api.polymarket.com
```

**Key Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/markets` | GET | List all markets with filtering/sorting |
| `/events` | GET | Get event groupings |
| `/markets/{id}` | GET | Single market details |

**Market Object Fields:**

```json
{
  "id": "string",
  "question": "string",
  "conditionId": "string",
  "slug": "string",
  "endDate": "datetime",
  "category": "string",
  "liquidity": "string",
  "liquidityNum": "number",
  "volume": "string",
  "volumeNum": "number",
  "volume24hr": "number",
  "volume1wk": "number",
  "volume1mo": "number",
  "volume1yr": "number",
  "outcomes": "string",
  "outcomePrices": "string",
  "oneDayPriceChange": "number",
  "oneHourPriceChange": "number",
  "oneWeekPriceChange": "number",
  "oneMonthPriceChange": "number",
  "lastTradePrice": "number",
  "bestBid": "number",
  "bestAsk": "number",
  "spread": "number",
  "clobTokenIds": "string",
  "enableOrderBook": "boolean",
  "acceptingOrders": "boolean"
}
```

**Query Parameters for Filtering:**

- `limit`, `offset` - Pagination
- `volume_num_min/max` - Volume filtering
- `liquidity_num_min/max` - Liquidity filtering
- `start_date_min/max`, `end_date_min/max` - Date filtering
- `category`, `tag_id` - Category filtering
- `closed` - Active vs resolved markets

#### CLOB API (Trading)

```
Base URL: https://clob.polymarket.com
```

**Python Client:** `py-clob-client` (v0.34.1 - 576 GitHub stars)

```bash
pip install py-clob-client
```

**Key Trading Functions:**

```python
from py_clob_client.client import ClobClient

# Read-only (no auth required)
client = ClobClient("https://clob.polymarket.com")

# Get market data
mid = client.get_midpoint(token_id)
price = client.get_price(token_id, side="BUY")
book = client.get_order_book(token_id)
markets = client.get_simplified_markets()

# Trading (requires auth)
client = ClobClient(
    HOST,
    key=PRIVATE_KEY,
    chain_id=137,  # Polygon
    signature_type=1,
    funder=FUNDER_ADDRESS
)
client.set_api_creds(client.create_or_derive_api_creds())

# Place orders
order = OrderArgs(token_id=TOKEN_ID, price=0.50, size=100, side=BUY)
signed = client.create_order(order)
resp = client.post_order(signed, OrderType.GTC)
```

### Polymarket Leaderboard Data (Observable Whales)

Top traders (January 2026 - Daily):

| Rank | Username | Profit | Volume |
|------|----------|--------|--------|
| 1 | DrPufferfish | +$747,952 | $5.85M |
| 2 | kch123 | +$662,260 | $2.56M |
| 3 | SemyonMarmeladov | +$634,142 | $3.32M |
| 4 | Anonymous | +$545,126 | $5.54M |
| 5 | SeriouslySirius | +$454,928 | $9.28M |
| 6 | swisstony | +$393,761 | $10.53M |
| 7 | GamblingIsAllYouNeed | +$281,506 | $5.45M |

**Key Insight:** Top traders generate millions in volume - tracking their positions provides "smart money" signals.

### Fee Structure

| Volume Tier | Maker Fee | Taker Fee |
|-------------|-----------|-----------|
| >0 USDC | 0% | 0% |

*Currently 0% fees on all trades*

---

## 🟢 Kalshi Deep Dive

### Overview

- **Type:** CFTC-regulated event contracts exchange
- **Currency:** USD (real dollars)
- **Regulation:** ✅ Fully legal for US residents
- **Unique:** Only US-regulated prediction market for many categories
- **Trading Hours:** Defined exchange hours (like stock market)

### Market Categories

1. **Politics** - Elections, legislation, appointments
2. **Sports** - Pro Football, College Football, NBA, NHL
3. **Culture** - Netflix rankings, Grammy/Oscar awards, GTA releases
4. **Crypto** - Bitcoin/ETH price targets
5. **Climate** - Weather events (rain in NYC, hurricanes)
6. **Economics** - Fed decisions, GDP, employment
7. **Mentions** - What will Trump/announcers say
8. **Companies** - Earnings mentions, stock performance
9. **Financials** - Interest rates, economic indicators
10. **Health** - Pandemic declarations
11. **World** - International events
12. **Tech & Science** - Product launches, scientific milestones

### Key Market Examples (January 2026)

| Market | Volume | Current Price |
|--------|--------|---------------|
| Pro Football Champion | $59.7M | Seattle 15%, SF 13% |
| College FB Championship | $56.6M | Indiana 44%, Miami 22% |
| Fed Chair Nominee | $21.9M | Hassett 40%, Warsh 39% |
| Democratic Nominee 2028 | $36M | Newsom 35%, AOC 10% |
| BTC Hit $150k | $18.2M | Before June 12% |
| 2028 Presidential Winner | $6.2M | JD Vance 30%, Newsom 21% |

### API Architecture

#### REST API

```
Production: https://api.elections.kalshi.com/trade-api/v2
Demo: https://demo-api.kalshi.co/trade-api/v2
```

**Authentication:**

- RSA key-based authentication
- Headers required:
  - `KALSHI-ACCESS-KEY`: Your API key ID
  - `KALSHI-ACCESS-SIGNATURE`: RSA-PSS signed request
  - `KALSHI-ACCESS-TIMESTAMP`: Unix timestamp (ms)

**Key Endpoints:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/exchange/status` | GET | No | Exchange status |
| `/markets` | GET | No | List all markets |
| `/markets/{ticker}` | GET | No | Single market |
| `/portfolio/positions` | GET | Yes | Your positions |
| `/portfolio/orders` | GET | Yes | Your orders |

#### WebSocket API (Real-Time)

```
Production: wss://api.elections.kalshi.com/trade-api/ws/v2
Demo: wss://demo-api.kalshi.co/trade-api/ws/v2
```

**Subscription Channels:**

```json
// Ticker updates (all markets)
{
  "id": 1,
  "cmd": "subscribe",
  "params": { "channels": ["ticker"] }
}

// Orderbook updates (specific markets)
{
  "id": 2,
  "cmd": "subscribe",
  "params": {
    "channels": ["orderbook_delta"],
    "market_tickers": ["KXSB-26", "KXFEDDECISION-26JAN"]
  }
}

// Trade feed
{
  "id": 3,
  "cmd": "subscribe",
  "params": {
    "channels": ["trades"],
    "market_tickers": ["KXSB-26"]
  }
}
```

**Message Types:**

- `ticker` - Bid/ask updates
- `orderbook_snapshot` - Full orderbook state
- `orderbook_delta` - Incremental changes
- `trade` - Trade executions
- `fill` - Your order fills (authenticated)

### Python WebSocket Example

```python
import asyncio
import websockets
import json

async def kalshi_stream():
    ws_url = "wss://api.elections.kalshi.com/trade-api/ws/v2"
    
    async with websockets.connect(ws_url, additional_headers=auth_headers) as ws:
        # Subscribe to ticker
        await ws.send(json.dumps({
            "id": 1,
            "cmd": "subscribe",
            "params": {"channels": ["ticker"]}
        }))
        
        async for message in ws:
            data = json.loads(message)
            if data.get("type") == "ticker":
                market = data["data"]["market_ticker"]
                bid = data["data"]["bid"]
                ask = data["data"]["ask"]
                print(f"{market}: ${bid}-${ask}")
```

### Unique Kalshi Features

1. **CFTC Regulated** - Legal certainty for US users
2. **USD Settlement** - No crypto knowledge needed
3. **Payout Structure** - $100 contracts (Yes pays $100, No pays $100)
4. **Exchange Hours** - Defined trading windows
5. **Tax Reporting** - 1099 forms provided
6. **Demo Environment** - Full API testing without real money

---

## 📚 Academic Research Summary

### Key Papers & Findings

#### "Prediction Markets" - Wolfers & Zitzewitz (2004)

*Journal of Economic Perspectives - 1,976 citations*

- Prediction markets aggregate news, polls, and expert opinions
- Market prices adjust to reflect true odds via economic incentives
- Foundational paper establishing prediction market efficiency

#### "Prediction Market Accuracy in the Long Run" - Berg, Nelson, Rietz (2008)

*International Journal of Forecasting - 489 citations*

- Iowa Electronic Markets data shows sustained accuracy
- Markets correct for publicly known biases
- Long-term forecasting efficiency validated

#### "A Manipulator Can Aid Prediction Market Accuracy" - Hanson & Oprea (2009)

*Economica - 119 citations*

- Counterintuitive finding: manipulation attempts can improve accuracy
- Manipulators provide liquidity and attract informed traders
- Market corrections happen quickly after manipulation

#### "The Effect of Malicious Manipulations on Prediction Market Accuracy" - Buckley & O'Brien (2017)

*Information Systems Frontiers - 23 citations*

- Manipulation temporarily affects prices
- Markets self-correct relatively quickly
- Design implications for manipulation-resistant markets

#### "Public Information Bias and Prediction Market Accuracy" - Gruca & Berg (2007)

*Journal of Prediction Markets - 30 citations*

- Traders correct known biases in public information
- Monetary incentives drive accurate forecasting
- Markets outperform naive models

### Key Academic Findings for Analytics

1. **Market Efficiency:** Prediction markets consistently outperform experts
2. **Manipulation Resistance:** Markets self-correct after manipulation
3. **Information Aggregation:** Prices reflect collective knowledge
4. **Calibration:** Well-designed markets show proper probability calibration
5. **Time Decay:** Prices converge to true probabilities as events approach

---

## 🎯 Key Metrics Traders Care About

### 1. Price/Probability Movements

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Current Price** | Real-time probability | Basic position taking |
| **Opening Price** | Where market opened | Track line movement |
| **1hr/24hr/1wk Change** | Price momentum | Trend identification |
| **Price History** | Full price timeline | Technical analysis |
| **Volatility** | Price variance | Risk assessment |

### 2. Volume Analysis

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Total Volume** | Cumulative trading volume | Market interest gauge |
| **24hr Volume** | Recent activity | Hot market detection |
| **Volume Spikes** | Sudden increases | News/event detection |
| **Volume/Open Interest Ratio** | Turnover rate | Liquidity assessment |
| **Volume by Price** | Where volume occurred | Support/resistance |

### 3. Whale Tracking

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Large Trades** | Trades >$10K (configurable) | Smart money signals |
| **Position Size Changes** | Big wallet movements | Follow the money |
| **Leaderboard Moves** | Top trader activity | Expert tracking |
| **New Large Positions** | Fresh whale interest | Early entry signals |

### 4. Sharp vs. Public Money

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Trade Count** | Number of transactions | Public interest |
| **Dollar Volume** | Total money traded | Sharp interest |
| **Avg Trade Size** | Volume/Count | Retail vs institutional |
| **Position Concentration** | Top holders % | Market control |

### 5. Liquidity Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Bid-Ask Spread** | Cost to trade | Execution costs |
| **Order Book Depth** | Available liquidity | Slippage estimation |
| **Best Bid/Ask** | Current quotes | Instant pricing |
| **Market Maker Activity** | Consistent quotes | Reliability |

### 6. Arbitrage Opportunities

| Type | Description | Risk Level |
|------|-------------|------------|
| **Cross-Platform Arb** | Polymarket vs Kalshi | Low risk |
| **Related Market Arb** | Same event, different framing | Medium risk |
| **Sportsbook Arb** | Prediction vs betting markets | Low risk |
| **Time Arb** | Different resolution dates | Medium risk |

### 7. Historical Accuracy

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Brier Score** | Forecast accuracy measure | Market quality |
| **Calibration** | Predicted vs actual | Trust assessment |
| **Resolution History** | Past market outcomes | Pattern recognition |
| **Category Performance** | Accuracy by type | Category selection |

### 8. Time-Based Patterns

| Pattern | Description | Trading Implication |
|---------|-------------|---------------------|
| **Time Decay** | Price convergence near expiry | Late entry strategies |
| **News Impact** | Price reaction to events | Fast-follow trading |
| **Weekend Effects** | Volume changes | Timing optimization |
| **Event Clustering** | Related events moving together | Correlation trading |

---

## 🛠️ What Makes a Great Prediction Market Analytics Platform

### Essential Features

#### 1. Real-Time Data Dashboard

- Live prices across all markets
- Volume indicators (24hr, 7d, 30d, all-time)
- Price change % (1hr, 24hr, 7d)
- Liquidity (spread, depth)
- Market countdown timers

#### 2. Advanced Filtering & Search

- By category (Politics, Sports, Crypto, etc.)
- By volume (min/max)
- By liquidity
- By price range
- By resolution date
- By price change %

#### 3. Whale Tracking

- Large trade alerts
- Top trader positions
- Leaderboard changes
- Wallet tracking
- "Smart money" flow indicators

#### 4. Price Charts & Technical Analysis

- Candlestick charts
- Volume overlays
- Moving averages
- Support/resistance levels
- Volatility indicators (ATR, Bollinger)

#### 5. Alerts System

- Price threshold alerts
- Volume spike alerts
- Whale activity alerts
- New market alerts
- Resolution alerts
- Arbitrage opportunity alerts

#### 6. Cross-Platform Comparison

- Polymarket vs Kalshi prices
- Prediction market vs sportsbook odds
- Historical price correlation
- Arbitrage calculator

#### 7. Portfolio Tracking

- Position management
- P&L tracking
- CLV (Closing Line Value)
- Win rate analytics
- ROI calculation

#### 8. Market Research Tools

- Resolution source links
- Related news aggregation
- Historical similar markets
- Expert/influencer opinions
- Social sentiment

### Visualization Best Practices

#### Charts That Work

1. **Price Line Charts** - Primary price visualization
2. **Candlestick Charts** - For active traders
3. **Volume Bars** - Overlay or separate panel
4. **Probability Tree** - For multi-outcome markets
5. **Heat Maps** - Cross-market correlation
6. **Whale Bubbles** - Large trade visualization

#### Dashboard Layouts

1. **Market Grid** - Card-based market overview
2. **Watchlist** - Customizable tracked markets
3. **Screener** - Filter-based market discovery
4. **Portfolio** - Personal positions and P&L
5. **Alerts** - Notification center

### Alert Categories Worth Building

| Alert Type | Trigger | Value |
|------------|---------|-------|
| **Price Threshold** | Price crosses X% | Entry/exit signals |
| **Volume Spike** | Volume > 3x average | Breaking news |
| **Whale Trade** | Trade > $X amount | Smart money |
| **New Market** | Market created | Early entry |
| **Resolution Soon** | <24hr to close | Position review |
| **Spread Narrowing** | Spread < X% | Liquidity improving |
| **Arbitrage** | Cross-platform gap | Profit opportunity |

---

## 💡 Platform Recommendations

### MVP Features (Week 1-2)

1. **Market Browser**
   - List all Polymarket + Kalshi markets
   - Filter by category, volume, date
   - Sort by volume, price change, liquidity
   - Search functionality

2. **Market Detail Page**
   - Price chart (historical)
   - Current bid/ask/last
   - Volume stats
   - Resolution details
   - Order book visualization

3. **Cross-Platform View**
   - Side-by-side Polymarket vs Kalshi
   - Price difference highlighting
   - Arbitrage calculator

### Growth Features (Month 1-2)

1. **Whale Tracking**
   - Leaderboard integration
   - Large trade feed
   - Top trader positions

2. **Alerts System**
   - Email/push notifications
   - Price alerts
   - Volume alerts
   - New market alerts

3. **Portfolio Tracker**
   - Manual position entry
   - P&L calculation
   - Performance analytics

### Pro Features (Month 3+)

1. **Real-Time WebSocket Feed**
   - Live price updates
   - Live trade feed
   - Live order book

2. **Arbitrage Scanner**
   - Auto-detect opportunities
   - Cross-platform comparison
   - Sportsbook integration

3. **API Access**
   - Developer API
   - Webhook integrations
   - Data export

4. **AI Analysis**
    - Market summaries
    - News impact prediction
    - Similar market recommendations

---

## 🔗 API Reference Summary

### Polymarket

| API | URL | Auth | Use |
|-----|-----|------|-----|
| Gamma (Markets) | `gamma-api.polymarket.com` | None | Market data |
| CLOB | `clob.polymarket.com` | Optional | Trading |
| GraphQL | `gamma-api.polymarket.com` | None | Flexible queries |

### Kalshi

| API | URL | Auth | Use |
|-----|-----|------|-----|
| REST | `api.elections.kalshi.com/trade-api/v2` | RSA key | All operations |
| WebSocket | `wss://api.elections.kalshi.com/trade-api/ws/v2` | RSA key | Real-time |
| Demo REST | `demo-api.kalshi.co/trade-api/v2` | RSA key | Testing |
| Demo WS | `wss://demo-api.kalshi.co/trade-api/ws/v2` | RSA key | Testing |

---

## 📈 On-Chain Analytics (Advanced)

### Polymarket Blockchain Data

Since Polymarket operates on Polygon:

- **Contract Addresses:**
  - Exchange: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
  - Neg Risk Exchange: `0xC5d563A36AE78145C45a50134d48A1215220f80a`
  - USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
  - CTF Tokens: `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045`

### Dune Analytics Queries Available

- Daily volume tracking
- Wallet retention analysis
- Wash trading removal filters
- Transaction counts
- User analytics

---

## 🎮 Community & Social Intelligence

### Reddit Communities

- r/Kalshi - Active, official Discord linked
- r/polymarket - Banned (mature content flag)
- r/predictionmarkets - General discussion

### Twitter/X Accounts to Follow

- @Polymarket - Official
- @Kalshi - Official
- Prediction market traders on leaderboards
- Political/sports prediction analysts

### Discord Communities

- Kalshi Official Discord
- Various trader Discords (search r/Kalshi)
- Prediction market analysis groups

---

## 🏆 Competitive Landscape

### Existing Tools

| Tool | Focus | Strength | Weakness |
|------|-------|----------|----------|
| Polymarket UI | Trading | Clean UX | No analytics |
| Kalshi UI | Trading | Regulated | Limited data |
| Dune Analytics | On-chain | Customizable | Technical |
| Metaculus | Forecasting | Community | Not tradeable |
| Manifold | Play money | Accessible | Not real money |

### Our Competitive Edge

1. **Cross-Platform** - Both Polymarket AND Kalshi in one place
2. **Trader-Focused** - Analytics traders actually want
3. **Whale Tracking** - Follow smart money
4. **Arbitrage Detection** - Profit opportunities
5. **Sports Integration** - Connect prediction markets to traditional betting
6. **Real-Time Alerts** - Never miss a move
7. **AI-Powered Analysis** - Gemini-powered insights

---

## 📊 Implementation Roadmap

### Phase 1: Data Foundation (Week 1-2)

- [ ] Integrate Polymarket Gamma API
- [ ] Integrate Kalshi REST API
- [ ] Build market data models
- [ ] Create market listing page
- [ ] Implement basic filtering

### Phase 2: Analytics Core (Week 3-4)

- [ ] Build price charting
- [ ] Add volume analytics
- [ ] Create cross-platform comparison
- [ ] Implement watchlists
- [ ] Add market search

### Phase 3: Real-Time (Week 5-6)

- [ ] Kalshi WebSocket integration
- [ ] Live price updates
- [ ] Trade feed
- [ ] Order book visualization

### Phase 4: Intelligence (Week 7-8)

- [ ] Whale tracking system
- [ ] Alert infrastructure
- [ ] Leaderboard integration
- [ ] Large trade detection

### Phase 5: Advanced (Month 3+)

- [ ] Arbitrage scanner
- [ ] Portfolio tracking
- [ ] AI analysis
- [ ] Public API

---

## 📚 Resources & Links

### Documentation

- [Polymarket Docs](https://docs.polymarket.com)
- [Kalshi API Docs](https://docs.kalshi.com)
- [Polymarket Python Client](https://github.com/Polymarket/py-clob-client)
- [Kalshi Python Starter](https://github.com/Kalshi/kalshi-starter-code-python)

### Research

- [Journal of Prediction Markets](https://ubplj.org/index.php/jpm)
- [NBER Prediction Market Research](https://nber.org/papers/prediction-markets)
- Academic papers cited above

### Communities

- [Kalshi Discord](https://discord.gg/kalshi)
- [Metaculus](https://metaculus.com) - Forecasting community
- r/Kalshi on Reddit

---

*Last Updated: January 3, 2026*
*This document should be continuously updated as APIs evolve and new features are discovered.*
