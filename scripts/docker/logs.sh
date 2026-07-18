#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/docker/logs.sh — Tail logs with optional service filter
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$PROJECT_ROOT"

# ── Parse args ──────────────────────────────────────────────────────────────
SERVICE=""
FOLLOW="-f"
TAIL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service|-s)
      SERVICE="$2"
      shift 2
      ;;
    --no-follow)
      FOLLOW=""
      shift
      ;;
    --tail)
      TAIL="--tail=$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: logs.sh [options]"
      echo ""
      echo "Options:"
      echo "  -s, --service NAME  Filter to a specific service (app, db, redis, nginx, etc.)"
      echo "  --no-follow         Don't follow logs (show and exit)"
      echo "  --tail N            Show last N lines (default: all)"
      echo "  -h, --help          Show this help"
      echo ""
      echo "Services: app-dev, app, db, redis, nginx, nginx-dev, mailhog, prometheus, grafana, loki, promtail"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "📋 Tailing logs..."
if [[ -n "$SERVICE" ]]; then
  echo "   Service: $SERVICE"
fi
echo ""

docker-compose logs $FOLLOW $TAIL "$SERVICE" 2>/dev/null || \
  docker-compose --profile dev --profile prod logs $FOLLOW $TAIL "$SERVICE"
