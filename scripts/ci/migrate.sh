#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Running Database Migrations"
echo "═══════════════════════════════════════"

cd "$(dirname "$0")/../.."

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Verify DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

echo ""
echo "Migrations completed!"
