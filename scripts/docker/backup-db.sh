#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/docker/backup-db.sh — Backup PostgreSQL from Docker container
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$PROJECT_ROOT"

# ── Configuration ───────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/fleet_db_${TIMESTAMP}.sql"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# ── Parse args ──────────────────────────────────────────────────────────────
DB_NAME="${1:-fleet_management}"
DB_USER="${2:-postgres}"

echo "💾 Backing up PostgreSQL database..."
echo "   Database: ${DB_NAME}"
echo "   User: ${DB_USER}"
echo "   Output: ${BACKUP_FILE}"
echo ""

# Run pg_dump inside the db container
docker exec -t fleet_db pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "$BACKUP_FILE"

echo ""
echo "✅ Backup complete: ${BACKUP_FILE}"
echo "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
