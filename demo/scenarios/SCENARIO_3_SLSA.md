# Scenario 3: SLSA Provenance L1-L3 & Artifact Signing

**Maps to:** Demo Skeleton Part 2, Section 5
**Duration:** ~5 minutes
**Audience:** Security Engineers, DevSecOps Architects, Platform Engineers, Compliance Officers

---

## Prerequisites

Before starting this scenario, ensure the following are in place:

- [ ] Harness project is configured with a CI pipeline that includes the SLSA Generation step (placed after Build & Push)
- [ ] The pipeline is configured to run on **Harness Cloud** infrastructure (required for SLSA Level 3)
- [ ] Cosign key pair is generated and stored as Harness file secrets (`cosign.key` / `cosign.pub`)
- [ ] Container registry connector is configured and the registry is accessible for showing `.att` and `.sig` tags
- [ ] The `require-slsa-attestation.rego` policy is active in the CD pipeline
- [ ] The `main` branch has clean dependencies (run `./demo/scripts/swap-vulnerable-dep.sh clean` if needed)
- [ ] Cosign CLI is installed locally for the verification step
- [ ] Demo environment is set up (run `./demo/scripts/setup-demo-env.sh` if starting fresh)

---

## SLSA Level Comparison Table

| Aspect | Level 1 | Level 2 | Level 3 |
|--------|---------|---------|---------|
| **Core Guarantee** | Provenance document exists | Provenance is signed by the build system | Build is tamper-proof; infrastructure is isolated |
| **Provenance** | Generated, but unsigned | Generated and cryptographically signed | Generated, signed, and produced on isolated infrastructure |
| **Build System Trust** | Self-reported | Authenticated by the build service | Authenticated + hermetic -- build steps cannot influence provenance generation |
| **Infrastructure** | Any CI system | Any CI system with signing capability | Ephemeral, isolated VMs; no persistent state between builds |
| **Tampering Protection** | None -- provenance can be forged | Forgery requires compromising the signing key | Forgery requires compromising the build infrastructure itself |
| **Harness Mechanism** | SLSA Generation step creates provenance JSON | Cosign attestation produces `.att` file in registry | Harness Cloud hosted builds: ephemeral VMs + OPA on CI stage templates |
| **Harness Requirement** | Any Harness CI infrastructure | Any Harness CI infrastructure + Cosign keys | **Harness Cloud hosted builds only** |

> **Presenter Tip:** Show this table (or the equivalent in the Harness documentation) at the start of the SLSA discussion. It anchors the audience on what each level actually guarantees and makes the L3 differentiation concrete.

---

## Key Differentiators to Highlight

- **Only vendor offering SLSA Level 3 natively:** Harness Cloud provides the ephemeral, isolated build infrastructure required for L3 -- no custom setup, no DIY VM orchestration
- **L3 hardening is automatic:** When you run on Harness Cloud, infrastructure isolation, non-privileged steps, and key separation are built in. Customers do not configure L3 -- they get it by using the platform.
- **Artifact signing is separate from attestation:** The `.sig` file (image signature) and `.att` file (provenance attestation) serve different purposes and are both stored in the registry. This distinction matters for supply chain verification at different trust boundaries.
- **CD-side verification gate:** The SLSA Verification step in the CD pipeline blocks deployment unless valid provenance is present. This closes the loop -- provenance is not just generated, it is enforced.
- **Standard-based:** Harness uses in-toto attestation framework and SLSA provenance predicates. The provenance is not a proprietary format -- it is interoperable with the broader SLSA ecosystem.

---

## Step-by-Step Walkthrough

### Step 1: Show the SLSA Generation Step in Pipeline Config

1. Open the CI pipeline YAML (`.harness/pipelines/ci-build.yaml`) or the Visual Pipeline Editor
2. Locate the **SLSA Generation** step -- it is placed immediately after the **Build & Push** step
3. Point out:
   - The step is a single pipeline step, not a custom script
   - It references the Cosign key pair stored as Harness secrets
   - It produces an in-toto attestation with a SLSA provenance predicate
4. Optionally show the step template at `.harness/templates/slsa-generation-step.yaml`

> **Presenter Tip:** Keep this step brief. The goal is to show that SLSA provenance is a configuration item, not a project. One step, a key pair, and Harness Cloud -- that is the entire setup.

