# Harness SCS Demo — Codebase Implementation Plan

## Objective

Build a realistic, demo-ready application codebase that exercises **every** Harness Supply Chain Security capability outlined in the demo skeleton — from SBOM generation and SLSA provenance to OPA policy enforcement and zero-day remediation workflows.

---

## 1. Application Architecture

### 1.1 Application Choice: "SupplyWatch" — A Supply Chain Monitoring Dashboard

A **Node.js (Express) + React + Java (Spring Boot)** web application that displays a dashboard of software components and their risk status. This is thematically appropriate (supply chain visibility) and provides realistic dependency trees across multiple languages for SBOM demonstrations. The Java microservice is specifically included to plant **Log4j (Log4Shell / CVE-2021-44228)** — the most high-profile supply chain vulnerability in recent history, referenced throughout the demo skeleton.

```
harnessdemo-supply-chain-security/
├── app/
│   ├── backend/                 # Express API server
│   │   ├── src/
│   │   │   ├── index.js         # Entry point
│   │   │   ├── routes/
│   │   │   │   ├── health.js    # Health check endpoint
│   │   │   │   ├── components.js # Mock component data API
│   │   │   │   └── risk.js      # Mock risk scoring API
│   │   │   └── middleware/
│   │   │       └── logger.js    # Request logging
│   │   ├── tests/
│   │   │   └── health.test.js   # Basic test (CI pipeline runs npm test)
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   └── Dockerfile
│   ├── frontend/                # React SPA
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── index.jsx
│   │   │   └── components/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ComponentList.jsx
│   │   │       ├── RiskScore.jsx
│   │   │       └── Header.jsx
│   │   ├── public/
│   │   │   └── index.html
│   │   ├── nginx.conf           # Custom nginx config for SPA routing
│   │   ├── vite.config.js       # Vite build config
│   │   ├── tests/
│   │   │   └── App.test.jsx     # Basic test (CI pipeline runs npm test)
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   └── Dockerfile
│   ├── notification-service/    # Java Spring Boot microservice (Log4j demo)
│   │   ├── src/main/java/com/supplywatch/notification/
│   │   │   ├── NotificationApplication.java   # Spring Boot entry point
│   │   │   ├── controller/
│   │   │   │   └── NotificationController.java # REST endpoint for alerts
│   │   │   └── service/
│   │   │       └── AlertService.java           # Mock alert processing
│   │   ├── src/main/resources/
│   │   │   └── application.yml
│   │   ├── src/test/java/com/supplywatch/notification/
│   │   │   └── NotificationApplicationTests.java
│   │   ├── pom.xml              # Maven config with planted Log4j vulnerability
│   │   └── Dockerfile
│   └── docker-compose.yml       # Local dev orchestration (all 3 services)
├── .harness/                    # Harness pipeline & policy configs (`.harness/` is the Harness Git Experience default)
│   ├── pipelines/
│   │   ├── ci-build.yaml        # CI pipeline with SCS steps
│   │   └── cd-deploy.yaml       # CD pipeline with SCS gates
│   ├── policies/
│   │   ├── deny-gpl-licenses.rego
│   │   ├── deny-vulnerable-versions.rego
│   │   ├── deny-blocked-components.rego
│   │   ├── require-slsa-attestation.rego
│   │   └── sbom-drift-approval.rego
│   ├── templates/
│   │   ├── sbom-orchestration-step.yaml
│   │   ├── slsa-generation-step.yaml
│   │   └── policy-enforcement-step.yaml
│   └── inputsets/
│       ├── build-main.yaml
│       └── build-feature.yaml
├── demo/                        # Demo helper scripts & seeded data
│   ├── seed-data/
│   │   ├── vulnerable-package.json   # package.json with planted CVE dep (backend)
│   │   ├── clean-package.json        # package.json without vulnerable dep (backend)
│   │   ├── vulnerable-pom.xml        # pom.xml with Log4j 2.14.1 (notification-service)
│   │   ├── clean-pom.xml             # pom.xml with Log4j 2.24.x patched (notification-service)
│   │   ├── sample-sbom-v1.json       # Pre-generated SBOM (CycloneDX) for drift demo
│   │   ├── sample-sbom-v2.json       # SBOM with drift (added GPL dep)
│   │   └── sample-sbom-v1-spdx.json  # SPDX format sample (matches frontend format)
│   ├── gpl-stub-package/             # Local stub package with GPL-3.0 license
│   │   ├── package.json              # { "license": "GPL-3.0", ... }
│   │   └── index.js                  # Trivial export
│   ├── scripts/
│   │   ├── setup-demo-env.sh         # One-command demo env setup
│   │   ├── swap-vulnerable-dep.sh    # Toggle backend vulnerable dependency
│   │   ├── trigger-pipeline.sh       # Trigger Harness pipeline via API
│   │   └── verify-attestation.sh     # Cosign verify script
│   ├── scenarios/
│   │   ├── SCENARIO_1_SBOM.md
│   │   ├── SCENARIO_2_POLICY_BLOCK.md
│   │   ├── SCENARIO_3_SLSA.md
│   │   ├── SCENARIO_4_ZERO_DAY.md
│   │   ├── SCENARIO_5_DRIFT.md
│   │   ├── SCENARIO_6_RSPM.md        # RSPM walkthrough (skeleton Part 2 Section 2)
│   │   └── SCENARIO_7_DASHBOARD.md   # Dashboard & AppSec Agent (skeleton Part 2 Section 7)
│   └── .env.example                  # Template for HARNESS_API_KEY, HARNESS_ACCOUNT_ID, etc.
├── k8s/                         # Kubernetes manifests for CD target
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── notification-deployment.yaml
│   ├── notification-service.yaml
│   └── ingress.yaml
├── cosign/                      # Key management reference
│   └── README.md                # Instructions for Cosign key setup (incl. HashiCorp Vault + Sigstore Rekor)
├── .gitignore
├── Harness_SCS_Demo_Skeleton.html
├── IMPLEMENTATION_PLAN.md
└── README.md
```

