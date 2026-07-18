#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Quick Database Connection Test
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/database/connection-test.sh
#
# Fast check — returns 0 if DB is reachable, 1 otherwise.
# Designed for health checks and CI/CD pipelines.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ─── Load env ───
cd "$PROJECT_ROOT"
if [[ -f ".env" ]]; then
  export $(grep -v '^#' .env | grep DATABASE_URL | xargs) 2>/dev/null || true
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "FAIL: DATABASE_URL not set" >&2
  exit 1
fi

# ─── Try pg_isready first (fastest) ───
if command -v pg_isready &> /dev/null; then
  # Parse host/port from DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

  [[ -z "$DB_HOST" ]] && DB_HOST="localhost"
  [[ -z "$DB_PORT" ]] && DB_PORT="5432"
  [[ -z "$DB_USER" ]] && DB_USER="postgres"
  [[ -z "$DB_NAME" ]] && DB_NAME="fleet_management"

  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
    echo "OK"
    exit 0
  fi
fi

# ─── Fallback: Prisma query ───
if npx prisma db execute --stdin > /dev/null 2>&1 <<EOF
SELECT 1;
EOF
then
  echo "OK"
  exit 0
fi

# ─── Last resort: psql ───
if command -v psql &> /dev/null; then
  if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "OK"
    exit 0
  fi
fi

echo "FAIL: Cannot connect to database" >&2
exit 1
