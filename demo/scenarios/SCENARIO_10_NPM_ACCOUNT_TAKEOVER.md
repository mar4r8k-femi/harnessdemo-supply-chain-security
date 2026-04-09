# Scenario 10: NPM Mass Account Takeover -- September 2025 Package Compromise

**Maps to:** Demo Skeleton Part 2, Section 6 (Zero-Day Response) & Part 2, Section 4 (OPA Policy)
**Duration:** 10--12 minutes
**Audience:** Security Engineers, DevSecOps Architects, Platform Engineers, CISOs

---

## Overview

This scenario demonstrates how Harness SCS detects and responds to a **mass package registry compromise** -- an attack where trusted NPM maintainer accounts are hijacked and used to publish malicious updates to widely-used packages. You will walk through how OSS search identifies compromised packages across your supply chain, how OPA policies block affected versions, and how the Remediation Tracker manages blast radius and response across environments.

This scenario highlights the "trust the publisher" problem. Unlike typosquatting or dependency confusion, these are **real packages from real maintainers** -- chalk, debug, strip-ansi, wrap-ansi, and 14+ others with a combined 2+ billion weekly downloads. Traditional `npm audit` did not catch this because the packages were published through legitimate accounts. SBOM policy enforcement provides a defense-in-depth layer that goes beyond registry-level checks.

> **Presenter Tip:** This attack is one of the largest NPM compromises in history by download volume. The scale (2B+ weekly downloads, 18+ packages) makes it immediately compelling for any audience. Pair it with the "trust the publisher" theme from the demo skeleton opening hook -- your audience will understand that even well-known, heavily-used packages are not immune.