### 1.2 Why This Stack

| Decision | Rationale |
|----------|-----------|
| Node.js + React | Rich npm dependency tree — excellent for SBOM demos with many components |
| Java (Spring Boot) notification service | Plants **Log4j (Log4Shell)** — the most famous supply chain CVE. Also demonstrates multi-language SBOM generation (Maven + npm) |
| Docker multi-stage builds | Standard container workflow that maps to Harness CI Build & Push step |
| Three microservices | Three separate images = three SBOMs, three artifacts, richer Remediation Tracker blast-radius demo |
| Kubernetes manifests | Required for CD pipeline deployment and environment blast-radius demos |

---

## 2. Intentional Dependency Strategy

The dependency choices are the backbone of the demo. Each dependency serves a specific demo purpose.

### 2.1 Backend Dependencies (`app/backend/package.json`)

| Package | Version | Demo Purpose |
|---------|---------|-------------|
| `express` | `^4.18.2` | Core framework — appears in SBOM as primary component |
| `winston` | `^3.11.0` | Logging — adds transitive dependency depth for SBOM |
| `cors` | `^2.8.5` | Standard middleware — normal component |
| `helmet` | `^7.1.0` | Security middleware — normal component |
| `axios` | `^1.6.0` | HTTP client — normal component |
| `lodash` | `4.17.20` | **Planted CVE** — CVE-2021-23337 (command injection via `_.template()`), CVE-2020-8203 (prototype pollution), CVE-2020-28500 (ReDoS). Used for zero-day response demo |
| `jsonwebtoken` | `8.5.1` | **Planted CVE** — older version with known vulnerabilities |
| `uuid` | `^9.0.0` | Normal component |
| `dotenv` | `^16.3.1` | Env config — normal component |

### 2.2 Frontend Dependencies (`app/frontend/package.json`)

| Package | Version | Demo Purpose |
|---------|---------|-------------|
| `react` | `^18.2.0` | Core framework |
| `react-dom` | `^18.2.0` | Core framework |
| `react-router-dom` | `^6.20.0` | Routing |
| `recharts` | `^2.10.0` | Dashboard charts — adds many transitive deps for SBOM richness |
| `@mui/material` | `^5.14.0` | UI library — large transitive tree |
| `@emotion/react` | `^11.11.0` | MUI peer dep |
| `@emotion/styled` | `^11.11.0` | MUI peer dep |
| `demo-gpl-component` | `file:../../demo/gpl-stub-package` | **Local stub package with `"license": "GPL-3.0"`** — used for license policy demo. A local package is more reliable than depending on a published GPL npm package. Appears in SBOM with GPL-3.0 license, triggering `deny-gpl-licenses` OPA policy |

### 2.3 Notification Service Dependencies (`app/notification-service/pom.xml`)

