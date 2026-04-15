# SCS Demo — Runtime-Conditional Pipeline Design

## Goal

Turn the single `SCS Demo CI-CD Pipeline` into a **demo-driver**: one pipeline, a handful of runtime inputs, presenter picks the scenario(s) at trigger time, the pipeline exercises the chosen Harness SCS capabilities end-to-end. Today the pipeline always deploys the full vulnerable stack. We want the same build + deploy flow, but with conditional behavior so all ten `IMPLEMENTATION_PLAN.md` scenarios (or the nine that are pipeline-demoable) can be shown from the same YAML.

---

## 1. What can live inside the pipeline vs. outside

| # | Scenario | In-pipeline? | Why |
|---|----------|--------------|-----|
| 1 | SBOM Generation & Attestation | ✅ Always-on | SBOM Orchestration step runs every build; just show the Supply Chain tab |
| 2 | OPA Policy Block | ✅ Runtime toggle | Swap vuln deps + toggle policy enforcement mode |
| 3 | SLSA Provenance | ✅ Always-on + toggle | Generate always, add optional verify gate |
| 4 | Zero-Day / Remediation Tracker | ✅ Partial | Pipeline shows the block/unblock loop; Tracker UI is external |
| 5 | SBOM Drift | ✅ Runtime toggle | Inject a new dependency pre-build to force drift |
| 6 | RSPM | ❌ External | Repo-scanning capability; pipeline has no role |
| 7 | Dashboard / AppSec Agent | ❌ External | Observability over pipeline output; no gating role |
| 8 | CI Tool Compromise (tj-actions) | ⚠️ Narrative-only | Lives in `.github/workflows/`, not Harness. Pipeline can at most *link* to it |
| 9 | xz-utils Backdoor | ✅ Runtime toggle | Inject xz-utils@5.6.1 via Dockerfile build-arg |
| 10 | NPM Account Takeover | ✅ Runtime toggle | Swap compromised `chalk` version via swap script |

So **one pipeline can cover scenarios 1–5 and 9–10 directly**. Scenarios 6, 7, and 8 are presented alongside but don't need pipeline gating.

---

## 2. Proposed runtime inputs

Six variables, each with a sensible default so `Run Pipeline` still works without thinking.

| Variable | Type | Allowed values | Default | Controls |
|----------|------|----------------|---------|----------|
| `scenario_preset` | enum | `clean`, `policy-block`, `zero-day-log4j`, `zero-day-lodash`, `drift`, `xz-backdoor`, `npm-takeover`, `all-risks`, `custom` | `clean` | One-click preset — sets the other vars below. `custom` = use explicit values |
| `vulnerability_profile` | enum | `clean`, `backend`, `notification`, `frontend-gpl`, `all` | `clean` | Which service(s) get vulnerable deps via `swap-vulnerable-dep.sh` |
| `policy_mode` | enum | `block`, `warn`, `skip` | `block` | Whether OPA policy violations fail the build, log-only, or are skipped |
| `inject_xz` | boolean | `true`, `false` | `false` | Add `xz-utils@5.6.1` to the backend image via `ARG XZ_VERSION` |
| `inject_npm_compromise` | boolean | `true`, `false` | `false` | Add `chalk@5.3.0-compromised` to frontend via swap variant |
| `slsa_verify_at_deploy` | boolean | `true`, `false` | `true` | Enforce SLSA attestation check before deploy |
| `force_drift` | boolean | `true`, `false` | `false` | Inject a new GPL dep pre-build to produce SBOM drift vs. previous run |

`scenario_preset` is the **demo-day control**. A runtime script at the top of the pipeline resolves the preset into the underlying vars, so the presenter picks one dropdown value and the pipeline behaves accordingly.

### 2.1 Preset → variable mapping

