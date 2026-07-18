#!/bin/bash
# Generate all Phase 12 backend modules

BASE="/root/.openclaw/workspace/fleet-management-saas/src/modules"

# Helper to create dirs
mkdir -p "$BASE"/{warehouse,part-category,inventory-part,stock,stock-movement,purchase-order,supplier,warehouse-transfer,tool,inventory-alert,inventory-analytics}/{validators,repositories,services,controllers}

echo "Directories created"