**Talk Track:**
"Setting up SLSA provenance in Harness is one pipeline step and a key pair. There is no external infrastructure to manage, no provenance service to deploy. The SLSA Generation step sits right after the image build, and it produces a signed provenance document automatically."

---

### Step 2: Trigger a Build on Harness Cloud Infrastructure

Trigger the CI pipeline, ensuring it runs on Harness Cloud:

```bash
./demo/scripts/trigger-pipeline.sh --pipeline ci-build --branch main
```

> **Presenter Tip:** While the build runs, emphasize that Harness Cloud is the key enabler for Level 3. Each build gets a fresh, ephemeral VM that is destroyed after the build completes. There is no persistent state, no shared filesystem, no way for one build to tamper with another.

**Talk Track:**
"This build is running on Harness Cloud -- a fully managed, ephemeral build environment. Every build gets its own VM, spun up on demand and destroyed when the build finishes. This is the infrastructure isolation that SLSA Level 3 requires, and it is built into the platform."

---

### Step 3: Show the Generated Provenance Payload

Once the build completes:

1. Navigate to the **Supply Chain** tab in the pipeline execution
2. Open the **SLSA Provenance** section
3. Walk through the provenance fields:

| Provenance Field | What It Contains | Why It Matters |
|-----------------|-----------------|----------------|
| **Repository** | The source repo URL (e.g., `github.com/org/harnessdemo-supply-chain-security`) | Proves the artifact was built from a specific codebase |
| **Branch** | The branch that triggered the build (e.g., `main`) | Proves the build came from a controlled branch, not an ad-hoc commit |
| **Commit SHA** | The exact commit hash | Immutable link between artifact and source code |
| **Builder ID** | The Harness build system identifier | Proves which build system produced the artifact |
| **Trigger** | What initiated the build (push, PR, manual, scheduled) | Audit trail for build provenance |
| **Timestamp** | When the build occurred | Temporal proof for compliance and forensics |

> **Presenter Tip:** If the audience is deeply technical, offer to show the raw JSON provenance payload. The in-toto envelope structure with the SLSA predicate type is a strong credibility signal for teams evaluating SLSA compliance.

**Talk Track:**
"This provenance document answers the fundamental questions: Where did this artifact come from? Who built it? What source code went in? When was it built? And critically -- can we trust that this information has not been tampered with? The answer, at Level 3, is yes."

---

### Step 4: Explain SLSA Levels (L1 -> L2 -> L3)

Walk the audience through the progression:

**Level 1 -- Provenance Exists:**
- The SLSA Generation step creates a provenance JSON document
- This alone is valuable for audit trails but offers no tamper protection
- Analogy: "A receipt exists, but anyone could have written it"

**Level 2 -- Provenance Is Signed:**
- The provenance is wrapped in a Cosign attestation and cryptographically signed
- The `.att` file in the container registry contains the signed provenance
- Forgery now requires compromising the signing key
- Analogy: "A notarized receipt -- you know who signed it"

**Level 3 -- Tamper-Proof, Isolated Infrastructure:**
- The build runs on an ephemeral VM that is destroyed after completion
- Build steps run in non-privileged containers with no volume mounts
- OPA policies enforce CI stage template constraints -- build steps cannot access the signing key
- Even a compromised build step cannot forge provenance
- Analogy: "A notarized receipt produced in a sealed room with cameras -- you know it was not tampered with"

**Talk Track:**
"Level 1 says provenance exists. Level 2 says it is signed. Level 3 says even if an attacker compromises your build step -- injects malicious code, modifies a dependency -- they still cannot forge the provenance. The build infrastructure itself is isolated, and the signing key is inaccessible to build steps. This is the SolarWinds defense: even if the pipeline is compromised, the provenance remains trustworthy."

---

### Step 5: Explain L3 Hardening Mechanics

Go deeper on the three mechanisms that enable Level 3:

**1. Ephemeral VM per Build Run**
- Every build gets a brand-new VM on Harness Cloud
- The VM is created on demand and destroyed after the build finishes
- No persistent filesystem, no shared state, no leftover artifacts from previous builds
- This eliminates the risk of cross-build contamination or persistent implants

**2. OPA Enforcement on CI Stage Templates**
- Harness enforces OPA policies on the CI stage definition itself (not just on SBOM data)
- Build steps must run as non-privileged containers
- No volume mounts are permitted -- build steps cannot access host paths
- This prevents build steps from reaching the signing key or modifying the provenance generation process

