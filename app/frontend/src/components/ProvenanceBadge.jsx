import Chip from "@mui/material/Chip";

function ShieldIcon({ verified }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={verified ? "#22c55e" : "#94a3b8"}
      style={{ marginRight: 2 }}
    >
      <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      {verified && (
        <path d="M10 15.5l-3.5-3.5 1.41-1.41L10 12.67l5.59-5.58L17 8.5l-7 7z" fill="#fff" />
      )}
    </svg>
  );
}

export default function ProvenanceBadge({ status }) {
  const verified = status === "verified";
  return (
    <Chip
      icon={<ShieldIcon verified={verified} />}
      label={verified ? "Verified" : "Unverified"}
      size="small"
      sx={{
        bgcolor: verified ? "rgba(34,197,94,0.1)" : "rgba(148,163,184,0.1)",
        color: verified ? "#16a34a" : "#64748b",
        fontWeight: 600,
        fontSize: "0.7rem",
        height: 24,
        "& .MuiChip-icon": { ml: 0.5 },
      }}
    />
  );
}
