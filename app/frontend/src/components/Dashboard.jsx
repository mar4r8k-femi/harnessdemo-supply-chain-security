import React, { useEffect, useState } from 'react';
import { Container, Grid, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import RiskScore from './RiskScore';
import ComponentList from './ComponentList';

function Dashboard() {
  const [riskSummary, setRiskSummary] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [riskRes, compRes] = await Promise.all([
          fetch('/api/risk/summary'),
          fetch('/api/components'),
        ]);

        if (!riskRes.ok || !compRes.ok) {
          throw new Error('Failed to fetch data from the API');
        }

        const riskData = await riskRes.json();
        const compData = await compRes.json();

        setRiskSummary(riskData);
        setComponents(compData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Supply Chain Overview
      </Typography>

      <Grid container spacing={3}>
        {/* Risk Score Panel */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <RiskScore summary={riskSummary} />
          </Paper>
        </Grid>

        {/* Component List Panel */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <ComponentList components={components} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
