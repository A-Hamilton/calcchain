// src/components/ResultsDisplay.tsx

import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { GridResults } from '../types';

interface ResultsDisplayProps {
  result: GridResults;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const {
    totalEstimatedProfit,
    estimatedDailyProfit,
    investmentPerGrid,
    gridSpacing,
    estimatedTradesPerDay,
    netProfitPerGridTransaction,
    durationDays,
  } = result;

  // Format numbers for display
  const formatNum = (num: number, decimals: number = 2) =>
    num.toFixed(decimals);

  return (
    <Card elevation={3} sx={{ marginTop: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Estimated Results:
        </Typography>
        <Typography>
          <strong>Total Estimated Profit:</strong>{' '}
          {formatNum(totalEstimatedProfit)}
        </Typography>
        <Typography>
          <strong>Estimated Daily Profit:</strong>{' '}
          {formatNum(estimatedDailyProfit)}
        </Typography>
        <Typography>
          <strong>Investment per Grid:</strong>{' '}
          {formatNum(investmentPerGrid)}
        </Typography>
        <Typography>
          <strong>Grid Spacing:</strong> {formatNum(gridSpacing)}
        </Typography>
        <Typography>
          <strong>Estimated Trades per Day:</strong>{' '}
          {formatNum(estimatedTradesPerDay, 1)}
        </Typography>
        <Typography>
          <strong>Net Profit per Grid Transaction:</strong>{' '}
          {formatNum(netProfitPerGridTransaction)}
        </Typography>
        <Typography>
          <strong>Duration (Days):</strong> {durationDays}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
