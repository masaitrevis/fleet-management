#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/docker/start-dev.sh — Start development stack with docker-compose
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "🚀 Starting development stack..."
echo ""

# Ensure .env.development exists
if [[ ! -f .env.development ]]; then
  echo "⚠️  .env.development not found. Copying from .env.example..."
  cp .env.example .env.development
fi

docker-compose --profile dev up -d "$@"

echo ""
echo "✅ Dev stack is running!"
echo "   App:       http://localhost:3000"
echo "   Nginx:     http://localhost:80"
echo "   MailHog:   http://localhost:8025"
echo "   Postgres:  localhost:5432"
echo "   Redis:     localhost:6379"
echo ""
echo "Run './scripts/docker/logs.sh' to tail logs."
