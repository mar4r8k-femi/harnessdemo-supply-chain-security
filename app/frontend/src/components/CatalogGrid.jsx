import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import SearchBar from "./SearchBar";
import ComponentCard from "./ComponentCard";

export default function CatalogGrid() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetch("/api/components")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch components");
        return res.json();
      })
      .then(setComponents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const SUPPLY_CHAIN_ATTACK_NAMES = [
    "tj-actions/changed-files",
    "xz-utils",
    "chalk",
  ];

  const POLICY_VIOLATION_LICENSES = ["GPL-3.0", "AGPL-3.0", "LGPL-3.0"];

  const filtered = components.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.purl.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeFilter) {
      case "MIT":
      case "Apache-2.0":
      case "GPL-3.0":
        return c.license === activeFilter;
      case "verified":
        return c.provenance === "verified";
      case "unverified":
        return c.provenance === "unverified";
      case "has-cves":
        return c.vulnerabilities && c.vulnerabilities.length > 0;
      case "policy-violation":
        return POLICY_VIOLATION_LICENSES.includes(c.license);
      case "supply-chain-attack":
        return SUPPLY_CHAIN_ATTACK_NAMES.includes(c.name);
      default:
        return true;
    }
  });

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
          Component Catalog
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          {components.length} packages tracked across your supply chain
        </Typography>
      </Box>

      <SearchBar
        onSearch={setSearchQuery}
        onFilter={setActiveFilter}
        activeFilter={activeFilter}
      />

      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} lg={4} key={i}>
                <Skeleton variant="rounded" height={140} sx={{ borderRadius: "12px" }} />
              </Grid>
            ))
          : filtered.map((c) => (
              <Grid item xs={12} sm={6} lg={4} key={c.id}>
                <ComponentCard component={c} />
              </Grid>
            ))}
      </Grid>

      {!loading && filtered.length === 0 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="body1" sx={{ color: "#94a3b8" }}>
            No components match your search
          </Typography>
        </Box>
      )}
    </Box>
  );
}
