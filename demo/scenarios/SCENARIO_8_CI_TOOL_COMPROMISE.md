# Scenario 8: CI/CD Toolchain Compromise — tj-actions/changed-files (CVE-2025-30066)

**Maps to:** Demo Skeleton Part 2, Section 2 (RSPM) & Part 1, Section 1 (Problem Framing)
**Duration:** 10--15 minutes
**Audience:** Security Engineers, DevSecOps Architects, Platform Engineers, CISOs

---

## Overview

This scenario demonstrates how Harness SCS detects and responds to a **CI/CD toolchain compromise** — an attack that targets the build pipeline itself rather than application dependencies. You will walk through how RSPM identifies the compromised `tj-actions/changed-files` GitHub Action in this repository's workflow, and how OPA policies can block builds that reference it.

This is a fundamentally different attack vector from Log4Shell or lodash (Scenarios 2 & 4). Those are vulnerable *libraries* in application code. This is a compromised *CI/CD tool* — the pipeline itself is the attack surface.

> **Presenter Tip:** The tj-actions incident (March 2025) affected over 23,000 repositories and resulted in widespread credential theft. It is one of the most impactful CI/CD supply chain attacks to date. Pair it with the SolarWinds and Codecov references from the demo skeleton opening hook to show that this class of attack is real and recurring.

---

## The Attack: What Happened

In March 2025, an attacker compromised the `tj-actions/changed-files` GitHub Action (one of the most popular Actions on the marketplace) by:

1. Gaining access to the repository maintainer's account
2. **Rewriting the `v35` Git tag** to point to a malicious commit
3. The malicious code injected into the action dumped **all CI/CD secrets** (tokens, API keys, passwords) from the runner environment into workflow logs
4. Any repository using `tj-actions/changed-files@v35` (a mutable tag) automatically pulled the compromised version on the next workflow run
5. Attackers could then harvest secrets from publicly readable workflow logs

**Key insight:** The attack exploited a fundamental weakness in GitHub Actions — **mutable tags**. A tag like `v35` can be moved to point to any commit at any time. Pinning to an immutable commit SHA eliminates this attack vector entirely.

---

## Prerequisites

Before you begin, confirm the following:

- [ ] The SupplyWatch demo repository has the `.github/workflows/ci.yml` file with the compromised `tj-actions/changed-files@v35` reference
- [ ] The `.github/workflows/ci-secure.yml` file is available as the remediated version
- [ ] Harness SCS module with RSPM is enabled and connected to this GitHub repository
- [ ] At least one RSPM scan has completed against the connected repo
- [ ] OPA policies are loaded: `.harness/policies/deny-blocked-components.rego` and `.harness/policies/deny-vulnerable-versions.rego`

---

## Step 1: Scene Setting

> **Talk Track:** "We've seen how Harness SCS protects against vulnerable application dependencies like Log4Shell. But there's an entirely different attack vector — what if the CI/CD pipeline itself is compromised? In March 2025, that's exactly what happened. An attacker took over one of the most popular GitHub Actions — `tj-actions/changed-files`, used by over 23,000 repos — and rewrote its version tag to inject code that stole every secret in the CI environment. Let me show you how Harness detects and blocks this."

---

## Step 2: Show the Vulnerable Workflow

Open the file `.github/workflows/ci.yml` in the repository and highlight the compromised line:

```yaml
- name: Detect changed files
  id: changes
  uses: tj-actions/changed-files@v35  # VULNERABLE — CVE-2025-30066
```

> **Talk Track:** "This looks like a perfectly normal GitHub Actions workflow. But that `@v35` tag? An attacker rewrote it. Every time this workflow runs, it executes the attacker's code instead of the real action. The malicious code dumps every environment variable — including `GITHUB_TOKEN`, AWS keys, Docker registry credentials — into the workflow log."

---

## Step 3: RSPM Detection

Navigate to the **RSPM** section in Harness SCS.

1. Show the RSPM scan results for this repository
2. Highlight the finding: **Compromised CI/CD action detected** — `tj-actions/changed-files@v35` (CVE-2025-30066)
3. Show the finding maps to **OWASP CI/CD-SEC-3: Dependency Chain Abuse** and **CIS Software Supply Chain Benchmark** controls for CI tool integrity
4. Show the severity: **Critical** — credential theft enables lateral movement across the entire organization
5. Show the recommended remediation: pin to immutable commit SHA

> **Talk Track:** "RSPM doesn't just scan your code dependencies — it scans your CI/CD toolchain. It detected that this workflow uses a known-compromised GitHub Action and flagged it as a critical finding. This is the 'Secure the Toolchain' pillar of Harness SCS in action."

---

## Step 4: Show the Blast Radius

> **Talk Track:** "What secrets were at risk? Let's look at the blast radius."

Discuss what an attacker gains from this workflow:

| Secret at Risk | How It's Exposed | Impact |
|---|---|---|
| `GITHUB_TOKEN` | Auto-injected into every workflow run | Repository write access, PR manipulation, code injection |
| Docker registry credentials | Used in build-and-push steps | Push malicious images to your registry |
| Cloud provider keys (AWS/GCP/Azure) | Stored as repository or org secrets | Full infrastructure access |
| Harness API key | Used by `trigger-pipeline.sh` | Trigger arbitrary pipeline executions |
| Cosign private key passphrase | Used for artifact signing | Forge SLSA attestations |

