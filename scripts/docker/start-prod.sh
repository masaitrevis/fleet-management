#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/docker/start-prod.sh — Start production stack with docker-compose
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "🚀 Starting production stack..."
echo ""

# Ensure .env.production exists
if [[ ! -f .env.production ]]; then
  echo "❌ .env.production not found."
  echo "   Please copy .env.example to .env.production and fill in real values."
  exit 1
fi

# Build if image doesn't exist
if ! docker images fleet-management-saas:latest | grep -q fleet-management-saas; then
  echo "🔨 Production image not found. Building first..."
  ./scripts/docker/build.sh
fi

docker-compose --profile prod up -d "$@"

echo ""
echo "✅ Production stack is running!"
echo "   App:        http://localhost:3000"
echo "   Nginx:      http://localhost:80"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana:    http://localhost:3001"
echo "   Loki:       http://localhost:3100"
echo "   Postgres:   localhost:5432"
echo "   Redis:      localhost:6379"
echo ""
echo "Run './scripts/docker/logs.sh' to tail logs."
