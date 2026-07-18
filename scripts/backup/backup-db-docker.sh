#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — PostgreSQL Backup Script (Docker)
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/backup/backup-db-docker.sh
#
# Runs pg_dump inside the PostgreSQL Docker container.
# Same format as backup-db.sh but container-aware.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/logs/backup-docker-$(date +%Y%m%d-%H%M%S).log"
RETENTION_DAYS=30
CONTAINER_NAME="${POSTGRES_CONTAINER:-fleet_db}"

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

# ─── Check Docker ───
if ! command -v docker &> /dev/null; then
  error "Docker is not installed or not in PATH"
  exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  error "Container '${CONTAINER_NAME}' is not running."
  error "Available containers:"
  docker ps --format '  - {{.Names}}' 2>/dev/null || true
  exit 1
fi

# ─── Prepare ───
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

mkdir -p "$BACKUP_DIR"

header
log "${CYAN}  Fleet Management SaaS — Database Backup (Docker)${NC}"
header
echo

info "Container: ${CONTAINER_NAME}"
info "Backup file: ${BACKUP_FILE}.gz"

# ─── Run Backup in Container ───
START_TIME=$(date +%s)

info "Running pg_dump inside container..."

if docker exec "$CONTAINER_NAME" pg_dump \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-fleet_management}" \
  --format=plain \
  --verbose \
  --no-owner \
  --no-acl > "${BACKUP_DIR}/${BACKUP_FILE}" 2>> "$LOG_FILE"; then

  success "Dump completed. Compressing..."

  if gzip -f "${BACKUP_DIR}/${BACKUP_FILE}"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    FILE_SIZE=$(du -h "${BACKUP_DIR}/${COMPRESSED_FILE}" | cut -f1)

    success "Backup completed in ${DURATION}s"
    success "File: ${BACKUP_DIR}/${COMPRESSED_FILE}"
    success "Size: ${FILE_SIZE}"

    if [[ ! -s "${BACKUP_DIR}/${COMPRESSED_FILE}" ]]; then
      error "Backup file is empty!"
      rm -f "${BACKUP_DIR}/${COMPRESSED_FILE}"
      exit 1
    fi
  else
    error "Compression failed"
    rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
    exit 1
  fi
else
  error "pg_dump failed inside container! Check ${LOG_FILE}"
  rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
  exit 1
fi

# ─── Retention Cleanup ───
info "Cleaning up old backups..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} | wc -l)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

if [[ "$DELETED_COUNT" -gt 0 ]]; then
  info "Deleted ${DELETED_COUNT} old backup(s)"
fi

REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
echo
header
success "Docker backup complete!"
info "File: ${BACKUP_DIR}/${COMPRESSED_FILE}"
info "Size: ${FILE_SIZE}"
info "Backups retained: ${REMAINING}"
header

exit 0
