import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ProvenanceBadge from "./ProvenanceBadge";
import LicenseBadge from "./LicenseBadge";

export default function ComponentCard({ component }) {
  const navigate = useNavigate();
  const cveCount = component.vulnerabilities?.length || 0;

  return (
    <Paper
      elevation={0}
      onClick={() => navigate(`/components/${component.id}`)}
      sx={{
        p: 2.5,
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "#a5b4fc",
          boxShadow: "0 4px 12px rgba(99,102,241,0.1)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "#1e293b",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >
            {component.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#64748b",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: "0.75rem",
            }}
          >
            {component.version}
          </Typography>
        </Box>
        <ProvenanceBadge status={component.provenance} />
      </Box>

      <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8rem", mb: 2 }}>
        {component.supplier}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <LicenseBadge license={component.license} />
        {cveCount > 0 && (
          <Typography
            variant="caption"
            sx={{
              color: "#ef4444",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          >
            {cveCount} CVE{cveCount !== 1 ? "s" : ""}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
