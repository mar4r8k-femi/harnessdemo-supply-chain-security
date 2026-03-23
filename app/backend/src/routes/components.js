const express = require("express");
const router = express.Router();

const components = [
  {
    id: "comp-001",
    name: "express",
    version: "4.18.2",
    supplier: "OpenJS Foundation",
    license: "MIT",
    spdxLicense: "MIT",
    purl: "pkg:npm/express@4.18.2",
    provenance: "verified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [],
    dependencies: ["body-parser@1.20.1", "cookie@0.5.0"],
  },
  {
    id: "comp-002",
    name: "lodash",
    version: "4.17.20",
    supplier: "Lodash",
    license: "MIT",
    spdxLicense: "MIT",
    purl: "pkg:npm/lodash@4.17.20",
    provenance: "unverified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [
      {
        id: "CVE-2021-23337",
        severity: "critical",
        description: "Command Injection in lodash",
      },
      {
        id: "CVE-2020-28500",
        severity: "high",
        description:
          "Regular Expression Denial of Service (ReDoS) in lodash",
      },
    ],
    dependencies: [],
  },
  {
    id: "comp-003",
    name: "log4j-core",
    version: "2.14.1",
    supplier: "Apache Software Foundation",
    license: "Apache-2.0",
    spdxLicense: "Apache-2.0",
    purl: "pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1",
    provenance: "verified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [
      {
        id: "CVE-2021-44228",
        severity: "critical",
        description: "Log4Shell — Remote Code Execution via JNDI lookup",
      },
      {
        id: "CVE-2021-45046",
        severity: "critical",
        description: "Incomplete fix for CVE-2021-44228",
      },
    ],
    dependencies: ["log4j-api@2.14.1"],
  },
  {
    id: "comp-004",
    name: "react",
    version: "18.2.0",
    supplier: "Meta Platforms",
    license: "MIT",
    spdxLicense: "MIT",
    purl: "pkg:npm/react@18.2.0",
    provenance: "verified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [],
    dependencies: ["react-dom@18.2.0"],
  },
  {
    id: "comp-005",
    name: "jsonwebtoken",
    version: "8.5.1",
    supplier: "Auth0",
    license: "MIT",
    spdxLicense: "MIT",
    purl: "pkg:npm/jsonwebtoken@8.5.1",
    provenance: "verified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [
      {
        id: "CVE-2022-23529",
        severity: "high",
        description:
          "Insecure implementation of key retrieval in jsonwebtoken",
      },
    ],
    dependencies: ["jws@3.2.2"],
  },
  {
    id: "comp-006",
    name: "axios",
    version: "1.6.0",
    supplier: "axios",
    license: "MIT",
    spdxLicense: "MIT",
    purl: "pkg:npm/axios@1.6.0",
    provenance: "verified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [
      {
        id: "CVE-2023-45857",
        severity: "medium",
        description: "Cross-Site Request Forgery in axios",
      },
    ],
    dependencies: [],
  },
  {
    id: "comp-007",
    name: "spring-boot",
    version: "3.1.5",
    supplier: "VMware",
    license: "Apache-2.0",
    spdxLicense: "Apache-2.0",
    purl: "pkg:maven/org.springframework.boot/spring-boot@3.1.5",
    provenance: "verified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [],
    dependencies: ["spring-core@6.0.13", "spring-web@6.0.13"],
  },
  {
    id: "comp-008",
    name: "openssl",
    version: "3.0.2",
    supplier: "OpenSSL Project",
    license: "Apache-2.0",
    spdxLicense: "Apache-2.0",
    purl: "pkg:generic/openssl@3.0.2",
    provenance: "unverified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [
      {
        id: "CVE-2022-3602",
        severity: "high",
        description: "Buffer overrun in X.509 certificate verification",
      },
    ],
    dependencies: [],
  },
  {
    id: "comp-009",
    name: "tensorflow",
    version: "2.14.0",
    supplier: "Google",
    license: "Apache-2.0",
    spdxLicense: "Apache-2.0",
    purl: "pkg:pypi/tensorflow@2.14.0",
    provenance: "verified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [
      {
        id: "CVE-2023-25801",
        severity: "medium",
        description: "Out-of-bounds read in TensorFlow",
      },
    ],
    dependencies: ["numpy@1.24.3"],
  },
  {
    id: "comp-010",
    name: "webpack",
    version: "5.89.0",
    supplier: "webpack contributors",
    license: "MIT",
    spdxLicense: "MIT",
    purl: "pkg:npm/webpack@5.89.0",
    provenance: "verified",
    lastScanned: "2026-03-21T10:00:00Z",
    vulnerabilities: [],
    dependencies: ["webpack-cli@5.1.4", "terser@5.22.0"],
  },
];

router.get("/", (req, res) => {
  res.json(components);
});

router.get("/:id", (req, res) => {
  const component = components.find((c) => c.id === req.params.id);
  if (!component) {
    return res.status(404).json({ error: "Component not found" });
  }
  res.json(component);
});

module.exports = router;
