# SupplyWatch — Harness Supply Chain Security Demo

A realistic, demo-ready application codebase that exercises **every** Harness Supply Chain Security (SCS) capability — from SBOM generation and SLSA provenance to OPA policy enforcement and zero-day remediation workflows.

## Application Architecture

**SupplyWatch** is a supply chain monitoring dashboard built with three microservices:

| Service | Stack | Port | Purpose |
|---------|-------|------|---------|
| **Backend** | Node.js / Express | 3001 | REST API for components and risk data |
| **Frontend** | React / Vite / MUI | 8080 | Dashboard SPA with charts and tables |
| **Notification Service** | Java / Spring Boot | 8082 | Alert processing (contains planted Log4j vulnerability) |

### Planted Vulnerabilities (Intentional)

These exist to demonstrate Harness SCS detection and policy enforcement:

| Component | Version | CVE | Severity | Service |
|-----------|---------|-----|----------|---------|
| `lodash` | 4.17.20 | CVE-2021-23337 (cmd injection) | High | Backend |
| `jsonwebtoken` | 8.5.1 | Multiple known CVEs | High | Backend |
| `log4j-core` | 2.14.1 | CVE-2021-44228 (Log4Shell) | Critical (10.0) | Notification |
| `demo-gpl-component` | 1.0.0 | N/A — GPL-3.0 license | Policy violation | Frontend |
| `tj-actions/changed-files` | v35 (mutable tag) | CVE-2025-30066 (secret exfiltration) | High (8.6) | GitHub Actions CI |
| `xz-utils` | 5.6.1 | CVE-2024-3094 (SSH backdoor via liblzma) | Critical (10.0) | Backend (demo data) |
| `chalk` | 5.3.0-compromised | NPM-2025-0908 (account takeover) | Critical | Backend (demo data) |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Maven 3.9+ and JDK 21 (for notification service)
- Cosign CLI (for attestation verification)

### Local Setup

```bash
# One-command setup (installs deps, runs tests, builds Docker images)
./demo/scripts/setup-demo-env.sh

# Or run with Docker Compose
cd app && docker compose up
```

### Environment Variables

```bash
cp demo/.env.example .env
# Edit .env with your Harness account details, Docker registry, etc.
```

## Repository Structure

```
harnessdemo-supply-chain-security/
├── app/
│   ├── backend/                    # Express API server
│   ├── frontend/                   # React SPA (Vite + MUI)
│   ├── notification-service/       # Spring Boot (Log4j planted)
│   └── docker-compose.yml          # Local orchestration
├── .harness/
│   ├── pipelines/
│   │   ├── ci-build.yaml           # CI: build + SBOM + SLSA + OPA (3 stages)
│   │   └── cd-deploy.yaml          # CD: deploy with SCS gates (Dev/Staging/Prod)
│   ├── policies/
│   │   ├── deny-gpl-licenses.rego
│   │   ├── deny-vulnerable-versions.rego
│   │   ├── deny-blocked-components.rego
│   │   ├── require-slsa-attestation.rego
│   │   └── sbom-drift-approval.rego
│   ├── templates/                  # Reusable SCS step templates
│   └── inputsets/                  # Pre-filled pipeline inputs
├── demo/
│   ├── scripts/
│   │   ├── setup-demo-env.sh       # One-command setup
│   │   ├── swap-vulnerable-dep.sh  # Toggle vulnerable/clean deps
│   │   ├── trigger-pipeline.sh     # Trigger pipeline via API
│   │   └── verify-attestation.sh   # Cosign verification
│   ├── scenarios/                  # 7 step-by-step presenter runbooks
│   ├── seed-data/                  # SBOM samples, package.json & pom.xml variants
│   ├── gpl-stub-package/           # Local GPL-3.0 package for policy demo
│   └── .env.example                # Environment variable template
├── cosign/
│   └── README.md                   # Cosign key setup + Vault + Rekor guide
└── k8s/                            # Kubernetes manifests (dev/staging/prod)
```

## Demo Scenarios

Seven step-by-step runbooks in `demo/scenarios/`:

