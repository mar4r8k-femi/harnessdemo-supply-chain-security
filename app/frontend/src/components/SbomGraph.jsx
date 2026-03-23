import { useState, useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

const LICENSE_COLORS = {
  MIT: "#3b82f6",
  "Apache-2.0": "#f59e0b",
  "GPL-3.0": "#ef4444",
  "BSD-3-Clause": "#8b5cf6",
  "BSD-2-Clause": "#8b5cf6",
  Proprietary: "#6b7280",
};

const NODE_TYPE_SIZES = { root: 28, direct: 20, transitive: 14 };

function layoutTree(nodes, edges, showTransitive) {
  const filtered = showTransitive ? nodes : nodes.filter((n) => n.type !== "transitive");
  const filteredIds = new Set(filtered.map((n) => n.id));
  const filteredEdges = edges.filter((e) => filteredIds.has(e.source) && filteredIds.has(e.target));

  const root = filtered.find((n) => n.type === "root");
  if (!root) return { positionedNodes: [], layoutEdges: [] };

  const children = {};
  filteredEdges.forEach((e) => {
    if (!children[e.source]) children[e.source] = [];
    children[e.source].push(e.target);
  });

  const positioned = [];
  const levelWidth = 200;
  const visited = new Set();

  function place(nodeId, depth, yStart, yEnd) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = filtered.find((n) => n.id === nodeId);
    if (!node) return;

    const x = 80 + depth * levelWidth;
    const y = (yStart + yEnd) / 2;
    positioned.push({ ...node, x, y });

    const kids = children[nodeId] || [];
    if (kids.length === 0) return;

    const sliceHeight = (yEnd - yStart) / kids.length;
    kids.forEach((kidId, i) => {
      place(kidId, depth + 1, yStart + i * sliceHeight, yStart + (i + 1) * sliceHeight);
    });
  }

  const svgHeight = Math.max(500, filtered.length * 50);
  place(root.id, 0, 30, svgHeight - 30);

  return { positionedNodes: positioned, layoutEdges: filteredEdges, svgHeight };
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

export default function SbomGraph() {
  const [sbom, setSbom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showTransitive, setShowTransitive] = useState(true);
  const svgRef = useRef(null);

  useEffect(() => {
    fetch("/api/sbom")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch SBOM");
        return res.json();
      })
      .then(setSbom)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getConnectedIds = useCallback(
    (nodeId) => {
      if (!sbom) return new Set();
      const connected = new Set();
      const traverse = (id, direction) => {
        connected.add(id);
        sbom.edges.forEach((e) => {
          if (direction === "up" && e.target === id && !connected.has(e.source)) {
            traverse(e.source, "up");
          }
          if (direction === "down" && e.source === id && !connected.has(e.target)) {
            traverse(e.target, "down");
          }
        });
      };
      traverse(nodeId, "up");
      traverse(nodeId, "down");
      return connected;
    },
    [sbom]
  );

  const handleExport = () => {
    window.open("/api/sbom/export", "_blank");
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={500} sx={{ mt: 2, borderRadius: "12px" }} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!sbom) return null;

  const { positionedNodes, layoutEdges, svgHeight } = layoutTree(
    sbom.nodes,
    sbom.edges,
    showTransitive
  );

  const connectedIds = hoveredNode ? getConnectedIds(hoveredNode) : null;
  const nodeMap = Object.fromEntries(positionedNodes.map((n) => [n.id, n]));
  const svgWidth = 780;

  const directCount = sbom.nodes.filter((n) => n.type === "direct").length;
  const transitiveCount = sbom.nodes.filter((n) => n.type === "transitive").length;
  const licenses = [...new Set(sbom.nodes.map((n) => n.license))];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
            SBOM Explorer
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            {directCount} direct &middot; {transitiveCount} transitive dependencies
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderColor: "#e2e8f0",
            color: "#475569",
            borderRadius: "8px",
            "&:hover": { borderColor: "#a5b4fc", bgcolor: "rgba(99,102,241,0.04)" },
          }}
        >
          Export CycloneDX
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <FormControlLabel
          control={
            <Switch
              checked={showTransitive}
              onChange={(e) => setShowTransitive(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#64748b" }}>Show transitive</Typography>}
          sx={{ mr: 3 }}
        />
        {licenses.map((lic) => (
          <Chip
            key={lic}
            size="small"
            label={lic}
            sx={{
              height: 22,
              fontSize: "0.65rem",
              fontWeight: 600,
              bgcolor: `${LICENSE_COLORS[lic] || "#6b7280"}18`,
              color: LICENSE_COLORS[lic] || "#6b7280",
              "& .MuiChip-label": { px: 1 },
            }}
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: LICENSE_COLORS[lic] || "#6b7280",
                  ml: 1,
                }}
              />
            }
          />
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          overflow: "auto",
          bgcolor: "#fafbfd",
        }}
      >
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ display: "block", minWidth: svgWidth }}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
              <path d="M0,0 L10,3 L0,6 Z" fill="#cbd5e1" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
              <path d="M0,0 L10,3 L0,6 Z" fill="#6366f1" />
            </marker>
          </defs>

          {layoutEdges.map((edge, i) => {
            const src = nodeMap[edge.source];
            const tgt = nodeMap[edge.target];
            if (!src || !tgt) return null;
            const isActive = connectedIds && connectedIds.has(edge.source) && connectedIds.has(edge.target);
            const dimmed = connectedIds && !isActive;
            const midX = (src.x + tgt.x) / 2;
            return (
              <path
                key={i}
                d={`M${src.x},${src.y} C${midX},${src.y} ${midX},${tgt.y} ${tgt.x},${tgt.y}`}
                fill="none"
                stroke={isActive ? "#6366f1" : "#e2e8f0"}
                strokeWidth={isActive ? 2 : 1.5}
                opacity={dimmed ? 0.15 : 1}
                markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow)"}
                style={{ transition: "all 0.2s" }}
              />
            );
          })}

          {positionedNodes.map((node) => {
            const r = NODE_TYPE_SIZES[node.type] || 14;
            const isActive = connectedIds ? connectedIds.has(node.id) : true;
            const isHovered = hoveredNode === node.id;
            const color = LICENSE_COLORS[node.license] || "#6b7280";

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                opacity={connectedIds && !isActive ? 0.15 : 1}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r / 2 + 4}
                  fill={isHovered ? `${color}22` : "transparent"}
                  stroke="none"
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r / 2}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={0.9}
                />
                <text
                  x={node.x + r / 2 + 8}
                  y={node.y}
                  dominantBaseline="central"
                  fontSize={node.type === "root" ? 13 : node.type === "direct" ? 12 : 11}
                  fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                  fontWeight={node.type === "root" ? 700 : node.type === "direct" ? 600 : 400}
                  fill={isActive ? "#1e293b" : "#94a3b8"}
                >
                  {node.name}
                  <tspan fill="#94a3b8" fontWeight={400}>
                    {" "}
                    {node.version}
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </Paper>

      {hoveredNode && nodeMap[hoveredNode] && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 2,
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            display: "flex",
            gap: 3,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1e293b" }}
            >
              {nodeMap[hoveredNode].name}@{nodeMap[hoveredNode].version}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={nodeMap[hoveredNode].license}
            sx={{
              bgcolor: `${LICENSE_COLORS[nodeMap[hoveredNode].license] || "#6b7280"}18`,
              color: LICENSE_COLORS[nodeMap[hoveredNode].license] || "#6b7280",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
          <Chip
            size="small"
            label={nodeMap[hoveredNode].type}
            sx={{
              bgcolor: "#f1f5f9",
              color: "#64748b",
              fontWeight: 600,
              fontSize: "0.7rem",
              textTransform: "capitalize",
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