**Reference:** [Lessons from the NPM Attack](https://harness.io/blog/lessons-from-the-npm-attack)

---

## The Attack: What Happened

On September 8, 2025, attackers executed a coordinated phishing campaign targeting NPM package maintainers:

1. **Phishing** -- Maintainers of popular packages received targeted credential-harvesting emails impersonating NPM/GitHub security alerts
2. **Account takeover** -- Attackers gained access to maintainer accounts and their NPM publish tokens
3. **Malicious publish** -- Attackers pushed new patch/minor versions of 18+ popular packages containing injected malicious code
4. **Downstream propagation** -- Applications using loose semver ranges (e.g., `^4.0.0`, `~2.1.0`) or running `npm install` without a lockfile automatically pulled the compromised versions
5. **Payload activation** -- The injected code targeted cryptocurrency wallets and blockchain transactions, silently redirecting funds

### Compromised Packages (Partial List)

| Package | Weekly Downloads | Compromised Version(s) | Role |
|---|---|---|---|
| `chalk` | ~250M | 5.4.1 | Terminal string styling |
| `debug` | ~350M | 4.3.7 | Debug logging utility |
| `strip-ansi` | ~300M | 7.1.1 | Strip ANSI escape codes |
| `wrap-ansi` | ~200M | 9.0.1 | Word-wrap strings with ANSI |
| + 14 others | ~900M+ combined | Various | Various utilities |

**Key insight:** These are not obscure packages. They are foundational utilities deep in the dependency tree of nearly every Node.js application. `chalk` and `debug` alone are transitive dependencies of Express, React CLI, Angular CLI, Webpack, ESLint, Jest, and thousands of other tools.

---

## Prerequisites

Before you begin, confirm the following:

- [ ] The SupplyWatch demo environment is running (`./demo/scripts/setup-demo-env.sh`)
- [ ] Harness SCS module is enabled with SBOM Orchestration configured for the demo pipelines
- [ ] At least one SBOM has been generated that includes Node.js dependencies (the demo `frontend` or `backend` service)
- [ ] OPA policies are loaded: `.harness/policies/deny-blocked-components.rego` and `.harness/policies/deny-vulnerable-versions.rego`
- [ ] Harness SCS OSS (Open Source Search) is accessible
- [ ] Remediation Tracker is enabled in the Harness project
- [ ] Jira integration is configured (for ticket creation from Remediation Tracker)

---

## Step 1: Scene Setting -- The Scale of the Attack

> **Talk Track:** "It is September 8, 2025. Reports are flooding in -- attackers have compromised the NPM accounts of maintainers behind some of the most downloaded packages in the JavaScript ecosystem. We are talking about chalk, debug, strip-ansi, wrap-ansi, and at least 14 others -- packages with a combined 2 billion-plus weekly downloads. The attackers phished the maintainers, took over their accounts, and pushed malicious updates that target cryptocurrency wallets. Every application that ran `npm install` without a lockfile or used a loose version range in the last 48 hours may be compromised. Your CISO is asking: Are we affected? How many of our services use these packages? Can we block them right now?"

Pause and let the scale sink in. Then:

> **Talk Track:** "Here is the problem: `npm audit` will not help you here. These updates came from the legitimate maintainer accounts. The registry sees them as normal publishes. There is no CVE yet. There is no advisory yet. The only way to know if you are exposed is to know exactly what is in your software -- and that means SBOMs and policy enforcement."

---

## Step 2: OSS Search -- Find Affected Packages Across the Supply Chain

Navigate to **Harness SCS > Supply Chain > OSS Search**.

1. Search for `chalk` -- show all artifacts and pipelines that contain this package
2. Filter by the compromised version (`5.4.1`) to see which artifacts pulled the malicious update
3. Repeat for `debug@4.3.7` to show the pattern across multiple packages
4. Show the **artifact list** -- every container image and build artifact that includes a compromised package version

> **Talk Track:** "OSS Search instantly tells us everywhere these packages exist in our supply chain. I searched for chalk version 5.4.1 -- the compromised version -- and Harness shows me every artifact, every pipeline, every environment where it appears. This is not scanning one project at a time. This is a single query across our entire software catalog. Within seconds, we know our blast radius."

---

## Step 3: Show Affected Packages in SBOM

Navigate to a specific artifact that contains a compromised package.

1. Open the **SBOM** tab for the artifact
2. Search for `chalk` in the component list
3. Show that the SBOM records the exact version (`5.4.1`), the supplier, and the dependency path
4. Highlight the transitive dependency chain -- e.g., `your-app > some-cli-tool > chalk@5.4.1`
5. Show that the SBOM was generated *before* the attack, proving the version was pulled in during a recent build

> **Talk Track:** "The SBOM tells us exactly how chalk got into this artifact. It is a transitive dependency -- we did not add it directly, it came in through our CLI tooling. This is the 'trust the publisher' problem in action. We trusted chalk because it is one of the most popular packages in the NPM ecosystem, maintained by well-known developers. But the maintainer's account was compromised, and that trust was weaponized against us."

---

## Step 4: OPA Policy -- Block Compromised Versions

Navigate to **Harness Policy Management** and create (or show) an OPA policy that blocks the compromised package versions.

### Policy: Block Compromised NPM Packages

Show the policy logic:

```rego
# Block packages affected by September 2025 NPM account takeover
deny_npm_compromised[msg] {
    component := input.components[_]
    compromised := {
        "chalk@5.4.1",
        "debug@4.3.7",
        "strip-ansi@7.1.1",
        "wrap-ansi@9.0.1"
        # ... additional compromised versions
    }
    pkg := sprintf("%s@%s", [component.name, component.version])
    compromised[pkg]
    msg := sprintf("BLOCKED: '%s' is a known-compromised package from the September 2025 NPM account takeover. Update to a verified clean version. See: harness.io/blog/lessons-from-the-npm-attack", [pkg])
}
```

1. Show the policy in the Harness Policy Management UI
2. Explain that this policy evaluates against every SBOM generated by the pipeline
3. Show what happens when a build contains a compromised version -- the **SBOM Policy Enforcement** step fails and blocks the pipeline
4. Highlight the actionable error message with the specific package and a link to the Harness blog for context

> **Talk Track:** "Within minutes of the advisory, the security team created this OPA policy. It blocks any build that contains a known-compromised version of the affected packages. This is not a suggestion or a warning -- this is a hard gate. No artifact with these versions will make it past this point in the pipeline. And because it is OPA, we have full version control, audit trail, and the ability to update the blocked list as new compromised versions are identified."

---

## Step 5: AI-Assisted Policy Generation via AppSec Agent

Demonstrate how the **AppSec Agent** can accelerate policy creation:

1. Open the AppSec Agent / AI assistant in Harness
2. Prompt: *"Generate an OPA policy to block all NPM packages compromised in the September 2025 account takeover attack"*
3. Show the AI-generated policy output -- it should include the list of known compromised packages and versions
4. Review the generated policy and apply it

> **Talk Track:** "In a zero-day scenario, speed matters. Instead of writing OPA policies from scratch, we can use the AppSec Agent to generate them. I described what I needed in plain English, and it produced a working OPA policy with the correct package names, versions, and error messages. The security engineer reviews and approves, and we have a blocking policy deployed in minutes, not hours."

---

## Step 6: Remediation Tracker -- Manage the Response

Navigate to the **Remediation Tracker** in Harness SCS.

1. Create a new Remediation Tracker entry for the NPM account takeover
2. Show the **blast radius view** -- all affected artifacts, pipelines, and environments
3. Assign an owner and set a Critical SLA (e.g., 24 hours)
4. Define remediation steps:
   - Pin all affected packages to known-clean versions in `package.json` and `package-lock.json`
   - Run `npm audit signatures` to verify package provenance where available
   - Rebuild and redeploy all affected artifacts
   - Verify clean SBOMs post-rebuild
5. Create a Jira ticket from the tracker for cross-team coordination
6. Show the environment-by-environment status: Dev (remediated), Staging (in progress), Prod (pending)

> **Talk Track:** "The Remediation Tracker gives us a single pane of glass for this incident. I can see every affected artifact, who owns remediation, the SLA, and the status across all environments. As teams rebuild with clean versions, the tracker updates automatically based on new SBOMs. When every environment shows green, we have auditable proof that the compromise has been fully remediated -- and we can show that to auditors, customers, or regulators."

---

## Step 7: Tie It All Together

> **Talk Track:** "Let's step back and look at what Harness SCS did for us in this scenario:
>
> 1. **OSS Search** instantly identified every artifact and environment affected by the compromised packages -- across our entire software catalog, not project by project.
> 2. **SBOM analysis** showed us exactly how these packages entered our supply chain, including transitive dependency paths we did not even know about.
> 3. **OPA policies** blocked any new build containing compromised versions -- a hard gate, not a warning.
> 4. **AppSec Agent** helped us generate blocking policies in minutes using plain English.
> 5. **Remediation Tracker** gave us a single pane of glass to manage the response across all environments with auditable proof of resolution.
>
> This is the critical point: `npm audit` did not flag this. The registry did not flag this. These were legitimate publishes from legitimate accounts. The only defense was knowing exactly what was in our software and having policy enforcement that could block specific versions regardless of their source. That is what SBOM-driven supply chain security gives you -- a defense-in-depth layer that does not depend on trusting the publisher."

---

## Key Differentiators to Highlight

| Capability | Harness SCS | Typical Competitor |
|---|---|---|
| Cross-catalog OSS search | Single query finds affected packages across all artifacts and environments | Project-by-project scanning |
| SBOM-based detection | Detects compromised versions even without CVE/advisory | Depends on advisory databases |
| OPA policy for specific versions | Block exact compromised versions as a hard pipeline gate | Warning-only or no version-level blocking |
| AI-assisted policy generation | AppSec Agent generates OPA policies from natural language | Manual policy authoring |
| Remediation Tracker | Full lifecycle: detect, assign, track, prove -- across environments | Spreadsheets or manual Jira workflows |
| Transitive dependency visibility | SBOM shows full dependency path to compromised package | Direct dependencies only |

---

## Why This Matters: The "Trust the Publisher" Problem

Traditional supply chain security assumes that if a package comes from a known, trusted maintainer, it is safe. This attack breaks that assumption completely:

- **npm audit** did not flag it -- the packages were published through legitimate accounts
- **Registry checks** did not flag it -- the publisher matched the expected maintainer
- **Signature verification** (where available) may have passed -- the maintainer's credentials were compromised, not spoofed

The only reliable defense is **knowing exactly what is in your software** (SBOMs) and **enforcing policies on specific component versions** (OPA) regardless of who published them. This is what Harness SCS provides.

---

## Anticipated Questions

- *"How is this different from a typosquatting attack?"* -- Typosquatting uses similarly-named packages (e.g., `chalkk` instead of `chalk`). This attack compromised the *real* package from the *real* maintainer account. That is what makes it so dangerous -- there were no obvious red flags.

- *"Would npm audit have caught this?"* -- Not initially. `npm audit` relies on advisories in the NPM security database. Until an advisory is published (which can take hours or days), `npm audit` sees nothing wrong. SBOM-based policy enforcement lets you block specific versions immediately, before any advisory exists.

- *"What about lockfiles? Would a lockfile have prevented this?"* -- A lockfile (`package-lock.json`) pins exact versions and prevents automatic upgrades on `npm install`. However, any team that ran `npm update`, merged a Dependabot PR, or did a fresh install without a committed lockfile would have pulled the compromised version.

- *"Can Harness SCS detect this in real time?"* -- Yes. As soon as the compromised versions are identified, OSS Search finds them across all SBOMs in your catalog. OPA policies can be deployed within minutes to block any pipeline that includes them. The Remediation Tracker then manages the response.

- *"What about packages we do not use directly but come in as transitive dependencies?"* -- This is exactly why SBOMs are essential. The SBOM records every component, including transitive dependencies, with their exact versions. OSS Search queries against the full SBOM, not just your `package.json`.

- *"How do we prevent this from happening again?"* -- Harness SCS provides multiple layers: SBOM generation captures your full dependency tree, OPA policies enforce version-level controls, and continuous monitoring via OSS Search alerts you when new compromises are discovered. Additionally, adopting `npm audit signatures` and requiring package provenance (where supported) adds another verification layer.

- *"How does the AppSec Agent know which packages are compromised?"* -- The AppSec Agent uses threat intelligence feeds, community advisories, and the Harness knowledge base. In a fast-moving incident, you can also provide the compromised package list directly in your prompt and the agent will generate the appropriate policy.
