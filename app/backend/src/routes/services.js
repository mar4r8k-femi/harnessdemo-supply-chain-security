const express = require("express");
const router = express.Router();

const services = [
  {
    id: "svc-frontend",
    name: "Frontend",
    description: "React dashboard served via nginx",
    tech: ["React 18", "Vite", "MUI", "nginx"],
    port: 80,
    image: "supplywatch/frontend:latest",
    endpoints: ["/", "/components/:id", "/sbom"],
    dependencies: ["svc-backend"],
    status: "healthy",
    replicas: 1,
    baseImage: "nginx:1.25-alpine",
    language: "JavaScript",
  },
  {
    id: "svc-backend",
    name: "Backend API",
    description: "Express REST API serving component and SBOM data",
    tech: ["Node.js 20", "Express 4", "Winston"],
    port: 3001,
    image: "supplywatch/backend:latest",
    endpoints: ["/api/health", "/api/components", "/api/sbom", "/api/risk"],
    dependencies: [],
    status: "healthy",
    replicas: 1,
    baseImage: "node:20-alpine",
    language: "JavaScript",
  },
  {
    id: "svc-notification",
    name: "Notification Service",
    description: "Spring Boot service for pipeline and alert notifications",
    tech: ["Java 21", "Spring Boot 3", "Maven"],
    port: 8082,
    image: "supplywatch/notification-service:latest",
    endpoints: ["/actuator/health", "/api/notifications"],
    dependencies: ["svc-backend"],
    status: "healthy",
    replicas: 1,
    baseImage: "eclipse-temurin:21-jre-alpine",
    language: "Java",
  },
];

const connections = [
  {
    from: "svc-frontend",
    to: "svc-backend",
    protocol: "HTTP",
    label: "/api/*",
    description: "Proxied via nginx upstream",
  },
  {
    from: "svc-notification",
    to: "svc-backend",
    protocol: "HTTP",
    label: "/api/components",
    description: "Polls for component changes",
  },
];

router.get("/", (req, res) => {
  res.json({ services, connections });
});

router.get("/:id", (req, res) => {
  const service = services.find((s) => s.id === req.params.id);
  if (!service) {
    return res.status(404).json({ error: "Service not found" });
  }
  res.json(service);
});

module.exports = router;
