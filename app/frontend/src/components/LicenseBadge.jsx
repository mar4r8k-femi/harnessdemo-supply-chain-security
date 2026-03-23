import Chip from "@mui/material/Chip";

const LICENSE_COLORS = {
  MIT: { bg: "#dbeafe", color: "#1d4ed8" },
  "Apache-2.0": { bg: "#fef3c7", color: "#92400e" },
  "GPL-3.0": { bg: "#fee2e2", color: "#991b1b" },
  "BSD-3-Clause": { bg: "#e0e7ff", color: "#3730a3" },
  "BSD-2-Clause": { bg: "#e0e7ff", color: "#3730a3" },
  Proprietary: { bg: "#f1f5f9", color: "#475569" },
};

export default function LicenseBadge({ license }) {
  const style = LICENSE_COLORS[license] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <Chip
      label={license}
      size="small"
      sx={{
        bgcolor: style.bg,
        color: style.color,
        fontWeight: 600,
        fontSize: "0.7rem",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        height: 24,
      }}
    />
  );
}
