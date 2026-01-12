#!/bin/bash
# ============================================================================
# IMPORT 25 YEARS OF HISTORICAL SPORTS DATA (2000-2025)
# This script fetches data from ESPN API and stores it in Supabase
# ============================================================================

BASE_URL="${1:-https://matchups-eta.vercel.app}"

echo "=============================================="
echo "  MATCHUPS - 25 YEAR HISTORICAL DATA IMPORT"
echo "=============================================="
echo ""
echo "This will import historical game data from 2000-2025 for:"
echo "  - NFL (Regular Season + Playoffs)"
echo "  - NBA (Regular Season + Playoffs)"
echo "  - MLB (Regular Season + Playoffs)"
echo "  - NHL (Regular Season + Playoffs)"
echo "  - NCAAF (Regular Season + Bowl Games)"
echo "  - NCAAB (Regular Season + March Madness)"
echo ""
echo "Target: $BASE_URL"
echo ""
echo "This may take several hours. Run in background with:"
echo "  nohup ./scripts/import-25-years.sh > import.log 2>&1 &"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Function to import a single sport/season
import_season() {
    local sport=$1
    local year=$2
    local season_type=$3
    local limit=${4:-100}
    
    echo "  → $sport $year ($season_type)..."
    
    response=$(curl -s -X POST "$BASE_URL/api/historical-data/populate" \
        -H "Content-Type: application/json" \
        -d "{\"sport\": \"$sport\", \"seasons\": [$year], \"seasonType\": \"$season_type\", \"limit\": $limit}")
    
    stored=$(echo $response | jq -r '.results.stored // 0')
    errors=$(echo $response | jq -r '.results.errors // 0')
    
    if [ "$stored" != "null" ] && [ "$stored" != "0" ]; then
        echo "    ✓ Stored $stored games ($errors errors)"
    else
        error=$(echo $response | jq -r '.error // "Unknown error"')
        echo "    ✗ Failed: $error"
    fi
    
    # Rate limiting - be nice to ESPN
    sleep 3
}

# ============================================================================
# NFL - 25 Years (2000-2024)
# ============================================================================
echo ""
echo "======================================"
echo " NFL Historical Data (2000-2024)"
echo "======================================"

for year in $(seq 2024 -1 2000); do
    echo ""
    echo "NFL Season $year"
    import_season "nfl" $year "regular" 272   # ~272 regular season games
    import_season "nfl" $year "postseason" 15  # ~11-15 playoff games
done

# ============================================================================
# NBA - 25 Years (2000-2024)
# ============================================================================
echo ""
echo "======================================"
echo " NBA Historical Data (2000-2024)"
echo "======================================"

for year in $(seq 2024 -1 2000); do
    echo ""
    echo "NBA Season $year"
    import_season "nba" $year "regular" 1230  # ~1230 regular season games
    import_season "nba" $year "postseason" 100 # ~80-100 playoff games
done

# ============================================================================
# MLB - 25 Years (2000-2024)
# ============================================================================
echo ""
echo "======================================"
echo " MLB Historical Data (2000-2024)"
echo "======================================"

for year in $(seq 2024 -1 2000); do
    echo ""
    echo "MLB Season $year"
    import_season "mlb" $year "regular" 2430  # 2430 regular season games
    import_season "mlb" $year "postseason" 50  # ~40-50 playoff games
done

# ============================================================================
# NHL - 25 Years (2000-2024)
# ============================================================================
echo ""
echo "======================================"
echo " NHL Historical Data (2000-2024)"
echo "======================================"

for year in $(seq 2024 -1 2000); do
    echo ""
    echo "NHL Season $year"
    import_season "nhl" $year "regular" 1312  # ~1312 regular season games
    import_season "nhl" $year "postseason" 100 # ~80-100 playoff games
done

# ============================================================================
# NCAAF - 25 Years (2000-2024)
# ============================================================================
echo ""
echo "======================================"
echo " College Football Historical Data (2000-2024)"
echo "======================================"

for year in $(seq 2024 -1 2000); do
    echo ""
    echo "NCAAF Season $year"
    import_season "ncaaf" $year "regular" 900  # Major games
    import_season "ncaaf" $year "postseason" 50 # Bowl games
done

# ============================================================================
# NCAAB - 25 Years (2000-2024)
# ============================================================================
echo ""
echo "======================================"
echo " College Basketball Historical Data (2000-2024)"
echo "======================================"

for year in $(seq 2024 -1 2000); do
    echo ""
    echo "NCAAB Season $year"
    import_season "ncaab" $year "regular" 5000  # Major games
    import_season "ncaab" $year "postseason" 67  # March Madness
done

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "=============================================="
echo " IMPORT COMPLETE!"
echo "=============================================="
echo ""
echo "Verify data with:"
echo "  curl '$BASE_URL/api/historical-data/query?sport=nfl&limit=10'"
echo ""
echo "Total games imported (approximate):"
echo "  - NFL: ~7,200 games"
echo "  - NBA: ~33,250 games"
echo "  - MLB: ~62,000 games"
echo "  - NHL: ~35,300 games"
echo "  - NCAAF: ~24,000 games"
echo "  - NCAAB: ~127,000 games"
echo ""
echo "Total: ~290,000+ games over 25 years"
