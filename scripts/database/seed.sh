#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Database Seed Script
# ═══════════════════════════════════════════════════════════════════════════════
# Usage:
#   ./scripts/database/seed.sh          # Idempotent — skips if data exists
#   ./scripts/database/seed.sh --force  # Force seed even if data exists
#
# Seeds the database with initial data for fresh environments.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/seed-$(date +%Y%m%d-%H%M%S).log"

FORCE=false
if [[ "${1:-}" == "--force" ]]; then
  FORCE=true
fi

# ─── Colors ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# ─── Pre-flight checks ───
cd "$PROJECT_ROOT"

log "Starting database seed..."

# Load .env if exists
if [[ -f ".env" ]]; then
  export $(grep -v '^#' .env | grep -E 'DATABASE_URL|DIRECT_DATABASE_URL' | xargs) 2>/dev/null || true
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  error "DATABASE_URL is not set. Cannot proceed."
  exit 1
fi

# ─── Check if data already exists ───
if [[ "$FORCE" == false ]]; then
  log "Checking if database already has data..."

  # Check for existing companies (master tenant table)
  COMPANY_COUNT=$(npx prisma db execute --stdin <<EOF 2>/dev/null | tail -n 1 | tr -d '[:space:]'
SELECT COUNT(*)::text FROM "Company";
EOF
  ) || COMPANY_COUNT="0"

  # Also check users
  USER_COUNT=$(npx prisma db execute --stdin <<EOF 2>/dev/null | tail -n 1 | tr -d '[:space:]'
SELECT COUNT(*)::text FROM "User";
EOF
  ) || USER_COUNT="0"

  if [[ "$COMPANY_COUNT" =~ ^[0-9]+$ && "$COMPANY_COUNT" -gt 0 ]] || \
     [[ "$USER_COUNT" =~ ^[0-9]+$ && "$USER_COUNT" -gt 0 ]]; then
    warn "Database already contains data (Companies: ${COMPANY_COUNT:-?}, Users: ${USER_COUNT:-?})"
    warn "Use --force to override and seed anyway."
    exit 0
  fi

  success "Database appears empty. Proceeding with seed."
else
  warn "--force flag set. Seeding regardless of existing data."
fi

# ─── Run Seed ───
log "Running: npm run db:seed"

if npm run db:seed 2>&1 | tee -a "$LOG_FILE"; then
  success "Database seeded successfully"
else
  error "Seeding failed! Check $LOG_FILE for details."
  exit 1
fi

log "Seed log saved to: $LOG_FILE"
success "Database seed complete. Exit code: 0"
exit 0