| Preset | `vuln_profile` | `policy_mode` | `inject_xz` | `inject_npm` | `slsa_verify` | `force_drift` | Demos scenarios |
|--------|----------------|---------------|-------------|--------------|---------------|---------------|-----------------|
| `clean` | clean | block | false | false | true | false | 1, 3 |
| `policy-block` | backend | block | false | false | true | false | 1, 2, 3 |
| `zero-day-log4j` | notification | block | false | false | true | false | 1, 2, 3, 4 |
| `zero-day-lodash` | backend | block | false | false | true | false | 1, 2, 3, 4 |
| `drift` | clean | warn | false | false | true | true | 1, 5 |
| `xz-backdoor` | clean | block | true | false | true | false | 1, 2, 9 |
| `npm-takeover` | clean | block | false | true | true | false | 1, 2, 10 |
| `all-risks` | all | warn | true | true | true | true | 1–5, 9, 10 (kitchen sink) |

`all-risks` is the “everything on” preset — useful to populate dashboards and the Remediation Tracker with rich data before a demo.

---

## 3. Pipeline structure with conditionals

The existing three-stage shape (Build → Approval → Deploy) stays. New work slots in as optional steps gated by `when` conditions. ASCII tree:

```
SCS Demo CI-CD Pipeline
├── Stage: Resolve Preset              (always)
│   └── ShellScript: preset → export variables (sets runtime vars if preset ≠ custom)
│
├── Stage: Build and Secure All Services  (always)
│   ├── StepGroup: Pre-Build Mutations
│   │   ├── Swap Vulnerable Deps        when: vulnerability_profile != "clean"
│   │   ├── Inject xz-utils             when: inject_xz == true
│   │   ├── Inject NPM Compromise       when: inject_npm_compromise == true
│   │   └── Force Drift Package         when: force_drift == true
│   ├── StepGroup: Run Tests            (always)
│   ├── StepGroup: Build and Push       (always)
│   ├── StepGroup: Supply Chain         (always)
│   │   ├── SBOM Orchestration (×3 services)
│   │   ├── SLSA Provenance (×3)
│   │   └── SBOM Policy Enforcement
│   │         policy_mode == "block" → Error and Fail Pipeline
│   │         policy_mode == "warn"  → Log Only
│   │         policy_mode == "skip"  → step disabled via `when: policy_mode != "skip"`
│   └── StepGroup: Drift Report         when: force_drift == true
│         compares this run's SBOM vs. previous run's stored SBOM
│
├── Stage: Approval                     (always, unchanged)
│
└── Stage: Deploy SupplyWatch           (always; matrix over services)
    ├── SLSA Verification               when: slsa_verify_at_deploy == true
    ├── Canary Deployment
    ├── Primary Deployment
    └── Get Frontend URL                when: service.identifier == "supplywatchfrontend"
```

### 3.1 Example YAML snippets

**Resolve preset (first stage, first step):**

```yaml
- step:
    name: Resolve Scenario Preset
    identifier: resolve_preset
    type: ShellScript
    spec:
      shell: Bash
      source:
        type: Inline
        spec:
          script: |
            case "<+pipeline.variables.scenario_preset>" in
              clean)           VP=clean;           PM=block; XZ=false; NPM=false; DRIFT=false ;;
              policy-block)    VP=backend;         PM=block; XZ=false; NPM=false; DRIFT=false ;;
              zero-day-log4j)  VP=notification;    PM=block; XZ=false; NPM=false; DRIFT=false ;;
              zero-day-lodash) VP=backend;         PM=block; XZ=false; NPM=false; DRIFT=false ;;
              drift)           VP=clean;           PM=warn;  XZ=false; NPM=false; DRIFT=true  ;;
              xz-backdoor)     VP=clean;           PM=block; XZ=true;  NPM=false; DRIFT=false ;;
              npm-takeover)    VP=clean;           PM=block; XZ=false; NPM=true;  DRIFT=false ;;
              all-risks)       VP=all;             PM=warn;  XZ=true;  NPM=true;  DRIFT=true  ;;
              custom)
                VP="<+pipeline.variables.vulnerability_profile>"
                PM="<+pipeline.variables.policy_mode>"
                XZ="<+pipeline.variables.inject_xz>"
                NPM="<+pipeline.variables.inject_npm_compromise>"
                DRIFT="<+pipeline.variables.force_drift>"
                ;;
            esac
            echo "resolved_vuln_profile=$VP"
            echo "resolved_policy_mode=$PM"
            echo "resolved_inject_xz=$XZ"
            echo "resolved_inject_npm=$NPM"
            echo "resolved_force_drift=$DRIFT"
      outputVariables:
        - { name: resolved_vuln_profile, type: String, value: VP }
        - { name: resolved_policy_mode,  type: String, value: PM }
        - { name: resolved_inject_xz,    type: String, value: XZ }
        - { name: resolved_inject_npm,   type: String, value: NPM }
        - { name: resolved_force_drift,  type: String, value: DRIFT }
      onDelegate: true
```

