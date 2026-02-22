#!/usr/bin/env bash
# Generate farmers CSV and print upload instructions.
# Usage: ./scripts/run-seed-farmers.sh [count]
# Example: ./scripts/run-seed-farmers.sh 3000

set -e
cd "$(dirname "$0")/.."
COUNT="${1:-3000}"
echo "Generating $COUNT farmers..."
node scripts/generate-farmers-csv.mjs "$COUNT"
echo ""
echo "Done. Upload farmers-seed.csv via:"
echo "  1. Open app → CSV Upload (logged in as TENANT)"
echo "  2. Or: curl -X POST http://localhost:${PORT:-8080}/api/csv/upload -H 'Cookie: token=YOUR_JWT' -F 'file=@farmers-seed.csv'"
echo "  (Start worker if needed: npm run worker)"
