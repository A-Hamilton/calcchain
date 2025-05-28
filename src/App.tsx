import React, { useState, useCallback } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  CssBaseline,
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import InputForm from "./components/InputForm";
import ResultsDisplay from "./components/ResultsDisplay";
import CryptoInsights from "./components/CryptoInsights";
import ErrorBoundary from "./ErrorBoundary";
import theme from "./theme";
import logo from "./assets/calcchainlogo.png";
import { GridResults, GridParameters, Metric } from "./types";
import {calculateGridProfit} from "./utils/calculator";



const App: React.FC = () => {
  const [results, setResults] = useState<GridResults | null>(null);
  const [chartData, setChartData] = useState<{ day: number; profit: number }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [symbolError, setSymbolError] = useState<string | null>(null);

  const handleCalculate = useCallback(
    async (params: GridParameters) => {
      setIsLoading(true);
      setSymbolError(null); // Clear previous errors
      try {
        const res = await calculateGridProfit(params);
        setResults(res);

        // Generate chart data
        const chartDataArr = [];
        const perDay = res.estimatedDailyProfit ?? 0;
        for (let day = 1; day <= params.durationDays; day++) {
          chartDataArr.push({ day, profit: Number((perDay * day).toFixed(2)) });
        }
        setChartData(chartDataArr);
      } catch (err: any) {
        // Binance invalid symbol errors typically return as a string error message
        const errMsg =
          err?.response?.data?.msg ||
          err?.message ||
          String(err) ||
          "";
        if (
          errMsg.toLowerCase().includes("invalid symbol") ||
          errMsg.toLowerCase().includes("symbol not found")
        ) {
          setSymbolError(
            "The trading symbol is invalid. Please enter a valid trading pair, e.g. BTCUSDT, ETHBTC, DOGEUSDT, etc."
          );
        } else {
          setSymbolError(
            "Calculation failed. Please check your parameters and try again."
          );
        }
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        {/* NAVBAR / HEADER */}
        <Box
          component="header"
          sx={{
            display: "flex",
            alignItems: "center",
            px: 4,
            py: 2,
            bgcolor: "background.paper",
            boxShadow: 1,
            minHeight: 60,
          }}
        >
          <img
            src={logo}
            alt="CalcChain"
            style={{ height: 36, marginRight: 16 }}
          />
          {/* Future: Navigation/tool links can be added here */}
        </Box>

        {/* MAIN PAGE CONTENT */}
        <Box sx={{ px: { xs: 1, md: 4 }, pt: 3, pb: 2 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, mb: 2, color: "#fff" }}
          >
            Grid Trading Profit Estimator
          </Typography>

          {/* Intro Banner */}
          <Paper
            sx={{ p: 2, mb: 3, bgcolor: "primary.dark", color: "#fff" }}
            elevation={0}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              What is Grid Trading?{" "}
              <span style={{ fontWeight: 400 }}>
                Grid trading automatically places buy and sell orders at preset
                intervals within a price range to profit from volatility.{" "}
                <a
                  href="https://b2broker.com/news/understanding-grid-trading-purpose-pros-cons/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#bbdefb",
                    textDecoration: "underline",
                  }}
                >
                  Learn more.
                </a>
              </span>
            </Typography>
          </Paper>

          {/* Main Grid Layout */}
          <Grid container spacing={3}>
            {/* LEFT: Input Form */}
            <Grid item xs={12} md={5}>
              <InputForm onCalculate={handleCalculate} symbolError={symbolError} />
            </Grid>
            {/* RIGHT: Results/Chart */}
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "stretch",
                  position: "relative",
                }}
              >
                {/* Loader Overlay */}
                {isLoading && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 20,
                      bgcolor: "rgba(0,0,0,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress color="primary" />
                  </Box>
                )}
                {/* Results or Placeholder */}
                {results ? (
                  <Box>
                    <ResultsDisplay
  title="Estimated Results"
  metrics={
    [
      results.overallTotalValue !== undefined && results.overallTotalValue !== null
        ? {
            label: "Total Value (After All Grid & Buy/Sell)",
            value: `$${results.overallTotalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          }
        : null,
      results.principalReturnFromEntryExit !== undefined && results.principalReturnFromEntryExit !== null
        ? {
            label: "Net Principal Change (Buy at X, Sell at Y)",
            value: `$${results.principalReturnFromEntryExit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          }
        : null,
      {
        label: "Estimated Daily Profit",
        value: `$${results.estimatedDailyProfit?.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      },
      {
        label: "Trades per Day",
        value: results.estimatedTradesPerDay?.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      },
      ].filter(Boolean) as Metric[]
  }
/>
                    <Box sx={{ mt: 2 }}>
                      <ResultsDisplay
                        title="Profit Breakdown"
                        metrics={[
                          {
                            label: "Total Net Profit",
                            value: `$${results.totalNetProfit?.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 2 }
                            )}`,
                          },
                          {
                            label: "Total Grid Profit (before fees)",
                            value: `$${results.totalGridProfit?.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 2 }
                            )}`,
                          },
                          {
                            label: "Estimated Daily Grid Profit (before fees)",
                            value: `$${results.estimatedDailyGridProfit?.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 2 }
                            )}`,
                          },
                        ]}
                      />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <ResultsDisplay
                        title="More Metrics"
                        metrics={[
                          {
                            label: "Investment per Grid",
                            value: `$${results.investmentPerGrid?.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 2 }
                            )}`,
                          },
                          {
                            label: "Grid Spacing",
                            value: `$${results.gridSpacing?.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 6 }
                            )}`,
                          },
                          {
                            label: "Net Profit/Tx",
                            value: `$${results.netProfitPerGridTransaction?.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 4 }
                            )}`,
                          },
                          {
                            label: "Average ATR per Minute",
                            value: results.atrPerMin?.toLocaleString(undefined, {
                              maximumFractionDigits: 6,
                            }),
                          },
                        ]}
                      />
                    </Box>
                    <Box sx={{ mt: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Why Use Grid Trading?
                      </Typography>
                      <CryptoInsights message="Generates consistent profit in volatile, sideways markets." />
                      <CryptoInsights message="Removes emotional decision-making by automating trades." />
                      <CryptoInsights message="Works best for assets with predictable price swings." />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, mt: 2, mb: 1 }}
                      >
                        What is Grid Trading?
                      </Typography>
                      <CryptoInsights message="Grid trading places buy and sell orders at fixed price intervals to profit from market volatility." />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, mt: 2, mb: 1 }}
                      >
                        What are the risks?
                      </Typography>
                      <CryptoInsights message="If the price breaks out of your set range, it can lead to losses." />
                      <CryptoInsights message="Grid trading is not suitable for all market conditions—trending markets can reduce profit." />
                      <CryptoInsights message="Always start with small amounts and manage risk carefully." />
                    </Box>
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: "center",
                      bgcolor: "background.paper",
                      color: "#fff",
                    }}
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/1995/1995526.png"
                      alt="Get Started"
                      style={{ height: 40, marginBottom: 8 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Welcome to the Grid Trading Profit Estimator!
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, color: "text.secondary" }}
                    >
                      Enter your parameters or click "Optimize Values" for
                      AI-powered suggestions. Then hit Calculate to see your
                      projected profits, chart, and trading metrics.
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
