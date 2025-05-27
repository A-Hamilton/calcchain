import React, { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Link,
  CircularProgress,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import logo from "./assets/calcchainlogo.png";
import InputForm from "./components/InputForm";
import ResultsDisplay from "./components/ResultsDisplay";
import ProfitChart from "./components/ProfitChart";
import CryptoInsights from "./components/CryptoInsights";
import { calculateGridProfit } from "./utils/calculator";
import { GridParameters, GridResults } from "./types";

const App: React.FC = () => {
  const [results, setResults] = useState<GridResults | null>(null);
  const [chartData, setChartData] = useState<{ day: number; profit: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async (params: GridParameters) => {
    setIsLoading(true);
    try {
      const res = await calculateGridProfit(params);
      setResults(res);
      const days = res.durationDays;
      const data = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        profit: (res.totalEstimatedProfit / days) * (i + 1),
      }));
      setChartData(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Full-screen loading overlay */}
      {isLoading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Main content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Logo Row (inline with grid) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minHeight: 56,
            mb: 2,
          }}
        >
          <Link href="/" sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="img"
              src={logo}
              alt="CalcChain Logo"
              sx={{ height: 32, objectFit: "contain" }}
            />
          </Link>
        </Box>

        <Typography variant="h4" gutterBottom>
          Grid Trading Profit Estimator
        </Typography>

        <Grid container spacing={4}>
          {/* Left: form */}
          <Grid item xs={12} md={5}>
            <InputForm onCalculate={handleCalculate} />
          </Grid>

          {/* Right: results, chart, insights, OR placeholder */}
          <Grid item xs={12} md={7}>
            <AnimatePresence mode="wait">
              {results ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Grid container direction="column" spacing={3}>
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
                          <Box
                            component="span"
                            sx={{ color: "#2B66F6", fontWeight: "900" }}
                          >
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
                          message={`If the price breaks decisively out of your set grid range, it can lead to losses.`}
                        />
                        <CryptoInsights
                          message={`Setting the correct price range and grid count requires careful analysis.`}
                        />
                        <CryptoInsights
                          message={`Frequent trades incur fees that can eat into profits.`}
                        />
                      </Typography>
                      <Typography variant="h6">
                        Important Considerations & Best Practices?
                        <CryptoInsights
                          message={`Choose assets in a ranging phase with good liquidity.`}
                        />
                        <CryptoInsights
                          message={`Define your upper/lower limits based on support & resistance.`}
                        />
                        <CryptoInsights
                          message={`Use reliable grid tools on low-fee exchanges.`}
                        />
                      </Typography>
                    </Grid>
                  </Grid>
                </motion.div>
              ) : (
                // Placeholder state BEFORE calculation
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Box
                    sx={{
                      background: "#1C1D2B",
                      borderRadius: 3,
                      p: 4,
                      boxShadow: 2,
                      minHeight: 420,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      border: "1.5px dashed #384050",
                    }}
                  >
                    <InfoOutlinedIcon sx={{ fontSize: 50, color: "#2B66F6", mb: 2, opacity: 0.7 }} />
                    <Typography variant="h5" color="#CDD2F6" align="center" fontWeight={600}>
                      No results yet
                    </Typography>
                    <Typography variant="body1" color="#9CA3AF" align="center" sx={{ maxWidth: 360 }}>
                      Enter your grid parameters on the left and click
                      <Box component="span" sx={{ color: "#2B66F6", fontWeight: 700, mx: 0.5 }}>
                        Calculate
                      </Box>
                      to see your estimated profit, trade metrics, and visual projections.
                    </Typography>
                    <Box
                      sx={{
                        mt: 4,
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                        opacity: 0.3,
                      }}
                    >
                      <Paper
                        sx={{
                          minHeight: 70,
                          borderRadius: 2,
                          bgcolor: "#24253A",
                          border: "1.5px dashed #2B66F6",
                          boxShadow: "none",
                        }}
                      />
                      <Paper
                        sx={{
                          minHeight: 70,
                          borderRadius: 2,
                          bgcolor: "#24253A",
                          border: "1.5px dashed #2B66F6",
                          boxShadow: "none",
                        }}
                      />
                      <Paper
                        sx={{
                          minHeight: 160,
                          gridColumn: "1 / span 2",
                          borderRadius: 2,
                          bgcolor: "#24253A",
                          border: "1.5px dashed #2B66F6",
                          boxShadow: "none",
                        }}
                      />
                    </Box>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default App;
