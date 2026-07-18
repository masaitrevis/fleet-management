#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/docker/seed.sh — Run database seed in Docker
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$PROJECT_ROOT"

# ── Determine profile ───────────────────────────────────────────────────────
PROFILE="${1:-dev}"

if [[ "$PROFILE" != "dev" && "$PROFILE" != "prod" ]]; then
  echo "Usage: seed.sh [dev|prod]"
  exit 1
fi

CONTAINER="fleet_app"
if [[ "$PROFILE" == "dev" ]]; then
  CONTAINER="fleet_app_dev"
fi

echo "🌱 Running database seed in ${PROFILE} environment..."

# Ensure the container is running
if ! docker ps | grep -q "$CONTAINER"; then
  echo "❌ Container ${CONTAINER} is not running."
  echo "   Start the stack first: ./scripts/docker/start-${PROFILE}.sh"
  exit 1
fi

# Run seed inside the container
docker exec -it "$CONTAINER" npm run db:seed

echo ""
echo "✅ Database seeded successfully."
