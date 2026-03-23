# Frontend UI Redesign Plan

## Problem

The current UI is a risk-score dashboard (donut chart, severity counts, overall score). This duplicates what Harness SCS already provides and confuses the demo narrative. The frontend should represent **the application being protected**, not the security tool itself. Harness is the security layer — this app is the thing Harness watches over.

---

## Design Direction: "SupplyWatch — Dependency Transparency Portal"

Reframe the UI as an **internal developer portal** that teams use to browse their software components, view provenance, and check attestation status. It's a realistic app that _happens to have vulnerable dependencies_ — which Harness SCS then catches in CI/CD.

This creates a clean demo story:
1. Show the app (this UI) — it looks legit, teams use it daily
2. Swap in vulnerable deps (`swap-vulnerable-dep.sh`)
3. Push to Harness — pipeline catches the problem
4. The app itself is unaware; Harness is the guardrail

---

## Proposed Pages & Components

### Page 1: Component Catalog (home page `/`)

A searchable, filterable **card grid** of all software components — like a mini internal package registry.

Each card shows:
- Package name + version
- Supplier/maintainer
- License badge (MIT, Apache-2.0, GPL-3.0 with visual distinction)
- Provenance status: "Verified" / "Unverified" (shield icon, not a risk score)
- Last scanned timestamp
- PURL (copy-to-clipboard)

**Interactions:**
- Search bar with real-time filter
- Filter chips: by license type, by provenance status, by supplier
- Click card to open detail view

**Why this works for the demo:** When you swap to vulnerable deps, the catalog still looks the same — the app doesn't know it's insecure. That's the point. Harness SCS is what catches it.

### Page 2: Component Detail (`/components/:id`)

A detail page for a single component showing:

- **Identity section:** name, version, PURL, supplier
- **Provenance section:** verification status, signature info, build origin
- **License section:** license name, SPDX identifier, link to license text
- **Known CVEs section:** table of associated vulnerabilities (CVE ID, description, severity chip) — this is factual data, not a risk judgment
- **Dependency tree visualization:** a small tree/graph showing what this component depends on (gives depth to the demo)

### Page 3: SBOM Explorer (`/sbom`)

A visual, interactive **dependency graph** using a tree or force-directed layout.

- Nodes = packages, edges = dependency relationships
- Node color = license type (not risk)
- Click a node to highlight its dependency chain
- Toggle between "direct dependencies only" and "full transitive tree"
- Export SBOM button (generates a mock CycloneDX/SPDX JSON download)

**Why this is creative:** Dependency graphs are visually impressive in demos. They make abstract supply chain concepts tangible. When you swap to a vulnerable dep, the graph changes — a new node appears — which makes the Harness SCS detection feel more real.

### Header / Navigation

- Logo + "SupplyWatch" branding
- Nav links: Catalog, SBOM Explorer
- Subtle "Powered by Harness" badge in footer (reinforces the demo narrative)

---

## Visual Style

- **Dark sidebar + light content area** (modern developer tool aesthetic, think Linear/Vercel)
- **Monospace font for technical values** (package names, versions, PURLs)
- **Color palette:** Use blue/indigo for branding, reserve red/orange/green only for license and provenance badges — not for risk
- **Card-based layout** over tables where possible (more visual, better for demos on projector/screen share)
- **Subtle animations:** card hover lift, smooth page transitions, skeleton loaders

---

## Backend API Changes

Minimal changes needed — mostly reshaping existing data:

| Endpoint | Change |
|---|---|
| `GET /api/components` | Add `provenance`, `lastScanned`, `spdxLicense` fields to mock data |
| `GET /api/components/:id` | Return full detail including CVE list (merge current `/api/risk/components/:id` data) |
| `GET /api/sbom` | New — returns dependency graph structure (`{ nodes: [...], edges: [...] }`) |
| `GET /api/risk/summary` | Can be removed or kept for backward compat |
| `GET /api/sbom/export` | New — returns mock CycloneDX JSON file |

---

## New Component Structure

```
src/
  components/
    Layout.jsx            # Sidebar nav + content area shell
    CatalogGrid.jsx       # Card grid with search/filter
    ComponentCard.jsx     # Individual catalog card
    ComponentDetail.jsx   # Full detail page
    SbomGraph.jsx         # Dependency graph visualization
    ProvenanceBadge.jsx   # Verified/Unverified shield
    LicenseBadge.jsx      # License chip with SPDX color coding
    CveTable.jsx          # Factual CVE listing (no risk score)
    SearchBar.jsx         # Search + filter controls
  pages/
    Catalog.jsx           # Page wrapper for catalog
    Detail.jsx            # Page wrapper for detail
    SbomExplorer.jsx      # Page wrapper for SBOM graph
  App.jsx
  index.jsx
```

---

## Charting/Graph Library Options

- **Dependency graph:** [react-force-graph-2d](https://github.com/vasturiano/react-force-graph) (lightweight, interactive, impressive visuals) or `recharts` Treemap as a simpler fallback
- **Badges/chips:** Continue using MUI Chip with custom styling
- **Skeleton loaders:** MUI Skeleton component

---

## What Gets Removed

- `RiskScore.jsx` — the donut chart and overall score (this belongs in Harness)
- Risk severity color-coding on the component list (replace with license/provenance indicators)
- `/api/risk/summary` consumption from frontend

---

## Demo Flow After Redesign

1. **Open SupplyWatch** — presenter shows a polished component catalog. "This is our internal dependency portal."
2. **Browse SBOM graph** — "Here's our full dependency tree. Everything looks clean."
3. **Run `swap-vulnerable-dep.sh vulnerable`** — swap in log4j 2.14.1 and lodash 4.17.20
4. **Refresh the catalog** — new versions appear, but the app doesn't flag anything. It's just a catalog.
5. **Push to Harness / trigger pipeline** — Harness SCS scans, finds CVEs, blocks the build
6. **Show Harness UI** — "This is where policy enforcement lives. The app doesn't need to know — Harness catches it."

The separation between "app" and "security platform" is now crystal clear.

---

## Implementation Priority

1. **Component Catalog page** (highest value, replaces current dashboard)
2. **Component Detail page** (adds depth for click-through during demo)
3. **SBOM Explorer** (visual wow factor, can be phase 2)
4. **Layout/styling overhaul** (sidebar nav, dark theme accents)
