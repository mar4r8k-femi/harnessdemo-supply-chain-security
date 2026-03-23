import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ProvenanceBadge from "./ProvenanceBadge";
import LicenseBadge from "./LicenseBadge";
import CveTable from "./CveTable";

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="overline"
        sx={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.1em", mb: 1.5, display: "block" }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function InfoRow({ label, value, mono, copyable }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75 }}>
      <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8rem" }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="body2"
          sx={{
            color: "#1e293b",
            fontWeight: 500,
            fontSize: "0.8rem",
            fontFamily: mono ? "'JetBrains Mono', 'Fira Code', monospace" : "inherit",
          }}
        >
          {value}
        </Typography>
        {copyable && (
          <Tooltip title={copied ? "Copied!" : "Copy"}>
            <IconButton size="small" onClick={handleCopy} sx={{ p: 0.5 }}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

export default function ComponentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/components/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Component not found");
        return res.json();
      })
      .then(setComponent)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={300} sx={{ mt: 2, borderRadius: "12px" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button onClick={() => navigate("/")} startIcon={<BackIcon />} sx={{ mb: 2, color: "#475569" }}>
          Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        onClick={() => navigate("/")}
        startIcon={<BackIcon />}
        sx={{ mb: 2, color: "#475569", textTransform: "none", fontWeight: 600, fontSize: "0.85rem" }}
      >
        Back to Catalog
      </Button>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >
            {component.name}
            <Typography
              component="span"
              sx={{
                ml: 1,
                color: "#94a3b8",
                fontWeight: 400,
                fontSize: "1rem",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            >
              @{component.version}
            </Typography>
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            {component.supplier}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <Section title="Identity">
            <InfoRow label="Name" value={component.name} mono />
            <InfoRow label="Version" value={component.version} mono />
            <InfoRow label="PURL" value={component.purl} mono copyable />
            <InfoRow label="Supplier" value={component.supplier} />
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="Provenance">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ProvenanceBadge status={component.provenance} />
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8rem" }}>
                {component.provenance === "verified"
                  ? "Build origin and signature verified"
                  : "Provenance not yet verified"}
              </Typography>
            </Box>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="License">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <LicenseBadge license={component.license} />
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8rem" }}>
                SPDX: {component.spdxLicense || component.license}
              </Typography>
            </Box>
          </Section>

          {component.dependencies && component.dependencies.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Section title="Direct Dependencies">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {component.dependencies.map((dep) => (
                    <Typography
                      key={dep}
                      variant="body2"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: "#f1f5f9",
                        borderRadius: "6px",
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontSize: "0.75rem",
                        color: "#475569",
                      }}
                    >
                      {dep}
                    </Typography>
                  ))}
                </Box>
              </Section>
            </>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <Section title={`Known Vulnerabilities (${component.vulnerabilities?.length || 0})`}>
            <CveTable vulnerabilities={component.vulnerabilities} />
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="Scan Info">
            <InfoRow
              label="Last scanned"
              value={new Date(component.lastScanned).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </Section>
        </Paper>
      </Box>
    </Box>
  );
}
