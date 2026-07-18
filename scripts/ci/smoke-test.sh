#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Smoke Test"
echo "═══════════════════════════════════════"

# Parse arguments
URL="${1:-}"
MAX_RETRIES="${2:-10}"
RETRY_DELAY="${3:-5}"
TIMEOUT="${4:-30}"

if [ -z "$URL" ]; then
    echo "Usage: $0 <url> [max_retries] [retry_delay] [timeout]"
    echo "Example: $0 https://fleet-management-saas.onrender.com/api/health"
    exit 1
fi

echo "Testing URL: $URL"
echo "Max retries: $MAX_RETRIES"
echo "Retry delay: ${RETRY_DELAY}s"
echo "Timeout: ${TIMEOUT}s"
echo ""

for ((i=1; i<=MAX_RETRIES; i++)); do
    echo "Attempt $i/$MAX_RETRIES..."
    
    if HTTP_STATUS=$(curl --silent --show-error --max-time "$TIMEOUT" \
        --write-out "\n%{http_code}" \
        --fail "$URL" 2>&1); then
        
        echo ""
        echo "Smoke test PASSED!"
        echo "Response:"
        echo "$HTTP_STATUS" | head -n -1
        echo "HTTP Status: $(echo "$HTTP_STATUS" | tail -n 1)"
        exit 0
    else
        echo "Attempt $i failed. Retrying in ${RETRY_DELAY}s..."
        sleep "$RETRY_DELAY"
    fi
done

echo ""
echo "Smoke test FAILED after $MAX_RETRIES attempts"
exit 1
