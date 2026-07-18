#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Database Reset Script
# ═══════════════════════════════════════════════════════════════════════════════
# ⚠️  DANGER: THIS WILL WIPE ALL DATA ⚠️
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/database/reset.sh
#
# Resets the database using `prisma migrate reset`.
# REFUSES to run in production unless explicitly overridden.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ─── Colors ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

log() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }
error() { log "${RED}ERROR: $1${NC}" >&2; }
success() { log "${GREEN}✓ $1${NC}"; }
warn() { log "${YELLOW}⚠ $1${NC}"; }

# ─── Production Guard ───
NODE_ENV="${NODE_ENV:-development}"

if [[ "$NODE_ENV" == "production" ]]; then
  error "${BOLD}REFUSING TO RUN: NODE_ENV=production${NC}"
  error "This script will WIPE ALL DATA. It cannot run in production."
  error "If you absolutely must reset production data, use prisma migrate reset directly."
  exit 1
fi

# ─── Danger Banner ───
cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                        ⚠️  DANGER: DATABASE RESET  ⚠️                         ║
║                                                                               ║
║  This will DROP ALL TABLES and re-create them from scratch.                   ║
║  ALL DATA WILL BE PERMANENTLY LOST.                                           ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

EOF

log "Environment: $NODE_ENV"
warn "All data in the database will be DESTROYED."

# ─── Confirmation ───
read -rp "Type the database name to confirm reset: " CONFIRM_DB

# Extract database name from DATABASE_URL
DB_NAME="${POSTGRES_DB:-fleet_management}"
if [[ -n "${DATABASE_URL:-}" ]]; then
  # Parse database name from connection string
  PARSED_DB=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  [[ -n "$PARSED_DB" ]] && DB_NAME="$PARSED_DB"
fi

if [[ "$CONFIRM_DB" != "$DB_NAME" ]]; then
  error "Confirmation failed. You typed '$CONFIRM_DB' but the database is '$DB_NAME'."
  error "Reset aborted."
  exit 1
fi

# Double confirmation
read -rp "Are you ABSOLUTELY SURE? This cannot be undone. [yes/N]: " CONFIRM_FINAL
if [[ "$CONFIRM_FINAL" != "yes" ]]; then
  warn "Reset aborted by user."
  exit 0
fi

# ─── Run Reset ───
cd "$PROJECT_ROOT"

log "Running: npx prisma migrate reset --force"

if npx prisma migrate reset --force; then
  success "Database reset complete. All tables re-created."
  success "Run ./scripts/database/seed.sh to populate with initial data."
else
  error "Reset failed!"
  exit 1
fi

exit 0
