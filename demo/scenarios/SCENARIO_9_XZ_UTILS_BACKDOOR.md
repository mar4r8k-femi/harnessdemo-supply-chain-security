# Scenario 9: xz-utils/liblzma Backdoor -- Social Engineering Supply Chain Attack (CVE-2024-3094)

**Maps to:** Demo Skeleton Part 2, Section 6 (Zero-Day Response) & Part 1, Section 1 (Problem Framing)
**Duration:** 10--15 minutes
**Audience:** Security Engineers, DevSecOps Architects, Platform Engineers, CISOs

---

## Overview

This scenario demonstrates how Harness SCS detects and responds to one of the most sophisticated supply chain attacks ever discovered -- the xz-utils/liblzma backdoor (CVE-2024-3094, CVSS 10.0). You will walk through how SBOM scanning identifies containers running compromised versions of xz-utils, how OPA policies block affected artifacts, and how the Remediation Tracker maps the blast radius across your container fleet.

This is a fundamentally different attack from Log4Shell (Scenario 4) or tj-actions (Scenario 8). Those exploited code vulnerabilities or compromised accounts. The xz-utils backdoor was planted by an attacker who *became a trusted maintainer* over the course of two years. It demonstrates that even verified provenance and legitimate commit history are not sufficient defenses when the maintainer themselves is the threat actor.

