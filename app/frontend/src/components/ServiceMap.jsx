import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";

const LANG_COLORS = {
  JavaScript: "#f7df1e",
  Java: "#e76f00",
};

const SERVICE_POSITIONS = {
  "svc-frontend": { x: 140, y: 100 },
  "svc-backend": { x: 400, y: 250 },
  "svc-notification": { x: 660, y: 100 },
};

const NODE_W = 180;
const NODE_H = 80;

function HealthDot({ status }) {
  const color = status === "healthy" ? "#22c55e" : status === "degraded" ? "#f59e0b" : "#ef4444";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <svg width="8" height="8"><circle cx="4" cy="4" r="4" fill={color} /></svg>
      <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "capitalize" }}>{status}</span>
    </span>
  );
}

function ServiceNode({ service, x, y, selected, onSelect }) {
  const langColor = LANG_COLORS[service.language] || "#94a3b8";
  const isSelected = selected === service.id;

  return (
    <g
      onClick={() => onSelect(isSelected ? null : service.id)}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={x - NODE_W / 2}
        y={y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx={12}
        fill={isSelected ? "#eef2ff" : "#fff"}
        stroke={isSelected ? "#6366f1" : "#e2e8f0"}
        strokeWidth={isSelected ? 2 : 1.5}
        style={{ transition: "all 0.2s" }}
      />
      {/* Language accent bar */}
      <rect
        x={x - NODE_W / 2}
        y={y - NODE_H / 2}
        width={4}
        height={NODE_H}
        rx={2}
        fill={langColor}
      />
      {/* Name */}
      <text
        x={x - NODE_W / 2 + 18}
        y={y - 12}
        fontSize={13}
        fontWeight={700}
        fill="#1e293b"
        fontFamily="Inter, sans-serif"
      >
        {service.name}
      </text>
      {/* Port */}
      <text
        x={x + NODE_W / 2 - 12}
        y={y - 12}
        fontSize={11}
        fill="#94a3b8"
        textAnchor="end"
        fontFamily="'JetBrains Mono', monospace"
      >
        :{service.port}
      </text>
      {/* Description */}
      <text
        x={x - NODE_W / 2 + 18}
        y={y + 8}
        fontSize={10}
        fill="#94a3b8"
        fontFamily="Inter, sans-serif"
      >
        {service.description.length > 28
          ? service.description.slice(0, 28) + "..."
          : service.description}
      </text>
      {/* Health dot */}
      <circle
        cx={x - NODE_W / 2 + 22}
        cy={y + 24}
        r={4}
        fill={service.status === "healthy" ? "#22c55e" : "#ef4444"}
      />
      <text
        x={x - NODE_W / 2 + 32}
        y={y + 28}
        fontSize={9}
        fill="#64748b"
        fontFamily="Inter, sans-serif"
        textTransform="capitalize"
      >
        {service.status}
      </text>
    </g>
  );
}

function ConnectionLine({ from, to, connection }) {
  const fx = SERVICE_POSITIONS[connection.from];
  const tx = SERVICE_POSITIONS[connection.to];
  if (!fx || !tx) return null;

  const startX = fx.x + NODE_W / 2;
  const startY = fx.y;
  const endX = tx.x - NODE_W / 2;
  const endY = tx.y;

  // Determine arrow direction for notifications (right to left needs different handling)
  const midX = (startX + endX) / 2;

  // Label position
  const labelX = midX;
  const labelY = Math.min(startY, endY) - 8 + Math.abs(endY - startY) / 2;

  return (
    <g>
      <path
        d={`M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth={2}
        strokeDasharray={connection.protocol === "gRPC" ? "6,4" : "none"}
        markerEnd="url(#service-arrow)"
      />
      {/* Protocol label */}
      <rect
        x={labelX - 28}
        y={labelY - 10}
        width={56}
        height={18}
        rx={9}
        fill="#f1f5f9"
        stroke="#e2e8f0"
        strokeWidth={1}
      />
      <text
        x={labelX}
        y={labelY + 2}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
        fill="#64748b"
        fontFamily="'JetBrains Mono', monospace"
      >
        {connection.label}
      </text>
    </g>
  );
}

function DetailPanel({ service }) {
  if (!service) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: 3,
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>
            {service.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8rem" }}>
            {service.description}
          </Typography>
        </Box>
        <HealthDot status={service.status} />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
        <Box>
          <Typography variant="overline" sx={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
            Infrastructure
          </Typography>
          <Box sx={{ mt: 1 }}>
            <DetailRow label="Image" value={service.image} mono />
            <DetailRow label="Base" value={service.baseImage} mono />
            <DetailRow label="Port" value={`:${service.port}`} mono />
            <DetailRow label="Replicas" value={service.replicas} />
          </Box>
        </Box>
        <Box>
          <Typography variant="overline" sx={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
            Tech Stack
          </Typography>
          <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {service.tech.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                sx={{
                  height: 24,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  bgcolor: "#f1f5f9",
                  color: "#475569",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            ))}
          </Box>

          <Typography variant="overline" sx={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em", mt: 2, display: "block" }}>
            Endpoints
          </Typography>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
            {service.endpoints.map((ep) => (
              <Typography
                key={ep}
                variant="body2"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.75rem",
                  color: "#475569",
                  bgcolor: "#f8fafc",
                  px: 1,
                  py: 0.25,
                  borderRadius: "4px",
                  display: "inline-block",
                  width: "fit-content",
                }}
              >
                {ep}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
      <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "#1e293b",
          fontWeight: 500,
          fontSize: "0.8rem",
          fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function ServiceMap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch services");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={400} sx={{ mt: 2, borderRadius: "12px" }} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const selectedService = selected
    ? data.services.find((s) => s.id === selected)
    : null;

  const svgWidth = 840;
  const svgHeight = 350;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
          Service Map
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          {data.services.length} services &middot; {data.connections.length} connections
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          overflow: "auto",
          bgcolor: "#fafbfd",
          p: 2,
        }}
      >
        <svg
          width="100%"
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ display: "block", minWidth: 700 }}
        >
          <defs>
            <marker
              id="service-arrow"
              viewBox="0 0 10 6"
              refX="10"
              refY="3"
              markerWidth="8"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L10,3 L0,6 Z" fill="#cbd5e1" />
            </marker>
          </defs>

          {/* Connections */}
          {data.connections.map((conn, i) => (
            <ConnectionLine key={i} connection={conn} />
          ))}

          {/* Service nodes */}
          {data.services.map((svc) => {
            const pos = SERVICE_POSITIONS[svc.id];
            if (!pos) return null;
            return (
              <ServiceNode
                key={svc.id}
                service={svc}
                x={pos.x}
                y={pos.y}
                selected={selected}
                onSelect={setSelected}
              />
            );
          })}
        </svg>
      </Paper>

      <DetailPanel service={selectedService} />

      {!selected && (
        <Typography
          variant="body2"
          sx={{ color: "#94a3b8", textAlign: "center", mt: 2, fontSize: "0.8rem" }}
        >
          Click a service to view details
        </Typography>
      )}
    </Box>
  );
}
