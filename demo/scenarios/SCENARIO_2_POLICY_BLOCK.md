# Scenario 2: OPA Policy Enforcement

**Maps to:** Demo Skeleton Part 2, Section 4
**Duration:** ~5 minutes
**Audience:** Security Engineers, DevSecOps Architects, Platform Engineers, Compliance Officers

---

## Prerequisites

Before starting this scenario, ensure the following are in place:

- [ ] Scenario 1 (SBOM Generation) has been completed, or the audience understands that SBOMs are generated on every build
- [ ] The `deny-vulnerable-versions.rego` policy is active in Harness Policy Management
- [ ] All five `.rego` policy files are deployed to the Harness project (see Policy Files section below)
- [ ] The `main` branch currently has **clean** dependencies (run `./demo/scripts/swap-vulnerable-dep.sh clean` before starting)
- [ ] Demo environment is set up (run `./demo/scripts/setup-demo-env.sh` if starting fresh)
- [ ] Terminal is open and positioned at the repository root for running scripts

---

## Policy Files

The demo includes five OPA (Rego) policy files under `.harness/policies/`. Each demonstrates a different enforcement pattern:

| Policy File | Purpose | Enforcement Behavior |
|-------------|---------|---------------------|
| `deny-vulnerable-versions.rego` | Blocks artifacts containing components at known-vulnerable versions (by name + version match). Targets lodash < 4.17.21, jsonwebtoken < 9.0.0, log4j-core < 2.17.1. | **Deny** -- pipeline fails |
| `deny-gpl-licenses.rego` | Blocks artifacts containing components with copyleft licenses (GPL-2.0, GPL-3.0, AGPL-3.0, LGPL-3.0 and variants). | **Deny** -- pipeline fails |
| `deny-blocked-components.rego` | Blocks specific components by name, PURL, or version. Designed to be updated live during a zero-day response (from the Remediation Tracker). | **Deny** -- pipeline fails |
| `require-slsa-attestation.rego` | Blocks deployment unless the artifact has a valid, signed SLSA provenance attestation with required metadata fields. Used as the CD-stage promotion gate. | **Deny** -- deployment blocked |
| `sbom-drift-approval.rego` | Requires manual approval if SBOM drift exceeds thresholds: more than 5 component changes, any license change, or any new copyleft component. | **Warn** (with deny for copyleft additions) |

> **Presenter Tip:** Have the Harness Policy Management UI open in a browser tab before starting. Showing the policy list gives the audience confidence that this is a governed, auditable system -- not ad-hoc scripting.

---

## Key Differentiators to Highlight

- **OPA-based, not proprietary:** Policies are written in Rego, the industry-standard policy language. Customers can bring existing OPA expertise and policies.
- **CI AND CD enforcement:** The same policy engine evaluates at build time (SBOM Policy Enforcement step in CI) and at deploy time (promotion gate in CD). Most competitors only enforce in one stage.
- **SBOM-aware policies:** Policies evaluate structured SBOM metadata -- component names, versions, PURLs, licenses -- not raw scan output. This enables precise, low-false-positive rules.
- **Full audit trail:** Every policy evaluation is logged with the policy version, input data, and decision. Exportable for SOC2, FedRAMP, and ISO 27001 audits.
- **Live policy updates:** A new policy takes effect on the next pipeline run. No agent restart, no redeployment. This is critical during zero-day response.

---

## Step-by-Step Walkthrough

### Step 1: Verify the `deny-vulnerable-versions.rego` Policy Is Active

1. Open Harness UI and navigate to **Project Settings > Policies**
2. Confirm that `deny-vulnerable-versions.rego` is listed and has **Enforcement Mode: Deny**
3. Open the policy and briefly walk through the structure:
   - The `vulnerable_components` map defines blocked component names and versions
   - The `deny` rules match against `input.components` -- this is the SBOM data provided by Harness SCS
   - Both name-based and PURL-based matching are supported for defense in depth

**Talk Track:**
"This policy is written in Rego -- the same language used by Open Policy Agent across the industry. It defines a deny list of component names and versions. When the SBOM is generated, Harness evaluates every component against this policy. If there is a match, the pipeline stops."

---

### Step 2: Introduce the Vulnerable Dependency

Run the swap script to introduce known-vulnerable dependencies:

```bash
./demo/scripts/swap-vulnerable-dep.sh vulnerable
```

This script replaces:

- **Backend:** `lodash@4.17.21` (clean) with `lodash@4.17.20` (CVE-2021-23337, CVE-2020-8203) and `jsonwebtoken@9.0.2` with `jsonwebtoken@8.5.1`
- **Notification service:** `log4j-core@2.24.3` (clean) with `log4j-core@2.14.1` (CVE-2021-44228 -- Log4Shell, CVSS 10.0)

> **Presenter Tip:** Show the terminal output from the swap script. The yellow warning messages listing the vulnerable versions create a visual anchor. Then commit and push so the CI pipeline triggers.

**Talk Track:**
"I am simulating what happens when a developer -- intentionally or accidentally -- introduces a dependency with a known vulnerability. In this case, we are downgrading lodash to a version with a command injection flaw and introducing Log4j 2.14.1, which is the exact version exploited in the Log4Shell attack."

---

### Step 3: Trigger the CI Build and Show It Blocked

Trigger the CI pipeline:

```bash
./demo/scripts/trigger-pipeline.sh --pipeline ci-build --branch main
```

Or commit and push the changes to `main` to trigger the pipeline automatically.

Wait for the pipeline to reach the **SBOM Policy Enforcement** step. It will:

1. Generate the SBOM (SBOM Orchestration step -- passes)
2. Evaluate the SBOM against active policies (SBOM Policy Enforcement step -- **FAILS**)
3. The pipeline execution turns red and stops

