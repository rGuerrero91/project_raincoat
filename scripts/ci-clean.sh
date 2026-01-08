#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "════════════════════════════════════════════════════════════"
echo "  Cleaning CI Test Artifacts"
echo "════════════════════════════════════════════════════════════"

cd "$PROJECT_ROOT"

# Clean frontend artifacts
echo ""
echo "Cleaning frontend artifacts..."
cd raincoat_frontend
rm -rf .next
rm -rf coverage
rm -rf node_modules
echo "✓ Frontend cleaned"

# Clean backend artifacts
echo ""
echo "Cleaning backend test database..."
cd "$PROJECT_ROOT/raincoat_api"
RAILS_ENV=test bundle exec rake db:drop 2>/dev/null || true
echo "✓ Backend test database dropped"

# Clean root node_modules
echo ""
echo "Cleaning root node_modules..."
cd "$PROJECT_ROOT"
rm -rf node_modules
echo "✓ Root node_modules cleaned"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "All CI artifacts cleaned!"
echo "════════════════════════════════════════════════════════════"
