#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Fleet Management SaaS — Scheduled Backup Wrapper
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/backup/backup-schedule.sh
#
# Designed to be called by cron. Checks lock file, runs backup,
# sends notification on success/failure, logs to file.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOCK_FILE="${PROJECT_ROOT}/tmp/backup-schedule.lock"
LOG_FILE="${PROJECT_ROOT}/logs/backup-schedule-$(date +%Y%m%d).log"
NOTIFY_WEBHOOK="${BACKUP_NOTIFY_WEBHOOK:-}"
NOTIFY_EMAIL="${BACKUP_NOTIFY_EMAIL:-}"

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

# ─── Lock File Check ───
mkdir -p "$(dirname "$LOCK_FILE")"

if [[ -f "$LOCK_FILE" ]]; then
  PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    warn "Backup already running (PID: $PID). Exiting."
    exit 0
  else
    warn "Stale lock file found. Removing..."
    rm -f "$LOCK_FILE"
  fi
fi

echo $$ > "$LOCK_FILE"

# ─── Cleanup on exit ───
cleanup() {
  rm -f "$LOCK_FILE"
}
trap cleanup EXIT

# ─── Run Backup ───
info "Starting scheduled backup at $(date)"

BACKUP_SCRIPT="${SCRIPT_DIR}/backup-db.sh"
if [[ -f "$BACKUP_SCRIPT" ]]; then
  if bash "$BACKUP_SCRIPT" >> "$LOG_FILE" 2>&1; then
    STATUS="SUCCESS"
    success "Scheduled backup completed successfully"
  else
    STATUS="FAILED"
    error "Scheduled backup failed"
  fi
else
  error "Backup script not found: $BACKUP_SCRIPT"
  STATUS="FAILED"
fi

# ─── Notification ───
HOSTNAME=$(hostname)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [[ -n "$NOTIFY_WEBHOOK" ]]; then
  NOTIFICATION_PAYLOAD=$(cat <<EOF
{
  "text": "Database Backup — ${STATUS}",
  "host": "${HOSTNAME}",
  "timestamp": "${TIMESTAMP}",
  "status": "${STATUS}",
  "log": "${LOG_FILE}"
}
EOF
  )

  if curl -s -X POST -H "Content-Type: application/json" \
       -d "$NOTIFICATION_PAYLOAD" "$NOTIFY_WEBHOOK" > /dev/null 2>&1; then
    info "Notification sent to webhook"
  else
    warn "Failed to send notification to webhook"
  fi
fi

# Simple email notification via sendmail if available
if [[ -n "$NOTIFY_EMAIL" ]] && command -v sendmail &> /dev/null; then
  {
    echo "Subject: [Fleet SaaS] Database Backup ${STATUS} — ${HOSTNAME}"
    echo "To: ${NOTIFY_EMAIL}"
    echo ""
    echo "Database Backup Report"
    echo "====================="
    echo "Status:     ${STATUS}"
    echo "Host:       ${HOSTNAME}"
    echo "Timestamp:  ${TIMESTAMP}"
    echo "Log File:   ${LOG_FILE}"
    echo ""
    echo "--- Last 50 log lines ---"
    tail -n 50 "$LOG_FILE" 2>/dev/null || echo "(log file not accessible)"
  } | sendmail "$NOTIFY_EMAIL"
fi

info "Scheduled backup cycle complete at $(date)"

if [[ "$STATUS" == "SUCCESS" ]]; then
  exit 0
else
  exit 1
fi