| Dependency | Version | Demo Purpose |
|-----------|---------|-------------|
| `spring-boot-starter-web` | `3.2.0` | Core Spring Boot web framework |
| `spring-boot-starter-actuator` | `3.2.0` | Health check and metrics endpoints |
| `log4j-core` | `2.14.1` | **Planted CVE — CVE-2021-44228 (Log4Shell)**. Critical RCE via JNDI lookup injection (CVSS 10.0). The most high-profile supply chain attack in history, referenced directly in the demo skeleton |
| `log4j-api` | `2.14.1` | **Planted CVE** — paired with log4j-core |
| `jackson-databind` | `2.15.3` | JSON serialization — adds transitive depth to SBOM |
| `lombok` | `1.18.30` | Boilerplate reduction — normal component |

> **Why Log4j matters for this demo**: The demo skeleton references Log4j in Part 1 Section 1 (problem framing), Part 2 Section 1 (attack vectors), and throughout as the canonical example of an open-source supply chain attack. Having a live Log4j vulnerability in the codebase makes these references directly demonstrable rather than hypothetical.

> **Version note**: `log4j-core@2.14.1` is vulnerable to CVE-2021-44228 (Log4Shell, CVSS 10.0), CVE-2021-45046 (CVSS 9.0), and CVE-2021-45105 (CVSS 7.5). The patched version is `2.24.x` (latest stable).

### 2.4 Swap Mechanism for Live Demos

The `demo/scripts/swap-vulnerable-dep.sh` script toggles vulnerable dependencies for both services:

**Backend (Node.js)**:
- `vulnerable`: installs `vulnerable-package.json` (with `lodash@4.17.20`, `jsonwebtoken@8.5.1`)
- `clean`: installs `clean-package.json` (with `lodash@4.17.21`, `jsonwebtoken@9.0.2`)

**Notification Service (Java)**:
- `vulnerable`: copies `vulnerable-pom.xml` (with `log4j-core@2.14.1` — Log4Shell)
- `clean`: copies `clean-pom.xml` (with `log4j-core@2.24.x` — patched)

```bash
./swap-vulnerable-dep.sh vulnerable   # Both services get CVE-laden deps
./swap-vulnerable-dep.sh clean        # Both services get patched deps
./swap-vulnerable-dep.sh vulnerable --service backend   # Backend only
./swap-vulnerable-dep.sh vulnerable --service notification  # Notification only
```

This enables the presenter to show builds being blocked, then succeeding after remediation — for both npm and Maven ecosystems.

---

## 3. Dockerfiles

### 3.1 Backend Dockerfile (`app/backend/Dockerfile`)

Multi-stage build to demonstrate realistic container image creation:

```
Stage 1: node:20-alpine — install deps, run tests
Stage 2: node:20-alpine — production image, copy only prod artifacts
```

Key points:
- Uses `npm ci` for reproducible installs (SBOM accuracy)
- Exposes port 3001
- Health check endpoint at `/api/health`
- Labels for image metadata (used in provenance)

### 3.2 Frontend Dockerfile (`app/frontend/Dockerfile`)

```
Stage 1: node:20-alpine — install deps, build React app
Stage 2: nginx:1.25-alpine — serve static files
```

Key points:
- Multi-stage reduces image size (better for registry demos)
- nginx base adds its own dependency tree to the SBOM
- Custom nginx.conf for SPA routing

### 3.3 Cosign & Sigstore Rekor

The `cosign/README.md` should cover:
- Cosign key pair generation (ECDSA-P256)
- Storing keys as Harness file secrets
- Optional: HashiCorp Vault integration for enterprise key management
- **in-toto attestation framework** — Harness SCS uses the in-toto attestation format for provenance and SBOM attestations. Document how Cosign wraps in-toto predicates (SLSA provenance predicate, SPDX/CycloneDX SBOM predicate) into signed attestation envelopes (.att files)
- **Artifact signing (.sig files)** — separate from attestation, Cosign can sign the image digest itself, producing a `.sig` file stored alongside the image in the registry. Document how to sign and verify: `cosign sign` / `cosign verify`
- **Optional: Sigstore Rekor transparency log** — Cosign supports publishing attestation entries to the Rekor public transparency log for independent verifiability. Document how to enable/disable this (`--rekor-url` flag). Useful for customers who want public auditability of their attestations

### 3.4 Notification Service Dockerfile (`app/notification-service/Dockerfile`)

```
Stage 1: maven:3.9-eclipse-temurin-21 — build JAR with mvn package
Stage 2: eclipse-temurin:21-jre-alpine — production image, copy only JAR
```

Key points:
- Multi-stage build separates build tools from runtime
- Uses `mvn package -DskipTests` in build stage (tests run in separate CI step)
- Exposes port 8082
- Health check via Spring Actuator at `/actuator/health`
- The Maven dependency tree (including `log4j-core`) appears in the SBOM

