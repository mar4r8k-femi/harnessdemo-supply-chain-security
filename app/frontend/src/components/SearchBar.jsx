import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "MIT", label: "MIT" },
  { key: "Apache-2.0", label: "Apache-2.0" },
  { key: "GPL-3.0", label: "GPL-3.0" },
  { key: "verified", label: "Verified" },
  { key: "unverified", label: "Unverified" },
  { key: "has-cves", label: "Has CVEs" },
  { key: "policy-violation", label: "Policy Violations" },
  { key: "supply-chain-attack", label: "Supply Chain Attacks" },
];

export default function SearchBar({ onSearch, onFilter, activeFilter }) {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search components..."
        value={query}
        onChange={handleSearch}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          sx: {
            bgcolor: "#fff",
            borderRadius: "10px",
            fontSize: "0.875rem",
            "& fieldset": { borderColor: "#e2e8f0" },
          },
        }}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            size="small"
            onClick={() => onFilter(f.key)}
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              cursor: "pointer",
              bgcolor: activeFilter === f.key ? "#4f46e5" : "#f1f5f9",
              color: activeFilter === f.key ? "#fff" : "#475569",
              "&:hover": {
                bgcolor: activeFilter === f.key ? "#4338ca" : "#e2e8f0",
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
