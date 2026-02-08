# The Whale's Review: Matchups Platform

**Identity:** "The Whale"  
**Philosophy:** I don't bet for fun; I bet for ROI. I treat sports betting as high-frequency trading.

---

## The Executive Summary

You have the *skeleton* of a billion-dollar product here, but right now, it’s wearing a cheap suit. You want to capture the guy who bets $50k a weekend? Stop building a "sports site" and start building a **financial terminal**.

### The Good (The Potential)

* **"Sus Plays" & "Check The Experts":** This is your viral goldmine. Sharps love fading public "touts" and spotting fixed games. This differentiates you from ESPN.
* **Tech Stack:** Next.js + Supabase is fast. Speed is money. If I see a line move 2 seconds faster here than on OddsJam, I’m yours.
* **The "Edge" Concept:** Your focus on RLM (Reverse Line Movement) and Steam is correct. That is the *only* way to beat the market long-term.

### The Bad (The Noise)

* **Mock Data:** Your audit says you use mock data for picks and alerts. If I see one piece of fake data, I assume *all* your data is fake. **Kill the mock data immediately.** A blank page is better than a lying page.
* **"Coming Soon" Fatigue:** You have placeholders everywhere. It looks amateur. Hide features that aren't ready.
* **Generic "AI" Analysis:** "Gemini says the Chiefs look strong." I don't care. Unless your AI has a backtested P&L record, it's noise. Use AI to *find* data, not predict winners.

### The Ugly (The Dealbreakers)

* **The "Broken" Matchup Page:** I see `NaN` scores and `0` odds. If I load a page and see a zero spread, I assume your API is broken and I leave.
* **Lack of Provenance:** You show stats, but where from? If you show "Public Betting %," I need to know if that's from a soft book (DraftKings) or a sharp book (Circa/Pinnacle).

---

## The Matchup Page: Anatomy of a Killer

Standard sites show: Score, Time, Basic Odds, Last 5 Games. That is for "squares" (casuals). Here is how you reorganize it for a **Sharp**:

### 1. What to KILL (Remove or Bury)

* **Generic "Win Probability" Pie Charts:** Unless based on a proprietary model hitting 55%+, it's useless.
* **Contextless "Last 5 Games":** W-L-W-L-W tells me nothing. Did they win against a tanking team?
* **Consensus Picks (without handle):** Knowing 60% of tickets are on the Chiefs is useless. Knowing 60% of tickets but 80% of *money* is on the 49ers? That's gold.

### 2. What to ADD (The Edge)

* **Liquidity/Limits:** Can I get $5k down on this line, or is it limited to $500?
* **Ref/Umpire Analytics:** "Ref Tony Brothers is officiating. Home teams cover 42% when he refs."
* **Correlated Parlay Logic:** "When KC hits the Over, Mahomes passing yards > 280 85% of the time."
* **The "Buy Point" Calculator:** Show me the **EV (Expected Value)** percentage in bold green text.

---

## Recommended Layout Flow

**Zone 1: The Market State (The Ticker)**

* **Headline:** Teams & Time.
* **The Line:** Best Available Odds (highlighted) vs. Market Average.
* **The Move:** Sparkline graph of Opening vs Current Line. *Did it cross a key number (3 or 7)?*
* **The Split:** Ticket % vs. Money %. **This is your hook.**

**Zone 2: The "Why" (The Edge)**

* **Signals:** "Steam Alert detected on SF -3 at 10:42 AM."
* **System Matches:** "Matches 'Home Dog in Division Game' System (58% ROI)."
* **Injury Impact:** Don't just list injuries. List **WAR** impact.

**Zone 3: The Context (The Grind)**

* **Situational:** "SF on short rest." "KC traveling 3 time zones."
* **Weather:** "15mph Crosswind = Fade Passing Props."
* **Advanced Metrics:** DVOA, EPA/Play. Forget "Yards per game."

**Zone 4: The Execution**

* **Line Shop Matrix:** Grid of every book. Highlight best price.
* **"Shop Now" Buttons:** Deep links to bet slips.

---

## Technical Verdict

You are building a Ferrari but putting 87-octane gas (mock data) in it.

1. **Purge the fake data.**
2. **Fix the Matchup Page rendering (NaN/0s).**
3. **Focus on "Money % vs Ticket %" and "Line Movement History."**

Do this, and you won't just have a betting site. You'll have a tool that prints money.