---

## 4. Harness CI Pipeline (`.harness/pipelines/ci-build.yaml`)

### 4.1 Pipeline Structure

```
Pipeline: scs-demo-ci-build
├── Stage 1: Build Backend
│   ├── Step 1: Run Tests (npm test)
│   ├── Step 2: Build & Push Docker Image (backend)
│   ├── Step 3: SBOM Orchestration (CycloneDX format)
│   ├── Step 4: SLSA Provenance Generation
│   └── Step 5: SBOM Policy Enforcement (OPA)
├── Stage 2: Build Frontend
│   ├── Step 1: Run Tests (npm test)
│   ├── Step 2: Build & Push Docker Image (frontend)
│   ├── Step 3: SBOM Orchestration (SPDX format — shows both formats)
│   ├── Step 4: SLSA Provenance Generation
│   └── Step 5: SBOM Policy Enforcement (OPA)
├── Stage 3: Build Notification Service (Java)
│   ├── Step 1: Run Tests (mvn test)
│   ├── Step 2: Build & Push Docker Image (notification-service)
│   ├── Step 3: SBOM Orchestration (CycloneDX format — demonstrates Maven SBOM)
│   ├── Step 4: SLSA Provenance Generation
│   └── Step 5: SBOM Policy Enforcement (OPA)
└── Notifications
    └── Slack notification on policy violation
```

### 4.2 Key Configuration Details

- **Infrastructure**: Harness Cloud (required for SLSA Level 3)
- **SBOM Orchestration step**: Harness native generator, attestation enabled with Cosign key pair
- **SLSA Generation step**: Placed after Build & Push, generates provenance JSON with repo/branch/commit/builder metadata
- **Policy Enforcement step**: References OPA policies from policy store, configured to `Error and Fail Pipeline` on violation
- **Trigger**: On push to `main` and on PR creation

### 4.3 Connectors Required

| Connector | Type | Purpose |
|-----------|------|---------|
| `demo-github` | GitHub | Source repo access |
| `demo-dockerhub` | Docker Registry | Image push target |
| `demo-cosign-private` | Harness File Secret | Cosign private key for attestation |
| `demo-cosign-public` | Harness File Secret | Cosign public key for verification |
| `demo-cosign-password` | Harness Text Secret | Cosign key passphrase |

---

## 5. Harness CD Pipeline (`.harness/pipelines/cd-deploy.yaml`)

### 5.1 Pipeline Structure

```
Pipeline: scs-demo-cd-deploy
├── Stage 1: Deploy to Dev
│   ├── Containerized Step Group (required for SBOM Orchestration in Deploy stages)
│   │   ├── Step 1: SBOM Orchestration (deploy-time SBOM)
│   │   ├── Step 2: SBOM Policy Enforcement (OPA — deploy-time gate)
│   │   └── Step 3: SLSA Verification (verify attestation exists)
│   └── Step 4: Kubernetes Deployment (Rolling Update)
├── Stage 2: Deploy to Staging (Approval Gate)
│   ├── Step 1: Manual Approval
│   ├── Containerized Step Group
│   │   ├── Step 2: SBOM Policy Enforcement (stricter policy set)
│   │   └── Step 3: SLSA Verification
│   └── Step 4: Kubernetes Deployment
└── Stage 3: Deploy to Prod (Promotion Gate)
    ├── Step 1: Artifact Promotion Policy Check (SLSA + SBOM required)
    ├── Step 2: Manual Approval
    ├── Containerized Step Group
    │   ├── Step 3: SBOM Policy Enforcement (strictest policy set)
    │   └── Step 4: SLSA Verification
    └── Step 5: Kubernetes Deployment
```

> **Note**: SBOM Orchestration in Deploy stages requires **Containerized Step Groups**. The repo must be cloned into the stage workspace before the SBOM Orchestration step runs.

### 5.2 Environment Setup

| Environment | Namespace | Purpose |
|-------------|-----------|---------|
| `dev` | `supplywatch-dev` | Fast feedback, lenient policies |
| `staging` | `supplywatch-staging` | Pre-prod validation, moderate policies |
| `prod` | `supplywatch-prod` | Production, strictest policies + approval gates |

This multi-environment setup is critical for the **Remediation Tracker blast-radius demo** — showing which environments are impacted by a vulnerable artifact.

---

## 6. OPA Policies (`.harness/policies/`)

### 6.1 Policy: Deny GPL Licenses

**File**: `deny-gpl-licenses.rego`

Blocks any artifact whose SBOM contains components with GPL-3.0, AGPL-3.0, or LGPL-3.0 licenses. Used to demonstrate license compliance enforcement.

