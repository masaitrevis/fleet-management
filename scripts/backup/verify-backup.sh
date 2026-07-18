#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Backup Integrity Verification
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/backup/verify-backup.sh <backup-file.sql.gz>
#
# Restores backup to a temporary database, runs validation queries,
# then deletes the temporary database. Reports integrity status.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/verify-backup-$(date +%Y%m%d-%H%M%S).log"

# ─── Colors ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

if [[ -z "$BACKUP_FILE" ]]; then
  error "Usage: $0 <backup-file.sql.gz>"
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
log "${CYAN}  Backup Integrity Verification${NC}"
header
echo

info "Backup file: $(basename "$BACKUP_FILE")"
info "File size: $(du -h "$BACKUP_FILE" | cut -f1)"

# ─── Parse connection details ───
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

[[ -z "$DB_HOST" ]] && DB_HOST="localhost"
[[ -z "$DB_PORT" ]] && DB_PORT="5432"
[[ -z "$DB_USER" ]] && DB_USER="postgres"
[[ -z "$DB_NAME" ]] && DB_NAME="fleet_management"

TEMP_DB="fleet_verify_$(date +%s)_$$"
PSQL_BASE="psql -h $DB_HOST -p $DB_PORT -U $DB_USER"
export PGPASSWORD="$DB_PASS"

info "Temp database: ${TEMP_DB}"

# ─── Create temp DB ───
info "Creating temporary database..."
if $PSQL_BASE -d "postgres" -c "CREATE DATABASE \"${TEMP_DB}\";" > /dev/null 2>&1; then
  success "Temporary database created"
else
  error "Failed to create temporary database"
  exit 1
fi

# ─── Cleanup function ───
cleanup_temp() {
  info "Cleaning up temporary database..."
  $PSQL_BASE -d "postgres" -c "DROP DATABASE IF EXISTS \"${TEMP_DB}\";" > /dev/null 2>&1 || true
  unset PGPASSWORD
}
trap cleanup_temp EXIT

# ─── Restore to temp DB ───
info "Restoring backup to temporary database..."
START_TIME=$(date +%s)

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | $PSQL_BASE -d "$TEMP_DB" > /dev/null 2>&1
  RESTORE_STATUS=${PIPESTATUS[1]}
else
  $PSQL_BASE -d "$TEMP_DB" < "$BACKUP_FILE" > /dev/null 2>&1
  RESTORE_STATUS=$?
fi

if [[ "$RESTORE_STATUS" -ne 0 ]]; then
  error "Restore to temp database failed! Backup may be corrupted."
  exit 1
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
success "Restore to temp DB completed in ${DURATION}s"

# ─── Validate ───
info "Running validation queries..."

VALIDATION_PASSED=true

# Check key tables exist and have reasonable row counts
VALIDATION_TABLES=(
  "Company:>=0"
  "User:>=0"
  "Vehicle:>=0"
  "Driver:>=0"
  "Role:>=0"
)

for entry in "${VALIDATION_TABLES[@]}"; do
  TABLE="${entry%%:*}"
  EXPECTED="${entry##*:}"

  COUNT=$($PSQL_BASE -d "$TEMP_DB" -t -c "SELECT COUNT(*) FROM \"$TABLE\";" 2>/dev/null | tr -d '[:space:]')

  if [[ "$COUNT" =~ ^[0-9]+$ ]]; then
    if [[ "$EXPECTED" == ">=0" && "$COUNT" -ge 0 ]]; then
      success "Table '$TABLE': $COUNT rows ✓"
    else
      warn "Table '$TABLE': unexpected count ($COUNT)"
      VALIDATION_PASSED=false
    fi
  else
    error "Table '$TABLE': not found or query failed"
    VALIDATION_PASSED=false
  fi
done

# Check schema version / migration table
MIGRATION_COUNT=$($PSQL_BASE -d "$TEMP_DB" -t -c "
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = '_prisma_migrations';
" 2>/dev/null | tr -d '[:space:]')

if [[ "$MIGRATION_COUNT" == "1" ]]; then
  success "Prisma migrations table found ✓"
else
  warn "Prisma migrations table not found — may be a schema-only backup"
fi

# Check for corrupt data (nulls in required fields)
REQUIRED_CHECKS=(
  'User:email IS NOT NULL'
  'Company:name IS NOT NULL'
  'Vehicle:registrationNumber IS NOT NULL'
)

for check in "${REQUIRED_CHECKS[@]}"; do
  TABLE="${check%%:*}"
  CONDITION="${check#*:}"

  BAD_COUNT=$($PSQL_BASE -d "$TEMP_DB" -t -c "
    SELECT COUNT(*) FROM \"$TABLE\" WHERE NOT ($CONDITION);
  " 2>/dev/null | tr -d '[:space:]')

  if [[ "$BAD_COUNT" == "0" ]]; then
    success "Table '$TABLE': data integrity check passed ✓"
  else
    warn "Table '$TABLE': $BAD_COUNT rows fail integrity check"
    VALIDATION_PASSED=false
  fi
done

echo
header
if [[ "$VALIDATION_PASSED" == true ]]; then
  success "BACKUP VERIFICATION PASSED ✓"
  info "Backup file is valid and restorable."
else
  warn "BACKUP VERIFICATION COMPLETED WITH WARNINGS"
  warn "Review the output above for details."
fi
header

# Cleanup is handled by trap
exit 0
