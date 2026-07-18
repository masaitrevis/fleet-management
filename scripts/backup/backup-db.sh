#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — PostgreSQL Backup Script
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/backup/backup-db.sh
#
# Creates a compressed full backup of the PostgreSQL database.
# Keeps last 30 backups, deletes older ones.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/logs/backup-$(date +%Y%m%d-%H%M%S).log"
RETENTION_DAYS=30

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

# ─── Load env ───
cd "$PROJECT_ROOT"
if [[ -f ".env" ]]; then
  export $(grep -v '^#' .env | grep DATABASE_URL | xargs) 2>/dev/null || true
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  error "DATABASE_URL is not set. Cannot proceed with backup."
  exit 1
fi

# Check pg_dump availability
if ! command -v pg_dump &> /dev/null; then
  error "pg_dump not found. Install PostgreSQL client tools."
  exit 1
fi

# ─── Prepare ───
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

mkdir -p "$BACKUP_DIR"

header
log "${CYAN}  Fleet Management SaaS — Database Backup${NC}"
header
echo

info "Backup file: backup_${TIMESTAMP}.sql.gz"
info "Destination: ${BACKUP_DIR}/"

# ─── Run Backup ───
START_TIME=$(date +%s)

info "Running pg_dump (this may take a while)..."

if pg_dump \
  --format=plain \
  --verbose \
  --no-owner \
  --no-acl \
  "$DATABASE_URL" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then

  success "Dump completed. Compressing..."

  if gzip -f "$BACKUP_FILE"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

    success "Backup completed in ${DURATION}s"
    success "File: ${COMPRESSED_FILE}"
    success "Size: ${FILE_SIZE}"
    info "Duration: ${DURATION} seconds"

    # Verify file is not empty
    if [[ ! -s "$COMPRESSED_FILE" ]]; then
      error "Backup file is empty! Something went wrong."
      rm -f "$COMPRESSED_FILE"
      exit 1
    fi
  else
    error "Compression failed"
    rm -f "$BACKUP_FILE"
    exit 1
  fi
else
  error "pg_dump failed! Check ${LOG_FILE} for details."
  rm -f "$BACKUP_FILE"
  exit 1
fi

# ─── Retention Cleanup ───
info "Cleaning up backups older than ${RETENTION_DAYS} days..."

DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} | wc -l)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

if [[ "$DELETED_COUNT" -gt 0 ]]; then
  info "Deleted ${DELETED_COUNT} old backup(s)"
else
  info "No old backups to clean up"
fi

# ─── Summary ───
REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
echo
header
success "Backup complete!"
info "File: ${COMPRESSED_FILE}"
info "Size: ${FILE_SIZE}"
info "Total backups retained: ${REMAINING}"
info "Log: ${LOG_FILE}"
header

exit 0