**Demo moment**: Frontend build with `demo-gpl-component` (local GPL-3.0 stub package) triggers this policy.

### 6.2 Policy: Deny Known-Vulnerable Component Versions

**File**: `deny-vulnerable-versions.rego`

Blocks artifacts whose SBOM contains components at known-vulnerable versions (by name + version match). SCS SBOM Policy Enforcement evaluates **SBOM metadata** (component name, version, license, PURL, supplier) — it does **not** evaluate CVE scan data directly. CVE-severity-based blocking requires **Harness STO OPA policies** (a separate mechanism).

This policy blocks: `lodash < 4.17.21`, `jsonwebtoken < 9.0.0`, `log4j-core < 2.17.1`, and any other components added to the deny list.

**Demo moment**: Backend build with `lodash@4.17.20` or notification service build with `log4j-core@2.14.1` triggers this policy because the version is in the deny list.

### 6.3 Policy: Deny Blocked Components

**File**: `deny-blocked-components.rego`

Blocks specific components by name, PURL, or version range. This policy is the one created from the Remediation Tracker during the zero-day response demo.

**Demo moment**: After "discovering" the vulnerability, create this policy live to block `lodash < 4.17.21`.

### 6.4 Policy: Require SLSA Attestation

**File**: `require-slsa-attestation.rego`

Blocks deployment unless the artifact has a valid SLSA provenance attestation. Used as the CD-stage promotion gate.

### 6.5 Policy: SBOM Drift Approval

**File**: `sbom-drift-approval.rego`

Requires manual approval if SBOM drift exceeds a threshold (e.g., >5 component changes or any license changes). Demonstrates the drift detection governance workflow.

### Important: SCS vs STO Policy Scopes

| Mechanism | Evaluates Against | Module |
|-----------|------------------|--------|
| **SCS SBOM Policy Enforcement** | SBOM metadata: component name, version, license, PURL, supplier | Harness SCS |
| **STO OPA Policies** | Vulnerability scan data: CVE IDs, severity scores, CWE IDs, occurrence counts | Harness STO |

All 5 policies above operate on **SBOM metadata** (SCS scope). To block based on CVE severity thresholds (e.g., "block all Critical CVEs"), you need Harness STO OPA policies. The `deny-vulnerable-versions.rego` policy achieves a similar effect by blocking known-bad component versions by name.

---

## 7. Demo Seed Data (`demo/seed-data/`)

### 7.1 Sample SBOMs for Drift Detection

Two pre-generated SBOM files in CycloneDX format:

- **`sample-sbom-v1.json`**: Baseline SBOM from a "previous" build
- **`sample-sbom-v2.json`**: Modified SBOM with:
  - 2 new components added (including one with GPL license)
  - 1 component version bumped
  - 1 component removed
  - This provides a clear diff for the SBOM Drift Detection demo

### 7.2 Package.json Variants (Backend)

- **`vulnerable-package.json`**: Contains `lodash@4.17.20` and `jsonwebtoken@8.5.1`
- **`clean-package.json`**: Contains `lodash@4.17.21` (patched) and `jsonwebtoken@9.0.2` (patched)

### 7.3 pom.xml Variants (Notification Service)

- **`vulnerable-pom.xml`**: Contains `log4j-core@2.14.1` and `log4j-api@2.14.1` (Log4Shell — CVE-2021-44228)
- **`clean-pom.xml`**: Contains `log4j-core@2.24.x` and `log4j-api@2.24.x` (fully patched)

---

## 8. Demo Helper Scripts (`demo/scripts/`)

### 8.1 `setup-demo-env.sh`

One-command setup that:
1. Installs dependencies for backend and frontend (npm ci)
2. Builds the notification service JAR (mvn package)
3. Builds Docker images locally for all three services
4. Validates Dockerfiles
5. Prints confirmation with next steps

### 8.2 `swap-vulnerable-dep.sh`

Toggles between vulnerable and clean dependencies:
```bash
./swap-vulnerable-dep.sh vulnerable   # Load CVE-laden deps
./swap-vulnerable-dep.sh clean        # Load patched deps
```

### 8.3 `trigger-pipeline.sh`

Triggers the Harness CI pipeline via API:
```bash
./trigger-pipeline.sh --pipeline ci-build --branch main
```
Requires `HARNESS_API_KEY`, `HARNESS_ACCOUNT_ID`, `HARNESS_ORG`, `HARNESS_PROJECT` env vars.

### 8.4 `verify-attestation.sh`

