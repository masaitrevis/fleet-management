#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  VPS Deployment (SSH + Docker)"
echo "═══════════════════════════════════════"

# Configuration (override via environment variables)
SSH_HOST="${SSH_HOST:-}"
SSH_USER="${SSH_USER:-}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/fleet-management}"
VERSION="${VERSION:-latest}"

if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ]; then
    echo "Usage: $0"
    echo "Required environment variables:"
    echo "  SSH_HOST    - VPS hostname or IP"
    echo "  SSH_USER    - SSH username"
    echo "Optional environment variables:"
    echo "  SSH_PORT    - SSH port (default: 22)"
    echo "  SSH_KEY     - Path to SSH private key"
    echo "  DEPLOY_DIR  - Deployment directory (default: /opt/fleet-management)"
    echo "  VERSION     - Version tag to deploy (default: latest)"
    exit 1
fi

echo "Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "Deploy directory: $DEPLOY_DIR"
echo "Version: $VERSION"
echo ""

# Build SSH options
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
if [ -n "$SSH_KEY" ]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

# Deploy via SSH
ssh $SSH_OPTS -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
    set -e
    echo "Starting deployment..."
    
    cd "$DEPLOY_DIR" || exit 1
    
    # Pull latest code
    echo "Pulling latest code..."
    git fetch origin
    git checkout "$VERSION" || git pull origin "$VERSION"
    
    # Build and restart
    echo "Building and restarting services..."
    docker-compose pull
    docker-compose up -d --build
    
    # Run migrations
    echo "Running database migrations..."
    docker-compose exec -T app npx prisma migrate deploy
    
    # Health check
    echo "Running health check..."
    sleep 10
    curl -sf http://localhost:3000/api/health || exit 1
    
    # Cleanup
    echo "Cleaning up..."
    docker system prune -f
    
    echo "Deployment complete!"
EOF

echo ""
echo "VPS deployment successful!"