**3. Build Steps Cannot Access the Signing Key**
- The Cosign private key is stored as a Harness platform secret
- The SLSA Generation step runs in a separate, platform-managed context
- User-defined build steps have no mechanism to read the key or inject data into the attestation
- Result: even a malicious build step cannot sign a forged provenance document

> **Presenter Tip:** This is where skeptical security architects will lean in. Be prepared to discuss the threat model: "What if a build step tries to exfiltrate the key? What if someone modifies the pipeline YAML?" The answers are: the key is not accessible to build steps (platform isolation), and pipeline changes are governed by Harness RBAC and Git-based audit trails.

**Talk Track:**
"This is the part that matters most to security architects. Level 3 is not just a label -- it is a specific set of hardening guarantees. Fresh VM every time, no privileged access, no volume mounts, and the signing key is behind a wall that build code cannot reach. If your build step gets compromised -- like in the SolarWinds attack -- the provenance still tells the truth."

---

### Step 6: Show the `.att` Attestation File in the Container Registry

Navigate to the container registry and show:

1. The container image tag (e.g., `supplywatch/backend:42`)
2. The `.att` tag stored alongside it -- this is the in-toto envelope containing the SLSA provenance predicate
3. Explain the structure:
   - **Outer layer:** Cosign attestation (digital signature)
   - **Middle layer:** in-toto envelope (attestation framework standard)
   - **Inner layer:** SLSA provenance predicate (the actual provenance data)

> **Presenter Tip:** Distinguish this from the SBOM attestation shown in Scenario 1. The SBOM `.att` contains the component inventory; the SLSA `.att` contains the build provenance. Both are signed, both are stored in the registry, but they serve different trust questions.

**Talk Track:**
"This `.att` file is the provenance attestation. It is distinct from the SBOM attestation we saw earlier. The SBOM tells you what is inside the artifact. The SLSA provenance tells you how, where, when, and by whom the artifact was built. Together, they form a complete chain of trust."

---

### Step 7: Show Artifact Signing (`.sig` File)

Still in the container registry, show:

1. The `.sig` tag stored alongside the image digest
2. Explain that this is the **artifact signature** -- separate from the attestation
3. The `.sig` file proves that the image content has not been modified since it was signed
4. The `.att` file proves provenance metadata about the build
5. Both are signed with the same Cosign key pair but serve different verification purposes

| Registry Tag | Type | What It Proves |
|-------------|------|---------------|
| `supplywatch/backend:42` | Container image | The application artifact |
| `sha256-<digest>.att` | Attestation(s) | SBOM content, SLSA provenance, build metadata |
| `sha256-<digest>.sig` | Signature | Image content integrity -- the bits have not changed |

**Talk Track:**
"The signature and the attestation are complementary. The signature says 'these exact bits were produced by our build system.' The attestation says 'here is the full provenance of how those bits were produced.' A downstream consumer can verify both independently."

---

### Step 8: Demonstrate Verification Against the Public Key

Run the verification script:

```bash
./demo/scripts/verify-attestation.sh <image:tag>
```

For example:

```bash
./demo/scripts/verify-attestation.sh supplywatch/backend:42
```

The script performs four checks:

1. **Image Signature Verification** -- validates the `.sig` against the public key
2. **SBOM Attestation Verification** -- validates the SBOM `.att` (CycloneDX or SPDX)
3. **SLSA Provenance Attestation Verification** -- validates the SLSA `.att` and extracts provenance metadata
4. **Attestation Tree** -- displays all attestations attached to the image

If all checks pass, the output shows a green summary. If any check fails, the specific failure is highlighted in red.

> **Presenter Tip:** Run this live in the terminal. After the verification passes, scroll back up to the SLSA provenance metadata that the script extracts and displays. Showing the raw provenance JSON (repository, commit, builder ID) alongside the verification result is a powerful proof point.

**Talk Track:**
"Anyone with the public key can run this verification. Your security team, your customers, a downstream CD pipeline, or an external auditor. The trust chain is fully transparent and independently verifiable."

---

### Step 9: Show the SLSA Verification Step in the CD Pipeline

