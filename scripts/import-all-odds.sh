#!/bin/bash
# Run historical odds import for all major sports
# Usage: bash scripts/import-all-odds.sh
#
# With 100k credits/month we can afford dense sampling:
#   NFL: ~550 requests × 30 = 16,500 credits (every day during season)  
#   NBA: ~350 requests × 30 = 10,500 credits (every 3 days)
#   MLB: ~320 requests × 30 = 9,600 credits (every 3 days)
#   NHL: ~280 requests × 30 = 8,400 credits (every 3 days)
#   Total: ~45,000 credits (well within 100k)

cd "$(dirname "$0")/.."

echo "========================================="
echo "  Historical Odds Import - All Sports"
echo "  Budget: 100,000 credits"
echo "========================================="
echo ""

# NFL: 2020-2025 (every game day matters for NFL)
echo ">>> Starting NFL import..."
npx tsx scripts/import-historical-odds.ts --sport=nfl --from=2020-09-01 --to=2025-02-14 --max-credits=20000 2>&1 | tee /tmp/odds-import-nfl.log
echo ""

# NBA: 2020-2025 (3-day intervals for good coverage)
echo ">>> Starting NBA import..."
npx tsx scripts/import-historical-odds.ts --sport=nba --from=2020-12-01 --to=2025-06-20 --max-credits=20000 2>&1 | tee /tmp/odds-import-nba.log
echo ""

# MLB: 2020-2025 (3-day intervals)
echo ">>> Starting MLB import..."
npx tsx scripts/import-historical-odds.ts --sport=mlb --from=2020-07-01 --to=2025-02-14 --max-credits=20000 2>&1 | tee /tmp/odds-import-mlb.log
echo ""

# NHL: 2021-2025 (3-day intervals)
echo ">>> Starting NHL import..."
npx tsx scripts/import-historical-odds.ts --sport=nhl --from=2021-01-01 --to=2025-06-25 --max-credits=20000 2>&1 | tee /tmp/odds-import-nhl.log
echo ""

# NCAAF: 2020-2025 (weekly - lots of games)
echo ">>> Starting NCAAF import..."
npx tsx scripts/import-historical-odds.ts --sport=ncaaf --from=2020-09-01 --to=2025-01-20 --max-credits=10000 2>&1 | tee /tmp/odds-import-ncaaf.log
echo ""

# NCAAB: 2020-2025 (weekly - lots of games)
echo ">>> Starting NCAAB import..."
npx tsx scripts/import-historical-odds.ts --sport=ncaab --from=2020-11-25 --to=2025-04-07 --max-credits=10000 2>&1 | tee /tmp/odds-import-ncaab.log
echo ""

echo "========================================="
echo "  All imports complete!"
echo "========================================="

# Show final counts
echo ""
echo "Checking total imported games per sport..."
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --data '{"query": "SELECT sport, COUNT(*) FROM game_odds GROUP BY sport ORDER BY sport"}' 2>/dev/null || \
  echo "  Query Supabase directly: SELECT sport, COUNT(*) FROM game_odds GROUP BY sport"
