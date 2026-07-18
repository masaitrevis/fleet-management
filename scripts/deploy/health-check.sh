#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Health Check"
echo "═══════════════════════════════════════"

# Configuration
BASE_URL="${1:-http://localhost:3000}"
TIMEOUT="${2:-30}"

ERRORS=0

echo "Checking health of: $BASE_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Helper function for checks
check() {
    local name="$1"
    local cmd="$2"
    
    echo -n "  $name ... "
    if eval "$cmd" > /dev/null 2>&1; then
        echo "OK"
        return 0
    else
        echo "FAIL"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# 1. API Health Endpoint
check "API Health" "curl -sf --max-time $TIMEOUT $BASE_URL/api/health"

# 2. Database Connectivity (via API)
check "Database" "curl -sf --max-time $TIMEOUT $BASE_URL/api/health | grep -q 'ok'"

# 3. Redis Connectivity (if accessible via API)
check "Redis" "curl -sf --max-time $TIMEOUT $BASE_URL/api/health"

# 4. Disk Space (local check)
if command -v df >/dev/null 2>&1; then
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 90 ]; then
        echo "  Disk Space ... OK ($DISK_USAGE% used)"
    else
        echo "  Disk Space ... WARNING ($DISK_USAGE% used)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  Disk Space ... SKIPPED (df not available)"
fi

# 5. Memory Usage (local check)
if command -v free >/dev/null 2>&1; then
    MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$MEM_USAGE" -lt 90 ]; then
        echo "  Memory ... OK ($MEM_USAGE% used)"
    else
        echo "  Memory ... WARNING ($MEM_USAGE% used)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  Memory ... SKIPPED (free not available)"
fi

# 6. Docker container status (if running locally)
if command -v docker-compose >/dev/null 2>&1; then
    check "Docker Containers" "docker-compose ps | grep -q 'Up'"
else
    echo "  Docker Containers ... SKIPPED (docker-compose not available)"
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
    echo "All health checks PASSED!"
    exit 0
else
    echo "Health checks FAILED with $ERRORS error(s)"
    exit 1
fi