Runs Cosign verification against a built image:
```bash
./verify-attestation.sh <image:tag>
```
Demonstrates SLSA provenance and SBOM attestation verification.

---

## 9. Demo Scenario Runbooks (`demo/scenarios/`)

Each scenario is a step-by-step guide for the presenter.

### 9.1 SCENARIO_1_SBOM.md — SBOM Generation, Scoring & Attestation

**Maps to**: Demo Skeleton Part 2, Section 3

Steps:
1. Trigger CI build on `main`
2. Navigate to Supply Chain tab in pipeline execution
3. Show generated SBOM — component name, version, supplier, PURL, license (walk through normalization)
4. Highlight: backend uses CycloneDX, frontend uses SPDX — both formats supported
5. Show SBOM Score — NTIA minimum elements compliance, structural completeness, license data quality, component identifiability
6. Highlight compliance readiness: SBOM + score satisfies **US Executive Order 14028** and customer SBOM audit requirements
7. Show .att attestation file in container registry (signed with Cosign)
8. Show Cosign verification command (`verify-attestation.sh`)
9. _(Optional)_ Show SBOM Orchestration step config — point out the tool selector (Harness native vs. bring-your-own Syft). Explain: customers with existing Syft/Grype SBOMs can ingest them and still get policy enforcement, scoring, and drift detection on top

### 9.2 SCENARIO_2_POLICY_BLOCK.md — OPA Policy Enforcement

**Maps to**: Demo Skeleton Part 2, Section 4

Steps:
1. Ensure `deny-vulnerable-versions.rego` policy is active
2. Run `swap-vulnerable-dep.sh vulnerable`
3. Trigger CI build — show it blocked at SBOM Policy Enforcement step
4. Show violation details in Supply Chain tab
5. Run `swap-vulnerable-dep.sh clean`
6. Trigger CI build again — show it passes
7. Show CD deploy-time enforcement as second gate

### 9.3 SCENARIO_3_SLSA.md — SLSA Provenance L1–L3 & Artifact Signing

**Maps to**: Demo Skeleton Part 2, Section 5

Steps:
1. Show SLSA Generation step in pipeline config (placed after Build & Push)
2. Trigger build on Harness Cloud infrastructure
3. Show generated provenance payload: repository, branch, commit SHA, builder ID, trigger, timestamp
4. Explain SLSA levels: L1 (provenance exists) → L2 (signed) → L3 (tamper-proof, isolated infra)
5. Explain L3 hardening mechanics: ephemeral VM per build run, OPA on CI stage templates (non-privileged steps, no volume mounts), build steps cannot access signing key
6. Show .att attestation file in container registry (in-toto envelope with SLSA provenance predicate)
7. Show **artifact signing**: .sig file stored in registry alongside image digest — separate from attestation
8. Demonstrate verification against public key (`verify-attestation.sh`)
9. Show SLSA Verification step in CD pipeline — artifact blocked unless valid attestation is present
10. Show Supply Chain tab: SLSA attestation status, downloadable provenance file

### 9.4 SCENARIO_4_ZERO_DAY.md — Zero-Day Response with Remediation Tracker

**Maps to**: Demo Skeleton Part 2, Section 6

This scenario can be run with **either** vulnerability — choose based on audience impact:

**Option A: Log4Shell (recommended for maximum impact)**
1. Ensure notification service is deployed to dev, staging, and prod with `log4j-core@2.14.1`
2. Open Remediation Tracker — create entry for **CVE-2021-44228 (Log4Shell)**
3. Show auto-populated affected artifacts (notification-service image across all envs, auto-populated from STO CVE data)
4. Show blast radius: which environments (Dev / Staging / Prod) have the vulnerable artifact
5. Show pipeline traceability — which pipeline and stage deployed each affected artifact
6. Assign owners to each affected artifact
7. Set SLA deadlines by severity — Critical: 24 hrs, High: 72 hrs
8. Show tracker dashboard: **Mean Time to Remediate (MTTR)**, remediation status breakdown, pending remediations
9. One-click Jira ticket creation from the tracker — show status sync
10. Create OPA block policy from tracker to block `log4j-core < 2.17.1`
11. Trigger new notification-service build — show it blocked at SBOM Policy Enforcement step
12. Show **audit trail**: policy creation time, creator, list of builds it has blocked
13. Run `swap-vulnerable-dep.sh clean --service notification`, rebuild, redeploy
14. Show remediation progress update in tracker
15. Generate **compliance report** — walk through contents: CVE details, affected artifacts, environment mapping, resolution timeline, MTTR, policy enforcement evidence
16. Explain use case: deliver to auditors, customers, or regulators as formal proof of remediation

