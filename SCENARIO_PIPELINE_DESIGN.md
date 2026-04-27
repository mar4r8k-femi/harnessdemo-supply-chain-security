# SCS Demo — Pipeline Design

## Goal

Tell one coherent story with one pipeline: a vulnerable app, a CI/CD pipeline, and a runtime toggle that controls whether Harness SCS gates are in the loop. The presenter walks the audience through three states — *vanilla CI/CD with no SCS, the same pipeline with SCS turned on, and the green path after remediation* — by changing one variable at trigger time.

Earlier drafts of this design tried to expose every Harness SCS scenario as its own runtime preset (`xz-backdoor`, `npm-takeover`, `drift`, `all-risks`, etc.). That framing was abandoned: most of those presets either had no working wiring, or required injecting attack patterns that didn't add narrative value beyond what the default vulnerable repo already provides. The current design is deliberately smaller and tells a sharper story.

---

## 1. What can live inside the pipeline vs. outside

| # | Scenario | In-pipeline? | Why |
|---|----------|--------------|-----|
| 1 | SBOM Generation & Attestation | ✅ Always-on under `with-scs-gates` | SBOM Orchestration step runs every build with SCS on |
| 2 | OPA Policy Block | ✅ Drives the `with-scs-gates` story | Default vulnerable deps + policy enforcement = blocked deploy |
| 3 | SLSA Provenance & Verification | ✅ Always-on under `with-scs-gates` | Provenance generated at build, verified at deploy |
| 4 | Zero-Day / Remediation Tracker | ✅ Tells the `remediated` story | Pipeline shows block → fix → re-run; Tracker UI is external |
| 5 | SBOM Drift | ❌ Out of scope at this layer | Needs SBOM baseline storage and a diff step — not yet built |
| 6 | RSPM | ❌ External | Repo-scanning capability; pipeline has no role |
| 7 | Dashboard / AppSec Agent | ❌ External | Observability over pipeline output; no gating role |
| 8 | CI Tool Compromise (tj-actions) | ⚠️ Narrative-only | Lives in `.github/workflows/`, not Harness |
| 9 | xz-utils Backdoor | ❌ Out of scope at this layer | The `deny-vulnerable-versions.rego` policy already covers xz, but no current build produces an SBOM containing it. Needs Dockerfile ARG to inject — not yet built |
| 10 | NPM Account Takeover | ❌ Out of scope at this layer | Needs frontend seed-file swap — not yet built |

So **one pipeline directly covers scenarios 1–4** via the on/off toggle and the remediation close. Scenarios 5, 9, 10 remain available as separate features once the supporting wiring lands. Scenarios 6, 7, 8 are presented alongside via UI/repo browsing.

---

## 2. Runtime input

One variable, three values. No resolver stage, no derivation step — the variable is referenced directly in `when` conditions.

| Variable | Type | Allowed values | Default | Controls |
|----------|------|----------------|---------|----------|
| `scenario_preset` | enum | `no-scs-gates`, `with-scs-gates`, `remediated` | `with-scs-gates` | Whether SCS step groups run, and whether deps get swapped to clean |

### 2.1 Preset semantics

| Preset | SCS Service step group (build) | SCS Gates Prod step group (deploy) | Swap to Clean Deps | Narrative |
|--------|-------------------------------|------------------------------------|--------------------|-----------|
| `no-scs-gates` | skip | skip | skip | "This is what most CI/CD pipelines look like today. Vulnerable deps build, sign nothing, deploy to prod, and nobody knows." |
| `with-scs-gates` | run (SBOM + SLSA + signing) | run (verify + policy enforcement) | skip | "Same pipeline, SCS on. Default vulnerable repo. SBOM Policy Enforcement catches lodash@4.17.20 and log4j@2.14.1 — pipeline blocks before deploy." |
| `remediated` | run | run | run (swaps to clean `package.json` / `pom.xml` from `demo/seed-data/clean-*`) | "We've patched. Same SCS gates, no findings. Build → sign → verify → deploy, all green. The remediation arc closes." |

The repo always ships with vulnerable deps as the baseline state — there's no need for a "vulnerable" toggle because that *is* the default. Only `remediated` actively swaps anything.

---

## 3. Pipeline structure

The three-stage shape (Build → Approval → Deploy) stays. Two `when` conditions on step groups carry the on/off behavior, plus one `when` on the swap step. ASCII tree:

