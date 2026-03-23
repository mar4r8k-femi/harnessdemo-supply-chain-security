# Require SLSA Attestation Policy
#
# Blocks deployment unless the artifact has a valid SLSA provenance attestation.
# Used as the CD-stage promotion gate — ensures no artifact reaches staging or
# production without a signed provenance record proving build integrity.
#
# SLSA Levels:
#   L1 — Provenance document exists
#   L2 — Provenance is signed by the build system
#   L3 — Build is tamper-proof, infrastructure is isolated (Harness Cloud)
#
# Scope: Evaluated in CD pipeline Containerized Step Groups against artifact
# attestation metadata provided by Harness SCS.

package supplychain

import future.keywords.if
import future.keywords.contains

# Deny if SLSA provenance attestation is missing
deny contains msg if {
  not input.attestation
  msg := "SLSA provenance attestation is MISSING. All artifacts must have a valid SLSA provenance attestation before deployment. Ensure the CI pipeline includes a SLSA Generation step after Build & Push."
}

# Deny if SLSA provenance attestation is not signed
deny contains msg if {
  input.attestation
  not input.attestation.signed
  msg := "SLSA provenance attestation exists but is NOT SIGNED. Attestation must be signed with Cosign to meet SLSA Level 2+ requirements. Verify Cosign key configuration in the CI pipeline."
}

# Deny if SLSA provenance is missing required fields
deny contains msg if {
  input.attestation
  input.attestation.signed
  not input.attestation.provenance
  msg := "SLSA provenance attestation is signed but provenance payload is EMPTY. The provenance must include: repository, branch, commit SHA, builder ID, and trigger metadata."
}

# Deny if builder ID is missing (required for L3 verification)
deny contains msg if {
  input.attestation
  input.attestation.provenance
  not input.attestation.provenance.builder
  msg := "SLSA provenance is missing builder ID. Builder identification is required for SLSA Level 3 compliance. Ensure builds run on Harness Cloud hosted infrastructure."
}

# Warn if SLSA level is below 3 (advisory — does not block)
warn contains msg if {
  input.attestation
  input.attestation.provenance
  input.attestation.provenance.slsa_level
  input.attestation.provenance.slsa_level < 3
  msg := sprintf(
    "SLSA provenance level is %d (Level 3 recommended). Level 3 requires Harness Cloud hosted builds with ephemeral VMs and infrastructure isolation.",
    [input.attestation.provenance.slsa_level]
  )
}
