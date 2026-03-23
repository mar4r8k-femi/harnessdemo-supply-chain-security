#!/usr/bin/env bash
# ────────────────────────────────────────────────────────
# verify-attestation.sh — Cosign attestation verification
# ────────────────────────────────────────────────────────
# Verifies SLSA provenance and SBOM attestations for a
# container image using Cosign. Demonstrates the
# verification side of Harness SCS artifact integrity.
#
# Usage:
#   ./verify-attestation.sh <image:tag>
#   ./verify-attestation.sh supplywatch/backend:42
#   ./verify-attestation.sh --key /path/to/cosign.pub supplywatch/backend:42
#
# Requires:
#   - cosign CLI installed (https://docs.sigstore.dev/cosign/installation/)
#   - cosign.pub public key (or specify with --key)
# ────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}[PASS]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }
header(){ echo -e "${CYAN}── $* ──${NC}"; }

usage() {
  echo "Usage: $0 [--key <path-to-cosign.pub>] <image:tag>"
  echo ""
  echo "Options:"
  echo "  --key    Path to Cosign public key (default: ./cosign/cosign.pub or cosign.pub)"
  echo ""
  echo "Examples:"
  echo "  $0 supplywatch/backend:42"
  echo "  $0 --key /path/to/cosign.pub docker.io/supplywatch/backend:latest"
  exit 1
}

# ── Parse arguments ─────────────────────────────────
PUBLIC_KEY=""
IMAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --key) PUBLIC_KEY="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) IMAGE="$1"; shift ;;
  esac
done

[[ -z "$IMAGE" ]] && usage

# ── Find public key ─────────────────────────────────
if [[ -z "$PUBLIC_KEY" ]]; then
  if [[ -f "$REPO_ROOT/cosign/cosign.pub" ]]; then
    PUBLIC_KEY="$REPO_ROOT/cosign/cosign.pub"
  elif [[ -f "$REPO_ROOT/cosign.pub" ]]; then
    PUBLIC_KEY="$REPO_ROOT/cosign.pub"
  elif [[ -f "cosign.pub" ]]; then
    PUBLIC_KEY="cosign.pub"
  else
    echo "Error: cosign.pub not found. Specify with --key or place in cosign/ directory."
    exit 1
  fi
fi

# ── Check cosign is installed ───────────────────────
if ! command -v cosign &>/dev/null; then
  echo "Error: cosign CLI not found. Install it:"
  echo "  brew install cosign"
  echo "  or: go install github.com/sigstore/cosign/v2/cmd/cosign@latest"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Cosign Attestation Verification            ║"
echo "║   Harness SCS — Artifact Integrity Check     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Image:      $IMAGE"
echo "Public Key: $PUBLIC_KEY"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# ── 1. Verify image signature (.sig) ────────────────
header "1. Image Signature Verification (.sig)"
if cosign verify --key "$PUBLIC_KEY" "$IMAGE" 2>/dev/null; then
  info "Image signature is VALID"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  fail "Image signature verification FAILED or no signature found"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# ── 2. Verify SBOM attestation (CycloneDX) ──────────
header "2. SBOM Attestation Verification (CycloneDX)"
if cosign verify-attestation --key "$PUBLIC_KEY" --type cyclonedx "$IMAGE" 2>/dev/null; then
  info "CycloneDX SBOM attestation is VALID"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  # Try SPDX if CycloneDX fails (frontend uses SPDX)
  if cosign verify-attestation --key "$PUBLIC_KEY" --type spdxjson "$IMAGE" 2>/dev/null; then
    info "SPDX SBOM attestation is VALID"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    fail "SBOM attestation verification FAILED or no SBOM attestation found"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
fi
echo ""

# ── 3. Verify SLSA provenance attestation ───────────
header "3. SLSA Provenance Attestation Verification"
if cosign verify-attestation --key "$PUBLIC_KEY" --type slsaprovenance "$IMAGE" 2>/dev/null; then
  info "SLSA provenance attestation is VALID"
  PASS_COUNT=$((PASS_COUNT + 1))

  # Extract and display provenance metadata
  echo ""
  header "   SLSA Provenance Metadata"
  PROVENANCE=$(cosign verify-attestation --key "$PUBLIC_KEY" --type slsaprovenance "$IMAGE" 2>/dev/null | head -1)
  if [[ -n "$PROVENANCE" ]]; then
    echo "$PROVENANCE" | python3 -m json.tool 2>/dev/null | head -30 || echo "  (raw JSON available — install python3 for formatted output)"
  fi
else
  fail "SLSA provenance verification FAILED or no provenance attestation found"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# ── 4. List all attestations on the image ───────────
header "4. All Attestations on Image"
if cosign tree "$IMAGE" 2>/dev/null; then
  info "Attestation tree retrieved"
else
  warn "Could not retrieve attestation tree (cosign tree may not be supported in this version)"
fi
echo ""

# ── Summary ─────────────────────────────────────────
echo "╔══════════════════════════════════════════════╗"
if [[ "$FAIL_COUNT" -eq 0 ]]; then
  echo -e "║   ${GREEN}All $PASS_COUNT verification(s) PASSED${NC}               ║"
else
  echo -e "║   ${GREEN}$PASS_COUNT PASSED${NC}  /  ${RED}$FAIL_COUNT FAILED${NC}                    ║"
fi
echo "╚══════════════════════════════════════════════╝"
echo ""

exit "$FAIL_COUNT"
