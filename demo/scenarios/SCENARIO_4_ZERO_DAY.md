# Scenario 4: Zero-Day Response with Remediation Tracker

**Maps to:** Demo Skeleton Part 2, Section 6 -- Zero-Day Vulnerability Response
**Duration:** 10--15 minutes
**Audience:** Security Engineers, DevSecOps Architects, Compliance Officers, CISOs

---

## Overview

This scenario demonstrates Harness SCS end-to-end zero-day response: from the moment a critical CVE drops to full organizational remediation with auditable proof. You will walk through the Remediation Tracker, blast-radius assessment, OPA policy blocking, and compliance report generation.

This scenario supports **two vulnerability options**. Choose whichever fits your audience best.

> **Presenter Tip:** Log4Shell (Option A) is the stronger story for nearly every audience. It is the most widely recognized supply chain attack in history (CVSS 10.0, front-page news), which means your audience will already understand the severity without explanation. Use Option B (Lodash) only if the audience is Node.js-centric or if you have already used Log4Shell in an earlier scenario.

---

## Prerequisites

Before you begin, confirm the following:

- [ ] The SupplyWatch demo environment is running (`./demo/scripts/setup-demo-env.sh`)
- [ ] The Harness project has the notification-service **and** backend pipelines configured with SBOM Orchestration and SBOM Policy Enforcement steps
- [ ] The notification-service (for Option A) or backend (for Option B) is deployed to **Dev**, **Staging**, and **Prod** environments with vulnerable dependencies in place
- [ ] Harness STO is connected and has CVE scan data for the deployed artifacts
- [ ] Jira integration is configured in the Harness project (for one-click ticket creation)
- [ ] OPA policies are loaded: `.harness/policies/deny-vulnerable-versions.rego` and `.harness/policies/deny-blocked-components.rego`
- [ ] You have the `swap-vulnerable-dep.sh` script ready at `demo/scripts/swap-vulnerable-dep.sh`

---

## Option A: Log4Shell (CVE-2021-44228) -- Recommended

### Scene Setting

> **Talk Track:** "It is December 2021. A critical zero-day just dropped -- CVE-2021-44228, Log4Shell. CVSS 10.0. Remote code execution in Apache Log4j, a logging library used in millions of Java applications worldwide. Your CISO is on the phone asking: How exposed are we? How fast can we block it? When will we have proof it is fixed? Let me show you how Harness answers all three questions in minutes, not days."

### Step 1: Ensure Vulnerable Artifact Is Deployed

Confirm the notification service is deployed across all three environments with `log4j-core@2.14.1`.

```bash
./demo/scripts/swap-vulnerable-dep.sh vulnerable --service notification
```

This copies `demo/seed-data/vulnerable-pom.xml` into `app/notification-service/pom.xml`, which pins `log4j-core` and `log4j-api` to version `2.14.1`.

Trigger the CI pipeline to build and deploy the notification-service image to Dev, Staging, and Prod so that all three environments contain the vulnerable artifact.

> **Presenter Tip:** Ideally, do this setup before the live demo. The audience should see the vulnerable artifact already deployed when you open the Remediation Tracker. The drama is in the discovery, not the setup.

### Step 2: Open Remediation Tracker -- Create Entry for CVE-2021-44228

1. Navigate to **Supply Chain Security > Remediation Tracker** in the Harness UI.
2. Click **Create New Tracker**.
3. Enter the CVE identifier: `CVE-2021-44228`.
4. Set severity to **Critical**.

> **Talk Track:** "The first thing a security engineer does when a zero-day drops is ask: where is this component running? Harness answers that instantly."

### Step 3: Show Auto-Populated Affected Artifacts

After creating the tracker entry, Harness auto-populates all affected artifacts by scanning SBOMs across every indexed artifact in the organization.

Point out:

- The **notification-service** container image appears across all three environments (Dev, Staging, Prod).
- The data is auto-populated from Harness STO CVE scan results -- no manual SBOM cross-referencing required.
- Each affected artifact row shows the component name (`log4j-core`), version (`2.14.1`), and the artifact image tag.

> **Talk Track:** "Without this, your security team would be manually grepping through SBOMs, checking CMDB records, and pinging Slack channels. Harness does it in seconds by correlating STO scan data with SBOM inventory."

