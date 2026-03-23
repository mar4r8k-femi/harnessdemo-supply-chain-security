# Scenario 5: SBOM Drift Detection

**Maps to:** Demo Skeleton Part 2, Section 3E -- SBOM Drift Detection
**Duration:** 8--10 minutes
**Audience:** Security Engineers, DevSecOps Architects, Compliance Officers, Platform Engineers

---

## Overview

This scenario demonstrates how Harness SCS detects changes between successive SBOM versions for the same artifact, surfaces those changes in a clear diff view, and enforces governance policies on drift -- including blocking copyleft-licensed components and requiring manual approval for significant changes.

The core story: a developer quietly adds a new dependency (including one with a GPL-3.0 license), and Harness catches it automatically before it reaches production.

> **Talk Track:** "SBOMs are not a one-time event. Every build produces a new SBOM, and what changed between builds matters as much as what is in the SBOM itself. A developer adds a GPL-licensed package, or downgrades a library to a version with known vulnerabilities -- without drift detection, that change slips through silently. Harness catches it."

---

## Prerequisites

Before you begin, confirm the following:

- [ ] The SupplyWatch demo environment is running (`./demo/scripts/setup-demo-env.sh`)
- [ ] The backend CI pipeline is configured with an **SBOM Orchestration** step (after Docker Build & Push) and an **SBOM Policy Enforcement** step
- [ ] The `sbom-drift-approval.rego` policy is loaded in Harness Policy Management (`.harness/policies/sbom-drift-approval.rego`)
- [ ] The `deny-gpl-licenses.rego` policy is loaded (`.harness/policies/deny-gpl-licenses.rego`)
- [ ] Sample SBOMs are available for reference: `demo/seed-data/sample-sbom-v1.json` (baseline) and `demo/seed-data/sample-sbom-v2.json` (with drift)
- [ ] The GPL stub package exists at `demo/gpl-stub-package/` (contains `package.json` with `"license": "GPL-3.0"`)
- [ ] You have at least one prior successful build of the backend image (to establish the baseline SBOM)

---

## Step 1: Build the Baseline Image (SBOM v1)

Start with a clean backend build to establish the baseline SBOM.

1. Ensure the backend has clean dependencies (no GPL package, no extra dependencies):

   ```bash
   ./demo/scripts/swap-vulnerable-dep.sh clean --service backend
   ```

2. Trigger the backend CI pipeline via the Harness UI or the helper script:

   ```bash
   ./demo/scripts/trigger-pipeline.sh --pipeline backend-ci --branch main
   ```

3. Once the build completes, navigate to **Supply Chain Security > Artifacts** and open the backend image.
4. Show the generated SBOM (CycloneDX format). This is the baseline -- SBOM v1.

> **Talk Track:** "This is our baseline. Ten components, all MIT or BSD-2-Clause licensed, no policy violations. This is what a clean build looks like."

The baseline SBOM (`sample-sbom-v1.json`) contains 10 components:

| Component      | Version  | License       |
|----------------|----------|---------------|
| express        | 4.18.2   | MIT           |
| lodash         | 4.17.21  | MIT           |
| winston        | 3.11.0   | MIT           |
| cors           | 2.8.5    | MIT           |
| helmet         | 7.1.0    | MIT           |
| axios          | 1.6.0    | MIT           |
| jsonwebtoken   | 9.0.2    | MIT           |
| uuid           | 9.0.0    | MIT           |
| dotenv         | 16.3.1   | BSD-2-Clause  |
| body-parser    | 1.20.2   | MIT           |

> **Presenter Tip:** Briefly point out the SBOM quality score if the audience is interested in SBOM scoring. This ties into Section 3D of the demo skeleton.

---

## Step 2: Add a New Dependency (Including a GPL-Licensed Package)

Simulate a developer adding new dependencies to the backend.

1. Open `app/backend/package.json`.
2. Add the following dependencies:

   ```json
   "demo-gpl-component": "file:../../demo/gpl-stub-package",
   "moment": "^2.30.1"
   ```

3. Remove `body-parser` from the dependencies (simulating a cleanup as part of the same change).
4. Update `axios` version from `1.6.0` to `1.7.2` (simulating a version bump).
5. Commit the changes.

> **Presenter Tip:** If you want to speed through this step in a live demo, have a pre-prepared branch with these changes ready. You can switch to it with `git checkout feature/add-gpl-dep` and show the diff. The audience cares about the detection, not the code change itself.

