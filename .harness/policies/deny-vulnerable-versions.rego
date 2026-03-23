# Deny Known-Vulnerable Component Versions Policy
#
# Blocks artifacts whose SBOM contains components at known-vulnerable versions
# (by name + version match). This operates on SBOM metadata — not CVE scan data.
#
# Blocked components:
#   - lodash < 4.17.21  (CVE-2021-23337 cmd injection, CVE-2020-8203 prototype pollution)
#   - jsonwebtoken < 9.0.0  (multiple known vulnerabilities)
#   - log4j-core < 2.17.1  (CVE-2021-44228 Log4Shell CVSS 10.0)
#
# Demo moment: Backend build with lodash@4.17.20 or notification service build
# with log4j-core@2.14.1 triggers this policy.
#
# Scope: Evaluates SBOM metadata via Harness SCS SBOM Policy Enforcement step.
# For CVE-severity-based blocking, use Harness STO OPA policies instead.

package supplychain

import future.keywords.in
import future.keywords.if
import future.keywords.contains

# Vulnerable component deny list: name → {max_vulnerable_version, reason}
# Any version less than or equal to max_vulnerable_version is blocked.
vulnerable_components := {
  "lodash": {
    "blocked_versions": ["4.17.20", "4.17.19", "4.17.18", "4.17.17", "4.17.16", "4.17.15"],
    "reason": "CVE-2021-23337 (command injection), CVE-2020-8203 (prototype pollution), CVE-2020-28500 (ReDoS). Upgrade to 4.17.21+",
  },
  "jsonwebtoken": {
    "blocked_versions": ["8.5.1", "8.5.0", "8.4.0", "8.3.0", "8.2.0", "8.1.0", "8.0.0"],
    "reason": "Multiple known vulnerabilities in versions < 9.0.0. Upgrade to 9.0.0+",
  },
  "log4j-core": {
    "blocked_versions": ["2.14.1", "2.14.0", "2.13.3", "2.13.2", "2.13.1", "2.13.0",
                         "2.12.1", "2.12.0", "2.11.2", "2.11.1", "2.11.0",
                         "2.10.0", "2.9.1", "2.9.0", "2.8.2", "2.8.1", "2.8",
                         "2.7", "2.6.2", "2.6.1", "2.6", "2.5", "2.4.1", "2.4",
                         "2.3", "2.2", "2.1", "2.0", "2.15.0", "2.16.0", "2.17.0"],
    "reason": "CVE-2021-44228 (Log4Shell, CVSS 10.0) — Remote Code Execution via JNDI lookup. Upgrade to 2.17.1+",
  },
  "log4j-api": {
    "blocked_versions": ["2.14.1", "2.14.0", "2.13.3", "2.13.2", "2.13.1", "2.13.0",
                         "2.12.1", "2.12.0", "2.11.2", "2.11.1", "2.11.0",
                         "2.10.0", "2.9.1", "2.9.0", "2.15.0", "2.16.0", "2.17.0"],
    "reason": "Paired with vulnerable log4j-core. Upgrade to 2.17.1+",
  },
}

# Deny if a component name + version appears in the blocked list
deny contains msg if {
  some component in input.components
  entry := vulnerable_components[component.name]
  component.version in entry.blocked_versions
  msg := sprintf(
    "BLOCKED: Component '%s@%s' is a known-vulnerable version. %s",
    [component.name, component.version, entry.reason]
  )
}

# Also match on PURL for more precise identification
deny contains msg if {
  some component in input.components
  some purl in component.purl
  some name, entry in vulnerable_components
  contains(purl, name)
  component.version in entry.blocked_versions
  msg := sprintf(
    "BLOCKED (PURL match): Component '%s@%s' identified via PURL '%s' is a known-vulnerable version. %s",
    [name, component.version, purl, entry.reason]
  )
}
