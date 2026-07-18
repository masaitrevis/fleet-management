#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Database Restore Script
# ═══════════════════════════════════════════════════════════════════════════════
# Usage:
#   ./scripts/backup/restore-db.sh <backup-file.sql.gz>
#   ./scripts/backup/restore-db.sh <backup-file.sql.gz> --force
#
# Restores database from a backup file.
# REFUSES production without --force flag.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/restore-$(date +%Y%m%d-%H%M%S).log"

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
  # Try relative to backups dir
  if [[ -f "${PROJECT_ROOT}/backups/$BACKUP_FILE" ]]; then
    BACKUP_FILE="${PROJECT_ROOT}/backups/$BACKUP_FILE"
  else
    error "Backup file not found: $BACKUP_FILE"
    exit 1
  fi
fi

# ─── Production Guard ───
NODE_ENV="${NODE_ENV:-development}"

if [[ "$NODE_ENV" == "production" && "$FORCE_FLAG" != "--force" ]]; then
  error "${BOLD}REFUSING TO RUN: NODE_ENV=production${NC}"
  error "Restoring will OVERWRITE all existing data."
  error "Use --force if you are absolutely sure."
  exit 1
fi

# ─── Danger Banner ───
cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                      ⚠️  DANGER: DATABASE RESTORE  ⚠️                         ║
║                                                                               ║
║  This will OVERWRITE all existing data in the database.                       ║
║  This action CANNOT be undone.                                                ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

EOF

info "Backup file: $(basename "$BACKUP_FILE")"
info "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
info "Environment: $NODE_ENV"

# ─── Confirmation ───
if [[ "$FORCE_FLAG" != "--force" ]]; then
  read -rp "Are you sure you want to restore? [yes/N]: " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    warn "Restore aborted."
    exit 0
  fi
else
  warn "--force flag detected. Skipping confirmation."
fi

# ─── Load env ───
cd "$PROJECT_ROOT"
if [[ -f ".env" ]]; then
  export $(grep -v '^#' .env | grep DATABASE_URL | xargs) 2>/dev/null || true
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  error "DATABASE_URL is not set."
  exit 1
fi

# Check psql
if ! command -v psql &> /dev/null; then
  error "psql not found. Install PostgreSQL client tools."
  exit 1
fi

header
log "${CYAN}  Starting Database Restore${NC}"
header
echo

# ─── Run Restore ───
START_TIME=$(date +%s)

info "Restoring from backup..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" 2>&1 | tee -a "$LOG_FILE"
  RESTORE_STATUS=${PIPESTATUS[1]}
else
  psql "$DATABASE_URL" < "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"
  RESTORE_STATUS=$?
fi

if [[ "$RESTORE_STATUS" -eq 0 ]]; then
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  success "Restore completed in ${DURATION}s"
else
  error "Restore failed with exit code $RESTORE_STATUS"
  error "Check ${LOG_FILE} for details"
  exit 1
fi

# ─── Verify Restore ───
info "Verifying restore..."

VERIFY_TABLES=("Company" "User" "Vehicle" "Driver")
ALL_OK=true

for TABLE in "${VERIFY_TABLES[@]}"; do
  COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"$TABLE\";" 2>/dev/null | tr -d '[:space:]')
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
  success "Restore verified successfully!"
else
  warn "Restore completed but some tables failed verification."
  warn "Check ${LOG_FILE} for details."
fi
header

exit 0