```
SCS Demo CI-CD Pipeline
│
├── Stage: Build and Secure All Services  (always)
│   ├── StepGroup: Pre-Build Mutations
│   │   └── Swap to Clean Deps           when: scenario_preset == "remediated"
│   ├── StepGroup: Run Tests             (always — backend / frontend / notification in parallel)
│   ├── StepGroup: Build and Push Images (always — matrix over backend / frontend / notification)
│   └── StepGroup: SCS Service           when: scenario_preset != "no-scs-gates"
│       │                                (matrix over backend / frontend / notification)
│       ├── SBOM Generation
│       ├── SLSA Provenance
│       └── Artifact Signing
│
├── Stage: Approval                      (always)
│
└── Stage: Deploy SupplyWatch            (always; matrix over services)
    ├── StepGroup: SCS Gates Prod        when: scenario_preset != "no-scs-gates"
    │   │                                (per-service via serviceVariables.image_name)
    │   ├── SLSA Verification
    │   ├── Artifact Verification
    │   └── SBOM Policy Enforcement
    ├── StepGroup: Canary Deployment
    ├── StepGroup: Primary Deployment
    └── Step: Get Frontend URL           when: service.identifier == "supplywatchfrontend"
```

### 3.1 The three `when` conditions

```yaml
# Build stage — SCS Service step group
when:
  stageStatus: Success
  condition: <+pipeline.variables.scenario_preset> != "no-scs-gates"

# Deploy stage — SCS Gates Prod step group
when:
  stageStatus: Success
  condition: <+pipeline.variables.scenario_preset> != "no-scs-gates"

# Build stage — Swap to Clean Deps step
when:
  stageStatus: Success
  condition: <+pipeline.variables.scenario_preset> == "remediated"
```

That's the entire control surface. No resolver script, no intermediate output variables.

---

## 4. Supporting artifacts

Already in the repo and used by the design:

| Artifact | Purpose |
|----------|---------|
| `demo/scripts/swap-vulnerable-dep.sh` | Copies clean dep manifests over the vulnerable defaults when `remediated` is selected |
| `demo/seed-data/clean-package.json`, `clean-pom.xml` | Patched dep manifests for backend + notification service |
| `demo/seed-data/vulnerable-package.json`, `vulnerable-pom.xml` | Reference snapshots of the default vulnerable state (not used by the pipeline today, kept for reset/debugging) |
| `.harness/policies/deny-vulnerable-versions.rego`, `deny-blocked-components.rego`, `deny-gpl-licenses.rego`, `require-slsa-attestation.rego`, `sbom-drift-approval.rego` | OPA policies referenced by the `SBOM Policy Enforcement` step; provide the actual deny logic |
| `demo/gpl-stub-package/` | Local GPL-3.0 component imported by the frontend, exercises `deny-gpl-licenses.rego` |

Out of scope at this layer (would be needed to bring scenarios 5, 9, 10 back in):

- `demo/scripts/inject-drift.sh` and SBOM baseline storage (drift)
- `XZ_VERSION` ARG in `app/backend/Dockerfile` plus a `buildArgs` pass-through (xz)
- `compromised-frontend-package.json` seed file plus a frontend branch in the swap script (npm takeover)

---

## 5. What this design deliberately does *not* do

- **Resolver stage.** An earlier draft computed five `resolved_*` output variables in a `Resolve Preset` shell-script stage. Three of them were never consumed downstream. With only three presets and three `when` conditions, direct variable references are clearer.
- **Per-scenario presets.** `xz-backdoor`, `npm-takeover`, `drift`, `all-risks`, and `baseline`/`remediated`-with-warn-mode all existed in earlier drafts. They were dropped because most either had no working wiring or duplicated `with-scs-gates` behavior. If those scenarios become demo-relevant again, they should be added as separate features (e.g. an `inject_xz` boolean) — not as overloaded preset variants.
- **`slsa_verify_at_deploy` toggle.** A boolean to skip SLSA verification at deploy was considered and removed — a knob to turn off verification undermines the pitch that verification is non-negotiable.
- **Multiple pipelines.** One pipeline keeps the story simple for the presenter and keeps execution history in one place for dashboards.
- **Auto-detect mode.** Everything is presenter-driven. Saves cognitive load mid-demo.
- **Demoing scenarios 6, 7, 8 from inside the pipeline.** RSPM and Dashboards read Harness-side data independently of pipeline runs; CI Tool Compromise is a GitHub Actions story.

---

## 6. Open questions

1. **Approval gate placement.** Should `no-scs-gates` skip the Approval stage too? Probably yes — the whole point of the preset is "look how easy it is to ship vulnerable code." An approval prompt mid-demo breaks the punchline. Currently the Approval stage runs regardless; revisit if the demo cadence demands.
2. **`SBOM_CI_Enforcement` policy set.** Referenced by the `SscaEnforcement` step but lives in the Harness account's Policy Management, not in this repo. Worth documenting in presenter setup notes so a fresh account doesn't fail the gate for the wrong reason.
3. **Re-introducing scenarios 5, 9, 10.** When/if these come back, are they additional `scenario_preset` values, or independent runtime variables (e.g. `inject_xz: true|false`)? The latter is cleaner — composable with the SCS on/off story instead of overloading it.
