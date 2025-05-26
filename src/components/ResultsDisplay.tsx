import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

interface Metric {
  label: string;
  value: string | number;
}

export interface ResultsDisplayProps {
  title:   string;
  metrics: Metric[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ title, metrics }) => (
  <Card elevation={0} sx={{ backgroundColor: '#1C1D2B', borderRadius: 2, boxShadow: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Grid container spacing={1} justifyContent="space-between">
        {metrics.map((m, i) => (
          <Grid key={i} item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">
              {m.label}
            </Typography>
            <Typography variant="h6" color="text.primary">
              {m.value}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </CardContent>
  </Card>
);

export default ResultsDisplay;
