import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Link,
} from "@mui/material";
import logo from "./assets/calcchainlogo.png";
import InputForm from "./components/InputForm";
import ResultsDisplay from "./components/ResultsDisplay";
import ProfitChart from "./components/ProfitChart";
import CryptoInsights from "./components/CryptoInsights";
import { GridResults } from "./types";

const App: React.FC = () => {
  const [results, setResults] = useState<GridResults | null>(null);
  const [chartData, setChartData] = useState<{ day: number; profit: number }[]>(
    []
  );

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
          boxShadow: "5",
          border: "0",
        }}
      >
        <Toolbar>
          <Link href="/" sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="img"
              src={logo}
              alt="CalcChain Logo"
              sx={{
                height: 24,
                objectFit: "contain",
              }}
            />
          </Link>
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
                      {
                        label: "Total Estimated Profit",
                        value: `$${results.totalEstimatedProfit.toFixed(2)}`,
                      },
                      {
                        label: "Estimated Daily Profit",
                        value: `$${results.estimatedDailyProfit.toFixed(2)}`,
                      },
                      {
                        label: "Trades per Day",
                        value: results.estimatedTradesPerDay.toFixed(2),
                      },
                    ]}
                  />
                </Grid>
                <Grid item>
                  <ResultsDisplay
                    title="More Metrics"
                    metrics={[
                      {
                        label: "Investment per Grid",
                        value: `$${results.investmentPerGrid.toFixed(2)}`,
                      },
                      {
                        label: "Grid Spacing",
                        value: `$${results.gridSpacing.toFixed(2)}`,
                      },
                      {
                        label: "Net Profit/Tx",
                        value: `$${results.netProfitPerGridTransaction.toFixed(
                          4
                        )}`,
                      },
                    ]}
                  />
                </Grid>
                <Grid item>
                  <Paper
                    variant="outlined"
                    sx={{
                      boxShadow: 2,
                      p: 2,

                      backgroundColor: "#10131D",
                    }}
                  >
                    <Typography variant="h6" gutterBottom ml={4} mt={2}>
                      Profit Projection
                    </Typography>
                    <Typography variant="subtitle2" align="right" mb={2}>
                      <Box
                        component="span"
                        sx={{ color: "#2B66F6", fontWeight: "900" }}
                      >
                        ━
                      </Box>{" "}
                      Cummulative profit over time{" "}
                    </Typography>
                    <ProfitChart data={chartData} />
                  </Paper>
                </Grid>
                <Grid item>
                  <Typography variant="h6" sx={{ whiteSpace: "pre-line" }}>
                    What is Grid Trading?
                    <CryptoInsights
                      message={`Automated Strategy: Sets up a series of buy and sell orders at predefined price intervals, creating a 'grid.'
Goal: To profit from market volatility by automatically buying low and selling high as the price fluctuates within a defined range.
Ideal Market: Best suited for sideways, range-bound, or oscillating markets rather than strong, one-directional trending markets.`}
                    />
                  </Typography>
                  <Typography variant="h6">
                    Key Advantages?
                    <CryptoInsights message="Grid trading works best in sideways markets. Consider asset volatility when setting grid parameters." />
                  </Typography>
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
