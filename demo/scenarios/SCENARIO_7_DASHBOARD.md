# Scenario 7: Dashboards, Reporting, STO Integration & AppSec Agent

**Maps to:** Demo Skeleton Part 1 Section 3, Part 2 Sections 7 & 8
**Estimated Duration:** 12--18 minutes
**Audience:** Security Leaders, CISO, Compliance Officers, DevSecOps Architects

---

## Prerequisites

Before running this scenario, confirm the following are in place:

| Prerequisite | Details |
|---|---|
| Harness SCS module enabled | Verify the SCS module is active in your Harness account |
| Multiple SBOM generations completed | At least 2--3 pipeline runs with SBOM Orchestration steps so SBOM coverage data and drift history exist |
| SLSA provenance generated | At least one pipeline run with SLSA Generation step so SLSA adoption data appears |
| RSPM scan completed | At least one RSPM scan has run so repository compliance data populates the dashboard |
| Remediation Tracker entries exist | At least one tracker entry (from Scenario 4 or 6) so SLA tracking data is visible |
| Harness STO module enabled | STO scan results (SAST, SCA, Secret Scanning) should be present for the integration demo |
| AppSec Agent access | Verify the AI-powered AppSec Agent feature is enabled and accessible |
| Jira connector configured | For demonstrating audit trail and remediation ticket integration |
| Multiple pipeline executions | Several builds over multiple days so that trend-over-time charts have data points |

---

## Dashboard Views Summary

Reference this table throughout the demo to orient the audience on which view you are showing and what it answers:

| Dashboard View | What It Shows | Business Question It Answers |
|---|---|---|
| SCS Overview Dashboard | Unified risk posture across repos, artifacts, CI/CD tools | "What is our overall supply chain security posture right now?" |
| Repository Compliance Posture | RSPM findings by repo, CIS/OWASP compliance scores | "Which repositories have the most misconfigurations?" |
| Artifact SBOM Coverage | Percentage of artifacts with SBOMs, SBOM quality scores | "How many of our artifacts have a complete software bill of materials?" |
| SLSA Adoption Rate | Percentage of builds with SLSA provenance, level distribution | "How close are we to SLSA Level 3 across all pipelines?" |
| Vulnerability Overview | CVE counts by severity, affected artifacts, remediation status | "How many critical vulnerabilities are we tracking, and are we meeting SLA?" |
| Open SLA Breaches | Remediation tracker entries past their SLA deadline | "Which remediations are overdue and who owns them?" |
| Trend Over Time | Risk score, vulnerability count, compliance score over days/weeks | "Are we getting better or worse?" |
| Audit Log Export | SBOM events, SLSA events, policy decisions, promotion governance | "Can we prove to an auditor what happened at every stage?" |

---

## Compliance Framework Mapping

Use this table when discussing audit and compliance use cases. It maps each compliance framework to the specific SCS features that provide evidence:

| Compliance Framework | Key Requirements | SCS Feature That Satisfies | Evidence Produced |
|---|---|---|---|
| **US Executive Order 14028** | Software bill of materials for all delivered software | SBOM Generation (CI + CD stages) | CycloneDX/SPDX SBOM files, SBOM attestation signatures |
| **US Executive Order 14028** | Provenance and integrity of software artifacts | SLSA Provenance (L1--L3) + Cosign signing | Signed provenance JSON, .att and .sig attestation files |
| **FedRAMP** | Supply chain risk management (CA-8, SA-12) | RSPM + Remediation Tracker | RSPM scan reports, remediation timelines, Jira ticket trails |
| **FedRAMP** | Continuous monitoring of security controls | SCS Dashboard + trend reporting | Dashboard exports, scheduled compliance reports |
| **SOC 2 (Trust Services Criteria)** | CC7.1 -- Detect and monitor anomalies | SBOM Drift Detection + STO integration | Drift reports, vulnerability alerts, policy enforcement logs |
| **SOC 2 (Trust Services Criteria)** | CC8.1 -- Manage changes to infrastructure and software | OPA Policy Enforcement (CI + CD) | Policy evaluation logs, blocked build/deploy records |
| **ISO 27001** | A.14.2.1 -- Secure development policy | OPA policies + RSPM posture scanning | Policy definitions (Rego files), RSPM compliance scores |
| **ISO 27001** | A.12.6.1 -- Management of technical vulnerabilities | Remediation Tracker + SLA tracking | Tracker reports, MTTR metrics, Jira ticket history |
| **NIST SSDF (SP 800-218)** | PO.1 -- Define security requirements for software development | OPA Policy Enforcement | Rego policy files, enforcement decision audit logs |
| **NIST SSDF (SP 800-218)** | PS.1 -- Protect all forms of code from unauthorized access | RSPM (branch protection, access controls) | RSPM scan results, CIS Benchmark compliance reports |
| **NIST SSDF (SP 800-218)** | PW.4 -- Verify third-party software integrity | SBOM + SLSA + Cosign verification | SBOM coverage scores, SLSA provenance verification logs |
| **NIST SSDF (SP 800-218)** | RV.1 -- Identify and confirm vulnerabilities | STO integration + Remediation Tracker | STO scan results, tracker entries with blast-radius mapping |

