const express = require("express");
const router = express.Router();

const riskSummary = {
  totalComponents: 10,
  critical: 2,
  high: 2,
  medium: 2,
  low: 4,
  overallScore: 72,
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
