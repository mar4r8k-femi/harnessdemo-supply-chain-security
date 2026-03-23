# Scenario 6: Repository Security Posture Management (RSPM)

**Maps to:** Demo Skeleton Part 2, Section 2
**Estimated Duration:** 10--15 minutes
**Audience:** Security Engineers, DevSecOps Architects, Compliance Officers

---

## Prerequisites

Before running this scenario, confirm the following are in place:

| Prerequisite | Details |
|---|---|
| Harness SCS module enabled | Verify the SCS module is active in your Harness account |
| GitHub connector configured | A read-only GitHub API connector pointing to this repository (PAT with `repo:read`, `admin:read` scopes) |
| RSPM scan completed | At least one RSPM scan has run against the connected repo so results are populated |
| Jira connector configured | A Harness Jira connector linked to a demo project for ticket creation |
| Remediation Tracker enabled | Verify the Remediation Tracker feature is accessible from the SCS module |
| Demo repo intentionally misconfigured | See the "Repo Preparation" section below |

---

## Repo Preparation

For a compelling RSPM demo, the target repository must have realistic misconfigurations that RSPM will detect. Before the demo, intentionally leave certain GitHub settings misconfigured on this repository. After the demo (or during it, as a remediation walkthrough), you can fix them live.

### Settings to Misconfigure vs. Fix During Demo

| Setting | Pre-Demo State (Misconfigured) | Fix During Demo? | Why This Matters |
|---|---|---|---|
| Branch protection on `main` | Disabled -- no branch protection rule exists | Yes -- enable during remediation step | CIS Benchmark critical finding; most common real-world misconfiguration |
| Required pull request reviews | Not required (or branch protection off) | Yes -- enable "Require approvals" with at least 1 reviewer | Prevents unauthorized code from reaching production |
| Secret scanning | Disabled in repository settings | Optional -- enable if time permits | Demonstrates detection of leaked credentials in commit history |
| Signed commits required | Not required | No -- mention only | SLSA-related control; ties back to Scenario 3 |
| Admin access | At least one overly broad collaborator with Admin role | No -- mention only | Highlights over-privileged access risk |
| Webhook security | At least one webhook without a secret configured | No -- mention only | Prevents webhook spoofing attacks |
| Dependency graph / Dependabot | Disabled | Optional | Shows gap in automated vulnerability alerting |
| Force push allowed on `main` | Allowed (no branch protection) | Yes -- disable when enabling branch protection | Prevents history rewriting on the default branch |
| Status checks required before merge | Not required | Optional | Ensures CI must pass before code lands |

> **Presenter Tip:** Keep a browser tab open to the GitHub repository "Settings > Branches" page so you can toggle branch protection live. This creates a powerful before/after moment when RSPM rescans and the finding is resolved.

---

## CIS Benchmark Controls Reference

RSPM scans against the CIS Software Supply Chain Security Benchmark. The following controls are most relevant to this demo:

| CIS Control ID | Control Name | What RSPM Checks | Expected Finding |
|---|---|---|---|
| 1.1.3 | Ensure any change to code receives approval of two strongly authenticated users | PR review requirements | Fail -- no required reviewers |
| 1.1.4 | Ensure previous approvals are dismissed when updates are introduced | Dismiss stale reviews setting | Fail -- not configured |
| 1.1.5 | Ensure there are restrictions on who can dismiss code change reviews | Dismiss review restrictions | Fail -- not configured |
| 1.1.6 | Ensure code owners approval is required | CODEOWNERS enforcement | Fail -- no CODEOWNERS file or enforcement |
| 1.1.8 | Ensure branch protection rules are defined | Branch protection on default branch | Fail -- branch protection disabled |
| 1.1.9 | Ensure pushing or force pushing of new code is restricted | Force push and push restrictions | Fail -- unrestricted |
| 1.1.14 | Ensure all checks have passed before merging new code | Required status checks | Fail -- not configured |
| 1.2.1 | Ensure all public repositories contain a SECURITY.md file | SECURITY.md presence | Varies |
| 1.3.3 | Ensure inactive repositories are reviewed and archived periodically | Repository activity check | Pass (active repo) |
| 2.3.1 | Ensure all build steps are defined as code | Pipeline-as-code check | Pass (Harness pipelines in `.harness/`) |
| 2.4.2 | Ensure the pipeline triggers are limited to specific branches | Branch trigger restrictions | Varies |