> **Presenter Tip:** Print this table or have it ready on a slide. When the audience asks "How does this help with [framework]?", point directly to the row and the specific SCS feature. This is often the moment that closes the deal for compliance-driven buyers.

---

## Demo Steps

### Step 1: Open the SCS Overview Dashboard

**Action:** Navigate to the SCS Overview Dashboard and orient the audience.

1. Open the Harness UI. Navigate to the **Supply Chain Security** module.
2. Land on the **Overview Dashboard** -- the top-level view.
3. Walk through the high-level metrics displayed:
   - **Overall Risk Posture Score** -- a single number representing supply chain health
   - **Repository count** with compliance status (e.g., "4 repos connected, 2 with critical findings")
   - **Artifact count** with SBOM coverage (e.g., "12 artifacts, 9 with SBOMs")
   - **CI/CD tool posture** -- aggregated RSPM score
   - **Open vulnerabilities** -- count by severity (Critical, High, Medium, Low)
   - **Active remediation trackers** -- count with SLA status
4. Emphasize the single-pane-of-glass view: repos, artifacts, pipelines, and CI/CD tools are all visible in one place.

> **Talk Track:** "This is your supply chain command center. In one view, you can see the posture of every connected repository, every artifact, and every CI/CD tool. You are not switching between five different dashboards from five different vendors. This is the unified picture your CISO has been asking for."

---

### Step 2: Drill Into Compliance Violations, Vulnerability Counts, and SBOM Coverage

**Action:** Click into each summary card to show the detail behind the numbers.

1. **Compliance Violations:** Click the compliance violations metric. Show the breakdown:
   - Violations by framework (CIS Benchmark, OWASP CI/CD)
   - Violations by severity
   - Violations by repository
   - Top offending controls (e.g., "Branch protection disabled" appears across 3 repos)

2. **Vulnerability Counts:** Click the vulnerability count metric. Show:
   - CVEs by severity (Critical, High, Medium, Low)
   - CVEs by source (STO scan vs. SBOM component match)
   - Most affected artifacts
   - Link to Remediation Tracker for each critical CVE

3. **SBOM Coverage Score:** Click the SBOM coverage metric. Show:
   - Percentage of artifacts with SBOMs generated
   - SBOM quality scores (NTIA minimum elements compliance)
   - Artifacts missing SBOMs -- highlight these as blind spots
   - SBOM format distribution (CycloneDX vs. SPDX)

> **Talk Track:** "Let me drill into the numbers. We have three compliance violations at Critical severity -- all related to branch protection. Our SBOM coverage is at 75% -- meaning one in four artifacts has no software bill of materials. For an EO 14028 audit, that is a gap. And we have two Critical CVEs in the Remediation Tracker with SLA deadlines approaching."

> **Presenter Tip:** Spend the most time on whichever metric resonates with the audience. For compliance buyers, focus on SBOM coverage and compliance violations. For security operations teams, focus on vulnerability counts and remediation status.

---

### Step 3: Show Trend Over Time and Top Risks by Category

**Action:** Navigate to the trend charts and risk category breakdown.

1. Scroll to (or navigate to) the **Trend Over Time** section of the dashboard.
2. Show the trend lines:
   - Risk posture score over the past 30 days (or available window)
   - Vulnerability count trend -- is it going up or down?
   - SBOM coverage trend -- are more artifacts getting SBOMs over time?
   - Compliance score trend -- are RSPM findings being remediated?
