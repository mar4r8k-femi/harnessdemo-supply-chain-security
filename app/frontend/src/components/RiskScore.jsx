import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RISK_COLORS = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c',
};

function RiskScore({ summary }) {
  if (!summary) {
    return (
      <Typography variant="body1" color="text.secondary">
        No risk data available.
      </Typography>
    );
  }

  const { overallScore, critical, high, medium, low } = summary;

  const chartData = [
    { name: 'Critical', value: critical || 0 },
    { name: 'High', value: high || 0 },
    { name: 'Medium', value: medium || 0 },
    { name: 'Low', value: low || 0 },
  ].filter((entry) => entry.value > 0);

  const scoreColor =
    overallScore >= 80
      ? RISK_COLORS.critical
      : overallScore >= 60
        ? RISK_COLORS.high
        : overallScore >= 40
          ? RISK_COLORS.medium
          : RISK_COLORS.low;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Risk Summary
      </Typography>

      <Card variant="outlined" sx={{ mb: 2, textAlign: 'center' }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Overall Risk Score
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700, color: scoreColor }}>
            {overallScore}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
        {[
          { label: 'Critical', count: critical, color: RISK_COLORS.critical },
          { label: 'High', count: high, color: RISK_COLORS.high },
          { label: 'Medium', count: medium, color: RISK_COLORS.medium },
          { label: 'Low', count: low, color: RISK_COLORS.low },
        ].map((item) => (
          <Box key={item.label} sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
              {item.count || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={RISK_COLORS[entry.name.toLowerCase()]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}

export default RiskScore;
