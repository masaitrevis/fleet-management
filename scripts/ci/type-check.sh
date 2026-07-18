#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Running TypeScript Type Check"
echo "═══════════════════════════════════════"

cd "$(dirname "$0")/../.."

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Generate Prisma client (needed for type checking)
echo "Generating Prisma client..."
npx prisma generate

# Run TypeScript compiler in no-emit mode
echo "Running TypeScript type check..."
npx tsc --noEmit

echo ""
echo "Type check passed!"