---

## OWASP Top 10 CI/CD Risks Reference

RSPM also maps findings to the OWASP Top 10 CI/CD Security Risks. The following are most relevant:

| OWASP CI/CD Risk ID | Risk Name | What RSPM Detects | Expected Demo Finding |
|---|---|---|---|
| CICD-SEC-1 | Insufficient Flow Control Mechanisms | Missing branch protection, no required reviews, no status checks | Fail -- multiple controls missing |
| CICD-SEC-2 | Inadequate Identity and Access Management | Over-privileged admin accounts, missing MFA enforcement | Fail -- admin access too broad |
| CICD-SEC-4 | Poisoned Pipeline Execution (PPE) | Unrestricted pipeline triggers, no branch restrictions on builds | Varies |
| CICD-SEC-5 | Insufficient PBAC (Pipeline-Based Access Controls) | Pipeline permissions not scoped, secrets accessible across pipelines | Varies |
| CICD-SEC-7 | Insecure System Configuration | Webhooks without secrets, disabled security features (secret scanning, dependency graph) | Fail -- webhook misconfiguration |
| CICD-SEC-9 | Improper Artifact Integrity Validation | Missing artifact signing, no SLSA attestation verification | Varies (covered in Scenarios 3 and 5) |

---

## Demo Steps

### Step 1: Show RSPM Connector Setup

**Action:** Navigate to **Project Settings > Connectors** and open the GitHub connector used for RSPM.

1. Open the Harness UI. Navigate to the SCS module within your project.
2. Go to **Project Settings > Connectors** and locate the GitHub connector (e.g., `github-supplywatch-readonly`).
3. Click into the connector and show the configuration:
   - Connection type: GitHub API (read-only)
   - Authentication: Personal Access Token (PAT) stored as a Harness secret
   - Scopes: `repo:read`, `admin:read` -- emphasize this is read-only, no write access needed
4. Show that the connector targets this specific repository (`harnessdemo-supply-chain-security`).

> **Talk Track:** "RSPM starts with a simple read-only API connector. We are not asking for write access to your repos or CI tools. Harness connects through standard APIs to scan your repository configuration, branch protection rules, access controls, and webhook settings -- all without touching your code."

> **Presenter Tip:** If time allows, briefly mention that RSPM also supports connectors for GitLab, Bitbucket, Jenkins, and GitHub Actions. The same posture scanning applies across all connected tools, not just a single repo.

---

### Step 2: Show Automated CIS Benchmark Scanning Results

**Action:** Navigate to the RSPM findings view and walk through the CIS Benchmark results.

1. In the SCS module, navigate to **Repository Security Posture** (or the RSPM section of the dashboard).
2. Select this repository from the list of scanned repos.
3. Open the **CIS Benchmark** tab or filter findings by framework.
4. Walk through the findings:
   - **Branch protection disabled on `main`** -- highlight this as the most critical finding
   - **No required reviews** -- explain the risk of unreviewed code reaching production
   - **Force push allowed** -- history rewriting risk
   - **Webhooks without secrets** -- webhook spoofing vector
   - **Admin access overly broad** -- principle of least privilege violation
5. Show the severity ratings (Critical, High, Medium) and how each finding maps to a specific CIS control ID.

> **Talk Track:** "Look at what Harness found in under a minute. No branch protection on main, no required reviews, webhooks without secrets. These are the exact misconfigurations that attackers exploit. The SolarWinds attack succeeded partly because of inadequate CI/CD access controls -- exactly the kind of gap RSPM catches."

