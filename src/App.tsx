import React, { useState, useCallback, useMemo, Suspense, lazy } from "react";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import {
  CssBaseline, Box, Typography, Grid, Paper, CircularProgress, AppBar, Toolbar, IconButton,
  Menu, MenuItem, Divider, ListItemIcon, Container, Accordion, AccordionSummary, AccordionDetails,
  Alert as MuiAlert, Skeleton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import logo from "./assets/calcchainlogo.png";

import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";

import InputForm from "./components/InputForm";
const ResultsDisplay = lazy(() => import("./components/ResultsDisplay"));
const CryptoInsights = lazy(() => import("./components/CryptoInsights"));

import ErrorBoundary from "./ErrorBoundary";
import appTheme from "./theme";
import { GridResults, GridParameters, Metric, GridType as GridTypeEnum } from "./types";
import { calculateGridProfit } from "./utils/calculator";

const NAV_HORIZONTAL_PADDING = { xs: 1, md: 4 };
const CONTENT_MAX_WIDTH = 1200;

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const resultsContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1, },
  },
};

interface InfoSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const InfoSection: React.FC<InfoSectionProps> = ({ title, icon, children, defaultExpanded }) => {
  const theme = useTheme();
  return (
    <m.div initial="hidden" animate="visible" variants={sectionVariants} >
      <Accordion
        defaultExpanded={defaultExpanded}
        TransitionProps={{ unmountOnExit: true }}
        sx={{
          bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1], '&:before': { display: 'none' },
          mb: 1.5, borderRadius: 2, overflow: 'hidden',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{color: 'text.secondary'}} />}
          sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center' }, '&:hover': { bgcolor: theme.palette.action.hover } }}
        >
          {icon && <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: 'primary.main' }}>{React.cloneElement(icon as React.ReactElement, { fontSize: "small" })}</Box>}
          <Typography variant="h6" component="h3" sx={{ fontWeight: 500, fontSize: '1.05rem' }}>{title}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{pt:0, pb:1.5, px:2}}>
          <m.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3, delay: 0.1}}>
              {children}
          </m.div>
        </AccordionDetails>
      </Accordion>
    </m.div>
  );
};

const LazyLoadingFallback: React.FC<{ height?: number | string, message?: string }> = ({ height = 200, message = "Loading..." }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height, width: '100%', my: 2, p:2, textAlign: 'center' }}>
    <CircularProgress sx={{mb:1}} />
    <Typography variant="caption" color="text.secondary">{message}</Typography>
  </Box>
);

const ResultsSectionSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="rectangular" width="100%" height={150} sx={{ mb: 2, borderRadius: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2, borderRadius: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={180} sx={{ mb: 2, borderRadius: 2 }} />
  </Box>
);


const App: React.FC = () => {
  const [results, setResults] = useState<GridResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const clearCalculationErrorFromApp = useCallback(() => setCalculationError(null), []);

  const handleCalculate = useCallback(
    async (params: GridParameters) => {
      setIsLoading(true); setCalculationError(null); setResults(null);
      try {
        const res = await calculateGridProfit(params); setResults(res);
      } catch (err: any) {
        let friendlyMessage = "Calculation failed. Please check parameters and try again.";
        const errorMessage = err?.message?.toLowerCase() || "";
        if (errorMessage.includes("symbol")) {
          friendlyMessage = `No market data for symbol '${params.symbol.trim()}'. It might be delisted. Check 'https://www.binance.com/en/trade' for available symbols.`;
        } else if (err?.message) { friendlyMessage = `Calculation error: ${err.message}`; }
        setCalculationError(friendlyMessage);
      } finally { setIsLoading(false); }
    },[]);

  const metrics = useMemo(() => {
    if (!results) return { primary: [], estimated: [], breakdown: [], more: [] };
    const primaryMetric: Metric | null = results.overallTotalValue !== undefined && results.overallTotalValue !== null
      ? {
          label: "Total Estimated Value (Principal + Grid P/L + Buy/Sell P/L)",
          value: `$${results.overallTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          isPrimary: true,
        } : null;
    const estimated: Metric[] = [
      ...(results.principalReturnFromEntryExit !== undefined && results.principalReturnFromEntryExit !== null
        ? [{ label: "Net P/L from Buy/Sell (Hypothetical)", value: `$${results.principalReturnFromEntryExit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, }] : []),
      { label: "Estimated Daily Net Profit (from Grids)", value: `$${results.estimatedDailyProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, },
      { label: "Est. Trades per Day (Round Trips)", value: results.estimatedTradesPerDay?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }), },
    ].filter(Boolean) as Metric[];
    const breakdown: Metric[] = [
      { label: "Total Net Profit (from Grids)", value: `$${results.totalNetProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, },
      { label: "Total Grid Profit (Gross, before fees)", value: `$${results.totalGridProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, },
      { label: "Est. Daily Grid Profit (Gross, before fees)", value: `$${results.estimatedDailyGridProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, },
    ];
    let gridStepLabel = "Grid Step"; let gridStepValueDisplay = "";
    if (results.gridType === GridTypeEnum.Geometric) {
      gridStepLabel = "Grid Step (Ratio)"; const ratio = results.gridSpacing; const percentage = (ratio - 1) * 100;
      gridStepValueDisplay = `${ratio?.toFixed(5)} (${percentage.toFixed(2)}%)`;
    } else {
      gridStepLabel = "Grid Step (Value)";
      gridStepValueDisplay = `$${results.gridSpacing?.toLocaleString(undefined, { minimumFractionDigits: Math.min(2, (results.gridSpacing < 1 ? 6 : 2)), maximumFractionDigits: 6 })}`;
    }
    const more: Metric[] = [
      { label: "Investment per Grid Line", value: `$${results.investmentPerGrid?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, },
      { label: gridStepLabel, value: gridStepValueDisplay, },
      { label: "Net Profit per Grid Tx (Round Trip)", value: `$${results.netProfitPerGridTransaction?.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`, },
      { label: "Average ATR per Minute", value: results.atrPerMin?.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 8 }), },
    ];
    return { primary: primaryMetric ? [primaryMetric] : [], estimated, breakdown, more };
  }, [results]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <LazyMotion features={domAnimation} strict>
          <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: "background.paper", boxShadow: 3, py: 0.5, borderBottom: `1px solid ${appTheme.palette.divider}`}}>
            <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: "auto", width: "100%", px: NAV_HORIZONTAL_PADDING }}>
              <Toolbar disableGutters sx={{ minHeight: 56, width: "100%", display: "flex", justifyContent: "space-between", px: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <a href="https://calcchain.com" aria-label="CalcChain Home">
                    <m.img
                      src={logo}
                      alt="CalcChain Logo"
                      width="128"
                      height="32"
                      style={{ display: 'block', height: '32px', width: 'auto' }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: "circOut" }}
                    />
                  </a>
                </Box>
                <Box>
                  <IconButton edge="end" color="inherit" aria-label="menu" onClick={handleMenuOpen} size="medium" sx={{ bgcolor: "primary.dark", '&:hover': { bgcolor: "primary.main", color: "#fff" }, borderRadius: 2, p: 0.75 }}>
                    <MenuIcon fontSize="small" />
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} >
                    <MenuItem onClick={handleMenuClose} selected sx={{fontSize: '0.9rem'}}> <ListItemIcon><TimelineOutlinedIcon fontSize="small" color="primary" /></ListItemIcon> Grid Trading Profit Estimator </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleMenuClose} disabled sx={{fontSize: '0.9rem'}}> <ListItemIcon><ScheduleOutlinedIcon fontSize="small" /></ListItemIcon> DCA Simulator (Coming Soon) </MenuItem>
                    <MenuItem onClick={handleMenuClose} disabled sx={{fontSize: '0.9rem'}}> <ListItemIcon><PieChartOutlineOutlinedIcon fontSize="small" /></ListItemIcon> Portfolio Tracker (Coming Soon) </MenuItem>
                  </Menu>
                </Box>
              </Toolbar>
            </Box>
          </AppBar>

          <Container maxWidth={false} sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: "auto", px: NAV_HORIZONTAL_PADDING, pt: {xs: 2, md: 3}, pb: 4 }}>
            <m.div initial="hidden" animate="visible" variants={sectionVariants}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2, color: "#fff", textAlign: {xs: 'center', sm: 'left'} }}>
                Grid Trading Profit Estimator
              </Typography>
            </m.div>

            <m.div initial="hidden" animate="visible" variants={sectionVariants} transition={{delay: 0.1}}>
              <Paper sx={{ p: 2, mb: 3, bgcolor: "primary.dark", color: "#fff", borderRadius: 2 }} elevation={0}>
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 500, mb: 0.5 }}> What is Grid Trading? </Typography>
                <Typography variant="body2"> Grid trading automatically places buy and sell orders at preset intervals within a price range to profit from volatility.{" "}
                  <a href="https://b2broker.com/news/understanding-grid-trading-purpose-pros-cons/" target="_blank" rel="noopener noreferrer" style={{ color: appTheme.palette.primary.light, textDecoration: "underline" }}> Learn more. </a>
                </Typography>
              </Paper>
            </m.div>

            {/* Explicitly add component="div" to Grid items */}
            <Grid container spacing={{xs: 2, md: 3}}>
              <Grid item component="div" xs={12} md={5}>
                <m.div initial="hidden" animate="visible" variants={sectionVariants} transition={{delay: 0.2}}>
                  <InputForm onCalculate={handleCalculate} calculationErrorFromApp={calculationError} onClearCalculationErrorFromApp={clearCalculationErrorFromApp} />
                </m.div>
              </Grid>
              <Grid item component="div" xs={12} md={7}>
                <Box sx={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
                  <AnimatePresence>
                    {isLoading && !results && (
                      <m.div
                        key="global-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                        style={{ position: "absolute", inset: 0, zIndex: 10, backgroundColor: "rgba(16, 19, 29, 0.85)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: appTheme.shape.borderRadius*2 }}
                      ><CircularProgress color="primary" /></m.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {calculationError && !isLoading && (
                      <m.div
                        key="calc-error-alert" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, transition:{duration: 0.2} }} transition={{ duration: 0.3, ease: "backOut" }}
                      ><MuiAlert severity="error" sx={{ mb: 2, width: '100%' }} onClose={clearCalculationErrorFromApp} role="alert">{calculationError}</MuiAlert></m.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence mode="wait">
                    {results ? (
                      <m.div key="results-content" initial="hidden" animate="visible" exit={{opacity: 0, y: -10, transition: {duration: 0.2}}} variants={resultsContainerVariants} >
                        <Suspense fallback={<ResultsSectionSkeleton />}>
                          <Box>
                            {metrics.primary.length > 0 && <ResultsDisplay title="Key Result" metrics={metrics.primary} titleIcon={<AccountBalanceWalletOutlinedIcon />} isLoading={isLoading} delay={0} />}
                            <ResultsDisplay title="Profit Estimates" metrics={metrics.estimated} titleIcon={<ShowChartOutlinedIcon />} delay={0.05} />
                            <Box sx={{ mt: 2 }}><ResultsDisplay title="Grid Profit Breakdown" metrics={metrics.breakdown} titleIcon={<FunctionsOutlinedIcon />} delay={0.1} /></Box>
                            <Box sx={{ mt: 2 }}><ResultsDisplay title="Additional Grid Metrics" metrics={metrics.more} titleIcon={<TuneOutlinedIcon />} delay={0.15} /></Box>
                            <m.div initial="hidden" animate="visible" variants={{visible: {transition: {staggerChildren: 0.1, delayChildren: 0.4}}}}>
                              <Box sx={{mt: 3}}>
                                  <InfoSection title="Why Use Grid Trading?" icon={<HelpOutlineIcon />} defaultExpanded>
                                      <Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..."/>}><CryptoInsights message="Generates consistent profit in volatile, sideways markets." /></Suspense>
                                      <Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..."/>}><CryptoInsights message="Removes emotional decision-making by automating trades." /></Suspense>
                                      <Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..."/>}><CryptoInsights message="Works best for assets with predictable price swings." /></Suspense>
                                  </InfoSection>
                                  <InfoSection title="Grid Trading Insights" icon={<InfoOutlinedIcon />}>
                                      <Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..."/>}><CryptoInsights message="Grid trading places buy and sell orders at fixed price intervals to profit from market volatility." /></Suspense>
                                  </InfoSection>
                                  <InfoSection title="Potential Risks" icon={<WarningAmberOutlinedIcon />}>
                                      <Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..."/>}><CryptoInsights message="If the price breaks out of your set range, it can lead to losses." /></Suspense>
                                      <Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..."/>}><CryptoInsights message="Not suitable for all market conditions—strong trending markets can reduce effectiveness." /></Suspense>
                                      <Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..."/>}><CryptoInsights message="Always start with small amounts and manage risk carefully." /></Suspense>
                                  </InfoSection>
                              </Box>
                            </m.div>
                          </Box>
                        </Suspense>
                      </m.div>
                    ) : (
                      !isLoading && !calculationError && (
                        <m.div key="placeholder-content" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} >
                          <Paper sx={{ p: {xs:2, md:4}, textAlign: "center", bgcolor: "background.paper", color: "text.primary", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, borderRadius: 2 }}>
                            <m.img
                              src="https://cdn-icons-png.flaticon.com/512/1995/1995526.png"
                              alt="Get Started Icon"
                              width="48"
                              height="48"
                              style={{ marginBottom: 16, filter: 'grayscale(30%) opacity(0.8)' }}
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 150 }}
                            />
                            <Typography variant="h6" component="p" sx={{ fontWeight: 600, mb:1 }}> Welcome to the Grid Trading Profit Estimator! </Typography>
                            <Typography variant="body2" component="p" sx={{ color: "text.secondary", maxWidth: 450, lineHeight: 1.6 }}>
                              Enter your parameters or click "Optimize Values" for data-driven suggestions. Then hit Calculate to see your projected profits and trading metrics.
                            </Typography>
                          </Paper>
                        </m.div>
                      )
                    )}
                  </AnimatePresence>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </LazyMotion>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
