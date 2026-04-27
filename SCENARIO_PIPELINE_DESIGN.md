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

One variable. The preset is the single demo-day control; every internal toggle is derived from it by the resolver step. This replaces an earlier seven-variable design where five of them silently did nothing unless `scenario_preset=custom` — a confusing Run form mid-presentation.

| Variable | Type | Allowed values | Default | Controls |
|----------|------|----------------|---------|----------|
| `scenario_preset` | enum | `baseline`, `remediated` *(currently exposed)* — design also covers `drift`, `xz-backdoor`, `npm-takeover`, `all-risks` (gated out until Phases D & E land) | `baseline` | One-click preset — drives dep swaps, policy mode, attack injections, and drift |

A runtime `Resolve Preset` stage at the top of the pipeline maps the preset into five internal `resolved_*` output variables (`resolved_vuln_profile`, `resolved_policy_mode`, `resolved_inject_xz`, `resolved_inject_npm`, `resolved_force_drift`) that downstream `when` conditions reference.

> **Removed:** an earlier draft included a second runtime input `slsa_verify_at_deploy` (`true`/`false`) that gated the SLSA Verification step in Deploy. It was dropped because a knob to skip SLSA verification undermines the demo's premise that verification is non-negotiable, and every realistic "verification fails" path is already covered by `drift` / `xz-backdoor` / `npm-takeover`.

New demos = add a preset row, not a new runtime permutation. If one-off tweaks are ever needed, clone the pipeline rather than re-introducing a `custom` escape hatch.

### 2.1 Preset → resolved-variable mapping

The repo ships with vulnerable dependencies by default (lodash@4.17.20, log4j-core@2.14.1, etc.), so most presets use `resolved_vuln_profile=none` — no dep swap needed. Only `remediated` actively swaps to patched versions.

> **Currently exposed in `allowedValues`:** `baseline`, `remediated`. The other four rows below are kept in the resolver `case` statement and in this table as design intent — they will be re-enabled once the supporting wiring (Dockerfile build-args, frontend chalk seed files, drift inject + report) lands per Phases D & E.

| Preset | `resolved_vuln_profile` | `resolved_policy_mode` | `resolved_inject_xz` | `resolved_inject_npm` | `resolved_force_drift` | Demos scenarios |
|--------|-------------------------|------------------------|----------------------|-----------------------|------------------------|-----------------|
| `baseline` | none | block | false | false | false | 1, 2, 3, 4 — repo as-is, SCS catches existing vulns (lodash, log4j, etc.) |
| `remediated` | remediated | block | false | false | false | 1, 3 — swaps to clean deps, policies pass ("green path") |
| `drift` | none | warn | false | false | true | 1, 5 — injects extra dep for drift detection |
| `xz-backdoor` | none | block | true | false | false | 1, 2, 9 — injects xz-utils@5.6.1 backdoor |
| `npm-takeover` | none | block | false | true | false | 1, 2, 10 — injects compromised chalk |
| `all-risks` | none | warn | true | true | true | 1–5, 9, 10 (kitchen sink) |

The old `policy-block`, `zero-day-log4j`, and `zero-day-lodash` presets were collapsed into `baseline` — since the repo ships with all vulnerable deps, these presets produced identical pipeline runs. The presenter narrates whichever vulnerability they want to highlight; the pipeline behavior is the same.

`all-risks` is the “everything on” preset — useful to populate dashboards and the Remediation Tracker with rich data before a demo.

---

## 3. Pipeline structure with conditionals

The existing three-stage shape (Build → Approval → Deploy) stays. New work slots in as optional steps gated by `when` conditions. ASCII tree:

