#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Rollback Script"
echo "═══════════════════════════════════════"

# Configuration
ROLLBACK_TO="${1:-previous}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/fleet-management}"
IMAGE_NAME="${IMAGE_NAME:-fleet-management-saas}"

echo "Rollback target: $ROLLBACK_TO"
echo ""

# List available Docker image tags
echo "Available Docker images:"
docker images "$IMAGE_NAME" --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | head -20

echo ""

if [ "$ROLLBACK_TO" = "previous" ]; then
    # Get the second most recent tag
    PREVIOUS_TAG=$(docker images "$IMAGE_NAME" --format "{{.Tag}}" | sed -n '2p')
    if [ -z "$PREVIOUS_TAG" ]; then
        echo "ERROR: No previous image found for rollback"
        exit 1
    fi
    ROLLBACK_TO="$PREVIOUS_TAG"
    echo "Rolling back to previous version: $ROLLBACK_TO"
fi

# Check if the target image exists
if ! docker images "$IMAGE_NAME" --format "{{.Tag}}" | grep -q "^${ROLLBACK_TO}$"; then
    echo "ERROR: Image tag '$ROLLBACK_TO' not found"
    exit 1
fi

echo "Rolling back to version: $ROLLBACK_TO"
echo ""

# Update docker-compose to use the rollback version
cd "$DEPLOY_DIR" || exit 1

# Create a backup of current docker-compose
cp docker-compose.yml docker-compose.yml.backup

# Update the image tag in docker-compose.yml
sed -i "s|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${ROLLBACK_TO}|" docker-compose.yml

# Restart with the previous image
echo "Restarting services with rollback image..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 15

# Health check
echo "Running health check..."
if curl -sf http://localhost:3000/api/health; then
    echo ""
    echo "Rollback successful! Running version: $ROLLBACK_TO"
else
    echo ""
    echo "Health check failed! Restoring previous configuration..."
    cp docker-compose.yml.backup docker-compose.yml
    docker-compose up -d
    echo "Restored to previous configuration"
    exit 1
fi

# Cleanup backup
rm -f docker-compose.yml.backup

echo ""
echo "Rollback complete!"