> **Talk Track:** "This is why CI/CD toolchain attacks are so dangerous. A single compromised action in your workflow gives the attacker access to every secret in your CI environment. From there, they can push malicious images, forge attestations, deploy compromised code — the blast radius is the entire software delivery pipeline."

---

## Step 5: OPA Policy Enforcement

Show that the OPA policy `deny-blocked-components.rego` now includes a `blocked_cicd_actions` section that blocks `tj-actions/changed-files@v35`.

1. Open the policy in the Harness Policy Management UI
2. Show the `blocked_cicd_actions` entry with the CVE reference and remediation guidance
3. If the action appears in SBOM/scan data, show that the build would be blocked with the message: `COMPROMISED CI/CD ACTION: 'tj-actions/changed-files@v35' is a known-compromised action tag.`

> **Talk Track:** "The security team has added this compromised action to our OPA block policy. Any pipeline that references it — whether in SBOM metadata or scan results — will be blocked automatically. This is the same policy enforcement mechanism we used for Log4Shell, now applied to CI/CD toolchain components."

---

## Step 6: Remediation — Pin to SHA

Show the secure version of the workflow (`.github/workflows/ci-secure.yml`):

```yaml
# SECURE: Pinned to immutable commit SHA (v44.5.1)
- name: Detect changed files
  id: changes
  uses: tj-actions/changed-files@6b2903bdce6310cfbddd87c418f253cf29b2dec9  # v44.5.1
```

Compare side-by-side with the vulnerable version:

| Aspect | Vulnerable (`ci.yml`) | Secure (`ci-secure.yml`) |
|---|---|---|
| Action reference | `@v35` (mutable tag) | `@6b2903bd...` (immutable SHA) |
| Can attacker rewrite? | Yes — tags can be force-pushed | No — SHA is a cryptographic hash |
| Version clarity | Comment needed | Comment documents version |
| All actions pinned? | No — uses `@v4` for checkout, setup-node | Yes — every action pinned to SHA |

> **Talk Track:** "The fix is simple but critical: replace mutable tags with immutable commit SHAs. A SHA is a cryptographic hash of the exact code you're running — an attacker cannot change it without detection. Notice we've pinned *every* action, not just the compromised one. This is defense in depth."

---

## Step 7: Create Remediation Tracker Entry

1. From the RSPM finding, create a **Remediation Tracker** entry for CVE-2025-30066
2. Assign an owner and set a Critical SLA (24 hours)
3. Show the recommended remediation steps:
   - Replace `tj-actions/changed-files@v35` with SHA-pinned reference
   - Audit all other GitHub Actions in the repository for mutable tag references
   - Rotate all secrets that were potentially exposed
   - Review workflow logs for signs of exfiltration
4. Create a Jira ticket from the tracker

> **Talk Track:** "Remediation isn't just about fixing the workflow file. You need to assume secrets were already exfiltrated and rotate them. The Remediation Tracker captures all of this — the finding, the owner, the SLA, and the full remediation checklist — in one place."

---

## Step 8: Tie It All Together

> **Talk Track:** "Let's step back and see what Harness SCS just did for us:
>
> 1. **RSPM detected** that our CI workflow uses a compromised GitHub Action — something no SCA or SAST tool would catch, because this isn't a code dependency.
> 2. **OPA policy blocked** any build that references the compromised action, preventing further damage.
> 3. **Remediation Tracker** gave us a single pane of glass to manage the response — owner, SLA, Jira ticket, resolution timeline.
> 4. We have a clear remediation path: pin to SHA, rotate secrets, audit all actions.
>
> This is the 'Secure the Toolchain' pillar in action. Most supply chain tools only look at your code. Harness SCS looks at your entire delivery pipeline."

---

## Key Differentiators to Highlight

| Capability | Harness SCS | Typical Competitor |
|---|---|---|
| CI/CD toolchain scanning (RSPM) | Detects compromised actions, insecure configs | Not available — focused on code dependencies only |
| GitHub Actions compromise detection | Flags known-compromised action tags/versions | No equivalent |
| OPA policy for CI/CD components | Block compromised actions in build pipeline | Not available |
| Remediation Tracker for toolchain issues | Full lifecycle: detect, assign, track, prove | Manual investigation |
| CIS/OWASP CI/CD risk mapping | Each finding maps to framework controls | Rarely available |

---

## Anticipated Questions

- *"Does RSPM scan GitHub Actions automatically?"* — Yes, RSPM analyzes workflow files in connected repositories and checks action references against known-compromised versions and best practices (SHA pinning, permission scoping).

- *"What about other CI tools like Jenkins plugins?"* — RSPM also scans Jenkins configurations, GitLab CI, and other connected CI tools for misconfigurations and known vulnerabilities.

- *"How quickly was the tj-actions compromise detected?"* — The community detected it within hours, and GitHub revoked the compromised tags. But repositories that had already run the compromised workflow had their secrets exfiltrated. Harness RSPM provides proactive detection before the workflow runs.

- *"Should we pin every action to SHA?"* — Yes, this is the security best practice recommended by GitHub, SLSA, and NIST SSDF. The tradeoff is that you lose automatic minor/patch updates, but the security benefit far outweighs the maintenance cost.