3. Show **Top Risks by Category:**
   - Open-source vulnerabilities (from STO/SCA)
   - Repository misconfigurations (from RSPM)
   - Missing provenance (artifacts without SLSA attestation)
   - License risk (GPL or other restrictive licenses detected)
   - SBOM gaps (artifacts without SBOMs)

> **Talk Track:** "The trend view is what your leadership team cares about. Are we improving or regressing? Two weeks ago, our risk score was 58. Today it is 71. You can see the jump corresponds to when we enabled RSPM and started remediating branch protection findings. This is the story you bring to a board meeting or an audit review."

---

### Step 4: Show Drill-In Views

**Action:** Navigate through each drill-in view to show depth.

Walk through each of the following views, spending 1--2 minutes on each:

**4a. Repository Compliance Posture**
1. Navigate to the repository compliance view.
2. Show each connected repo with its compliance score.
3. Click into one repo and show its specific CIS/OWASP findings.
4. Highlight repos with the lowest scores as priority remediation targets.

**4b. Artifact SBOM Coverage**
1. Navigate to the artifact view.
2. Show which artifacts have SBOMs and which do not.
3. Show SBOM quality scores for covered artifacts.
4. Click into one artifact to show its full SBOM (component list, licenses, PURLs).

**4c. SLSA Adoption Rate**
1. Navigate to the SLSA adoption view.
2. Show the percentage of builds generating SLSA provenance.
3. Show the level distribution: how many builds are at L1, L2, L3.
4. Highlight the goal: 100% of production builds at SLSA Level 3 (achievable with Harness Cloud).

**4d. Open SLA Breaches**
1. Navigate to the Remediation Tracker SLA view.
2. Show any tracker entries past their SLA deadline.
3. Show the owner, severity, time elapsed past SLA.
4. Emphasize MTTR (Mean Time to Remediate) as a KPI for security operations maturity.

> **Talk Track:** "Each of these views answers a specific question your security team or auditor is going to ask. 'Which repos are non-compliant?' -- here. 'Which artifacts lack SBOMs?' -- here. 'What percentage of our builds have tamper-proof provenance?' -- here. 'Are we meeting our remediation SLAs?' -- here. All from one module."

---

### Step 5: Show Exportable Audit Logs

**Action:** Navigate to the audit log section and demonstrate export.

1. Navigate to the **Audit Logs** section within SCS (or the platform-level audit log with SCS filters).
2. Apply filters to show SCS-specific events:
   - **SBOM Generation events** -- which pipeline, which artifact, when, who triggered it
   - **SLSA Attestation events** -- provenance generation, signing events
   - **Policy Enforcement decisions** -- which policies evaluated, pass/fail results, which builds were blocked
   - **Artifact Promotion governance** -- promotion requests, policy gate results, approvals
3. Show the detail of one audit log entry:
   - Timestamp, actor (user or pipeline), action, resource, result
   - Link back to the pipeline execution
4. Demonstrate the **Export** function:
   - Export filtered logs as CSV or JSON
   - Show that the export includes all fields needed for audit evidence

> **Talk Track:** "When an auditor asks, 'Can you prove that every artifact deployed to production had an SBOM and a signed provenance attestation?' -- this is your answer. Every SBOM generation, every SLSA signing event, every policy enforcement decision is logged with full traceability. Export it, hand it to the auditor, and move on."

---

### Step 6: Highlight Compliance Use Case

**Action:** Connect the audit logs and dashboard data to specific compliance frameworks.

1. Reference the Compliance Framework Mapping table (see above).
2. Walk through a specific scenario relevant to the audience. For example, for FedRAMP:
   - "FedRAMP requires supply chain risk management under CA-8 and SA-12."
   - Show the RSPM compliance report as evidence for SA-12.
   - Show the SBOM generation audit logs as evidence for software transparency requirements.
   - Show the SLSA provenance logs as evidence for artifact integrity.
   - Show the Remediation Tracker report as evidence for vulnerability management timelines.
3. Emphasize **full lifecycle traceability:**
   - Code commit triggers CI build
   - SBOM generated and attested during build
   - SLSA provenance generated and signed during build
   - Policy enforcement gates at build and deploy
   - Artifact promotion governed by policy
   - Every step logged and exportable