> **Talk Track:** "A developer made what looks like a routine update -- added a couple of packages, removed one, bumped a version. But buried in that change is a GPL-3.0 licensed component. In most organizations, this would slip through a code review unnoticed."

---

## Step 3: Build the Updated Image (SBOM v2)

1. Trigger the backend CI pipeline again.
2. The SBOM Orchestration step generates SBOM v2 for the new build.
3. Harness automatically compares SBOM v2 against the previous build's SBOM (v1).

---

## Step 4: Show SBOM Diff View

Navigate to the SBOM diff view in the Harness UI. Walk through each category of change:

### Expected Drift Summary

| Change Type        | Component               | Details                                      |
|--------------------|-------------------------|----------------------------------------------|
| **Added**          | `demo-gpl-component@1.0.0` | **GPL-3.0 license** -- triggers drift policy |
| **Added**          | `moment@2.30.1`         | MIT license -- new dependency                |
| **Removed**        | `body-parser@1.20.2`    | MIT license -- removed during cleanup        |
| **Version Bumped** | `axios`                 | `1.6.0` changed to `1.7.2`                        |

Point out in the diff view:

- **Additions** are highlighted (2 components added).
- **Removals** are highlighted (1 component removed).
- **Version changes** are highlighted with before/after comparison.
- **License changes** are flagged prominently -- the addition of `demo-gpl-component` with GPL-3.0 is called out as a license risk.

> **Talk Track:** "Harness shows you exactly what changed between builds. Two components added -- and one of them has a GPL-3.0 license. One component removed. One version bumped. This is the kind of change that would be invisible without drift detection."

> **Presenter Tip:** Pause on the GPL-3.0 license flag. This is the moment that resonates most with legal and compliance audiences. Explain that GPL-3.0 is a copyleft license that can have significant implications for proprietary software -- if it slips into your artifact undetected, you may face legal exposure.

---

## Step 5: Show Drift Policy Triggering Approval Gate

The `sbom-drift-approval.rego` policy evaluates the drift and produces the following results:

### Policy Evaluation Outcome

1. **DENY -- Copyleft license detected:**

   ```
   SBOM DRIFT BLOCKED: New component 'demo-gpl-component@1.0.0' introduces a copyleft
   license (GPL-3.0). Adding copyleft-licensed components requires legal review and
   explicit approval.
   ```

2. **WARN -- License change detected:**

   ```
   SBOM DRIFT WARNING: 1 license change(s) detected between SBOM versions. License
   changes require review to ensure compliance with organizational policy.
   ```

Walk through the pipeline behavior:

- The pipeline reaches the **SBOM Policy Enforcement** step.
- The drift policy evaluates the diff between SBOM v1 and SBOM v2.
- The policy **denies** the build because a copyleft-licensed component was added.
- If the policy were configured as "warn" instead of "deny," it would trigger a **manual approval gate** -- the build pauses and requires a designated approver to review the drift and approve or reject.

> **Talk Track:** "The policy is written in Rego -- the same Open Policy Agent language used across the industry. It fires on two conditions: any copyleft license addition is a hard block, and any license change at all triggers a warning. You control the thresholds. The point is that this change cannot reach production without someone explicitly reviewing and approving it."

Show the policy source file for reference:

- **Policy file:** `.harness/policies/sbom-drift-approval.rego`
- **Key thresholds:**
  - More than 5 component changes (additions + removals) triggers a warning.
  - ANY license change triggers a warning.
  - Any new GPL/AGPL/LGPL component triggers a hard deny.
  - Version downgrades trigger a warning (potential re-introduction of vulnerabilities).

### Approval Gate Walkthrough (if configured as warn + approval)

If you want to demonstrate the manual approval flow rather than the hard deny:

1. Show the pipeline paused at the approval gate with the drift summary displayed.
2. The approver sees the full drift summary: what was added, removed, and changed.
3. The approver can approve (allow the build to proceed) or reject (fail the build).
4. The decision is recorded in the audit trail.

> **Presenter Tip:** Decide before the demo whether to show the hard deny or the approval gate flow. The hard deny is faster and more dramatic. The approval gate is better for audiences who are concerned about developer friction -- it shows that Harness enables governance without being a blocker when changes are legitimate.

---

## Key Differentiators

Highlight these throughout the scenario:

