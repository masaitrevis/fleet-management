#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Production Build"
echo "═══════════════════════════════════════"

cd "$(dirname "$0")/../.."

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Generate Prisma client first
echo "Generating Prisma client..."
npx prisma generate

# Set production environment
export NODE_ENV=production

# Build the application
echo "Building Next.js application..."
npm run build

echo ""
echo "Build successful!"