> **Talk Track:** "Compliance is not a checkbox exercise -- it is about demonstrating a continuous, auditable process. Harness SCS provides the evidence chain from code commit to production deployment. Whether your framework is FedRAMP, SOC 2, ISO 27001, or NIST SSDF, the data is here, it is immutable, and it is exportable."

> **Presenter Tip:** Tailor this step to the prospect's specific compliance requirements. If they mentioned SOC 2 in the discovery call, lead with SOC 2 examples. If they are a federal agency, lead with FedRAMP and EO 14028.

---

### Step 7: Show STO Integration

**Action:** Demonstrate how Harness STO scan results feed into the SCS posture view.

1. Navigate to the SCS module and locate the **vulnerability posture** section (or a combined STO + SCS view).
2. Show that STO scan results are visible within SCS:
   - **SAST findings** -- static analysis vulnerabilities detected in application code
   - **SCA findings** -- software composition analysis results (known CVEs in dependencies)
   - **Secret Scanning findings** -- leaked credentials or API keys detected in code
3. Show how STO CVE data auto-populates the Remediation Tracker:
   - An SCA finding for a critical CVE (e.g., Log4Shell) appears in the tracker
   - The tracker already shows affected artifacts (from SBOM cross-referencing) and environments
4. Show the combined view: vulnerability risk (from STO) and supply chain risk (from SCS) in a single posture score.

> **Talk Track:** "Here is where the Harness platform advantage becomes clear. Harness STO runs your SAST, SCA, and secret scanning. Those results do not live in a silo -- they feed directly into the SCS posture. A critical CVE found by SCA is automatically correlated with your SBOMs to identify every affected artifact. The Remediation Tracker picks it up without anyone manually entering a CVE number. This is what 'platform' means -- not bolting tools together, but having them share data natively."

> **Presenter Tip:** If the prospect currently uses a standalone SCA tool (Snyk, Black Duck), acknowledge it and emphasize that STO can integrate with those tools too. The point is not to replace their scanner -- it is to show that SCS consumes vulnerability data from any source and adds the supply chain context (SBOMs, blast radius, environment mapping) on top.

---

### Step 8: Show the AppSec Agent

**Action:** Open the AppSec Agent and demonstrate AI-powered prioritization.

1. Navigate to the **AppSec Agent** within the SCS module (or the broader Harness AI features section).
2. Show the agent's prioritization view:
   - The agent has analyzed all supply chain alerts across repos, artifacts, and build tools
   - Alerts are ranked by contextual risk -- not just CVSS score, but considering:
     - Whether the vulnerable component is in a production-deployed artifact
     - Whether the artifact has SLSA provenance (higher confidence in blast-radius assessment)
     - Whether the affected repository has branch protection (can the fix be safely merged?)
     - Whether an SLA deadline is approaching
3. Show the **highest-risk items** the agent has surfaced:
   - Example: "Repository X has 3 Critical CVEs in production artifacts, no branch protection, and an SLA breach in 12 hours"
   - Example: "Registry Y has 4 artifacts without SBOMs -- blind spots that cannot be assessed for risk"
4. Demonstrate how the agent helps a security team focus: instead of triaging 200 alerts, the agent identifies the 5 that matter most right now.

> **Talk Track:** "Your security team does not have time to chase every alert. The AppSec Agent uses AI to analyze your entire supply chain posture and tell you where to focus first. It is not just sorting by CVSS score -- it is looking at your actual deployment context, your SLA deadlines, and your toolchain posture to surface the risks that matter most."

---

### Step 9: Demonstrate Conversational Remediation Guidance

**Action:** Use the AppSec Agent's conversational interface to get remediation guidance.

1. Open the AppSec Agent's conversational interface (chat or query bar).
2. Demonstrate a remediation query. Type:
   - **"Find an alternate package to mitigate this license risk"** (in the context of a GPL-licensed dependency)
3. Show the agent's response:
   - It identifies the GPL-licensed package (e.g., the planted `gpl-stub-package` from the demo seed data)
   - It suggests MIT-licensed or Apache-2.0-licensed alternatives with similar functionality
   - It provides the package name, version, license, and a link to the package registry
