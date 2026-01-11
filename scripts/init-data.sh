#!/bin/bash

# =============================================================================
# MATCHUPS DATA INITIALIZATION SCRIPT
# =============================================================================
# This script initializes the Matchups application with real data:
# 1. Deploys Supabase schemas
# 2. Imports historical game data
# 3. Runs trend discovery
# 4. Verifies data flow
# =============================================================================

echo "🏈 MATCHUPS DATA INITIALIZATION"
echo "================================"

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY not set, some operations may fail"
fi

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_SECRET="${ADMIN_SECRET:-}"

echo ""
echo "📊 Configuration:"
echo "   Base URL: $BASE_URL"
echo "   Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# =============================================================================
# Step 1: Deploy Supabase Schemas
# =============================================================================
echo "📦 Step 1: Deploying Supabase Schemas..."
echo "   Please run the following SQL files in your Supabase SQL editor:"
echo "   - supabase/schema.sql"
echo "   - supabase/historical-data-schema.sql" 
echo "   - supabase/leaderboard-schema.sql"
echo "   - supabase/cappers-schema.sql"
echo ""
read -p "   Press Enter when schemas are deployed..."

# =============================================================================
# Step 2: Import Historical Data
# =============================================================================
echo ""
echo "📥 Step 2: Importing Historical Data..."

# Import NFL
echo "   Importing NFL 2020-2025..."
curl -X POST "$BASE_URL/api/data/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{"sport":"NFL","startYear":2020,"endYear":2025}' \
  --silent | jq .

# Import NBA
echo "   Importing NBA 2020-2025..."
curl -X POST "$BASE_URL/api/data/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{"sport":"NBA","startYear":2020,"endYear":2025}' \
  --silent | jq .

# Import NHL
echo "   Importing NHL 2020-2025..."
curl -X POST "$BASE_URL/api/data/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{"sport":"NHL","startYear":2020,"endYear":2025}' \
  --silent | jq .

# Import MLB
echo "   Importing MLB 2020-2025..."
curl -X POST "$BASE_URL/api/data/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{"sport":"MLB","startYear":2020,"endYear":2025}' \
  --silent | jq .

# =============================================================================
# Step 3: Run Trend Discovery
# =============================================================================
echo ""
echo "🔍 Step 3: Running Trend Discovery..."

curl -X POST "$BASE_URL/api/data/discover-trends" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{"minSampleSize":20,"minWinPct":53}' \
  --silent | jq .

# =============================================================================
# Step 4: Verify Data Flow
# =============================================================================
echo ""
echo "✅ Step 4: Verifying Data Flow..."

echo "   Testing /api/games..."
curl "$BASE_URL/api/games?sport=NFL" --silent | jq '.count'

echo "   Testing /api/analytics..."
curl "$BASE_URL/api/analytics?type=summary" --silent | jq '.'

echo "   Testing /api/data/discover-trends..."
curl "$BASE_URL/api/data/discover-trends?sport=NFL&limit=5" --silent | jq '.trends | length'

# =============================================================================
# Done
# =============================================================================
echo ""
echo "================================"
echo "🎉 INITIALIZATION COMPLETE!"
echo "================================"
echo ""
echo "Your Matchups app should now have:"
echo "  ✓ Historical game data from 2020-2025"
echo "  ✓ Discovered betting trends"
echo "  ✓ Real-time game data from ESPN"
echo "  ✓ Odds data from The Odds API"
echo ""
echo "Next steps:"
echo "  1. Visit $BASE_URL to verify the app"
echo "  2. Check /trends for discovered trends"
echo "  3. Check /analytics for Edge Finder"
echo "  4. Check /leaderboard for cappers"
echo ""