> **Presenter Tip:** This is the highest-impact moment in the policy demo. Let the pipeline fail visibly. Do not rush past it. Let the red status sit on screen for a moment before clicking into the details.

**Talk Track:**
"The build just failed -- not because of a compilation error or a test failure, but because the SBOM generated from this image contains a component that violates our security policy. The vulnerable version of lodash was detected, and the pipeline was stopped before the image could be pushed to production. This is shift-left enforcement on actual supply chain metadata."

---

### Step 4: Show Violation Details in the Supply Chain Tab

1. Click on the failed pipeline execution
2. Navigate to the **Supply Chain** tab
3. Open the **Policy Violations** panel

The violation details will show:

```
BLOCKED: Component 'lodash@4.17.20' is a known-vulnerable version.
CVE-2021-23337 (command injection), CVE-2020-8203 (prototype pollution),
CVE-2020-28500 (ReDoS). Upgrade to 4.17.21+
```

Walk through the violation message:

- **Component name and version** -- exactly what was blocked
- **CVE references** -- why it was blocked
- **Remediation guidance** -- what to upgrade to
- **Policy name** -- which policy triggered the block

> **Presenter Tip:** If time allows, also show that `log4j-core@2.14.1` triggered the same policy in the notification service build. Having two violations across two ecosystems (npm and Maven) reinforces the cross-language story.

**Talk Track:**
"The violation message is not a generic 'policy failed.' It tells the developer exactly which component, which version, which CVEs, and what to upgrade to. This is actionable feedback, not a wall of scan noise."

---

### Step 5: Restore Clean Dependencies

Run the swap script to restore clean dependencies:

```bash
./demo/scripts/swap-vulnerable-dep.sh clean
```

This restores:

- **Backend:** `lodash@4.17.21`, `jsonwebtoken@9.0.2`
- **Notification service:** `log4j-core@2.24.3`

Commit and push the changes.

**Talk Track:**
"The developer gets the violation feedback, upgrades the dependency, and pushes again. Let us see what happens now."

---

### Step 6: Trigger the CI Build Again and Show It Passes

Trigger the pipeline again:

```bash
./demo/scripts/trigger-pipeline.sh --pipeline ci-build --branch main
```

This time:

1. SBOM Orchestration step -- passes
2. SBOM Policy Enforcement step -- **PASSES** (no violations)
3. The pipeline completes successfully (green status)

> **Presenter Tip:** Click into the Supply Chain tab on the passing build and show that the policy evaluation ran but found zero violations. This proves the policy is active on every build, not just when it fails.

**Talk Track:**
"Same policy, same pipeline -- but now the dependencies are clean. The build passes. This is the feedback loop: introduce a vulnerable component, get blocked with actionable guidance, fix it, and move on. No tickets, no waiting for a security review -- the guardrail is automated."

---

### Step 7: Show CD Deploy-Time Enforcement (Second Gate)

Navigate to the CD pipeline configuration (`.harness/pipelines/cd-deploy.yaml`) and show:

1. The **SBOM Policy Enforcement** step is also present in the Deploy stage, before the actual deployment step
2. This is the second gate -- even if an artifact was built before a policy existed, it will be evaluated again at deploy time
3. Show the `require-slsa-attestation.rego` policy in the CD stage -- this blocks deployment unless SLSA provenance is present

**Talk Track:**
"CI enforcement catches problems at build time. But what about artifacts that were built last week, before this policy existed? That is why Harness enforces at deploy time too. An artifact that passed CI last Tuesday can still be blocked from deploying to production today if a new policy or a new CVE makes it non-compliant. This dual-gate model is a key differentiator -- most tools only enforce at one stage."

---

## Talk Track: Tying It Together

Use this narrative arc when presenting the full scenario:

1. **Setup:** "We have OPA policies that define what is and is not acceptable in our supply chain."
2. **Break it:** "A developer introduces a vulnerable dependency -- maybe by accident, maybe by copying from Stack Overflow."
3. **Catch it:** "The pipeline stops. The SBOM is evaluated against the policy, and the violation is surfaced with full context."
4. **Fix it:** "The developer upgrades the dependency and pushes again. The build passes."
5. **Double-check it:** "Even if we missed it at build time, the CD pipeline evaluates the same policies before deployment. Defense in depth."

---

## Common Audience Questions

**Q: "Can we write our own policies or do we have to use templates?"**
A: Both. Harness provides policy templates for common use cases, but policies are standard Rego -- you can write anything OPA supports. If your team already has OPA experience, those skills transfer directly.

**Q: "What happens when a policy blocks a build? Does the developer get notified?"**
A: The pipeline fails at the policy enforcement step. The violation details are visible in the execution UI, and Harness can send notifications via email, Slack, or PagerDuty. The developer sees exactly what was blocked and why.

**Q: "Can we set policies to 'warn' instead of 'block'?"**
A: Yes. Each policy can be set to **Deny** (hard block), **Warn** (advisory, pipeline continues), or **Warn + Approval** (pipeline pauses for manual review). The `sbom-drift-approval.rego` policy in this demo uses the warn pattern.

**Q: "How do we handle exceptions? What if a team needs to temporarily use a blocked component?"**
A: You can scope policies to specific pipelines, projects, or organizations. You can also use Harness governance exemptions to grant time-bound exceptions with audit trails.

---

## Transition to Next Scenario

After completing this scenario, transition to Scenario 3 (SLSA Provenance) with:

"We have shown how Harness generates SBOMs and enforces policies on the components inside your artifacts. But there is another dimension to supply chain security: how do you prove that the artifact itself was built by a trusted system, from trusted source code, in a tamper-proof environment? That is what SLSA provenance solves."
