#!/bin/bash
# Run ALL CI checks locally (both frontend and backend)

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "════════════════════════════════════════════════════════════"
echo "  Running ALL CI Checks Locally"
echo "════════════════════════════════════════════════════════════"
echo ""

# Run frontend checks
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    FRONTEND CHECKS                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
bash "$SCRIPT_DIR/ci-local-frontend.sh"
echo ""

# Run backend checks
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    BACKEND CHECKS                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
bash "$SCRIPT_DIR/ci-local-backend.sh"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  ALL CI CHECKS PASSED! Ready to push to GitHub!"
echo "════════════════════════════════════════════════════════════"
