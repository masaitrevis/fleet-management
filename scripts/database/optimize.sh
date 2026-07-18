#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Database Optimization Script
# ═══════════════════════════════════════════════════════════════════════════════
# Usage:
#   ./scripts/database/optimize.sh           # Run optimization (dev/staging)
#   ./scripts/database/optimize.sh --dry-run # Show what would be done
#
# Runs VACUUM ANALYZE, checks index stats, and reports table bloat.
# For dev/staging use. In production, use read-only checks or schedule
# maintenance windows.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/optimize-$(date +%Y%m%d-%H%M%S).log"

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

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
  error "DATABASE_URL is not set."
  exit 1
fi

NODE_ENV="${NODE_ENV:-development}"

if [[ "$NODE_ENV" == "production" && "$DRY_RUN" == false ]]; then
  warn "NODE_ENV=production detected."
  warn "This script runs VACUUM ANALYZE which can lock tables briefly."
  warn "Use --dry-run for read-only checks, or schedule a maintenance window."
  read -rp "Continue anyway? [yes/N]: " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    info "Aborted. Use --dry-run for safe read-only analysis."
    exit 0
  fi
fi

header
log "${CYAN}  Fleet Management SaaS — Database Optimization${NC}"
[[ "$DRY_RUN" == true ]] && log "${YELLOW}  MODE: DRY RUN (read-only)${NC}"
header
echo

# ─── 1. VACUUM ANALYZE ───
if [[ "$DRY_RUN" == false ]]; then
  info "Running VACUUM ANALYZE..."
  if psql "$DATABASE_URL" -c "VACUUM ANALYZE;" 2>&1 | tee -a "$LOG_FILE"; then
    success "VACUUM ANALYZE completed"
  else
    warn "VACUUM ANALYZE encountered issues (may need elevated privileges)"
  fi
else
  info "[DRY RUN] Would run: VACUUM ANALYZE"
fi

echo

# ─── 2. Index Statistics ───
info "Index Statistics"

INDEX_STATS=$(psql "$DATABASE_URL" -t -A -F " | " <<'EOF' 2>/dev/null || echo "ERROR")
SELECT
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
EOF

if [[ "$INDEX_STATS" != "ERROR" ]]; then
  echo "$INDEX_STATS" | while read -r line; do
    [[ -n "$line" ]] && log "  $line"
  done
else
  warn "Could not retrieve index statistics"
fi

echo

# ─── 3. Table Bloat Check ───
info "Table Bloat Estimation"

BLOAT_CHECK=$(psql "$DATABASE_URL" -t -A -F " | " <<'EOF' 2>/dev/null || echo "ERROR")
SELECT
  schemaname || '.' || relname AS table,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  CASE
    WHEN n_live_tup > 0 THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2)
    ELSE 0
  END AS dead_ratio_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 100
ORDER BY n_dead_tup DESC
LIMIT 15;
EOF

if [[ "$BLOAT_CHECK" != "ERROR" && -n "$BLOAT_CHECK" ]]; then
  echo "$BLOAT_CHECK" | while read -r line; do
    [[ -n "$line" ]] && log "  $line"
  done

  # Check for high bloat
  HIGH_BLOAT=$(echo "$BLOAT_CHECK" | awk -F'|' '$NF > 20 {print}')
  if [[ -n "$HIGH_BLOAT" ]]; then
    warn "Tables with >20% dead tuples detected — consider running VACUUM FULL"
    if [[ "$DRY_RUN" == false ]]; then
      warn "Run: psql \"$DATABASE_URL\" -c 'VACUUM FULL;"
    fi
  fi
else
  info "No significant table bloat detected"
fi

echo

# ─── 4. Cache Hit Ratio ───
info "Cache Hit Ratio"

CACHE_HIT=$(psql "$DATABASE_URL" -t -c "
SELECT
  ROUND(
    100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)),
    2
  )::text || '%' AS cache_hit_ratio
FROM pg_statio_user_tables;
" 2>/dev/null || echo "N/A")

log "  Buffer cache hit ratio: ${CACHE_HIT:-N/A}"
if echo "$CACHE_HIT" | grep -qE "^[0-9]+\.[0-9]+%$"; then
  HIT_NUM=$(echo "$CACHE_HIT" | sed 's/%//')
  if (( $(echo "$HIT_NUM < 95" | bc -l 2>/dev/null || echo "0") )); then
    warn "Cache hit ratio below 95% — consider increasing shared_buffers"
  else
    success "Cache hit ratio is healthy"
  fi
fi

echo

# ─── 5. Connection Pool Status ───
info "Active Connections"

CONN_COUNT=$(psql "$DATABASE_URL" -t -c "
SELECT count(*)::text FROM pg_stat_activity WHERE datname = current_database();
" 2>/dev/null || echo "N/A")

log "  Active connections: ${CONN_COUNT:-N/A}"

echo
header
if [[ "$DRY_RUN" == true ]]; then
  info "Dry run complete. No changes made."
else
  success "Optimization complete. Log: $LOG_FILE"
fi
header
