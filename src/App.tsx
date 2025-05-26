import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import logo from './assets/calcchainlogo.png';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import ProfitChart from './components/ProfitChart';
import CryptoInsights from './components/CryptoInsights';
import { GridResults } from './types';

const App: React.FC = () => {
  const [results, setResults] = useState<GridResults | null>(null);
  const [chartData, setChartData] = useState<{ day: number; profit: number }[]>([]);

  const handleCalculate = (res: GridResults) => {
    setResults(res);
    const days = res.durationDays;
    const data = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      profit: (res.totalEstimatedProfit / days) * (i + 1),
    }));
    setChartData(data);
  };

  return (
    <>
      {/* Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: '#0D0D0D',
          boxShadow: 'none',    // no shadow
          border: 'none',       // no border at all
        }}
      >
        <Toolbar>
          <Box
            component="img"
            src={logo}
            alt="CalcChain Logo"
            sx={{
              height: 24,       // much larger
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Grid Trading Profit Estimator
        </Typography>

        <Grid container spacing={4}>
          {/* Left: form */}
          <Grid item xs={12} md={5}>
            <InputForm onCalculate={handleCalculate} />
          </Grid>

          {/* Right: results, chart, insights */}
          <Grid item xs={12} md={7} container direction="column" spacing={3}>
            {results && (
              <>
                <Grid item>
                  <ResultsDisplay
                    title="Estimated Results"
                    metrics={[
                      { label: 'Total Estimated Profit', value: `$${results.totalEstimatedProfit.toFixed(2)}` },
                      { label: 'Estimated Daily Profit', value: `$${results.estimatedDailyProfit.toFixed(2)}` },
                      { label: 'Trades per Day', value: results.estimatedTradesPerDay.toString() },
                    ]}
                  />
                </Grid>
                <Grid item>
                  <ResultsDisplay
                    title="More Metrics"
                    metrics={[
                      { label: 'Investment per Grid', value: `$${results.investmentPerGrid.toFixed(2)}` },
                      { label: 'Grid Spacing', value: `$${results.gridSpacing.toFixed(2)}` },
                      { label: 'Net Profit/Tx', value: `$${results.netProfitPerGridTransaction.toFixed(4)}` },
                    ]}
                  />
                </Grid>
                <Grid item>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      backgroundColor: '#1A1A1A',
                      borderColor: '#374151',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Profit Projection
                    </Typography>
                    <ProfitChart data={chartData} />
                  </Paper>
                </Grid>
                <Grid item>
                  <CryptoInsights message="Grid trading works best in sideways markets. Consider asset volatility when setting grid parameters." />
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default App;
