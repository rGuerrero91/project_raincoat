#!/bin/bash
# Local Frontend CI Check - mirrors .github/workflows/frontend-ci.yml

set -e  # Exit on any error

echo "Running Frontend CI Checks Locally..."
echo ""

cd raincoat_frontend

echo "Installing dependencies..."
npm ci
echo "Dependencies installed"
echo ""

echo "Running ESLint..."
npm run lint
echo "ESLint passed"
echo ""

echo "Running Prettier check..."
npx prettier --check .
echo "Prettier check passed"
echo ""

echo "Running TypeScript type check..."
npx tsc --noEmit
echo "TypeScript check passed"
echo ""

echo "Running Jest tests..."
npm run test:ci
echo "Tests passed"
echo ""

echo "🏗️  Building Next.js app..."
npm run build
echo "Build successful"
echo ""

echo "All Frontend CI checks passed!"
