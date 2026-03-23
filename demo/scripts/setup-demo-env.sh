#!/usr/bin/env bash
# ────────────────────────────────────────────────────────
# setup-demo-env.sh — One-command SupplyWatch demo setup
# ────────────────────────────────────────────────────────
# Installs dependencies, builds all services, and validates
# Docker images for the Harness SCS demo environment.
#
# Usage:
#   ./demo/scripts/setup-demo-env.sh
# ────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   SupplyWatch — Demo Environment Setup       ║"
echo "║   Harness Supply Chain Security Demo         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Step 1: Backend dependencies ────────────────────
info "Installing backend dependencies..."
cd "$REPO_ROOT/app/backend"
if [ -f package-lock.json ]; then
  npm ci --silent
else
  npm install --silent
fi
info "Backend dependencies installed."

# ── Step 2: Backend tests ───────────────────────────
info "Running backend tests..."
npm test 2>&1 || warn "Backend tests failed — continuing setup."
echo ""

# ── Step 3: Frontend dependencies ───────────────────
info "Installing frontend dependencies..."
cd "$REPO_ROOT/app/frontend"
if [ -f package-lock.json ]; then
  npm ci --silent
else
  npm install --silent
fi
info "Frontend dependencies installed."

# ── Step 4: Frontend tests ──────────────────────────
info "Running frontend tests..."
npm test 2>&1 || warn "Frontend tests failed — continuing setup."
echo ""

# ── Step 5: Notification service (Maven build) ──────
info "Building notification service JAR..."
cd "$REPO_ROOT/app/notification-service"
if command -v mvn &>/dev/null; then
  mvn package -DskipTests -B -q 2>&1 || warn "Maven build failed — Docker build may still work."
  info "Notification service JAR built."
else
  warn "Maven not found — skipping JAR build. Docker build will handle it."
fi
echo ""

# ── Step 6: Docker image builds ─────────────────────
info "Building Docker images..."
cd "$REPO_ROOT/app"

if ! command -v docker &>/dev/null; then
  warn "Docker not found — skipping image builds."
  warn "Install Docker to build container images locally."
else
  info "Building backend image..."
  docker build -t supplywatch/backend:latest ./backend 2>&1 | tail -1
  info "Backend image built: supplywatch/backend:latest"

  info "Building frontend image..."
  docker build -t supplywatch/frontend:latest ./frontend 2>&1 | tail -1
  info "Frontend image built: supplywatch/frontend:latest"

  info "Building notification service image..."
  docker build -t supplywatch/notification-service:latest ./notification-service 2>&1 | tail -1
  info "Notification service image built: supplywatch/notification-service:latest"

  echo ""
  info "Docker images:"
  docker images --format "  {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep supplywatch || true
fi

# ── Step 7: Validate Dockerfiles exist ──────────────
echo ""
info "Validating project structure..."
MISSING=0
for f in \
  app/backend/Dockerfile \
  app/frontend/Dockerfile \
  app/notification-service/Dockerfile \
  app/docker-compose.yml \
  .harness/pipelines/ci-build.yaml \
  .harness/pipelines/cd-deploy.yaml \
  .harness/policies/deny-gpl-licenses.rego \
  .harness/policies/deny-vulnerable-versions.rego \
  demo/seed-data/vulnerable-package.json \
  demo/seed-data/clean-package.json \
  demo/seed-data/vulnerable-pom.xml \
  demo/seed-data/clean-pom.xml \
  demo/gpl-stub-package/package.json \
  cosign/README.md; do
  if [ ! -f "$REPO_ROOT/$f" ]; then
    warn "Missing: $f"
    MISSING=$((MISSING + 1))
  fi
done

if [ "$MISSING" -eq 0 ]; then
  info "All expected files present."
else
  warn "$MISSING file(s) missing."
fi

# ── Done ────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Setup Complete!                            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
info "Next steps:"
echo "  1. Run locally:    cd app && docker compose up"
echo "  2. Swap to vulnerable deps:  ./demo/scripts/swap-vulnerable-dep.sh vulnerable"
echo "  3. Trigger CI pipeline:      ./demo/scripts/trigger-pipeline.sh --pipeline ci-build --branch main"
echo "  4. See scenario runbooks:    ls demo/scenarios/"
echo ""
