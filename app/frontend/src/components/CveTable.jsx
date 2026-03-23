import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const SEVERITY_STYLES = {
  critical: { bg: "#fee2e2", color: "#991b1b" },
  high: { bg: "#ffedd5", color: "#9a3412" },
  medium: { bg: "#fef9c3", color: "#854d0e" },
  low: { bg: "#dcfce7", color: "#166534" },
};

export default function CveTable({ vulnerabilities }) {
  if (!vulnerabilities || vulnerabilities.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          No known CVEs
        </Typography>
      </Box>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.75rem" }}>CVE ID</TableCell>
          <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.75rem" }}>Severity</TableCell>
          <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.75rem" }}>Description</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {vulnerabilities.map((vuln) => {
          const style = SEVERITY_STYLES[vuln.severity] || SEVERITY_STYLES.low;
          return (
            <TableRow key={vuln.id}>
              <TableCell
                sx={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                {vuln.id}
              </TableCell>
              <TableCell>
                <Chip
                  label={vuln.severity}
                  size="small"
                  sx={{
                    bgcolor: style.bg,
                    color: style.color,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    textTransform: "capitalize",
                    height: 22,
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: "0.8rem", color: "#475569" }}>
                {vuln.description}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
