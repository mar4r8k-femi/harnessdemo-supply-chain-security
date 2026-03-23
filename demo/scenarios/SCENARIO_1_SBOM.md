# Scenario 1: SBOM Generation, Scoring & Attestation

**Maps to:** Demo Skeleton Part 2, Section 3
**Duration:** ~7 minutes
**Audience:** Security Engineers, DevSecOps Architects, Compliance Officers

---

## Prerequisites

Before starting this scenario, ensure the following are in place:

- [ ] Harness project is configured with a CI pipeline that includes the SBOM Orchestration step
- [ ] Container registry connector is configured (DockerHub, ECR, GAR, or ACR)
- [ ] Cosign key pair is generated and stored as Harness file secrets (`cosign.key` / `cosign.pub`)
- [ ] The `main` branch has clean dependencies (run `./demo/scripts/swap-vulnerable-dep.sh clean` if needed)
- [ ] Demo environment is set up (run `./demo/scripts/setup-demo-env.sh` if starting fresh)
- [ ] Cosign CLI is installed locally for the verification step

---

## Key Differentiators to Highlight

- **Dual format support:** Harness natively generates both CycloneDX and SPDX SBOMs -- no third-party tooling required
- **SBOM Scoring:** Out-of-the-box quality scoring against NTIA minimum elements -- most competitors only generate SBOMs without evaluating their completeness
- **Attestation built in:** Cosign-based SBOM attestation is a pipeline checkbox, not a custom scripting exercise
- **Bring-your-own SBOM:** Customers already using Syft, Grype, or other tools can ingest existing SBOMs and still get policy enforcement, scoring, and drift detection on top
- **CI + CD coverage:** SBOM generation is available in both Build and Deploy stages -- captures component inventory at both build time and deployment time

---

## Step-by-Step Walkthrough

### Step 1: Trigger a CI Build on `main`

Trigger the CI pipeline on the `main` branch. You can do this from the Harness UI or via the helper script:

```bash
./demo/scripts/trigger-pipeline.sh --pipeline ci-build --branch main
```

> **Presenter Tip:** While the build runs, use the wait time to set context. Explain that the SBOM Orchestration step is placed after the Docker Build & Push step -- it analyzes the built container image to produce a complete component inventory.

**Talk Track:**
"We are kicking off a standard CI build. Harness SCS hooks into this pipeline natively -- there is no separate tool to configure, no sidecar to deploy. The SBOM generation happens as a first-class pipeline step, right after the container image is built."

---

### Step 2: Navigate to the Supply Chain Tab in Pipeline Execution

Once the build completes:

1. Open the pipeline execution in the Harness UI
2. Click the **Supply Chain** tab at the top of the execution view
3. This tab aggregates all SCS artifacts produced during this execution: SBOMs, attestations, policy evaluation results, and SLSA provenance

> **Presenter Tip:** Point out that the Supply Chain tab is a dedicated experience -- security engineers do not need to dig through build logs to find compliance evidence. Everything is structured and exportable.

**Talk Track:**
"Notice this is not buried in build logs. Harness gives supply chain data a first-class home. Your security team can come here, download what they need for an audit, and never touch the CI configuration."

---

### Step 3: Walk Through the Generated SBOM

Open the generated SBOM from the Supply Chain tab. Walk the audience through the key fields:

| Field | What to Show | Why It Matters |
|-------|-------------|----------------|
| **Component Name** | e.g., `lodash`, `express`, `react` | Identifies every dependency in the artifact |
| **Version** | e.g., `4.17.21`, `4.19.2` | Enables version-specific vulnerability matching |
| **Supplier** | e.g., `lodash contributors` | Required by NTIA minimum elements |
| **PURL** | e.g., `pkg:npm/lodash@4.17.21` | Package URL -- the universal identifier for policy matching |
| **License** | e.g., `MIT`, `Apache-2.0` | Critical for license compliance enforcement |

**Walk through normalization:** Explain that Harness normalizes component metadata across ecosystems (npm, Maven, pip, Go modules) into a consistent structure. A Java JAR from Maven Central and an npm package from the registry both produce structured, queryable component records.

> **Presenter Tip:** If the audience is technical, click into a specific component and show the raw JSON. If the audience is executive-level, stay at the summary view and emphasize the compliance-ready structure.

**Talk Track:**
"Every component in this container image is cataloged with its name, version, supplier, license, and a Package URL. This is not just a flat list -- it is a structured, machine-readable inventory that policies can evaluate automatically."

---

### Step 4: Highlight Dual Format Support (CycloneDX and SPDX)

Point out that:

- The **backend** service is configured to produce CycloneDX format SBOMs
- The **frontend** service is configured to produce SPDX format SBOMs
- Both formats are fully supported -- Harness does not force customers into one standard

**Talk Track:**
"Your organization might have customers requiring SPDX, a compliance team that prefers CycloneDX, or both. Harness supports both formats natively. You pick the format per artifact, and all downstream features -- scoring, policy enforcement, drift detection -- work identically regardless of format."

---

### Step 5: Show the SBOM Score

Navigate to the SBOM score panel within the Supply Chain tab. Walk through each scoring dimension:

| Scoring Dimension | What It Measures |
|-------------------|-----------------|
| **NTIA Minimum Elements Compliance** | Does the SBOM contain all fields mandated by NTIA (supplier, component name, version, unique identifier, dependency relationships, author, timestamp)? |
| **Structural Completeness** | Are component relationships properly expressed? Are there orphaned entries or missing dependency trees? |
| **License Data Quality** | Are licenses expressed using valid SPDX identifiers? Are there components with missing or ambiguous license data? |
| **Component Identifiability** | Does every component have a PURL or CPE? Can each component be uniquely identified for vulnerability matching? |