> **Presenter Tip:** The xz-utils backdoor was discovered on March 29, 2024, by Andres Freund (a Microsoft engineer) who noticed anomalous SSH login latency. It was days away from shipping in stable Linux distributions. This near-miss makes it one of the most compelling supply chain attack stories available -- use it to anchor the "why SBOM + policy enforcement" argument. For detailed technical background and Harness-specific guidance, see: [harness.io/blog/xz-utils-cve-2024-3094-block-and-remediate-with-harness-ssca](https://harness.io/blog/xz-utils-cve-2024-3094-block-and-remediate-with-harness-ssca)

---

## The Attack: What Happened

In early 2024, the open-source community discovered that xz-utils versions 5.6.0 and 5.6.1 contained a deliberately planted backdoor. The attack unfolded over more than two years:

1. A contributor using the identity "Jia Tan" began submitting legitimate patches to the xz-utils project in late 2021
2. Over 2+ years, Jia Tan built trust through sustained, high-quality contributions and gradually became a co-maintainer of the project
3. Jia Tan then injected a backdoor through **modified build scripts** (not directly in source code) and **malicious binary test fixture files** committed to the repository
4. The backdoor targeted **liblzma**, the compression library bundled with xz-utils, which is linked by OpenSSH on many Linux distributions via systemd
5. The malicious code hijacked OpenSSH's authentication routines through **glibc IFUNC** (indirect function) resolution, enabling **unauthorized remote SSH access** to affected systems
6. The backdoor was designed to activate only under specific conditions (x86-64 Linux, linked via systemd), making it extremely difficult to detect through normal testing

**Key insight:** This was not a hack. The attacker did not compromise an account or exploit a vulnerability. They *became the maintainer*. The commits were signed, the contributor had a years-long history of legitimate work, and the code passed review. This is a social engineering attack against the open-source trust model itself.

---

## Affected Versions and Distributions

| Status | Versions / Distributions |
|---|---|
| **Compromised versions** | xz-utils 5.6.0, xz-utils 5.6.1 |
| **Affected distributions** | Fedora 41, Fedora Rawhide, Debian testing/unstable/experimental, Kali Linux, openSUSE Tumbleweed, SUSE (select versions), Alpine edge |
| **NOT affected** | Amazon Linux, Ubuntu (stable), RHEL, Debian stable, Fedora 40 and below |
| **Safe versions** | xz-utils 5.4.x and below |

> **Presenter Tip:** The reason stable distributions were not affected is that 5.6.0/5.6.1 had only recently been released and had not yet been promoted to stable channels. The attack was caught just in time -- Fedora 41 was weeks away from including it in a stable release.

---

## Blast Radius: Common Base Images

The following table shows which common container base images are at risk of bundling the compromised xz-utils versions. Use this during the demo to illustrate the blast radius.

| Base Image | Default xz-utils Version | Affected? | Notes |
|---|---|---|---|
| `alpine:edge` (at time of CVE) | 5.6.1 | **Yes** | Alpine edge tracks upstream aggressively |
| `alpine:3.19` (stable) | 5.4.x | No | Stable Alpine uses older xz-utils |
| `debian:trixie` (testing) | 5.6.1 | **Yes** | Debian testing/unstable picked up 5.6.x |
| `debian:bookworm` (stable) | 5.4.1 | No | Debian stable was not affected |
| `fedora:41` / `fedora:rawhide` | 5.6.1 | **Yes** | Fedora Rawhide adopted 5.6.x early |
| `fedora:40` | 5.4.x | No | Fedora 40 shipped before 5.6.0 release |
| `ubuntu:24.04` (noble) | 5.4.x | No | Ubuntu did not promote 5.6.x to stable |
| `amazonlinux:2023` | 5.4.x | No | Amazon Linux uses conservative versioning |

> **Talk Track:** "If your containers are built on Alpine edge, Debian testing, or Fedora Rawhide, you may be running the backdoored version right now. Stable distributions were not affected -- but how many teams use 'latest' or rolling-release base images in development? That is the blast radius we need to assess."

---

## Prerequisites

Before you begin, confirm the following:

- [ ] The SupplyWatch demo environment is running (`./demo/scripts/setup-demo-env.sh`)
- [ ] At least one container artifact built on an affected base image (e.g., `alpine:edge`, `debian:trixie`, or `fedora:rawhide`) has been indexed with an SBOM in Harness SCS
- [ ] SBOM Orchestration and SBOM Policy Enforcement steps are configured in the relevant pipelines
- [ ] OPA policies are loaded: `.harness/policies/deny-vulnerable-versions.rego` and `.harness/policies/deny-blocked-components.rego`
- [ ] Jira integration is configured in the Harness project
- [ ] You are familiar with the xz-utils attack timeline (review the Harness blog post linked above)

---

## Step 1: Scene Setting

> **Talk Track:** "It is late March 2024. A Microsoft engineer named Andres Freund notices that SSH logins on his Debian testing machine are taking 500 milliseconds longer than usual. He investigates and discovers something extraordinary: a backdoor has been deliberately planted in xz-utils, a compression library that ships with virtually every Linux distribution. The backdoor gives an attacker unauthorized remote SSH access to any affected system. CVE-2024-3094 is assigned with a CVSS score of 10.0 -- the maximum.

> But here is what makes this attack different from anything we have seen before. This was not a stolen credential. This was not a compromised CI pipeline. The attacker -- using the identity 'Jia Tan' -- spent over two years contributing legitimate code to the xz-utils project. They earned commit access. They became a trusted maintainer. Then they used that trust to inject a backdoor through modified build scripts and malicious test files that would never be flagged by a code review.

> This is the nightmare scenario for open source: the maintainer *is* the attacker. Let me show you how Harness SCS detects this, even when the provenance looks perfectly legitimate."

---

## Step 2: Show the Compromised Component in SBOM

Navigate to **Supply Chain Security > Artifacts** in the Harness UI.

1. Select a container artifact built on an affected base image (e.g., one using `alpine:edge` or `debian:trixie`)
2. Open the **SBOM** tab for the artifact
3. Search for `xz-utils` or `liblzma` in the component list
4. Highlight the entry showing `xz-utils@5.6.1` (or `5.6.0`)
5. Show the component metadata: package name, version, supplier, and any associated CVE data

> **Talk Track:** "Here is the artifact's SBOM -- the full inventory of every component inside this container. And there it is: xz-utils version 5.6.1. This is the backdoored version. Without an SBOM, you would have no way to know this component exists in your container, let alone that it is compromised. The SBOM makes the invisible visible."

---

## Step 3: OPA Policy Blocking

Show that the OPA policy `deny-blocked-components.rego` includes a rule blocking xz-utils 5.6.0 and 5.6.1.

1. Navigate to the **Policy Management** section in Harness
2. Open the `deny-blocked-components.rego` policy
3. Show the entry that blocks `xz-utils` versions `5.6.0` and `5.6.1` with the CVE-2024-3094 reference
4. Trigger a pipeline build using the affected artifact
5. Show the SBOM Policy Enforcement step failing with the violation message:

   ```
   BLOCKED COMPONENT VERSION: 'xz-utils@5.6.1' is on the blocked versions list.
   Blocked by CVE-2024-3094 (xz-utils backdoor, CVSS 10.0). Downgrade to 5.4.x.
   ```

> **Talk Track:** "The moment CVE-2024-3094 was published, the security team added xz-utils 5.6.0 and 5.6.1 to the OPA block policy. Now any pipeline that tries to build or deploy a container with those versions is stopped cold. This is not a warning in a dashboard -- it is a hard gate in the pipeline. Nothing ships until the component is clean."

---

## Step 4: Remediation Tracker -- Map the Blast Radius

1. Navigate to **Supply Chain Security > Remediation Tracker**
2. Click **Create New Tracker**
3. Enter the CVE identifier: `CVE-2024-3094`
4. Set severity to **Critical** (CVSS 10.0)
5. Harness auto-populates all affected artifacts by scanning SBOMs across the organization

Walk through the blast radius:

| Environment | Artifact | Component | Version | Base Image | Status |
|---|---|---|---|---|---|
| Dev | api-service:build-87 | xz-utils | 5.6.1 | alpine:edge | Vulnerable |
| Dev | worker:build-34 | xz-utils | 5.6.1 | debian:trixie | Vulnerable |
| Staging | api-service:build-87 | xz-utils | 5.6.1 | alpine:edge | Vulnerable |
| Prod | -- | -- | -- | -- | Not affected |

> **Talk Track:** "The Remediation Tracker instantly shows us every artifact in the organization that contains xz-utils 5.6.0 or 5.6.1. In this case, our Dev and Staging environments have affected containers because they use rolling-release base images. Production is clean because it uses stable base images -- but that is luck, not strategy. Let me show you how we fix this systematically."

---

## Step 5: Assign Ownership and Set SLA

1. Select each affected artifact in the Remediation Tracker
2. Assign owners (e.g., `@platform-team` for base image updates)
3. Set the SLA deadline: **24 hours** (Critical severity)
4. Show the MTTR clock starting for each artifact

> **Talk Track:** "Every affected artifact now has a named owner and a ticking SLA clock. This is how you turn a zero-day from chaos into a managed process."

---

## Step 6: One-Click Jira Ticket Creation

1. From the Remediation Tracker, click **Create Jira Ticket** on the affected artifacts
2. Show the pre-populated ticket containing:
   - CVE-2024-3094 details and CVSS score
   - Affected artifact name, tag, and digest
   - Environment and deployment information
   - Remediation guidance: downgrade xz-utils to 5.4.x
   - SLA deadline
3. Point out bidirectional sync between Jira and the Remediation Tracker

> **Talk Track:** "The developer gets a Jira ticket with everything they need: the CVE, the affected artifact, the environment, and the exact remediation step. When they close the ticket, the Remediation Tracker updates automatically. No manual status syncing."

---

## Step 7: Remediation -- Downgrade to Safe Version

Walk through the remediation approach:

1. **For Alpine-based images:** Update the Dockerfile to use `alpine:3.19` (stable) instead of `alpine:edge`, or explicitly pin xz-utils:
   ```dockerfile
   RUN apk add --no-cache xz=5.4.5-r0
   ```

2. **For Debian-based images:** Switch from `debian:trixie` to `debian:bookworm` (stable), or pin the package:
   ```dockerfile
   RUN apt-get update && apt-get install -y xz-utils=5.4.1-0.2
   ```

3. **For Fedora-based images:** Switch from `fedora:rawhide` to `fedora:40`, or downgrade:
   ```dockerfile
   RUN dnf downgrade -y xz-5.4.4
   ```

4. Trigger a new pipeline build after the Dockerfile change
5. Show the SBOM Policy Enforcement step **passing** with the safe version
6. Show the Remediation Tracker updating the artifact status to **Remediated**

> **Talk Track:** "The fix is straightforward: downgrade to xz-utils 5.4.x using your distribution's package manager. But the real lesson here is about base image hygiene. Rolling-release base images in production are a liability. Pin your base images to stable releases and use SBOM scanning to verify what is inside them."

---

## Step 8: Tie It All Together -- Why This Matters

> **Talk Track:** "Let me explain why this scenario is the most important one in the entire demo.
>
> Every other supply chain attack we have looked at -- Log4Shell, tj-actions, Lodash -- could theoretically be prevented with better credential management, SHA pinning, or faster patching. The xz-utils backdoor is different. The attacker did not steal anything. They did not exploit a vulnerability. They *became the maintainer*. The commits were legitimate. The contributor had a two-year track record. The code passed review.
>
> This means **provenance alone is not enough**. You can verify that the code came from the official maintainer, and still be compromised -- because the maintainer is the attacker. You can verify the build was reproducible, and still be compromised -- because the backdoor was in the build scripts.
>
> What catches this? **SBOM + policy enforcement.** Regardless of who wrote the code or how it was built, the SBOM tells you exactly what is in the artifact. And the OPA policy blocks it the moment a CVE is published. Trust is necessary but insufficient. You need runtime verification of every component in every artifact. That is what Harness SCS provides."

---

## Key Differentiators to Highlight

| Capability | Harness SCS | Typical Competitor |
|---|---|---|
| **SBOM-based component detection** | Identifies xz-utils version in any container artifact via SBOM inventory | Relies on vulnerability scanner DB updates; may miss OS-level packages |
| **OPA policy for OS-level packages** | Block specific versions of system packages (xz-utils, glibc, openssl) across all pipelines | Typically limited to application dependencies (npm, Maven, pip) |
| **Blast radius across environments** | Shows exactly which environments and artifacts contain the affected component | Flat list of images with no environment context |
| **Remediation Tracker with SLA** | Full lifecycle management with ownership, SLA, MTTR tracking, and Jira sync | Manual spreadsheet or ticket triage |
| **Base image visibility** | SBOM reveals components bundled in base images that developers never explicitly install | No visibility into inherited base image components |

---

## Anticipated Questions

- *"How does Harness SCS detect xz-utils if the developer never explicitly installed it?"* -- SBOM Orchestration generates a complete inventory of the container, including OS-level packages inherited from the base image. xz-utils is a system dependency bundled by the distribution -- it appears in the SBOM even though no developer added it to a requirements file.

- *"Could SLSA attestations have prevented this?"* -- No. SLSA verifies that the artifact was built from the claimed source using the claimed process. In this case, the source *was* the official repository and the build *was* the official process -- the maintainer who planted the backdoor controlled both. SLSA attestations would have passed. This is exactly why SBOM + policy enforcement is a necessary complement to provenance verification.

- *"Was this a state-sponsored attack?"* -- The attribution is not definitively confirmed, but the sophistication, patience (2+ years of social engineering), and the target (SSH authentication on Linux systems) strongly suggest a state-level actor. The U.S. CISA issued an alert. Regardless of attribution, the attack pattern is now a known playbook that other actors can replicate.

- *"Are we safe if we only use Ubuntu or Amazon Linux?"* -- For this specific CVE, yes -- those distributions did not ship xz-utils 5.6.x. But the attack pattern applies universally. Any distribution-level package can be targeted the same way. The defense is not choosing the right distribution -- it is having SBOM visibility and policy enforcement for every component in every artifact.

- *"How do we prevent this from happening again with a different package?"* -- You cannot prevent a trusted maintainer from going rogue. What you can do is: (1) generate SBOMs for every artifact so you know exactly what is inside, (2) enforce OPA policies that block known-compromised versions within minutes of CVE disclosure, and (3) use the Remediation Tracker to manage response across your entire fleet. Detection and response speed is the defense.

- *"What about scanning at deploy time vs. build time?"* -- Harness SCS enforces policies at both build time (SBOM Policy Enforcement step) and can gate deployments. For a CVSS 10.0 like this, you want both. Block new builds immediately, and use the Remediation Tracker to identify and redeploy existing affected environments.

---

## References

- **Harness Blog:** [xz-utils CVE-2024-3094: Block and Remediate with Harness SSCA](https://harness.io/blog/xz-utils-cve-2024-3094-block-and-remediate-with-harness-ssca)
- **NVD Entry:** [CVE-2024-3094](https://nvd.nist.gov/vuln/detail/CVE-2024-3094)
- **CISA Alert:** [Reported Supply Chain Compromise Affecting XZ Utils](https://www.cisa.gov/news-events/alerts/2024/03/29/reported-supply-chain-compromise-affecting-xz-utils-data-compression-library-cve-2024-3094)