### Step 4: Show Blast Radius -- Environment Mapping

Click into the blast-radius view. Walk through:

| Environment | Artifact                        | Component         | Version | Status     |
|-------------|--------------------------------|-------------------|---------|------------|
| Dev         | notification-service:build-42   | log4j-core        | 2.14.1  | Vulnerable |
| Staging     | notification-service:build-42   | log4j-core        | 2.14.1  | Vulnerable |
| Prod        | notification-service:build-42   | log4j-core        | 2.14.1  | Vulnerable |

> **Talk Track:** "This is the blast radius. Three environments, all running the same vulnerable artifact. Your CISO now has the answer in 30 seconds: we are fully exposed, and here is exactly where."

### Step 5: Show Pipeline Traceability

For each affected artifact, show which pipeline and which stage deployed it:

- Pipeline: `notification-service-ci-cd`
- Build stage: `Build_and_Push`
- Deploy stages: `Deploy_Dev`, `Deploy_Staging`, `Deploy_Prod`

> **Talk Track:** "Not only do we know where the vulnerability lives, we know exactly how it got there -- which pipeline, which stage, which execution. Full traceability from code commit to production deployment."

### Step 6: Assign Owners to Each Affected Artifact

In the Remediation Tracker:

1. Select each affected artifact row.
2. Assign an owner (e.g., `@platform-team` for Dev/Staging, `@sre-team` for Prod).
3. Point out that ownership assignment creates accountability -- every artifact has a named individual or team responsible for remediation.

### Step 7: Set SLA Deadlines by Severity

Configure SLA deadlines:

| Severity | SLA Deadline |
|----------|-------------|
| Critical | 24 hours    |
| High     | 72 hours    |
| Medium   | 7 days      |
| Low      | 30 days     |

Since CVE-2021-44228 is Critical (CVSS 10.0), the SLA clock starts immediately with a 24-hour deadline.

> **Talk Track:** "SLA enforcement is not optional in regulated industries. Harness enforces deadlines automatically and tracks MTTR across your entire organization."

### Step 8: Show Tracker Dashboard Metrics

Navigate to the tracker dashboard and walk through:

- **Mean Time to Remediate (MTTR):** Current average across all tracked CVEs.
- **Remediation Status Breakdown:** How many artifacts are Pending, In Progress, Remediated, or Overdue.
- **Pending Remediations:** List of artifacts still awaiting fixes, sorted by SLA urgency.

> **Talk Track:** "This is the view your CISO wants on their Monday morning. Not just 'we have vulnerabilities' but 'here is how fast we are fixing them, and here is what is overdue.'"

### Step 9: One-Click Jira Ticket Creation

1. From the Remediation Tracker, click **Create Jira Ticket** on one of the affected artifacts.
2. Show the pre-populated Jira ticket: CVE details, affected artifact, environment, SLA deadline, and assigned owner are all included automatically.
3. Point out that Jira ticket status syncs back to the Remediation Tracker -- when the ticket moves to "Done" in Jira, the tracker updates accordingly.

> **Talk Track:** "Your developers do not need to leave Jira. The security team does not need to leave Harness. Both sides stay in sync automatically."

### Step 10: Create OPA Block Policy from Tracker

1. From the Remediation Tracker, click **Create Block Policy**.
2. Harness generates an OPA policy that blocks `log4j-core` versions below `2.17.1`.
3. Show the generated policy (this maps to `.harness/policies/deny-blocked-components.rego` in the repo).
4. The policy is immediately active in the SBOM Policy Enforcement step of all pipelines.

> **Talk Track:** "Within minutes of the zero-day dropping, you have a policy in place that blocks any new build or deployment containing the vulnerable component. No more waiting for developers to 'get around to it.'"

### Step 11: Trigger New Build -- Show It Blocked

1. Trigger a new notification-service build while `log4j-core@2.14.1` is still in the `pom.xml`.
2. The pipeline reaches the **SBOM Policy Enforcement** step and fails.
3. Show the violation message:

   ```
   BLOCKED COMPONENT VERSION: 'log4j-core@2.14.1' is on the blocked versions list.
   Blocked by Remediation Tracker -- CVE-2021-44228 (Log4Shell, CVSS 10.0). Upgrade to 2.17.1+
   ```