**Option B: Lodash (command injection / prototype pollution)**
1. Ensure backend is deployed to dev, staging, and prod with `lodash@4.17.20`
2. Open Remediation Tracker — create entry for CVE-2021-23337
3. Follow steps 3–16 as above, targeting the backend artifact

> **Presenter tip**: Log4Shell (Option A) is the stronger story because the demo skeleton references it by name as the canonical open-source supply chain attack. The audience will immediately recognize it.

### 9.5 SCENARIO_5_DRIFT.md — SBOM Drift Detection

**Maps to**: Demo Skeleton Part 2, Section 3E

Steps:
1. Build baseline image (SBOM v1)
2. Add a new dependency (e.g., a GPL-licensed package)
3. Build updated image (SBOM v2)
4. Show SBOM diff view — additions, removals, license changes
5. Show drift policy triggering manual approval gate

### 9.6 SCENARIO_6_RSPM.md — Repository Security Posture Management

**Maps to**: Demo Skeleton Part 2, Section 2

Steps:
1. Show RSPM connector setup for this GitHub repo (read-only API integration)
2. Show automated CIS Benchmark scanning results — branch protection, admin access, webhook security
3. Show OWASP Top 10 CI/CD Risks findings — map to specific control IDs
4. Show aggregated risk score across connected repos and CI tools
5. Create a Remediation Tracker entry from an RSPM finding
6. Show auto-created Jira ticket from the tracker

**Repo preparation note**: For compelling RSPM findings, intentionally leave some repo settings misconfigured (e.g., no branch protection on `main`, no required reviews, no secret scanning enabled). Document which settings to misconfigure and which to fix during the demo.

### 9.7 SCENARIO_7_DASHBOARD.md — Dashboards, Reporting, STO Integration & AppSec Agent

**Maps to**: Demo Skeleton Part 1 Section 3, Part 2 Sections 7 & 8

Steps:
1. Open SCS Overview Dashboard — show unified risk posture across repos, artifacts, CI/CD tools
2. Drill into: compliance violations, vulnerability counts, SBOM coverage score
3. Show trend over time and top risks by category
4. Show drill-in views: repository compliance posture, artifact SBOM coverage, SLSA adoption rate, open SLA breaches
5. Show exportable audit logs: SBOM generation events, SLSA attestation events, policy enforcement decisions, artifact promotion governance
6. Highlight compliance use case: logs provide evidence for **FedRAMP, SOC2, ISO 27001, NIST SSDF** audits — full lifecycle traceability from build to deployment
7. Show **STO integration**: SAST, SCA, and Secret Scanning results from Harness STO feed directly into SCS posture — combined vulnerability + supply chain risk in one platform view
8. Show AppSec Agent: AI-powered prioritization of supply chain alerts — identifies highest-risk repos/registries/build tools
9. Demonstrate conversational remediation guidance (e.g., "find an alternate package to mitigate this license risk")

---

## 10. Implementation Phases

### Phase 1: Application Foundation (Steps 1–6)

| # | Task | Output |
|---|------|--------|
| 1 | Create backend Express app with routes, middleware, and package.json | `app/backend/` complete |
| 2 | Create frontend React app with dashboard components and package.json | `app/frontend/` complete |
| 3 | Create notification service Spring Boot app with pom.xml (Log4j planted) | `app/notification-service/` complete |
| 4 | Write Dockerfiles for all three services (multi-stage) | All Dockerfiles |
| 5 | Write docker-compose.yml for local development (all 3 services) | `app/docker-compose.yml` |
| 6 | Write Kubernetes manifests for dev/staging/prod (all 3 services) | `k8s/` complete |

### Phase 2: Harness Pipeline Configs (Steps 7–10)

| # | Task | Output |
|---|------|--------|
| 7 | Write CI pipeline YAML with Build & Push + SCS steps (3 stages) | `.harness/pipelines/ci-build.yaml` |
| 8 | Write CD pipeline YAML with deploy-time SCS gates (Containerized Step Groups) | `.harness/pipelines/cd-deploy.yaml` |
| 9 | Write pipeline step templates for reuse | `.harness/templates/` |
| 10 | Write input sets for different trigger scenarios | `.harness/inputsets/` |

### Phase 3: Policies & Governance (Steps 11–14)

