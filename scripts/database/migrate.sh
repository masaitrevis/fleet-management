#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Production Database Migration Script
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/database/migrate.sh
#
# Runs `prisma migrate deploy` for ZERO-DOWNTIME production migrations.
# NEVER uses `migrate dev` in production — that can cause data loss.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/migrate-$(date +%Y%m%d-%H%M%S).log"

# ─── Colors ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# ─── Pre-flight checks ───
cd "$PROJECT_ROOT"

log "Starting production database migration..."

# Check if we're in production
if [[ "${NODE_ENV:-}" == "production" ]]; then
  warn "NODE_ENV=production detected"
fi

# Check DATABASE_URL
if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f ".env" ]]; then
    export $(grep -v '^#' .env | grep DATABASE_URL | xargs) 2>/dev/null || true
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  error "DATABASE_URL is not set. Cannot proceed with migration."
  exit 1
fi

success "DATABASE_URL is configured"

# Check Prisma CLI
if ! command -v npx &> /dev/null; then
  error "npx not found. Make sure Node.js is installed."
  exit 1
fi

# ─── Run Migration ───
log "Running: npx prisma migrate deploy"

MIGRATE_OUTPUT="${PROJECT_ROOT}/logs/migrate-output-$(date +%Y%m%d-%H%M%S).txt"
mkdir -p "$(dirname "$MIGRATE_OUTPUT")"

if npx prisma migrate deploy 2>&1 | tee "$MIGRATE_OUTPUT"; then
  success "Migration completed successfully"
else
  error "Migration failed! Check ${MIGRATE_OUTPUT} for details."
  exit 1
fi

# ─── Verify Migration ───
log "Verifying migration status..."

if npx prisma migrate status 2>&1 | tee -a "$MIGRATE_OUTPUT"; then
  success "Migration status verified"
else
  warn "Could not verify migration status, but deploy reported success"
fi

# ─── Generate Prisma Client ───
log "Regenerating Prisma Client..."
if npx prisma generate 2>&1 | tee -a "$MIGRATE_OUTPUT"; then
  success "Prisma Client generated"
else
  warn "Prisma Client generation had issues (non-fatal)"
fi

# ─── Summary ───
MIGRATION_COUNT=$(grep -c "migrations applied" "$MIGRATE_OUTPUT" 2>/dev/null || echo "0")
log "Migration log saved to: $LOG_FILE"
log "Migration output saved to: $MIGRATE_OUTPUT"
success "Production migration complete. Exit code: 0"
exit 0
