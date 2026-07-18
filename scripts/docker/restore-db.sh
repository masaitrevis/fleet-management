#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/docker/restore-db.sh — Restore PostgreSQL from backup file
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$PROJECT_ROOT"

# ── Parse args ──────────────────────────────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "Usage: restore-db.sh <backup-file.sql> [database-name] [user]"
  echo ""
  echo "Example:"
  echo "  ./scripts/docker/restore-db.sh backups/fleet_db_20240115_120000.sql"
  exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${2:-fleet_management}"
DB_USER="${3:-postgres}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "❌ Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "⚠️  WARNING: This will DROP and recreate the database '${DB_NAME}'."
read -r -p "   Are you sure? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
  echo "❌ Restore cancelled."
  exit 0
fi

echo ""
echo "🔄 Restoring database..."
echo "   Source: ${BACKUP_FILE}"
echo "   Target: ${DB_NAME}"
echo ""

# Drop and recreate database
docker exec -t fleet_db psql -U "${DB_USER}" -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";" 2>/dev/null || true
docker exec -t fleet_db psql -U "${DB_USER}" -c "CREATE DATABASE \"${DB_NAME}\";" 2>/dev/null || true

# Restore from backup
docker exec -i fleet_db psql -U "${DB_USER}" -d "${DB_NAME}" < "$BACKUP_FILE"

echo ""
echo "✅ Restore complete: ${DB_NAME}"
