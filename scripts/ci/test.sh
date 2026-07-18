#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Running Unit Tests"
echo "═══════════════════════════════════════"

cd "$(dirname "$0")/../.."

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run tests with coverage
echo "Running tests..."
npm run test -- --coverage "$@"

echo ""
echo "Tests passed!"
