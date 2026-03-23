const express = require("express");
const router = express.Router();
const packageJson = require("../../package.json");

router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    service: "supplywatch-backend",
    timestamp: new Date().toISOString(),
    version: packageJson.version,
  });
});

module.exports = router;
