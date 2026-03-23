import React from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';

const RISK_CHIP_COLORS = {
  critical: { bg: '#d32f2f', text: '#fff' },
  high: { bg: '#f57c00', text: '#fff' },
  medium: { bg: '#fbc02d', text: '#000' },
  low: { bg: '#388e3c', text: '#fff' },
};

function getRiskChipStyle(level) {
  const normalized = (level || '').toLowerCase();
  const colors = RISK_CHIP_COLORS[normalized] || { bg: '#9e9e9e', text: '#fff' };
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    fontWeight: 600,
  };
}

function ComponentList({ components }) {
  if (!components || components.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary">
        No components found.
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Software Components
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Version</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>License</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Risk Level</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {components.map((comp, index) => (
              <TableRow key={comp.name || index} hover>
                <TableCell>{comp.name}</TableCell>
                <TableCell>{comp.version}</TableCell>
                <TableCell>{comp.supplier}</TableCell>
                <TableCell>{comp.license}</TableCell>
                <TableCell>
                  <Chip
                    label={comp.riskLevel}
                    size="small"
                    sx={getRiskChipStyle(comp.riskLevel)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default ComponentList;