```
SCS Demo CI-CD Pipeline
├── Stage: Resolve Preset              (always)
│   └── ShellScript: preset → export resolved_* variables
│
├── Stage: Build and Secure All Services  (always)
│   ├── StepGroup: Pre-Build Mutations
│   │   ├── Swap to Clean Deps          when: resolved_vuln_profile == "remediated"
│   │   ├── Inject xz-utils             when: resolved_inject_xz == "true"     [DESIGN — not wired]
│   │   ├── Inject NPM Compromise       when: resolved_inject_npm == "true"    [DESIGN — not wired]
│   │   └── Force Drift Package         when: resolved_force_drift == "true"   [DESIGN — not wired]
│   ├── StepGroup: Run Tests            (always)
│   ├── StepGroup: Build and Push       (always — matrix over backend/frontend/notification)
│   ├── StepGroup: SCS Service          (always — matrix over backend/frontend/notification)
│   │   ├── SBOM Orchestration
│   │   ├── SLSA Provenance
│   │   └── Artifact Signing
│   └── StepGroup: Drift Report         when: resolved_force_drift == "true"   [DESIGN — not wired]
│
├── Stage: Approval                     (always, unchanged)
│
└── Stage: Deploy SupplyWatch           (always; matrix over services)
    ├── StepGroup: SCS Gates Prod       (matrix over services via serviceVariables.image_name)
    │   ├── SLSA Verification           (always)
    │   ├── Artifact Verification       (always)
    │   └── SBOM Policy Enforcement     when: resolved_policy_mode != "skip"
    │         resolved_policy_mode == "warn" → onFailure: MarkAsSuccess
    │         resolved_policy_mode == "block" → onFailure: fail stage (default)
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
              baseline)        VP=none;            PM=block; XZ=false; NPM=false; DRIFT=false ;;
              remediated)      VP=remediated;      PM=block; XZ=false; NPM=false; DRIFT=false ;;
              drift)           VP=none;            PM=warn;  XZ=false; NPM=false; DRIFT=true  ;;
              xz-backdoor)     VP=none;            PM=block; XZ=true;  NPM=false; DRIFT=false ;;
              npm-takeover)    VP=none;            PM=block; XZ=false; NPM=true;  DRIFT=false ;;
              all-risks)       VP=none;            PM=warn;  XZ=true;  NPM=true;  DRIFT=true  ;;
              *) echo "Unknown preset: <+pipeline.variables.scenario_preset>"; exit 1 ;;
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

**Swap to clean deps (only for `remediated` preset):**

```yaml
- step:
    name: Swap to Clean Deps
    identifier: swap_clean_deps
    type: Run
    when:
      stageStatus: Success
      condition: <+...resolved_vuln_profile> == "remediated"
    spec:
      connectorRef: account.harnessImage
      image: mirror.gcr.io/library/bash:5
      shell: Sh
      command: |
        bash demo/scripts/swap-vulnerable-dep.sh clean
