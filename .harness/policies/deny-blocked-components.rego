# Deny Blocked Components Policy
#
# Blocks specific components by name, PURL, or version range. This is the
# policy created from the Remediation Tracker during the zero-day response
# demo — when a critical CVE drops, a security engineer creates a block
# policy to immediately prevent the vulnerable component from being deployed.
#
# Demo moment: After "discovering" a vulnerability (e.g., Log4Shell), create
# or update this policy live to block the component, then show the next build
# being rejected.
#
# Scope: Evaluates SBOM metadata via Harness SCS SBOM Policy Enforcement step.

package supplychain

import future.keywords.in
import future.keywords.if
import future.keywords.contains

# ────────────────────────────────────────────────────
# Blocked Components Registry
# ────────────────────────────────────────────────────
# Add entries here when a zero-day is discovered.
# Each entry blocks by component name. The "blocked" field
# is true if ALL versions should be blocked; otherwise
# provide specific versions in "blocked_versions".
# ────────────────────────────────────────────────────

blocked_by_name := {
  # Example: block all versions of a compromised package
  # "event-stream": {"blocked": true, "reason": "Supply chain attack — malicious code injected in v3.3.6+"},
}

blocked_by_purl := {
  # Example: block by Package URL for precise targeting
  # "pkg:npm/event-stream": {"blocked": true, "reason": "Compromised package"},
}

blocked_by_name_version := {
  # Block specific name + version combinations
  # These are typically added during a zero-day response
  "lodash": {
    "blocked_versions": ["4.17.20", "4.17.19", "4.17.18", "4.17.17", "4.17.16", "4.17.15"],
    "reason": "Blocked by Remediation Tracker — CVE-2021-23337 (command injection). Upgrade to 4.17.21+",
  },
  "log4j-core": {
    "blocked_versions": ["2.14.1", "2.14.0", "2.13.3", "2.15.0", "2.16.0", "2.17.0"],
    "reason": "Blocked by Remediation Tracker — CVE-2021-44228 (Log4Shell, CVSS 10.0). Upgrade to 2.17.1+",
  },
}

# Deny if component name is entirely blocked
deny contains msg if {
  some component in input.components
  entry := blocked_by_name[component.name]
  entry.blocked == true
  msg := sprintf(
    "BLOCKED COMPONENT: '%s@%s' is on the blocked components list. %s",
    [component.name, component.version, entry.reason]
  )
}

# Deny if component PURL is blocked
deny contains msg if {
  some component in input.components
  some purl in component.purl
  some blocked_purl, entry in blocked_by_purl
  contains(purl, blocked_purl)
  entry.blocked == true
  msg := sprintf(
    "BLOCKED COMPONENT (PURL): '%s' matches blocked PURL '%s'. %s",
    [purl, blocked_purl, entry.reason]
  )
}

# Deny if component name + version is blocked
deny contains msg if {
  some component in input.components
  entry := blocked_by_name_version[component.name]
  component.version in entry.blocked_versions
  msg := sprintf(
    "BLOCKED COMPONENT VERSION: '%s@%s' is on the blocked versions list. %s",
    [component.name, component.version, entry.reason]
  )
}
