#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/docker/migrate.sh — Run Prisma migrations in Docker
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$PROJECT_ROOT"

# ── Determine profile ───────────────────────────────────────────────────────
PROFILE="${1:-dev}"

if [[ "$PROFILE" != "dev" && "$PROFILE" != "prod" ]]; then
  echo "Usage: migrate.sh [dev|prod]"
  exit 1
fi

CONTAINER="fleet_app"
if [[ "$PROFILE" == "dev" ]]; then
  CONTAINER="fleet_app_dev"
fi

echo "🗃️  Running Prisma migrations in ${PROFILE} environment..."

# Ensure the container is running
if ! docker ps | grep -q "$CONTAINER"; then
  echo "❌ Container ${CONTAINER} is not running."
  echo "   Start the stack first: ./scripts/docker/start-${PROFILE}.sh"
  exit 1
fi

# Run migration inside the container
docker exec -it "$CONTAINER" npx prisma migrate deploy

echo ""
echo "✅ Migrations applied successfully."