```

Since the repo ships with vulnerable dependencies by default, there is no need to swap *to* vulnerable — most presets skip this step entirely (`resolved_vuln_profile=none`). Only `remediated` swaps to patched versions to demonstrate the "green path" where all policies pass.

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

## 6. Implementation status — preset → pipeline wiring

Verification of the current `.harness/pipelines/main-pipeline.yaml` against the design above. Phase A (resolver) and Phase B (vuln swap + policy modes) are wired; Phases C, D, E are not.

### 6.1 Resolved-variable consumption

Five `resolved_*` outputs are produced by the `Resolve Preset` stage. Only **two** are referenced anywhere downstream:

| Output | Consumed by | Status |
|--------|-------------|--------|
| `resolved_vuln_profile` | `Swap to Clean Deps` step (`when: == "remediated"`) | ✅ Wired |
| `resolved_policy_mode` | `SBOM Policy Enforcement` step `when` + failure strategy `MarkAsSuccess` for `warn` | ✅ Wired |
| `resolved_inject_xz` | nothing | ❌ Computed but never consumed |
| `resolved_inject_npm` | nothing | ❌ Computed but never consumed |
| `resolved_force_drift` | nothing | ❌ Computed but never consumed |

### 6.2 Per-preset behavior — design vs reality

| Preset | Design intent | Actual pipeline behavior | Gap |
|--------|---------------|--------------------------|-----|
| `baseline` | Build with default vulnerable deps; SBOM enforcement blocks | Builds with default deps; `SBOM Policy Enforcement` runs in block mode (no `MarkAsSuccess`) | None |
| `remediated` | Swap to clean deps; enforcement passes ("green path") | `Swap to Clean Deps` runs and overwrites `package.json` / `pom.xml` from `demo/seed-data/clean-*`; enforcement runs in block mode and should pass | None — but see §6.3 (swap step image lacks `npm`) |
| `drift` | Inject extra dep pre-build; warn mode; produce drift report | Warn mode is wired (enforcement failures → `MarkAsSuccess`); **drift is not actually injected**; no drift report step exists | `inject-drift.sh` doesn't exist; no `Force Drift Package` step in pipeline; no SBOM diff/report step; `resolved_force_drift` is dead |
| `xz-backdoor` | Inject `xz-utils@5.6.1` via Dockerfile build-arg; `deny-vulnerable-versions.rego` flags it; block | **xz is not injected**; pipeline behaves identically to `baseline` | Backend `Dockerfile` has no `XZ_VERSION` ARG; build steps pass no `buildArgs`; `resolved_inject_xz` is dead. The `xz-utils` entry in `deny-vulnerable-versions.rego` exists but never matches anything in the SBOM |
| `npm-takeover` | Swap frontend to compromised `chalk` version; block | **chalk is not swapped**; pipeline behaves identically to `baseline` | No `clean-frontend-package.json` / `compromised-frontend-package.json` seed files; swap script handles only backend + notification, not frontend; `resolved_inject_npm` is dead |
| `all-risks` | Kitchen sink — xz + npm + drift + warn | Only the `warn` policy mode is actually applied; xz/npm/drift are no-ops | Inherits all gaps above |

### 6.3 Other latent issues uncovered while verifying

- **`Swap to Clean Deps` runs in `bash:5`**, which has no `npm` or `mvn`. `swap-vulnerable-dep.sh` calls `npm install --silent` after copying `package.json`; under `set -euo pipefail` this should hard-fail the step. Either change the image to `node:20-alpine` (with `apk add maven` for the pom rebuild) or remove the `npm install` from the swap script and let the downstream `Run Backend Tests` step do `npm install` against the new `package.json`.
- **GPL license demo has no preset.** `demo/gpl-stub-package` and `deny-gpl-licenses.rego` exist, and `app/frontend/package.json` already depends on `demo-gpl-component`, so every build evaluates this policy — but no preset is named for the GPL story. Either fold it into `baseline` narration or add a `gpl-license` preset.
- **`SBOM_CI_Enforcement` policy set is referenced** by the `SscaEnforcement` step but not defined in this repo — it must exist in the Harness account's Policy Management. Worth noting in presenter setup docs.

### 6.4 Resolution

Two near-term fixes applied (see git history for the chore PR):

1. **Trimmed `allowedValues` to `baseline,remediated`** — the only two presets with genuinely distinct pipeline behavior today. Dropping the rest from the Run form keeps presenters from clicking a no-op preset mid-demo. The resolver `case` statement still covers the full set so re-enabling them is just an `allowedValues` edit once wiring lands.
2. **Switched the `Swap to Clean Deps` step image from `bash:5` to `node:20`** — `bash:5` has no `npm`, so `swap-vulnerable-dep.sh` was hard-failing on `npm install` under `set -euo pipefail`, breaking `remediated` itself. `node:20` has both `bash` and `npm`; the script's `mvn` block already gracefully degrades when Maven is absent, and the pipeline's `Run Notification Tests` step rebuilds with the swapped `pom.xml` regardless.

Implementing Phases D & E (xz Dockerfile ARG, frontend chalk seed files, drift inject + report) remains the eventual goal to restore the full preset set.

---

## 7. What this design deliberately does *not* do

- **Fork into multiple pipelines.** One pipeline keeps the story simple for the presenter and keeps the execution history in one place for dashboards.
- **Auto-detect what to demo.** Everything is presenter-driven via preset. Saves cognitive load mid-demo.
- **Try to demo scenarios 6, 7, 8 from inside the pipeline.** RSPM and Dashboards read Harness-side data independently of the pipeline; CI Tool Compromise is a GitHub Actions story, not a Harness pipeline story. Those are shown alongside via UI, not via a pipeline run.

---

## 8. Open questions / decisions to make before implementing

1. **Destructive preset runs.** Do we want `all-risks` to actually deploy (so dashboards show everything) or stop at build so prod never gets poisoned? Suggest: let it *build*, block at deploy via `policy_mode=block` override.
2. **Preset naming exposure.** Show users `policy-block` or friendlier `"Demo: Blocked by Policy"`? Harness pipeline variables support labels separate from values.
3. **Drift baseline storage.** Pipeline artifact, Harness file secret, or an object-store bucket? Pipeline artifact is simplest but has retention limits.
4. **Matrix service scope for vuln injections.** Keep it "all services at once" or let the presenter pick exactly one? Current design lets one value cover one service; `all` is the everything-mode.
5. **Policy source.** Inline OPA policies in the pipeline vs. Harness Policy Management service. Policy Management makes the audit-trail demo stronger (scenario 4 step 12); inline is faster to iterate on.
6. **One-off tweaks without a preset.** Resolved by dropping the `custom` escape hatch: if a demo needs a one-off combination, clone the pipeline or add a named preset row. Keeps the Run form to two dropdowns.
