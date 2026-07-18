#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Render Deploy Hook Trigger"
echo "═══════════════════════════════════════"

RENDER_DEPLOY_HOOK="${1:-${RENDER_DEPLOY_HOOK:-}}"

if [ -z "$RENDER_DEPLOY_HOOK" ]; then
    echo "Usage: $0 <render-deploy-hook-url>"
    echo "Or set RENDER_DEPLOY_HOOK environment variable"
    exit 1
fi

echo "Triggering Render deploy hook..."
echo "URL: ${RENDER_DEPLOY_HOOK//\/\/[^@]*@/\/\/******@}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$RENDER_DEPLOY_HOOK" \
    -H "Content-Type: application/json" 2>&1)

HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "HTTP Status: $HTTP_STATUS"
echo "Response: $BODY"

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
    echo ""
    echo "Deploy hook triggered successfully!"
    exit 0
else
    echo ""
    echo "Failed to trigger deploy hook (HTTP $HTTP_STATUS)"
    exit 1
fi