> **Talk Track:** "The build is blocked. Even if a developer tries to ship this version, the pipeline will not let it through. This is automated guardrail enforcement -- not a suggestion in a dashboard, but a hard gate in the pipeline."

### Step 12: Show Audit Trail

Navigate to the policy audit trail and show:

- **Policy creation timestamp:** When the block policy was created.
- **Policy creator:** Which user or automation created it.
- **Builds blocked:** List of pipeline executions that were blocked by this policy, with timestamps.

> **Talk Track:** "Every action is auditable. When the auditor asks 'when did you block this vulnerability and what did it prevent?' -- you have the answer with timestamps and evidence."

### Step 13: Remediate -- Swap to Clean Dependencies

Run the remediation script to update the notification service to the patched version:

```bash
./demo/scripts/swap-vulnerable-dep.sh clean --service notification
```

This replaces `log4j-core@2.14.1` with `log4j-core@2.24.3` (fully patched, no known vulnerabilities).

Commit the change and trigger a new build. The pipeline should now pass the SBOM Policy Enforcement step.

Then redeploy to all three environments (Dev, Staging, Prod).

### Step 14: Show Remediation Progress Update in Tracker

Return to the Remediation Tracker. Walk through:

- The notification-service artifacts now show status **Remediated** in each environment as the clean image is deployed.
- The MTTR clock stops for each artifact as it is confirmed remediated.
- The Jira ticket status updates to reflect the fix.

> **Talk Track:** "As each environment is redeployed with the patched version, the tracker updates in real time. No manual status updates, no Slack messages saying 'I think we fixed it.'"

### Step 15: Generate Compliance Report

1. From the Remediation Tracker, click **Generate Compliance Report**.
2. Walk through the report contents (see Compliance Report Contents section below).

> **Talk Track:** "This is the artifact your auditor, your customer, or your regulator needs. It proves not just that you found the vulnerability, but exactly when you found it, how you responded, how fast you fixed it, and what policies you put in place to prevent recurrence."

### Step 16: Explain the Compliance Report Use Case

Describe who receives this report and why:

- **Internal auditors:** SOC 2 / ISO 27001 evidence of vulnerability management controls.
- **Customers:** Proof of remediation when a customer asks "are you affected by Log4Shell?"
- **Regulators:** FedRAMP / NIST SSDF compliance evidence showing policy enforcement and remediation timelines.
- **Executive leadership:** MTTR metrics demonstrating security posture improvement over time.

---

## Option B: Lodash (CVE-2021-23337) -- Command Injection / Prototype Pollution

### Scene Setting

> **Talk Track:** "A critical vulnerability has been disclosed in Lodash, one of the most downloaded npm packages in the world -- over 40 million weekly downloads. CVE-2021-23337 is a command injection vulnerability in the `_.template()` function. Let me show you how Harness identifies every affected artifact and blocks the next deployment in minutes."

### Step 1: Ensure Vulnerable Artifact Is Deployed

Confirm the backend is deployed to Dev, Staging, and Prod with `lodash@4.17.20`.

```bash
./demo/scripts/swap-vulnerable-dep.sh vulnerable --service backend
```

This copies `demo/seed-data/vulnerable-package.json` into `app/backend/package.json`, which pins `lodash` to version `4.17.20` (and `jsonwebtoken` to `8.5.1`).

Trigger the CI pipeline to build and deploy the backend image across all three environments.

### Step 2: Open Remediation Tracker -- Create Entry for CVE-2021-23337

1. Navigate to **Supply Chain Security > Remediation Tracker**.
2. Click **Create New Tracker**.
3. Enter: `CVE-2021-23337`.
4. Set severity to **High**.

### Steps 3--16: Follow the Same Flow as Option A

Follow Steps 3 through 16 from Option A above, with the following substitutions:

| Option A (Log4Shell)                      | Option B (Lodash)                          |
|-------------------------------------------|--------------------------------------------|
| notification-service                      | backend                                    |
| `log4j-core@2.14.1`                       | `lodash@4.17.20`                           |
| CVE-2021-44228                            | CVE-2021-23337                             |
| CVSS 10.0 (Critical)                      | CVSS 7.2 (High)                            |
| Block `log4j-core < 2.17.1`              | Block `lodash < 4.17.21`                  |
| `clean --service notification`            | `clean --service backend`                  |
| Patched: `log4j-core@2.24.3`             | Patched: `lodash@4.17.21`                  |
| SLA: 24 hours (Critical)                  | SLA: 72 hours (High)                       |

