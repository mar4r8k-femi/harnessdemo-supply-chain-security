# Deny GPL Licenses Policy
#
# Blocks any artifact whose SBOM contains components with copyleft licenses
# (GPL-3.0, AGPL-3.0, LGPL-3.0). Used to demonstrate license compliance
# enforcement in Harness SCS.
#
# Demo moment: Frontend build with `demo-gpl-component` (local GPL-3.0 stub
# package) triggers this policy.
#
# Scope: Evaluates SBOM metadata (component license field) via Harness SCS
# SBOM Policy Enforcement step.

package supplychain

import future.keywords.in
import future.keywords.if
import future.keywords.contains

# Copyleft license identifiers to block
blocked_licenses := {
  "GPL-3.0",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
  "GPL-2.0",
  "GPL-2.0-only",
  "GPL-2.0-or-later",
  "AGPL-3.0",
  "AGPL-3.0-only",
  "AGPL-3.0-or-later",
  "LGPL-3.0",
  "LGPL-3.0-only",
  "LGPL-3.0-or-later",
}

# Deny if any component has a blocked license
deny contains msg if {
  some component in input.components
  some license in component.licenses
  license_id := license.license.id
  license_id in blocked_licenses
  msg := sprintf(
    "Component '%s' (version %s) has blocked copyleft license: %s. " +
    "Copyleft licenses (GPL, AGPL, LGPL) are not permitted. " +
    "Remove the dependency or obtain a commercial license exception.",
    [component.name, component.version, license_id]
  )
}

# Also check license name field (some SBOMs use name instead of id)
deny contains msg if {
  some component in input.components
  some license in component.licenses
  license_name := license.license.name
  some blocked in blocked_licenses
  contains(upper(license_name), upper(blocked))
  msg := sprintf(
    "Component '%s' (version %s) has blocked copyleft license: %s. " +
    "Copyleft licenses (GPL, AGPL, LGPL) are not permitted.",
    [component.name, component.version, license_name]
  )
}
