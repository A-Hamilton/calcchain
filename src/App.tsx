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
      <AppBar position="static" elevation={0} sx={{ boxShadow: 5, border: 0 }}>
        <Toolbar>
          <Link href="/" sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="img"
              src={logo}
              alt="CalcChain Logo"
              sx={{ height: 24, objectFit: "contain" }}
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
                        value: `$${results.netProfitPerGridTransaction.toFixed(4)}`,
                      },
                      {
                        label: "ATR / Min",
                        value: results.atrPerMin.toFixed(4),
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
                      backgroundColor: "#1C1D2B",
                    }}
                  >
                    <Typography variant="h6" gutterBottom ml={4} mt={2}>
                      Profit Projection
                    </Typography>
                    <Typography variant="subtitle2" align="right" mb={2}>
                      <Box component="span" sx={{ color: "#2B66F6", fontWeight: "900" }}>
                        ━
                      </Box>{" "}
                      Cumulative profit over time
                    </Typography>
                    <ProfitChart data={chartData} />
                  </Paper>
                </Grid>
                <Grid item>
                  <Typography variant="h6" sx={{ whiteSpace: "pre-line" }}>
                    What is Grid Trading?
                    <CryptoInsights
                      message={`Grid trading places buy and sell orders at fixed price intervals to profit from market volatility.`}
                    />
                    <CryptoInsights
                      message={`It aims to buy and sell repeatedly as the price fluctuates within a range.`}
                    />
                    <CryptoInsights
                      message={`This strategy works best in sideways or ranging markets without strong trends.`}
                    />
                  </Typography>
                  <Typography variant="h6">
                    Why Use Grid Trading?
                    <CryptoInsights
                      message={`Generates consistent profit in volatile, sideways markets.`}
                    />
                    <CryptoInsights
                      message={`Removes emotional decision-making by automating trades.`}
                    />
                    <CryptoInsights
                      message={`Works without needing to predict market direction.`}
                    />
                  </Typography>
                  <Typography variant="h6">
                    What are the risks?
                    <CryptoInsights
                      message={`If the price breaks decisively out of your set grid range (either up or down), it can lead to losses (e.g., buying all the way down in a crash, or selling all your assets too early in a strong rally).`}
                    />
                    <CryptoInsights
                      message={`Setting the correct price range, number of grids, and investment per grid is crucial and requires careful analysis. Incorrect parameters lead to poor performance.`}
                    />
                    <CryptoInsights
                      message={`Frequent buying and selling can lead to accumulating transaction fees, which can eat into profits.`}
                    />
                  </Typography>
                  <Typography variant="h6">
                    Important Considerations & Best Practices?
                    <CryptoInsights
                      message={`Choose cryptocurrencies that are currently in a ranging phase with decent volatility and good liquidity.`}
                    />
                    <CryptoInsights
                      message={`Carefully define the upper and lower price limits for your grid (e.g., based on support and resistance levels).`}
                    />
                    <CryptoInsights
                      message={`Use a reputable exchange or bot provider that offers reliable grid trading tools with low fees.`}
                    />
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
