#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/docker/stop.sh — Stop all Docker containers
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "🛑 Stopping all containers..."
docker-compose --profile dev --profile prod down "$@"

echo ""
echo "✅ All containers stopped."
