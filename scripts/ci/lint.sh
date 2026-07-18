#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Running ESLint"
echo "═══════════════════════════════════════"

cd "$(dirname "$0")/../.."

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Run ESLint with color output
npx eslint src/ --ext .ts,.tsx --color "$@"

echo ""
echo "Lint passed!"
