#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Database Restore Script (Docker)
# ═══════════════════════════════════════════════════════════════════════════════
# Usage:
#   ./scripts/backup/restore-db-docker.sh <backup-file.sql.gz>
#   ./scripts/backup/restore-db-docker.sh <backup-file.sql.gz> --force
#
# Runs restore inside the PostgreSQL Docker container.
# Same safety checks as restore-db.sh.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/restore-docker-$(date +%Y%m%d-%H%M%S).log"
CONTAINER_NAME="${POSTGRES_CONTAINER:-fleet_db}"

# ─── Colors ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo -e "$msg"
  mkdir -p "$(dirname "$LOG_FILE")"
  echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

error() { log "${RED}ERROR: $1${NC}" >&2; }
success() { log "${GREEN}✓ $1${NC}"; }
warn() { log "${YELLOW}⚠ $1${NC}"; }
info() { log "${BLUE}ℹ $1${NC}"; }
header() { log "${CYAN}═══════════════════════════════════════════════════════════════${NC}"; }

# ─── Parse Args ───
BACKUP_FILE="${1:-}"
FORCE_FLAG="${2:-}"

if [[ -z "$BACKUP_FILE" ]]; then
  error "Usage: $0 <backup-file.sql.gz> [--force]"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  if [[ -f "${PROJECT_ROOT}/backups/$BACKUP_FILE" ]]; then
    BACKUP_FILE="${PROJECT_ROOT}/backups/$BACKUP_FILE"
  else
    error "Backup file not found: $BACKUP_FILE"
    exit 1
  fi
fi

# ─── Check Docker ───
if ! command -v docker &> /dev/null; then
  error "Docker is not installed"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  error "Container '${CONTAINER_NAME}' is not running"
  exit 1
fi

# ─── Production Guard ───
NODE_ENV="${NODE_ENV:-development}"

if [[ "$NODE_ENV" == "production" && "$FORCE_FLAG" != "--force" ]]; then
  error "${BOLD}REFUSING TO RUN: NODE_ENV=production${NC}"
  error "Use --force if you are absolutely sure."
  exit 1
fi

# ─── Danger Banner ───
cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                    ⚠️  DANGER: DOCKER DATABASE RESTORE  ⚠️                    ║
║                                                                               ║
║  This will OVERWRITE all existing data in the container database.             ║
║  This action CANNOT be undone.                                                ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

EOF

info "Container: ${CONTAINER_NAME}"
info "Backup: $(basename "$BACKUP_FILE")"
info "Environment: $NODE_ENV"

# ─── Confirmation ───
if [[ "$FORCE_FLAG" != "--force" ]]; then
  read -rp "Are you sure? [yes/N]: " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    warn "Restore aborted."
    exit 0
  fi
else
  warn "--force flag detected. Skipping confirmation."
fi

header
log "${CYAN}  Starting Docker Database Restore${NC}"
header
echo

# ─── Copy backup into container and restore ───
START_TIME=$(date +%s)

TEMP_BACKUP="/tmp/restore_$(date +%s).sql"

info "Copying backup into container..."
docker cp "$BACKUP_FILE" "${CONTAINER_NAME}:/tmp/restore_backup.sql.gz"

info "Running restore inside container..."

if docker exec "$CONTAINER_NAME" bash -c "
  gunzip -c /tmp/restore_backup.sql.gz | psql -U \${POSTGRES_USER:-postgres} -d \${POSTGRES_DB:-fleet_management} 2>&1
"; then

  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  success "Restore completed in ${DURATION}s"
else
  error "Restore failed! Check ${LOG_FILE}"
  exit 1
fi

# Cleanup
info "Cleaning up temp files..."
docker exec "$CONTAINER_NAME" rm -f /tmp/restore_backup.sql.gz

# ─── Verify ───
info "Verifying restore..."

VERIFY_TABLES=("Company" "User" "Vehicle" "Driver")
ALL_OK=true

for TABLE in "${VERIFY_TABLES[@]}"; do
  COUNT=$(docker exec "$CONTAINER_NAME" psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-fleet_management}" -t -c "SELECT COUNT(*) FROM \"$TABLE\";" 2>/dev/null | tr -d '[:space:]')
  if [[ "$COUNT" =~ ^[0-9]+$ ]]; then
    success "Table '$TABLE': $COUNT rows"
  else
    error "Table '$TABLE': verification failed"
    ALL_OK=false
  fi
done

echo
header
if [[ "$ALL_OK" == true ]]; then
  success "Docker restore verified successfully!"
else
  warn "Restore completed with verification issues."
fi
header

exit 0