Downstream steps reference `<+pipeline.stages.resolve.spec.execution.steps.resolve_preset.output.outputVariables.resolved_vuln_profile>` in their `when` conditions.

**Swap vulnerable deps:**

```yaml
- step:
    name: Swap Vulnerable Deps
    identifier: swap_deps
    type: Run
    when:
      stageStatus: Success
      condition: <+...resolved_vuln_profile> != "clean"
    spec:
      connectorRef: account.harnessImage
      image: mirror.gcr.io/library/bash:5
      shell: Sh
      command: |
        bash demo/scripts/swap-vulnerable-dep.sh vulnerable \
          --service <+...resolved_vuln_profile>
```

**Inject xz-utils at build time (via Dockerfile ARG):**

In `app/backend/Dockerfile`:

```dockerfile
ARG XZ_VERSION=""
RUN if [ -n "$XZ_VERSION" ]; then \
      apk add --no-cache xz=$XZ_VERSION || echo "xz=$XZ_VERSION not in apk"; \
    fi
```

In the Build Backend step:

```yaml
buildArgs:
  XZ_VERSION: "<+...resolved_inject_xz == \"true\" ? \"5.6.1-r0\" : \"\">"
```

(If Alpine's apk doesn't have 5.6.1, download from archive; a static binary copy works too. The point is the SBOM should show `xz-utils@5.6.1` so the OPA deny-list fires.)

**Policy enforcement mode:**

The SBOM Policy Enforcement step has a `failStrategy` field. Two steps, one gated by mode:

```yaml
- step:
    name: Enforce SBOM Policies (Block)
    when: { condition: <+...resolved_policy_mode> == "block" }
    type: SscaOrchestration
    spec: { policyFailureStrategy: ErrorAndFailPipeline, ... }

- step:
    name: Enforce SBOM Policies (Warn)
    when: { condition: <+...resolved_policy_mode> == "warn" }
    type: SscaOrchestration
    spec: { policyFailureStrategy: Warn, ... }
```

`skip` simply means neither step runs.

---

## 4. Supporting artifacts to create / update

| # | Artifact | New or existing? | Purpose |
|---|----------|------------------|---------|
| 1 | `demo/scripts/swap-vulnerable-dep.sh` | New (per IMPLEMENTATION_PLAN 8.2) | Toggle vulnerable deps for backend/notification/frontend |
| 2 | `demo/seed-data/vulnerable-package.json`, `clean-package.json` | New | Backend dep variants |
| 3 | `demo/seed-data/vulnerable-pom.xml`, `clean-pom.xml` | New | Notification-service dep variants |
| 4 | `demo/gpl-stub-package/` | New | GPL-3.0 local pkg for license policy demo |
| 5 | `demo/scripts/inject-drift.sh` | New | Adds one extra dep (e.g. `moment`) pre-build for drift runs |
| 6 | `.harness/policies/deny-vulnerable-versions.rego` etc. | New | OPA policies referenced by the enforcement step |
| 7 | Dockerfile build-arg for `xz-utils` | Update to `app/backend/Dockerfile` | Conditional xz injection |
| 8 | Frontend `package.json` variants with `chalk@5.3.0-compromised` | New seed files | NPM takeover demo |
| 9 | Previous-run SBOM artifact stash | New (pipeline output publishing) | Diff target for drift detection |
| 10 | Pipeline runtime variables + preset resolver step | Update to `.harness/pipelines/main-pipeline.yaml` | The core change |

