#!/bin/bash
# Populate historical NFL playoff data

BASE_URL="${1:-https://matchups-eta.vercel.app}"

echo "Populating NFL playoff data from 2015-2025..."
echo "This may take several minutes..."

# Fetch each season's playoff data
for year in 2024 2023 2022 2021 2020 2019 2018 2017 2016 2015; do
  echo ""
  echo "Fetching $year NFL playoffs..."
  curl -s -X POST "$BASE_URL/api/historical-data/populate" \
    -H "Content-Type: application/json" \
    -d "{\"sport\": \"nfl\", \"seasons\": [$year], \"seasonType\": \"postseason\", \"limit\": 15}" \
    | jq '.results.stored // .error // "Request sent"'
  
  # Small delay to avoid rate limiting
  sleep 2
done

echo ""
echo "Done! Check data with:"
echo "curl '$BASE_URL/api/historical-data/populate?sport=nfl'"