| # | Task | Output |
|---|------|--------|
| 11 | Write all 5 OPA/Rego policies (incl. Log4j + lodash in deny list) | `.harness/policies/` complete |
| 12 | Create seed data: sample SBOMs (CycloneDX + SPDX), package.json + pom.xml variants | `demo/seed-data/` complete |
| 13 | Create GPL stub package for license policy demo | `demo/gpl-stub-package/` complete |
| 14 | Create Cosign key setup documentation (incl. Vault integration notes) | `cosign/README.md` |

### Phase 4: Demo Tooling & Runbooks (Steps 15–19)

| # | Task | Output |
|---|------|--------|
| 15 | Write demo helper scripts (setup, swap for npm+Maven, trigger, verify) | `demo/scripts/` complete |
| 16 | Write 7 scenario runbooks (SBOM, Policy, SLSA, Zero-Day, Drift, RSPM, Dashboard) | `demo/scenarios/` complete |
| 17 | Create `.env.example` with required env var template | `demo/.env.example` |
| 18 | Update repo README with full setup & usage guide | `README.md` updated |
| 19 | Final review: validate all paths, deps, and pipeline refs align | All files consistent |

---

## 11. Demo Environment Prerequisites

The following must be configured in the Harness account before running the demo:

| Prerequisite | Details |
|-------------|---------|
| Harness SCS module | Enabled on the account |
| Harness CI module | For build pipelines |
| Harness CD module | For deployment pipelines |
| Harness STO module | Required for CVE auto-population in Remediation Tracker and for SAST/SCA/Secret Scanning results that feed into SCS posture. Without STO, CVE data must be entered manually |
| Harness Cloud build infra | Required for SLSA Level 3 (ephemeral VMs, infrastructure isolation) |
| Docker Registry connector | DockerHub or other registry |
| GitHub connector | Read access to this repo |
| Cosign key pair | Generated and stored as Harness file secrets (ECDSA-P256) |
| HashiCorp Vault (optional) | Enterprise key management for Cosign keys. Not required — Harness native secrets work for demos |
| Kubernetes cluster | With dev/staging/prod namespaces created |
| Jira connector | For Remediation Tracker integration (one-click ticket creation) |
| OPA policy store | Policies uploaded to Harness governance module |

---

## 12. Key Design Decisions

| Decision | Chosen Approach | Alternative Considered | Reason |
|----------|----------------|----------------------|--------|
| App languages | Node.js + Java | Single language | Multi-language SBOMs (npm + Maven), plants Log4j which is Java-only, demonstrates SCS works across ecosystems |
| Frontend build tool | Vite | Create React App, webpack | Faster builds, simpler config, modern standard |
| SBOM format | CycloneDX (backend) + SPDX (frontend) | Single format | Shows both supported formats in one demo |
| Vulnerable dep | lodash@4.17.20 | Other packages | Multiple well-known CVEs (cmd injection, prototype pollution, ReDoS), easy to explain, patched in 4.17.21 |
| GPL license dep | Local stub package (`demo-gpl-component`) | Published GPL npm package | Reliable and controllable — most popular npm packages are MIT, making a real GPL dependency fragile |
| K8s manifests | Plain YAML | Helm chart | Simpler for demo purposes, less abstraction |
| Pipeline config | YAML-as-code in `.harness/` | UI-only | Reproducible, version-controlled, follows Harness Git Experience convention |
| Multi-service app | Backend + Frontend + Notification | Monolith | Three artifacts = richer multi-artifact SCS coverage + multi-language SBOM |
| Policy scope | SCS SBOM policies (component metadata) | STO OPA policies (CVE severity) | SCS module focus — STO policies documented as optional enhancement |

---

## 13. Success Criteria

The codebase is demo-ready when:

- [ ] All three services build and run locally via docker-compose
- [ ] CI pipeline generates SBOMs in both CycloneDX and SPDX formats
- [ ] SBOM attestation produces signed .att files in the registry
- [ ] SLSA provenance is generated with full metadata (repo, branch, commit, builder ID)
- [ ] OPA policy blocks a build with `lodash@4.17.20` (vulnerable version in deny list)
- [ ] OPA policy blocks a build with `log4j-core@2.14.1` (Log4Shell in deny list)
- [ ] OPA policy blocks a build with `demo-gpl-component` (GPL-3.0 license violation)
- [ ] OPA policy passes after swapping to the clean dependency set
- [ ] CD pipeline enforces policies at deploy-time via Containerized Step Groups
- [ ] SLSA verification blocks deployment of unsigned artifacts in all three environments
- [ ] Remediation Tracker shows blast radius across dev/staging/prod
- [ ] SBOM drift is visible between two successive builds
- [ ] RSPM findings appear for the connected GitHub repo
- [ ] All 7 demo scenarios can be executed end-to-end without errors
