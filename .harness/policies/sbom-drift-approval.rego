# SBOM Drift Approval Policy
#
# Requires manual approval if SBOM drift between the current and previous
# build exceeds defined thresholds. Demonstrates the drift detection
# governance workflow in Harness SCS.
#
# Thresholds:
#   - More than 5 component changes (additions + removals) → require approval
#   - ANY license change → require approval
#   - Any new GPL/AGPL/LGPL component added → deny outright
#
# Demo moment: Build with a new dependency (especially a GPL-licensed one)
# shows the drift policy triggering a review gate.
#
# Scope: Evaluates SBOM drift metadata provided by Harness SCS when comparing
# successive SBOM versions for the same artifact.

package supplychain

import future.keywords.in
import future.keywords.if
import future.keywords.contains

# ── Thresholds ──────────────────────────────────────
max_component_changes := 5

copyleft_licenses := {
  "GPL-3.0", "GPL-3.0-only", "GPL-3.0-or-later",
  "GPL-2.0", "GPL-2.0-only", "GPL-2.0-or-later",
  "AGPL-3.0", "AGPL-3.0-only", "AGPL-3.0-or-later",
  "LGPL-3.0", "LGPL-3.0-only", "LGPL-3.0-or-later",
}

# ── Deny: new copyleft component added ──────────────
deny contains msg if {
  some added in input.drift.components_added
  some license in added.licenses
  license_id := license.license.id
  license_id in copyleft_licenses
  msg := sprintf(
    "SBOM DRIFT BLOCKED: New component '%s@%s' introduces a copyleft license (%s). " +
    "Adding copyleft-licensed components requires legal review and explicit approval.",
    [added.name, added.version, license_id]
  )
}

# ── Warn: too many component changes ────────────────
warn contains msg if {
  total_changes := count(input.drift.components_added) + count(input.drift.components_removed)
  total_changes > max_component_changes
  msg := sprintf(
    "SBOM DRIFT WARNING: %d component changes detected (threshold: %d). " +
    "Added: %d, Removed: %d. Manual review recommended before deployment.",
    [total_changes, max_component_changes,
     count(input.drift.components_added),
     count(input.drift.components_removed)]
  )
}

# ── Warn: any license change detected ───────────────
warn contains msg if {
  count(input.drift.license_changes) > 0
  msg := sprintf(
    "SBOM DRIFT WARNING: %d license change(s) detected between SBOM versions. " +
    "License changes require review to ensure compliance with organizational policy.",
    [count(input.drift.license_changes)]
  )
}

# ── Warn: component version downgrades ──────────────
warn contains msg if {
  some change in input.drift.version_changes
  change.direction == "downgrade"
  msg := sprintf(
    "SBOM DRIFT WARNING: Component '%s' was downgraded from %s to %s. " +
    "Version downgrades may reintroduce known vulnerabilities.",
    [change.name, change.previous_version, change.current_version]
  )
}
