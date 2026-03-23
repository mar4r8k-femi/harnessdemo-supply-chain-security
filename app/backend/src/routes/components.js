const express = require("express");
const router = express.Router();

const components = [
  {
    id: "comp-001",
    name: "express",
    version: "4.18.2",
    supplier: "OpenJS Foundation",
    license: "MIT",
    purl: "pkg:npm/express@4.18.2",
    riskLevel: "low",
  },
  {
    id: "comp-002",
    name: "lodash",
    version: "4.17.20",
    supplier: "Lodash",
    license: "MIT",
    purl: "pkg:npm/lodash@4.17.20",
    riskLevel: "critical",
  },
  {
    id: "comp-003",
    name: "log4j-core",
    version: "2.14.1",
    supplier: "Apache Software Foundation",
    license: "Apache-2.0",
    purl: "pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1",
    riskLevel: "critical",
  },
  {
    id: "comp-004",
    name: "react",
    version: "18.2.0",
    supplier: "Meta Platforms",
    license: "MIT",
    purl: "pkg:npm/react@18.2.0",
    riskLevel: "low",
  },
  {
    id: "comp-005",
    name: "jsonwebtoken",
    version: "8.5.1",
    supplier: "Auth0",
    license: "MIT",
    purl: "pkg:npm/jsonwebtoken@8.5.1",
    riskLevel: "high",
  },
  {
    id: "comp-006",
    name: "axios",
    version: "1.6.0",
    supplier: "axios",
    license: "MIT",
    purl: "pkg:npm/axios@1.6.0",
    riskLevel: "medium",
  },
  {
    id: "comp-007",
    name: "spring-boot",
    version: "3.1.5",
    supplier: "VMware",
    license: "Apache-2.0",
    purl: "pkg:maven/org.springframework.boot/spring-boot@3.1.5",
    riskLevel: "low",
  },
  {
    id: "comp-008",
    name: "openssl",
    version: "3.0.2",
    supplier: "OpenSSL Project",
    license: "Apache-2.0",
    purl: "pkg:generic/openssl@3.0.2",
    riskLevel: "high",
  },
  {
    id: "comp-009",
    name: "tensorflow",
    version: "2.14.0",
    supplier: "Google",
    license: "Apache-2.0",
    purl: "pkg:pypi/tensorflow@2.14.0",
    riskLevel: "medium",
  },
  {
    id: "comp-010",
    name: "webpack",
    version: "5.89.0",
    supplier: "webpack contributors",
    license: "MIT",
    purl: "pkg:npm/webpack@5.89.0",
    riskLevel: "low",
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
