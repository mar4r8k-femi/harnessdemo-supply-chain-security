import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ProvenanceBadge from "./ProvenanceBadge";
import LicenseBadge from "./LicenseBadge";

const ATTACK_TYPES = {
  "tj-actions/changed-files": { label: "CI/CD Compromise", color: "#7c3aed" },
  "xz-utils": { label: "Backdoor", color: "#b91c1c" },
  "chalk": { label: "Account Takeover", color: "#c2410c" },
};

const POLICY_VIOLATIONS = {
  "GPL-3.0": { label: "License Policy Violation", color: "#d97706" },
};

export default function ComponentCard({ component }) {
  const navigate = useNavigate();
  const cveCount = component.vulnerabilities?.length || 0;
  const attackType = ATTACK_TYPES[component.name];
  const policyViolation = POLICY_VIOLATIONS[component.license];
  const isHighlighted = attackType || policyViolation;

  const borderColor = attackType ? "#fecaca" : policyViolation ? "#fde68a" : "#e2e8f0";
  const bgColor = attackType ? "#fef2f2" : policyViolation ? "#fffbeb" : "#fff";
  const hoverBorder = attackType ? "#f87171" : policyViolation ? "#f59e0b" : "#a5b4fc";
  const hoverShadow = attackType
    ? "0 4px 12px rgba(239,68,68,0.15)"
    : policyViolation
      ? "0 4px 12px rgba(217,119,6,0.15)"
      : "0 4px 12px rgba(99,102,241,0.1)";

  return (
    <Paper
      elevation={0}
      onClick={() => navigate(`/components/${component.id}`)}
      sx={{
        p: 2.5,
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        bgcolor: bgColor,
        "&:hover": {
          borderColor: hoverBorder,
          boxShadow: hoverShadow,
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "#1e293b",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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

      {(attackType || policyViolation) && (
        <Chip
          label={(attackType || policyViolation).label}
          size="small"
          sx={{
            mb: 1.5,
            height: 20,
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            bgcolor: `${(attackType || policyViolation).color}18`,
            color: (attackType || policyViolation).color,
            "& .MuiChip-label": { px: 1 },
          }}
        />
      )}

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