> **Presenter Tip:** If the score is not 100%, that is actually a good thing for the demo. Point to the gaps and explain how the score guides teams toward higher-quality SBOMs over time.

**Talk Track:**
"Generating an SBOM is step one. But a low-quality SBOM is almost as bad as no SBOM at all -- if components are missing identifiers or licenses are ambiguous, you cannot enforce policy on them. The SBOM Score tells you exactly where the gaps are."

---

### Step 6: Highlight Compliance Readiness

Connect the SBOM and score to real-world compliance requirements:

- **US Executive Order 14028:** Requires software vendors selling to the federal government to provide SBOMs. The SBOM + NTIA minimum elements score together prove compliance.
- **Customer SBOM audit requirements:** Enterprise customers increasingly request SBOMs as part of vendor security assessments. Harness produces audit-ready artifacts, not raw data dumps.
- **NIST SSDF (SP 800-218):** The Secure Software Development Framework references SBOM generation as a key practice. Harness SCS maps directly to SSDF tasks PS.3.1 and PS.3.2.

**Talk Track:**
"This is not a nice-to-have anymore. Executive Order 14028 made SBOMs a requirement for federal procurement. Enterprise customers are following suit. With Harness, you are not scrambling to produce an SBOM when the auditor calls -- it is generated, scored, attested, and stored on every single build, automatically."

---

### Step 7: Show the `.att` Attestation File in the Container Registry

Navigate to the container registry (DockerHub, ECR, or whichever is configured). Show:

1. The container image digest (e.g., `sha256:abc123...`)
2. The `.att` attestation tag stored alongside the image
3. Explain that this is a Cosign attestation wrapping the SBOM in an in-toto envelope
4. The attestation is cryptographically signed -- it cannot be tampered with after creation

> **Presenter Tip:** If you have registry UI access, show the tag list side by side: the image tag, the `.att` tag, and (if SLSA is also configured) the `.sig` tag. This visual makes the artifact integrity story tangible.

**Talk Track:**
"The SBOM is not just stored in Harness -- it is attested and pushed to the container registry alongside the image itself. Anyone pulling this image can independently verify that the SBOM was generated by a trusted build system and has not been modified."

---

### Step 8: Demonstrate Cosign Verification

Run the verification script from the repository root:

```bash
./demo/scripts/verify-attestation.sh <image:tag>
```

For example:

```bash
./demo/scripts/verify-attestation.sh supplywatch/backend:42
```

The script will:

1. Verify the image signature (`.sig`)
2. Verify the SBOM attestation (CycloneDX or SPDX)
3. Verify the SLSA provenance attestation (if present)
4. Display the attestation tree for the image

You can also specify a custom public key path:

```bash
./demo/scripts/verify-attestation.sh --key /path/to/cosign.pub supplywatch/backend:42
```

> **Presenter Tip:** Run this live in a terminal. The color-coded output (PASS/FAIL) creates a strong visual moment. If the audience is skeptical, explain that this exact command could be run by a customer, an auditor, or an automated gate in their own CD pipeline.

**Talk Track:**
"This is the consumer side of the trust chain. Your security team, your customers, or a downstream CD pipeline can run this one command and get cryptographic proof that the SBOM and provenance are authentic. No trust-on-first-use, no honor system -- just math."

---

### Step 9 (Optional): Show SBOM Orchestration Step Configuration

If the audience wants to see how this is set up:

1. Open the CI pipeline YAML (`.harness/pipelines/ci-build.yaml`)
2. Navigate to the SBOM Orchestration step
3. Point out the **Tool** selector:
   - **Harness Native** -- uses the built-in SBOM generator, zero configuration
   - **Syft** -- bring-your-own, for customers who already have Syft/Grype-based SBOMs in their workflow
4. Point out the **Format** selector: CycloneDX or SPDX
5. Point out the **Attestation** toggle: when enabled, the SBOM is signed with Cosign and pushed as an `.att` tag

**Talk Track:**
"For customers who already have Syft or another SBOM tool in place, Harness does not ask you to rip and replace. You can ingest your existing SBOMs and still get all the value on top -- scoring, policy enforcement, drift detection, and attestation. That is the platform approach versus a point tool."

---

## Common Audience Questions

**Q: "We already generate SBOMs with Syft. Why do we need Harness for this?"**
A: Harness adds scoring, policy enforcement, drift detection, and cryptographic attestation on top of your existing SBOMs. Generating an SBOM is step one -- governing it across your entire pipeline is where the real value is.

**Q: "Which SBOM format should we use?"**
A: It depends on your compliance requirements. CycloneDX is more common in security-focused workflows; SPDX is an ISO standard and preferred by some government and legal teams. Harness supports both, so you can choose per artifact.

**Q: "How does SBOM scoring help us pass audits?"**
A: Auditors do not just want an SBOM -- they want a complete one. The NTIA minimum elements score gives you a measurable, defensible answer: "Our SBOMs meet 100% of NTIA requirements, verified on every build."

**Q: "Can we generate SBOMs for non-container artifacts?"**
A: Yes. Harness SCS supports SBOM generation for container images and file-based artifacts. The SBOM Orchestration step works with any artifact type that the pipeline produces.

---

## Transition to Next Scenario

After completing this scenario, transition to Scenario 2 (OPA Policy Enforcement) with:

"Now that we have a complete, scored, attested SBOM on every build -- the question becomes: what do we do when a component violates our security or license policies? Let me show you how Harness enforces those policies automatically."