1. Open the CD pipeline configuration (`.harness/pipelines/cd-deploy.yaml`)
2. Locate the **SLSA Verification** step -- it is placed before the deployment step
3. Show that the `require-slsa-attestation.rego` policy is enforced here:
   - Denies deployment if SLSA provenance attestation is missing
   - Denies deployment if the attestation is not signed
   - Denies deployment if required provenance fields (builder ID, repository, commit) are absent
   - Warns (but does not block) if the SLSA level is below 3

4. Explain the scenario: an artifact built on a non-Harness-Cloud runner (Level 1 or 2) would trigger the warning. An artifact with no provenance at all would be blocked entirely.

> **Presenter Tip:** If time allows, show what happens when an artifact without SLSA provenance hits the CD gate. The deployment is blocked with a clear message: "SLSA provenance attestation is MISSING." This is the enforcement side of the trust chain.

**Talk Track:**
"Generating provenance is half the story. The other half is enforcing it. This CD pipeline step verifies that every artifact has valid SLSA provenance before it can be deployed to staging or production. No attestation, no deployment. This is the gate that would have caught a SolarWinds-style attack -- a tampered artifact without legitimate provenance gets stopped at the door."

---

### Step 10: Show the Supply Chain Tab Summary

1. Return to the pipeline execution and open the **Supply Chain** tab
2. Show the **SLSA Attestation Status**: verified, signed, Level 3
3. Show the **downloadable provenance file**: the audience can download the raw in-toto envelope for offline verification or archival
4. Point out that the Supply Chain tab aggregates all evidence from this execution:
   - SBOM (from Scenario 1)
   - Policy evaluation results (from Scenario 2)
   - SLSA provenance and verification status (this scenario)
   - Artifact signature status

> **Presenter Tip:** Zoom out and show the full Supply Chain tab as a "compliance evidence package." Every build produces this body of evidence automatically. For audit-heavy organizations, this is the differentiator -- no manual evidence collection, no spreadsheets.

**Talk Track:**
"Every single build produces this complete evidence package: a scored SBOM, policy evaluation results, SLSA provenance at Level 3, artifact signatures, and verification records. When your auditor asks for proof of build integrity, you hand them a link. When your customer asks for an SBOM, you hand them a link. This is not something a team builds once for an audit and then neglects -- it is generated on every build, automatically, as part of your pipeline."

---

## Common Audience Questions

**Q: "What if we are not using Harness Cloud? Can we still get SLSA provenance?"**
A: Yes. You can achieve SLSA Level 1 (provenance exists) and Level 2 (signed provenance) on any Harness CI infrastructure, including self-managed runners. Level 3 requires Harness Cloud because of the ephemeral VM and infrastructure isolation guarantees.

**Q: "How does SLSA provenance help us in a real attack scenario?"**
A: In a SolarWinds-style attack, the attacker compromises the build pipeline to inject malicious code. With SLSA L3, even if the build step is compromised, the provenance is generated by an isolated platform component that the attacker cannot influence. Downstream consumers can verify that the provenance is authentic and detect that the artifact does not match expected build parameters.

**Q: "Is the provenance format proprietary?"**
A: No. Harness uses the in-toto attestation framework with SLSA provenance predicates -- both are open standards. The provenance can be verified with standard Cosign tooling, not just within Harness.

**Q: "Can we use Sigstore Rekor for public transparency logging?"**
A: Yes. Harness supports optional integration with Sigstore Rekor for public transparency logs. This adds a public, append-only record of every attestation -- useful for open-source projects or organizations that want maximum transparency.

**Q: "What is the performance impact of adding SLSA Generation to the pipeline?"**
A: The SLSA Generation step typically adds 10-30 seconds to the pipeline. The provenance document is small (a few KB of JSON), and signing is fast. The ephemeral VM overhead is part of the Harness Cloud build infrastructure, not an additional cost of SLSA specifically.

---

## Closing the Demo

If this is the final scenario, close with the full supply chain security narrative:

"We have walked through the three pillars of Harness Supply Chain Security. First, we generate and score SBOMs on every build -- a complete, quality-rated inventory of every component in your artifacts. Second, we enforce OPA policies on that inventory at both build time and deploy time -- blocking vulnerable and non-compliant components before they reach production. Third, we generate SLSA Level 3 provenance that proves your artifacts were built from trusted source code, on trusted infrastructure, in a tamper-proof environment. All of this happens inside your existing CI/CD pipeline, with no additional tools to deploy, no separate dashboards to maintain, and a complete audit trail on every build. That is the Harness SCS platform advantage."