> **Presenter Tip:** Click into one specific finding (branch protection) and show the detail view: the CIS control ID, a description of the risk, the current repo setting, and the recommended remediation. This shows the depth of the scan.

---

### Step 3: Show OWASP Top 10 CI/CD Risks Findings

**Action:** Switch to the OWASP CI/CD Risk view and map findings to specific control IDs.

1. In the RSPM findings view, switch the framework filter to **OWASP Top 10 CI/CD Risks**.
2. Walk through the mapped findings:
   - **CICD-SEC-1 (Insufficient Flow Control)** -- ties back to missing branch protection and reviews
   - **CICD-SEC-2 (Inadequate IAM)** -- over-privileged admin access
   - **CICD-SEC-7 (Insecure System Configuration)** -- webhook misconfiguration, disabled security features
3. Show how each OWASP risk maps to one or more CIS control findings. Emphasize the cross-referencing.
4. Click into a specific OWASP risk to show the detailed description, affected entities, and recommended actions.

> **Talk Track:** "OWASP published the Top 10 CI/CD Security Risks specifically because the industry was ignoring toolchain security. Harness RSPM is one of the only tools that scans directly against this framework. Notice how CICD-SEC-1 maps to the same branch protection gap we saw in the CIS results -- you get a unified view across both frameworks."

---

### Step 4: Show Aggregated Risk Score

**Action:** Navigate to the RSPM summary view showing the aggregated risk score.

1. Return to the top-level RSPM view (or the SCS Dashboard RSPM section).
2. Show the **aggregated risk score** across all connected repositories and CI tools.
3. Point out:
   - Overall posture score (e.g., "62/100 -- Needs Improvement")
   - Breakdown by category: access control, branch protection, pipeline security, secret management
   - Trend over time (if multiple scans have run)
   - Comparison across repos if multiple are connected
4. If additional repos or CI tools (Jenkins, GitHub Actions) are connected, show how the score aggregates across all of them.

> **Talk Track:** "This is your single risk score across your entire software delivery toolchain -- not just code dependencies, but the repos, the CI systems, the webhooks, the access controls. Most supply chain security tools stop at scanning your package.json. Harness scans the infrastructure you use to build and deliver software."

> **Presenter Tip:** If the prospect has mentioned specific compliance mandates (FedRAMP, SOC2), tie the risk score back to audit readiness: "An auditor asking about your CI/CD security posture? This score and the findings behind it are your evidence."

---

### Step 5: Create a Remediation Tracker Entry from an RSPM Finding

**Action:** From an RSPM finding, create a Remediation Tracker entry.

1. Navigate back to the RSPM findings list.
2. Select the "Branch protection disabled on `main`" finding (Critical severity).
3. Click **Create Remediation Tracker** (or the equivalent action button).
4. In the tracker creation dialog:
   - **Title:** Auto-populated from the finding (e.g., "Enable branch protection on main branch")
   - **Severity:** Critical (inherited from the finding)
   - **Owner:** Assign to a team member or yourself
   - **SLA Deadline:** Set based on severity (e.g., Critical = 24 hours, High = 72 hours)
   - **Description:** Auto-populated with the CIS control reference and remediation guidance
5. Confirm creation and show the entry in the Remediation Tracker dashboard.
6. Show the tracker view: status (Open), owner, SLA countdown, linked finding.

> **Talk Track:** "From finding to tracked remediation in two clicks. The tracker automatically pulls in the CIS control reference, the severity, and the remediation guidance. You assign an owner, set an SLA, and now you have accountability. No more findings disappearing into a spreadsheet."

---

### Step 6: Show Auto-Created Jira Ticket from the Tracker

**Action:** From the Remediation Tracker entry, show the Jira integration.

1. In the Remediation Tracker entry created in Step 5, click **Create Jira Ticket** (or show that it was auto-created based on policy).
2. Show the Jira ticket details:
   - Summary matches the tracker title
   - Description includes the CIS control ID, OWASP risk mapping, current state, and remediation steps
   - Priority maps to the severity (Critical finding = Highest priority ticket)
   - Labels/components are auto-tagged (e.g., `supply-chain-security`, `rspm`)