4. Demonstrate a second query:
   - **"Which repositories are most at risk of a supply chain attack right now?"**
5. Show the agent's response:
   - It ranks repositories by combined risk score (RSPM findings + vulnerability count + SBOM gaps)
   - It explains why each repository is ranked where it is
6. Demonstrate a third query (if time permits):
   - **"What do I need to do to reach SLSA Level 3 across all production pipelines?"**
7. Show the agent's response:
   - It identifies pipelines not yet using Harness Cloud builds
   - It lists the specific steps needed: enable Harness Cloud infrastructure, add SLSA Generation step, configure Cosign signing

> **Talk Track:** "This is not a chatbot giving you generic answers. The AppSec Agent has context about your specific repos, your SBOMs, your SLSA status, and your RSPM findings. When I ask 'find an alternate package,' it knows which package I am talking about because it has already analyzed my supply chain. This is AI-powered remediation guidance built into the platform."

> **Presenter Tip:** Keep the conversational queries natural and relevant to the demo flow. If you just showed a GPL license finding in a previous scenario, ask about license risk remediation. If you just showed RSPM findings, ask about the most at-risk repositories. This makes the agent feel integrated, not like a bolt-on.

---

## Key Differentiators

Emphasize these points throughout the demo:

| Differentiator | Explanation |
|---|---|
| Unified supply chain dashboard | Repos, artifacts, CI/CD tools, vulnerabilities, compliance -- all in one view. Competitors require switching between multiple tools and manually correlating data. |
| STO + SCS native integration | Vulnerability data from SAST, SCA, and Secret Scanning feeds directly into supply chain posture. No manual CVE entry, no CSV imports, no API stitching. |
| Full lifecycle audit trail | Every SBOM generation, SLSA attestation, policy decision, and artifact promotion is logged and exportable. Competitors typically capture only build-time events. |
| Compliance framework mapping | Dashboard data maps directly to FedRAMP, SOC 2, ISO 27001, and NIST SSDF requirements. Exportable evidence reduces audit preparation from weeks to hours. |
| AI-powered prioritization (AppSec Agent) | Contextual risk ranking considers deployment status, SLA deadlines, and toolchain posture -- not just CVSS scores. Conversational interface provides actionable remediation guidance. |
| Trend and SLA tracking | Risk posture trends over time and SLA breach tracking give leadership the "are we improving?" answer that point-in-time scanners cannot provide. |

---

## Handling Common Questions

| Question | Suggested Response |
|---|---|
| "Can we customize the dashboard views?" | Yes -- dashboard views can be filtered by project, repository, artifact, or time range. Custom views can be saved and shared across the team. |
| "How do we export data for our auditors?" | Audit logs and dashboard data can be exported as CSV or JSON. Scheduled exports can be configured for recurring audit needs. |
| "Does the AppSec Agent have access to our code?" | The AppSec Agent analyzes metadata -- SBOMs, RSPM findings, vulnerability data, and posture scores. It does not read or access source code directly. |
| "How does STO integration work if we use a third-party scanner?" | Harness STO supports ingestion from third-party scanners (Snyk, Checkmarx, SonarQube, etc.). Results from those tools flow into SCS the same way native STO results do. |
| "What if we only have the SCS module, not STO?" | SCS works independently for SBOM, SLSA, RSPM, and policy enforcement. STO integration enriches the posture view with vulnerability data, but it is not required for core SCS functionality. |
| "How does the compliance mapping hold up to a real audit?" | The mapping is based on published framework requirements. Harness does not certify compliance -- your assessor does. But the evidence SCS produces (SBOMs, provenance, audit logs, remediation timelines) is exactly what assessors ask for. |

---

## Post-Demo Wrap-Up

After completing this scenario:

1. Return to the SCS Overview Dashboard for a final "big picture" moment.
2. Summarize what was shown: unified posture, compliance evidence, STO integration, and AI-guided remediation.
3. Tie back to the prospect's specific pain points from the discovery call.
4. Recommended next steps:
   - **Compliance-driven prospect:** Schedule a compliance mapping session to overlay SCS against their specific framework requirements.
   - **Security operations prospect:** Propose a PoV connecting their actual repos and CI tools to show real posture data within 1 hour.
   - **Executive prospect:** Share the dashboard as evidence of what "supply chain security maturity" looks like with Harness.