| Capability | Harness SCS | Typical Competitor |
|------------|------------|-------------------|
| **SBOM drift detection** | Automatic diff between successive builds of the same artifact | Not available -- SBOMs are generated but never compared |
| **License change detection** | Flags new, changed, or removed licenses in the diff view | No license-level diff tracking |
| **Copyleft license blocking** | OPA policy denies builds that introduce GPL/AGPL/LGPL components | Requires separate license scanning tool |
| **Approval gate on drift** | Policy-driven manual approval for significant changes | No governance on SBOM changes |
| **Version change tracking** | Shows version bumps and downgrades with before/after comparison | No version-level change tracking |
| **Rego-based policy customization** | Fully customizable thresholds using standard OPA Rego language | Fixed rules or limited configurability |
| **CI + CD enforcement** | Drift policies enforced at both build-time and deploy-time | Usually CI-only |
| **Audit trail** | Every drift evaluation, approval decision, and denial is recorded | No audit trail for SBOM changes |

---

## Reference Files

| File | Path | Purpose |
|------|------|---------|
| Baseline SBOM | `demo/seed-data/sample-sbom-v1.json` | 10-component CycloneDX SBOM (all MIT/BSD) |
| Drifted SBOM | `demo/seed-data/sample-sbom-v2.json` | 11-component SBOM with GPL addition, removal, and version bump |
| Drift policy | `.harness/policies/sbom-drift-approval.rego` | OPA policy: deny copyleft, warn on license changes, warn on excessive changes |
| GPL license policy | `.harness/policies/deny-gpl-licenses.rego` | Standalone GPL/copyleft deny policy |
| GPL stub package | `demo/gpl-stub-package/package.json` | Local npm package with `"license": "GPL-3.0"` for demo purposes |

---

## What Changed Between SBOM v1 and v2 -- Detailed Breakdown

For presenter reference, here is the precise diff between the two sample SBOMs:

### Components Added (2)

| Component | Version | License | PURL | Notes |
|-----------|---------|---------|------|-------|
| `demo-gpl-component` | 1.0.0 | **GPL-3.0** | `pkg:npm/demo-gpl-component@1.0.0` | Triggers copyleft deny in drift policy |
| `moment` | 2.30.1 | MIT | `pkg:npm/moment@2.30.1` | Clean addition, no policy violation on its own |

### Components Removed (1)

| Component | Version | License | PURL |
|-----------|---------|---------|------|
| `body-parser` | 1.20.2 | MIT | `pkg:npm/body-parser@1.20.2` |

### Version Changes (1)

| Component | Previous Version | New Version | License |
|-----------|-----------------|-------------|---------|
| `axios` | 1.6.0 | 1.7.2 | MIT (unchanged) |

### License Changes (1)

| Component | License | Change Type |
|-----------|---------|-------------|
| `demo-gpl-component` | GPL-3.0 | Added (new component with copyleft license) |

### Unchanged Components (7)

express@4.18.2, lodash@4.17.21, winston@3.11.0, cors@2.8.5, helmet@7.1.0, jsonwebtoken@9.0.2, uuid@9.0.0, dotenv@16.3.1

---

## Common Questions from the Audience

**Q: How does drift detection handle transitive dependencies?**
A: The SBOM captures the full dependency tree, including transitive dependencies. Drift detection compares the complete SBOM, so if a transitive dependency changes, it appears in the diff. The depth of transitive visibility depends on the SBOM generation tool (Syft, Harness native, etc.).

**Q: Can we customize the drift thresholds?**
A: Yes. The `sbom-drift-approval.rego` policy is fully customizable. You can change the maximum component change threshold (default: 5), add or remove licenses from the copyleft list, or add entirely new rules. It is standard Rego -- any OPA-compatible rule works.

**Q: What if a legitimate change is blocked by the drift policy?**
A: Configure the policy as a "warn" action with an approval gate instead of a hard "deny." This allows a designated approver to review the drift and approve the change if it is legitimate. The approval decision is recorded in the audit trail.

**Q: Does drift detection work across different SBOM formats?**
A: Harness normalizes SBOMs internally regardless of whether they were generated in CycloneDX or SPDX format. Drift detection works across format boundaries as long as both SBOMs are for the same artifact.

**Q: Can I see drift across environments, not just across builds?**
A: Yes. If you generate SBOMs in both CI and CD stages (see Demo Skeleton Part 2, Section 3B), you can compare the build-time SBOM against the deploy-time SBOM to catch drift that occurred between build and deployment -- for example, if a base image was updated in the registry between the build and deploy steps.