| # | Scenario | Maps To | Key Capability |
|---|----------|---------|----------------|
| 1 | [SBOM Generation, Scoring & Attestation](demo/scenarios/SCENARIO_1_SBOM.md) | Part 2, Sec 3 | CycloneDX + SPDX, NTIA scoring, Cosign attestation |
| 2 | [OPA Policy Enforcement](demo/scenarios/SCENARIO_2_POLICY_BLOCK.md) | Part 2, Sec 4 | CI + CD policy gates, block/pass cycle |
| 3 | [SLSA Provenance L1-L3](demo/scenarios/SCENARIO_3_SLSA.md) | Part 2, Sec 5 | SLSA L3 on Harness Cloud, artifact signing |
| 4 | [Zero-Day Response](demo/scenarios/SCENARIO_4_ZERO_DAY.md) | Part 2, Sec 6 | Remediation Tracker, blast radius, Jira |
| 5 | [SBOM Drift Detection](demo/scenarios/SCENARIO_5_DRIFT.md) | Part 2, Sec 3E | Drift diff, license change detection |
| 6 | [RSPM](demo/scenarios/SCENARIO_6_RSPM.md) | Part 2, Sec 2 | CIS/OWASP scanning of toolchain |
| 7 | [Dashboards & Reporting](demo/scenarios/SCENARIO_7_DASHBOARD.md) | Part 2, Sec 7-8 | SCS dashboard, audit logs, AppSec Agent |

## Demo Scripts

### Swap Vulnerable Dependencies

Toggle between vulnerable and clean dependencies for live demo:

```bash
# Both services — install vulnerable deps
./demo/scripts/swap-vulnerable-dep.sh vulnerable

# Both services — install clean (patched) deps
./demo/scripts/swap-vulnerable-dep.sh clean

# Single service
./demo/scripts/swap-vulnerable-dep.sh vulnerable --service backend
./demo/scripts/swap-vulnerable-dep.sh clean --service notification
```

### Trigger Pipeline

```bash
# CI build
./demo/scripts/trigger-pipeline.sh --pipeline ci-build --branch main

# CD deploy
./demo/scripts/trigger-pipeline.sh --pipeline cd-deploy --branch main --tag 42
```

### Verify Attestation

```bash
./demo/scripts/verify-attestation.sh supplywatch/backend:42
```

## Harness Configuration

### Required Connectors

| Connector | Type | Purpose |
|-----------|------|---------|
| `demo_github` | GitHub | Source repo access |
| `demo_dockerhub` | Docker Registry | Image push/pull |
| `demo_cosign_private` | File Secret | Cosign private key |
| `demo_cosign_public` | File Secret | Cosign public key |
| `demo_cosign_password` | Text Secret | Key passphrase |

### Required Modules

- **Harness CI** — Build pipelines
- **Harness CD** — Deployment pipelines
- **Harness SCS** — SBOM, SLSA, policy enforcement
- **Harness STO** — CVE auto-population in Remediation Tracker
- **Harness Cloud** — Required for SLSA Level 3

### OPA Policies

| Policy | Scope | Enforcement |
|--------|-------|-------------|
| `deny-gpl-licenses` | License compliance | Blocks GPL/AGPL/LGPL components |
| `deny-vulnerable-versions` | Known-bad versions | Blocks lodash<4.17.21, log4j<2.17.1, jsonwebtoken<9.0.0 |
| `deny-blocked-components` | Zero-day response | Blocks components added to deny list from Remediation Tracker |
| `require-slsa-attestation` | Build integrity | Blocks deployment without signed SLSA provenance |
| `sbom-drift-approval` | Change governance | Warns on >5 component changes, denies new copyleft additions |

## Pipeline Overview

### CI Pipeline (`ci-build.yaml`)

Three parallel stages (Backend, Frontend, Notification), each running:
1. Run Tests
2. Build & Push Docker Image
3. SBOM Orchestration (Backend/Notification: CycloneDX, Frontend: SPDX)
4. SLSA Provenance Generation
5. SBOM Policy Enforcement (OPA)

### CD Pipeline (`cd-deploy.yaml`)

Three sequential stages with escalating governance:
- **Dev** — SBOM + policy (lenient) + SLSA verification
- **Staging** — Manual approval + stricter policies
- **Prod** — Artifact promotion check + manual approval + strictest policies

## Cosign Key Setup

See [cosign/README.md](cosign/README.md) for:
- Key pair generation (ECDSA-P256)
- Harness secret storage
- in-toto attestation format
- HashiCorp Vault integration
- Sigstore Rekor transparency log