3. Show the bidirectional link: the Harness tracker entry links to the Jira ticket, and the Jira ticket links back to the Harness finding.
4. Mention that as remediation progresses (e.g., branch protection is enabled and RSPM rescans), the tracker status and Jira ticket can be updated automatically.

> **Talk Track:** "Your developers live in Jira. RSPM findings do not help if they stay locked inside a security tool. Harness creates the Jira ticket automatically with all the context your developer needs -- the control ID, what is wrong, how to fix it, and the SLA deadline. When the fix is verified by the next RSPM scan, the loop closes."

> **Presenter Tip:** If time permits, actually fix the branch protection setting in GitHub (switch to the Settings tab, enable branch protection on `main`, require 1 reviewer). Then trigger a rescan or wait for the next scan cycle. Show the finding resolved and the tracker entry updated. This is the most powerful live demo moment for RSPM.

---

## Key Differentiators

Emphasize these points throughout the demo. These are the reasons RSPM stands apart from competitors:

| Differentiator | Explanation |
|---|---|
| Toolchain scanning, not just code scanning | Most supply chain tools (Snyk, Black Duck, Dependabot) focus on code dependencies. RSPM scans the repositories, CI/CD pipelines, and build tools themselves -- the infrastructure that delivers your software. |
| CIS + OWASP dual framework coverage | RSPM maps findings to both CIS Software Supply Chain Benchmarks and OWASP Top 10 CI/CD Risks. Competitors that offer any posture management typically cover only one framework. |
| Multi-tool aggregation | RSPM is not limited to GitHub. It aggregates posture across GitHub, GitLab, Bitbucket, Jenkins, and GitHub Actions through a single pane of glass. One risk score across your entire toolchain. |
| Finding-to-remediation workflow | RSPM findings flow directly into the Remediation Tracker with SLA tracking and Jira integration. No CSV exports, no manual ticket creation, no context lost in translation. |
| Read-only, non-invasive integration | RSPM uses read-only API connectors. It does not require agents, webhooks, or write access to your repositories or CI tools. This makes security team adoption frictionless. |
| Part of the Harness SCS platform | RSPM findings combine with SBOM data, SLSA provenance, and OPA policy enforcement in a single module. A CIS finding about missing artifact signing ties directly to your SLSA adoption status. |

---

## Handling Common Questions

| Question | Suggested Response |
|---|---|
| "How often does RSPM scan?" | RSPM scans on a configurable schedule (daily by default) and can also be triggered on-demand. Scan frequency can be adjusted per connector. |
| "Does RSPM require a GitHub App or just a PAT?" | RSPM works with a Personal Access Token (PAT) with read-only scopes. A GitHub App is also supported for organizations that prefer app-based authentication. |
| "Can RSPM auto-fix findings?" | RSPM identifies and tracks findings but does not auto-remediate (it uses read-only access). Remediation is manual or scripted by your team, tracked through the Remediation Tracker and Jira. |
| "What about GitLab or Bitbucket?" | RSPM supports GitLab and Bitbucket connectors with equivalent posture scanning. The CIS and OWASP framework mappings apply across all supported platforms. |
| "How does this compare to GitHub Advanced Security?" | GitHub Advanced Security focuses on code scanning (SAST, secret scanning, Dependabot). RSPM focuses on repository and CI/CD configuration posture -- a different and complementary layer. Harness RSPM also aggregates across multiple platforms, not just GitHub. |

---

## Post-Demo Cleanup

If you modified repository settings during the demo:

1. Decide whether to leave branch protection enabled (recommended for the repo's ongoing security).
2. If you need to reset to a misconfigured state for the next demo, disable branch protection and required reviews on `main`.
3. Document the current state in your demo environment notes so the next presenter knows the starting configuration.