> **Presenter Tip:** When using Option B, you lose the "front-page news" recognition factor of Log4Shell. Compensate by emphasizing the scale: "Lodash is one of the most depended-upon packages in the entire npm ecosystem. When it has a vulnerability, the blast radius is enormous." However, for maximum audience impact, Log4Shell remains the recommended choice.

---

## Key Differentiators

Highlight these points throughout the scenario to distinguish Harness SCS from point solutions:

| Capability | Harness SCS | Typical Competitor |
|------------|------------|-------------------|
| **Auto-populated blast radius** | STO CVE data automatically populates affected artifacts across all environments | Manual SBOM cross-referencing required |
| **Environment mapping** | Shows exactly which environments (Dev/Staging/Prod) have the vulnerable artifact | No environment awareness -- just a list of images |
| **Pipeline traceability** | Traces each affected artifact back to the pipeline and stage that deployed it | No CI/CD integration |
| **One-click Jira integration** | Create pre-populated Jira tickets from the tracker with bidirectional status sync | Manual ticket creation and status tracking |
| **OPA block policy from tracker** | Create and enforce a block policy directly from the Remediation Tracker in minutes | Policy creation is a separate, manual process |
| **SLA enforcement with MTTR** | Automated SLA deadlines with MTTR tracking across the organization | No SLA tracking |
| **Compliance report generation** | One-click report with full remediation evidence chain | Manual report assembly from multiple tools |
| **CI + CD enforcement** | Block policy enforced at both build-time and deploy-time | Usually CI-only or CD-only |

---

## Compliance Report Contents

When you generate the compliance report in Step 15, walk through each section:

| Report Section | Contents |
|---------------|----------|
| **CVE Details** | CVE identifier, CVSS score, severity, description, published date, affected component and version range |
| **Affected Artifacts** | List of every artifact containing the vulnerable component, with image tag, digest, and SBOM reference |
| **Environment Mapping** | Which environments each affected artifact was deployed to, with deployment timestamps |
| **Resolution Timeline** | Chronological log: CVE discovered, tracker created, policy created, first build blocked, remediation deployed, tracker closed |
| **Mean Time to Remediate (MTTR)** | Elapsed time from tracker creation to full remediation across all environments |
| **Policy Enforcement Evidence** | OPA policy text, creation timestamp, list of builds blocked by the policy, list of builds that passed after remediation |
| **Ownership and Accountability** | Assigned owners for each artifact, SLA deadlines, SLA compliance status (met or breached) |
| **Jira Integration Evidence** | Linked Jira ticket IDs, status transitions, resolution timestamps |

> **Talk Track:** "This is not a PDF you cobble together from five different tools. It is a single, machine-generated report with full chain of custody -- from the moment the CVE was identified to the moment every environment was clean."

---

## Common Questions from the Audience

**Q: What if we have hundreds of artifacts affected by a single CVE?**
A: The Remediation Tracker scales to any number of artifacts. Bulk assignment and bulk Jira ticket creation are supported. MTTR is tracked per-artifact and rolled up to an organizational average.

**Q: Can we create block policies automatically without a human in the loop?**
A: Yes. Harness supports automated policy creation triggered by severity thresholds. For example, any CVE with CVSS >= 9.0 can automatically generate a block policy. The demo shows the manual flow for clarity, but automation is available.

**Q: How does this integrate with our existing vulnerability scanner?**
A: Harness STO supports 30+ scanners (Snyk, Black Duck, Grype, Trivy, etc.). CVE data from any connected scanner feeds into the Remediation Tracker. SCS does not replace your scanner -- it orchestrates the response.

**Q: What happens to in-flight deployments when a block policy is created?**
A: Any pipeline execution that has not yet reached the SBOM Policy Enforcement step will be blocked. Executions that have already passed the enforcement step will complete. This is by design -- you do not want to kill a running production deployment mid-rollout.
