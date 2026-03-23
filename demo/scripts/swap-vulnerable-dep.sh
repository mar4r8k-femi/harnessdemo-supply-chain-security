#!/usr/bin/env bash
# ────────────────────────────────────────────────────────
# swap-vulnerable-dep.sh — Toggle vulnerable / clean deps
# ────────────────────────────────────────────────────────
# Swaps between vulnerable and clean dependency files for
# the backend (npm) and notification service (Maven).
#
# Usage:
#   ./swap-vulnerable-dep.sh vulnerable              # Both services
#   ./swap-vulnerable-dep.sh clean                   # Both services
#   ./swap-vulnerable-dep.sh vulnerable --service backend        # Backend only
#   ./swap-vulnerable-dep.sh vulnerable --service notification   # Notification only
#
# Vulnerable deps:
#   Backend:       lodash@4.17.20, jsonwebtoken@8.5.1
#   Notification:  log4j-core@2.14.1 (Log4Shell CVE-2021-44228)
#
# Clean deps:
#   Backend:       lodash@4.17.21, jsonwebtoken@9.0.2
#   Notification:  log4j-core@2.24.3 (fully patched)
# ────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SEED_DIR="$REPO_ROOT/demo/seed-data"
BACKEND_DIR="$REPO_ROOT/app/backend"
NOTIFICATION_DIR="$REPO_ROOT/app/notification-service"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

usage() {
  echo "Usage: $0 <vulnerable|clean> [--service <backend|notification>]"
  echo ""
  echo "Arguments:"
  echo "  vulnerable   Install dependencies with known CVEs"
  echo "  clean        Install patched dependencies"
  echo ""
  echo "Options:"
  echo "  --service    Target a single service (default: both)"
  exit 1
}

# ── Parse arguments ─────────────────────────────────
MODE="${1:-}"
SERVICE="both"

if [[ -z "$MODE" ]] || [[ "$MODE" != "vulnerable" && "$MODE" != "clean" ]]; then
  usage
fi
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)
      SERVICE="${2:-}"
      if [[ "$SERVICE" != "backend" && "$SERVICE" != "notification" ]]; then
        error "Invalid service: $SERVICE. Must be 'backend' or 'notification'."
      fi
      shift 2
      ;;
    *)
      error "Unknown option: $1"
      ;;
  esac
done

# ── Swap backend deps (npm) ─────────────────────────
swap_backend() {
  local src_file="$SEED_DIR/${MODE}-package.json"

  if [[ ! -f "$src_file" ]]; then
    error "Seed file not found: $src_file"
  fi

  info "Backend: swapping to ${MODE} package.json..."
  cp "$src_file" "$BACKEND_DIR/package.json"

  info "Backend: running npm install..."
  cd "$BACKEND_DIR"
  rm -rf node_modules package-lock.json
  npm install --silent 2>&1

  if [[ "$MODE" == "vulnerable" ]]; then
    warn "Backend now has VULNERABLE deps: lodash@4.17.20, jsonwebtoken@8.5.1"
  else
    info "Backend now has CLEAN deps: lodash@4.17.21, jsonwebtoken@9.0.2"
  fi
}

# ── Swap notification deps (Maven) ──────────────────
swap_notification() {
  local src_file="$SEED_DIR/${MODE}-pom.xml"

  if [[ ! -f "$src_file" ]]; then
    error "Seed file not found: $src_file"
  fi

  info "Notification: swapping to ${MODE} pom.xml..."
  cp "$src_file" "$NOTIFICATION_DIR/pom.xml"

  if [[ "$MODE" == "vulnerable" ]]; then
    warn "Notification service now has VULNERABLE deps: log4j-core@2.14.1 (Log4Shell CVE-2021-44228)"
  else
    info "Notification service now has CLEAN deps: log4j-core@2.24.3 (fully patched)"
  fi

  # Optionally rebuild if Maven is available
  if command -v mvn &>/dev/null; then
    info "Notification: rebuilding JAR with new dependencies..."
    cd "$NOTIFICATION_DIR"
    mvn package -DskipTests -B -q 2>&1 || warn "Maven rebuild failed."
  else
    warn "Maven not found — skipping JAR rebuild. Commit the pom.xml and let CI handle it."
  fi
}

# ── Execute ─────────────────────────────────────────
echo ""
echo "Swapping to ${MODE} dependencies (service: ${SERVICE})..."
echo ""

case "$SERVICE" in
  backend)
    swap_backend
    ;;
  notification)
    swap_notification
    ;;
  both)
    swap_backend
    echo ""
    swap_notification
    ;;
esac

echo ""
info "Done! Dependencies set to: ${MODE}"
if [[ "$MODE" == "vulnerable" ]]; then
  echo ""
  warn "Remember: commit and push to trigger CI pipeline and demonstrate policy enforcement."
else
  echo ""
  info "Clean deps in place — builds should pass all SCS policy checks."
fi
