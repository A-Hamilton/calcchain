import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import type { Metric } from "../types";

interface ResultsDisplayProps {
  title: string;
  metrics: Metric[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(({ title, metrics }) => (
  <Card
    elevation={0}
    sx={{
      bgcolor: "background.paper",
      color: "text.primary",
      borderRadius: 2,
      boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
      mb: 2,
    }}
  >
    <CardContent>
      <Typography variant="h6" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {metrics.map((m, i) => (
          <Grid item xs={12} sm={6} md={4} key={`${m.label}-${i}`}>
            <Typography variant="subtitle2" color="text.secondary">
              {m.label}
            </Typography>
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 500 }}>
              {typeof m.value === "number" ? m.value : m.value}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </CardContent>
  </Card>
));

export default ResultsDisplay;
