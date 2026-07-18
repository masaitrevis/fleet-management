#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scripts/docker/build.sh — Build production Docker image
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ── Configuration ─────────────────────────────────────────────────────────────
IMAGE_NAME="${IMAGE_NAME:-fleet-management-saas}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PLATFORM="${PLATFORM:-linux/amd64}"

# ── Parse args ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag|-t)
      IMAGE_TAG="$2"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --no-cache)
      NO_CACHE="--no-cache"
      shift
      ;;
    --help|-h)
      echo "Usage: build.sh [options]"
      echo ""
      echo "Options:"
      echo "  -t, --tag TAG       Docker image tag (default: latest)"
      echo "  --platform PLATFORM Target platform (default: linux/amd64)"
      echo "  --no-cache          Build without cache"
      echo "  -h, --help          Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

cd "$PROJECT_ROOT"

echo "🔨 Building production Docker image..."
echo "   Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "   Platform: ${PLATFORM}"
echo ""

docker build \
  ${NO_CACHE:-} \
  --platform "$PLATFORM" \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  -t "${IMAGE_NAME}:latest" \
  -f Dockerfile \
  .

echo ""
echo "✅ Build complete: ${IMAGE_NAME}:${IMAGE_TAG}"
