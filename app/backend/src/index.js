require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { requestLogger } = require("./middleware/logger");

const healthRoutes = require("./routes/health");
const componentsRoutes = require("./routes/components");
const riskRoutes = require("./routes/risk");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api/health", healthRoutes);
app.use("/api/components", componentsRoutes);
app.use("/api/risk", riskRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SupplyWatch backend listening on port ${PORT}`);
  });
}

module.exports = app;
