#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Database Status Check
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/database/status.sh
#
# Checks database connectivity, migration status, and key table counts.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ─── Colors ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "$1"; }
header() { log "${CYAN}═══════════════════════════════════════════════════════════════${NC}"; }
subheader() { log "${BLUE}▸ $1${NC}"; }
success() { log "${GREEN}  ✓ $1${NC}"; }
error() { log "${RED}  ✗ $1${NC}"; }
warn() { log "${YELLOW}  ⚠ $1${NC}"; }

# ─── Load env ───
cd "$PROJECT_ROOT"
if [[ -f ".env" ]]; then
  export $(grep -v '^#' .env | grep -E 'DATABASE_URL|DIRECT_DATABASE_URL' | xargs) 2>/dev/null || true
fi

header
log "${CYAN}  Fleet Management SaaS — Database Status${NC}"
header
echo

# ─── 1. Connection Test ───
subheader "Connection Test"

if npx prisma db execute --stdin <<EOF 2>/dev/null | grep -q "SELECT 1"
SELECT 1;
EOF
then
  success "Database connection: OK"
else
  error "Database connection: FAILED"
  error "Check DATABASE_URL and ensure PostgreSQL is running"
  exit 1
fi

# ─── 2. Migration Status ───
subheader "Migration Status"

MIGRATION_STATUS=$(npx prisma migrate status 2>/dev/null || echo "ERROR")

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
  success "Schema: Up to date"
elif echo "$MIGRATION_STATUS" | grep -q "pending migration"; then
  warn "Pending migrations detected"
  echo "$MIGRATION_STATUS" | grep -E "(pending|migration)" | sed 's/^/    /'
else
  warn "Migration status unclear — run migrate.sh to verify"
fi

# ─── 3. Table Counts ───
subheader "Table Counts (Key Tables)"

KEY_TABLES=(
  "Company:companies"
  "User:users"
  "Vehicle:vehicles"
  "Driver:drivers"
  "Trip:trips"
  "Branch:branches"
  "Department:departments"
  "Role:roles"
  "Session:sessions"
  "MaintenanceRecord:maintenance_records"
  "FuelLog:fuel_logs"
  "GPSDevice:gps_devices"
  "Notification:notifications"
  "AuditLog:audit_logs"
)

for entry in "${KEY_TABLES[@]}"; do
  MODEL="${entry%%:*}"
  LABEL="${entry##*:}"

  COUNT=$(npx prisma db execute --stdin 2>/dev/null <<EOF | tail -n 1 | tr -d '[:space:]'
SELECT COUNT(*)::text FROM "${MODEL}";
EOF
  ) || COUNT="ERR"

  if [[ "$COUNT" =~ ^[0-9]+$ ]]; then
    printf "  ${GREEN}%-25s${NC} %'d\n" "$MODEL" "$COUNT"
  else
    printf "  ${YELLOW}%-25s${NC} %s\n" "$MODEL" "N/A"
  fi
done

# ─── 4. Database Size ───
subheader "Database Size"

DB_SIZE=$(npx prisma db execute --stdin 2>/dev/null <<EOF | tail -n 1 | tr -d '[:space:]'
SELECT pg_size_pretty(pg_database_size(current_database()));
EOF
) || DB_SIZE="unknown"

log "  Total size: ${DB_SIZE:-unknown}"

# ─── 5. Connection Info ───
subheader "Connection Info"

if [[ -n "${DATABASE_URL:-}" ]]; then
  # Parse and mask password from DATABASE_URL
  MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:\/\/[^:]*@[^@]*@/:\/\/***@/; s/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
  log "  DATABASE_URL: ${MASKED_URL}"
else
  warn "DATABASE_URL not set"
fi

# ─── 6. Prisma Client Version ───
subheader "Prisma Version"

PRISMA_VERSION=$(npx prisma --version 2>/dev/null | head -n 1 || echo "unknown")
log "  ${PRISMA_VERSION}"

echo
header
success "Status check complete"
header
