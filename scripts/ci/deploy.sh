#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  Deployment Script"
echo "═══════════════════════════════════════"

# Parse arguments
ENVIRONMENT="${1:-}"
VERSION="${2:-latest}"

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <environment> [version]"
    echo "Environments: staging, production"
    echo "Example: $0 staging v1.2.3"
    exit 1
fi

case "$ENVIRONMENT" in
    staging|production)
        ;;
    *)
        echo "ERROR: Invalid environment '$ENVIRONMENT'"
        echo "Valid environments: staging, production"
        exit 1
        ;;
esac

echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo ""

cd "$(dirname "$0")/../.."

# Build Docker image
echo "Building Docker image..."
docker build -t "fleet-management-saas:$VERSION" .

# Tag for registry
docker tag "fleet-management-saas:$VERSION" "fleet-management-saas:$ENVIRONMENT"

echo ""
echo "Deployment image built: fleet-management-saas:$VERSION"
echo "Tagged as: fleet-management-saas:$ENVIRONMENT"
echo ""
echo "To deploy, run the appropriate GitHub Actions workflow or use docker-compose."
