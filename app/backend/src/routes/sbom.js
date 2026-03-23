const express = require("express");
const router = express.Router();

const sbomGraph = {
  root: "supplywatch@1.0.0",
  nodes: [
    { id: "supplywatch@1.0.0", name: "supplywatch", version: "1.0.0", license: "Proprietary", type: "root" },
    { id: "express@4.18.2", name: "express", version: "4.18.2", license: "MIT", type: "direct" },
    { id: "body-parser@1.20.1", name: "body-parser", version: "1.20.1", license: "MIT", type: "transitive" },
    { id: "cookie@0.5.0", name: "cookie", version: "0.5.0", license: "MIT", type: "transitive" },
    { id: "lodash@4.17.20", name: "lodash", version: "4.17.20", license: "MIT", type: "direct" },
    { id: "log4j-core@2.14.1", name: "log4j-core", version: "2.14.1", license: "Apache-2.0", type: "direct" },
    { id: "log4j-api@2.14.1", name: "log4j-api", version: "2.14.1", license: "Apache-2.0", type: "transitive" },
    { id: "react@18.2.0", name: "react", version: "18.2.0", license: "MIT", type: "direct" },
    { id: "react-dom@18.2.0", name: "react-dom", version: "18.2.0", license: "MIT", type: "transitive" },
    { id: "jsonwebtoken@8.5.1", name: "jsonwebtoken", version: "8.5.1", license: "MIT", type: "direct" },
    { id: "jws@3.2.2", name: "jws", version: "3.2.2", license: "MIT", type: "transitive" },
    { id: "axios@1.6.0", name: "axios", version: "1.6.0", license: "MIT", type: "direct" },
    { id: "spring-boot@3.1.5", name: "spring-boot", version: "3.1.5", license: "Apache-2.0", type: "direct" },
    { id: "spring-core@6.0.13", name: "spring-core", version: "6.0.13", license: "Apache-2.0", type: "transitive" },
    { id: "spring-web@6.0.13", name: "spring-web", version: "6.0.13", license: "Apache-2.0", type: "transitive" },
    { id: "openssl@3.0.2", name: "openssl", version: "3.0.2", license: "Apache-2.0", type: "direct" },
    { id: "tensorflow@2.14.0", name: "tensorflow", version: "2.14.0", license: "Apache-2.0", type: "direct" },
    { id: "numpy@1.24.3", name: "numpy", version: "1.24.3", license: "BSD-3-Clause", type: "transitive" },
    { id: "webpack@5.89.0", name: "webpack", version: "5.89.0", license: "MIT", type: "direct" },
    { id: "webpack-cli@5.1.4", name: "webpack-cli", version: "5.1.4", license: "MIT", type: "transitive" },
    { id: "terser@5.22.0", name: "terser", version: "5.22.0", license: "BSD-2-Clause", type: "transitive" },
  ],
  edges: [
    { source: "supplywatch@1.0.0", target: "express@4.18.2" },
    { source: "supplywatch@1.0.0", target: "lodash@4.17.20" },
    { source: "supplywatch@1.0.0", target: "log4j-core@2.14.1" },
    { source: "supplywatch@1.0.0", target: "react@18.2.0" },
    { source: "supplywatch@1.0.0", target: "jsonwebtoken@8.5.1" },
    { source: "supplywatch@1.0.0", target: "axios@1.6.0" },
    { source: "supplywatch@1.0.0", target: "spring-boot@3.1.5" },
    { source: "supplywatch@1.0.0", target: "openssl@3.0.2" },
    { source: "supplywatch@1.0.0", target: "tensorflow@2.14.0" },
    { source: "supplywatch@1.0.0", target: "webpack@5.89.0" },
    { source: "express@4.18.2", target: "body-parser@1.20.1" },
    { source: "express@4.18.2", target: "cookie@0.5.0" },
    { source: "log4j-core@2.14.1", target: "log4j-api@2.14.1" },
    { source: "react@18.2.0", target: "react-dom@18.2.0" },
    { source: "jsonwebtoken@8.5.1", target: "jws@3.2.2" },
    { source: "spring-boot@3.1.5", target: "spring-core@6.0.13" },
    { source: "spring-boot@3.1.5", target: "spring-web@6.0.13" },
    { source: "tensorflow@2.14.0", target: "numpy@1.24.3" },
    { source: "webpack@5.89.0", target: "webpack-cli@5.1.4" },
    { source: "webpack@5.89.0", target: "terser@5.22.0" },
  ],
};

const cyclonedxExport = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  serialNumber: "urn:uuid:3e671687-395b-41f5-a30f-a58921a69b79",
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: [{ vendor: "SupplyWatch", name: "sbom-generator", version: "1.0.0" }],
    component: { type: "application", name: "supplywatch", version: "1.0.0" },
  },
  components: sbomGraph.nodes
    .filter((n) => n.type !== "root")
    .map((n) => ({
      type: "library",
      name: n.name,
      version: n.version,
      purl: `pkg:npm/${n.name}@${n.version}`,
      licenses: [{ license: { id: n.license } }],
    })),
  dependencies: sbomGraph.edges.reduce((acc, edge) => {
    const existing = acc.find((d) => d.ref === edge.source);
    if (existing) {
      existing.dependsOn.push(edge.target);
    } else {
      acc.push({ ref: edge.source, dependsOn: [edge.target] });
    }
    return acc;
  }, []),
};

router.get("/", (req, res) => {
  res.json(sbomGraph);
});

router.get("/export", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="supplywatch-sbom.cdx.json"'
  );
  res.json(cyclonedxExport);
});

module.exports = router;
