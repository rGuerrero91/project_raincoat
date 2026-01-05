#!/bin/bash
# Local Backend CI Check - mirrors .github/workflows/backend-ci.yml

set -e  # Exit on any error

echo "Running Backend CI Checks Locally..."
echo ""

cd raincoat_api

echo "Installing gems..."
bundle install
echo "Gems installed"
echo ""

echo "🗄️  Setting up test database..."
RAILS_ENV=test bundle exec rake db:drop db:create db:schema:load
echo "Test database ready"
echo ""

echo "Running RuboCop..."
bundle exec rubocop --fail-level=E
echo "RuboCop passed"
echo ""

echo "Running Brakeman security scan..."
bundle exec brakeman --no-summary --quiet --format json --output tmp/brakeman.json || true
if [ -f tmp/brakeman.json ]; then
  warnings=$(cat tmp/brakeman.json | jq '.warnings | length' 2>/dev/null || echo "0")
  if [ "$warnings" -gt "0" ]; then
    echo "⚠️  Security vulnerabilities found:"
    cat tmp/brakeman.json | jq '.warnings'
    exit 1
  fi
fi
echo "Security scan passed"
echo ""

echo "Running RSpec tests..."
bundle exec rspec --format progress --format documentation
echo "Tests passed"
echo ""

echo "All Backend CI checks passed!"
