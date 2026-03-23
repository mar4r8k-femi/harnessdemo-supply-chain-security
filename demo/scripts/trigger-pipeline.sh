#!/usr/bin/env bash
# ────────────────────────────────────────────────────────
# trigger-pipeline.sh — Trigger Harness pipeline via API
# ────────────────────────────────────────────────────────
# Triggers a Harness CI or CD pipeline execution using
# the Harness API.
#
# Usage:
#   ./trigger-pipeline.sh --pipeline ci-build --branch main
#   ./trigger-pipeline.sh --pipeline cd-deploy --branch main --tag 42
#
# Required environment variables:
#   HARNESS_API_KEY      — Harness API key (x-api-key)
#   HARNESS_ACCOUNT_ID   — Harness account identifier
#   HARNESS_ORG          — Harness organization identifier
#   HARNESS_PROJECT      — Harness project identifier
#
# Optional:
#   HARNESS_BASE_URL     — API base URL (default: https://app.harness.io)
# ────────────────────────────────────────────────────────
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

usage() {
  echo "Usage: $0 --pipeline <ci-build|cd-deploy> --branch <branch> [--tag <image-tag>]"
  echo ""
  echo "Options:"
  echo "  --pipeline   Pipeline to trigger: ci-build or cd-deploy"
  echo "  --branch     Git branch to build from"
  echo "  --tag        Image tag for CD pipeline (defaults to 'latest')"
  echo ""
  echo "Required env vars: HARNESS_API_KEY, HARNESS_ACCOUNT_ID, HARNESS_ORG, HARNESS_PROJECT"
  exit 1
}

# ── Parse arguments ─────────────────────────────────
PIPELINE=""
BRANCH=""
IMAGE_TAG="latest"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pipeline) PIPELINE="$2"; shift 2 ;;
    --branch)   BRANCH="$2";   shift 2 ;;
    --tag)      IMAGE_TAG="$2"; shift 2 ;;
    *)          error "Unknown option: $1" ;;
  esac
done

[[ -z "$PIPELINE" ]] && usage
[[ -z "$BRANCH" ]]   && usage

# ── Validate env vars ───────────────────────────────
[[ -z "${HARNESS_API_KEY:-}" ]]    && error "HARNESS_API_KEY is not set. Export it before running this script."
[[ -z "${HARNESS_ACCOUNT_ID:-}" ]] && error "HARNESS_ACCOUNT_ID is not set."
[[ -z "${HARNESS_ORG:-}" ]]        && error "HARNESS_ORG is not set."
[[ -z "${HARNESS_PROJECT:-}" ]]    && error "HARNESS_PROJECT is not set."

BASE_URL="${HARNESS_BASE_URL:-https://app.harness.io}"

# ── Map pipeline name to identifier ─────────────────
case "$PIPELINE" in
  ci-build)   PIPELINE_ID="scs_demo_ci_build" ;;
  cd-deploy)  PIPELINE_ID="scs_demo_cd_deploy" ;;
  *)          error "Unknown pipeline: $PIPELINE. Use 'ci-build' or 'cd-deploy'." ;;
esac

# ── Build request payload ───────────────────────────
if [[ "$PIPELINE" == "ci-build" ]]; then
  PAYLOAD=$(cat <<EOF
{
  "inputSetReferences": [],
  "stageIdentifiers": [],
  "pipelineIdentifier": "${PIPELINE_ID}",
  "moduleType": "CI",
  "runtimeInputYaml": "pipeline:\n  properties:\n    ci:\n      codebase:\n        build:\n          type: branch\n          spec:\n            branch: ${BRANCH}\n"
}
EOF
)
else
  PAYLOAD=$(cat <<EOF
{
  "inputSetReferences": [],
  "stageIdentifiers": [],
  "pipelineIdentifier": "${PIPELINE_ID}",
  "moduleType": "CD",
  "runtimeInputYaml": "pipeline:\n  variables:\n    - name: image_tag\n      type: String\n      value: ${IMAGE_TAG}\n"
}
EOF
)
fi

# ── Trigger pipeline ────────────────────────────────
API_URL="${BASE_URL}/pipeline/api/pipeline/execute/${PIPELINE_ID}"
API_URL="${API_URL}?accountIdentifier=${HARNESS_ACCOUNT_ID}"
API_URL="${API_URL}&orgIdentifier=${HARNESS_ORG}"
API_URL="${API_URL}&projectIdentifier=${HARNESS_PROJECT}"

info "Triggering pipeline: ${PIPELINE} (${PIPELINE_ID})"
info "Branch: ${BRANCH}"
[[ "$PIPELINE" == "cd-deploy" ]] && info "Image tag: ${IMAGE_TAG}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
  PLAN_EXEC_ID=$(echo "$BODY" | grep -o '"planExecution":{[^}]*"uuid":"[^"]*"' | grep -o '"uuid":"[^"]*"' | head -1 | cut -d'"' -f4)
  info "Pipeline triggered successfully! (HTTP ${HTTP_CODE})"
  if [[ -n "$PLAN_EXEC_ID" ]]; then
    EXEC_URL="${BASE_URL}/ng/account/${HARNESS_ACCOUNT_ID}/ci/orgs/${HARNESS_ORG}/projects/${HARNESS_PROJECT}/pipelines/${PIPELINE_ID}/executions/${PLAN_EXEC_ID}/pipeline"
    info "Execution URL: ${EXEC_URL}"
  fi
else
  error "Pipeline trigger failed (HTTP ${HTTP_CODE}):\n${BODY}"
fi
