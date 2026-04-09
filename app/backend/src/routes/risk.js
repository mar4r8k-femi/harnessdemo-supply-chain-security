const express = require("express");
const router = express.Router();

const riskSummary = {
  totalComponents: 14,
  critical: 5,
  high: 2,
  medium: 3,
  low: 4,
  overallScore: 54,
};

const componentRiskDetails = {
  "comp-001": {
    componentId: "comp-001",
    name: "express",
    riskLevel: "low",
    score: 15,
    vulnerabilities: [],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "verified",
  },
  "comp-002": {
    componentId: "comp-002",
    name: "lodash",
    riskLevel: "critical",
    score: 95,
    vulnerabilities: [
      {
        id: "CVE-2021-23337",
        severity: "critical",
        description: "Command Injection in lodash",
      },
      {
        id: "CVE-2020-28500",
        severity: "high",
        description: "Regular Expression Denial of Service (ReDoS) in lodash",
      },
    ],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "unverified",
  },
  "comp-003": {
    componentId: "comp-003",
    name: "log4j-core",
    riskLevel: "critical",
    score: 99,
    vulnerabilities: [
      {
        id: "CVE-2021-44228",
        severity: "critical",
        description: "Log4Shell - Remote Code Execution via JNDI lookup",
      },
      {
        id: "CVE-2021-45046",
        severity: "critical",
        description: "Incomplete fix for CVE-2021-44228",
      },
    ],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "verified",
  },
  "comp-004": {
    componentId: "comp-004",
    name: "react",
    riskLevel: "low",
    score: 10,
    vulnerabilities: [],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "verified",
  },
  "comp-005": {
    componentId: "comp-005",
    name: "jsonwebtoken",
    riskLevel: "high",
    score: 78,
    vulnerabilities: [
      {
        id: "CVE-2022-23529",
        severity: "high",
        description:
          "Insecure implementation of key retrieval in jsonwebtoken",
      },
    ],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "verified",
  },
  "comp-006": {
    componentId: "comp-006",
    name: "axios",
    riskLevel: "medium",
    score: 45,
    vulnerabilities: [
      {
        id: "CVE-2023-45857",
        severity: "medium",
        description: "Cross-Site Request Forgery in axios",
      },
    ],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "verified",
  },
  "comp-007": {
    componentId: "comp-007",
    name: "spring-boot",
    riskLevel: "low",
    score: 12,
    vulnerabilities: [],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "verified",
  },
  "comp-008": {
    componentId: "comp-008",
    name: "openssl",
    riskLevel: "high",
    score: 80,
    vulnerabilities: [
      {
        id: "CVE-2022-3602",
        severity: "high",
        description: "Buffer overrun in X.509 certificate verification",
      },
    ],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "unverified",
  },
  "comp-009": {
    componentId: "comp-009",
    name: "tensorflow",
    riskLevel: "medium",
    score: 50,
    vulnerabilities: [
      {
        id: "CVE-2023-25801",
        severity: "medium",
        description: "Out-of-bounds read in TensorFlow",
      },
    ],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "verified",
  },
  "comp-010": {
    componentId: "comp-010",
    name: "webpack",
    riskLevel: "low",
    score: 8,
    vulnerabilities: [],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "verified",
  },
  "comp-011": {
    componentId: "comp-011",
    name: "tj-actions/changed-files",
    riskLevel: "critical",
    score: 97,
    vulnerabilities: [
      {
        id: "CVE-2025-30066",
        severity: "critical",
        description:
          "Compromised GitHub Action — malicious code injected via tag rewrite exfiltrates CI/CD secrets from runner environment to workflow logs",
      },
    ],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "unverified",
  },
  "comp-012": {
    componentId: "comp-012",
    name: "xz-utils",
    riskLevel: "critical",
    score: 99,
    vulnerabilities: [
      {
        id: "CVE-2024-3094",
        severity: "critical",
        description:
          "Backdoor in xz/liblzma — malicious build script injects code that hijacks OpenSSH authentication via IFUNC, enabling unauthorized remote access (CVSS 10.0)",
      },
    ],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "unverified",
  },
  "comp-013": {
    componentId: "comp-013",
    name: "chalk",
    riskLevel: "critical",
    score: 96,
    vulnerabilities: [
      {
        id: "NPM-2025-0908",
        severity: "critical",
        description:
          "NPM account takeover attack (Sep 2025) — compromised maintainer pushed malicious updates to 18+ packages with 2B+ weekly downloads, targeting cryptocurrency wallets",
      },
    ],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "unverified",
  },
  "comp-014": {
    componentId: "comp-014",
    name: "demo-gpl-component",
    riskLevel: "medium",
    score: 55,
    vulnerabilities: [],
    lastScanned: "2026-03-21T10:00:00Z",
    provenance: "unverified",
    policyViolations: [
      {
        id: "LICENSE-GPL-3.0",
        type: "license",
        description:
          "GPL-3.0 copyleft license detected — OPA policy deny-gpl-licenses.rego blocks deployment. Copyleft licenses require derivative works to be open-sourced.",
      },
    ],
  },
};

router.get("/summary", (req, res) => {
  res.json(riskSummary);
});

router.get("/components/:id", (req, res) => {
  const details = componentRiskDetails[req.params.id];
  if (!details) {
    return res
      .status(404)
      .json({ error: "Risk details not found for component" });
  }
  res.json(details);
});

module.exports = router;