---

## 5. Phased implementation

Keeps the pipeline green at each phase — each phase is an independent, demo-able checkpoint.

**Phase A — Inputs & preset resolver (no behavior change yet)**
1. Add the 7 runtime variables to the pipeline with sensible defaults.
2. Add the `Resolve Scenario Preset` step that just echoes resolved values.
3. Test: running with default `clean` preset matches today's behavior.

**Phase B — Vulnerability swapping + policy modes** (scenarios 1, 2, 4)
1. Land the swap script + clean/vulnerable seed files.
2. Wire the `Swap Vulnerable Deps` step + `when`.
3. Add two policy-enforcement step variants (block / warn) gated by `resolved_policy_mode`.
4. Test each `policy-block`, `zero-day-log4j`, `zero-day-lodash` preset.

**Phase C — SLSA verify gate** (scenario 3)
1. Add SLSA Verification step in Deploy stage, gated by `slsa_verify_at_deploy`.
2. Test: toggling verify off lets an unsigned image through; on blocks it.

**Phase D — Supply-chain attack injections** (scenarios 9, 10)
1. Dockerfile build-arg for xz-utils.
2. Frontend variant seed with compromised chalk.
3. Wire `inject_xz` / `inject_npm_compromise` into the pre-build mutation step group.
4. Add OPA deny entries for `xz-utils@5.6.1`, `chalk@5.3.0-compromised`.
5. Test each preset.

**Phase E — Drift detection** (scenario 5)
1. Add `Inject Drift` step that adds `moment` (or any extra dep) pre-build.
2. After build, publish the SBOM as a pipeline output artifact so the *next* run can diff against it.
3. Add a `Drift Report` step that compares current SBOM to previous-run SBOM and uploads the diff.
4. Test: run `drift` preset twice in a row — first seeds the baseline, second shows drift.

**Phase F — Documentation & presenter crib sheet**
1. Add `demo/PRESENTER_GUIDE.md`: one page per preset, "click X, narrate Y".
2. Update `README.md` with the preset dropdown and what each demonstrates.

---

## 6. What this design deliberately does *not* do

- **Fork into multiple pipelines.** One pipeline keeps the story simple for the presenter and keeps the execution history in one place for dashboards.
- **Auto-detect what to demo.** Everything is presenter-driven via preset. Saves cognitive load mid-demo.
- **Try to demo scenarios 6, 7, 8 from inside the pipeline.** RSPM and Dashboards read Harness-side data independently of the pipeline; CI Tool Compromise is a GitHub Actions story, not a Harness pipeline story. Those are shown alongside via UI, not via a pipeline run.

---

## 7. Open questions / decisions to make before implementing

1. **Destructive preset runs.** Do we want `all-risks` to actually deploy (so dashboards show everything) or stop at build so prod never gets poisoned? Suggest: let it *build*, block at deploy via `policy_mode=block` override.
2. **Preset naming exposure.** Show users `policy-block` or friendlier `"Demo: Blocked by Policy"`? Harness pipeline variables support labels separate from values.
3. **Drift baseline storage.** Pipeline artifact, Harness file secret, or an object-store bucket? Pipeline artifact is simplest but has retention limits.
4. **Matrix service scope for vuln injections.** Keep it "all services at once" or let the presenter pick exactly one? Current design lets one value cover one service; `all` is the everything-mode.
5. **Policy source.** Inline OPA policies in the pipeline vs. Harness Policy Management service. Policy Management makes the audit-trail demo stronger (scenario 4 step 12); inline is faster to iterate on.
