// src/App.tsx

// REMOVE the following lines from App.tsx:
// export const ThemeModeContext = createContext<{ toggleThemeMode: () => void }>({
//   toggleThemeMode: () => {},
// });

// ADD this import instead:
import { ThemeModeContext, ThemeModeContextType } from './ThemeModeContext'; // Adjust path if necessary

// ... rest of your existing imports from React, MUI, Framer Motion etc. ...
import React, {
  useState,
  useCallback,
  useMemo,
  Suspense,
  lazy,
  // createContext, // No longer needed here if ThemeModeContext is imported
  useContext,
  useEffect,
} from 'react';
import {
  ThemeProvider,
  useTheme as useMuiTheme,
  alpha,
  Theme,
} from '@mui/material/styles';
// ... other MUI imports ...
import {
  CssBaseline,
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert as MuiAlert,
  Skeleton,
  Tooltip,
  Card,
} from '@mui/material';
// ... MUI Icon imports ...
import {
  Menu as MenuIcon,
  ExpandMore as ExpandMoreIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  TimelineOutlined as TimelineOutlinedIcon,
  ScheduleOutlined as ScheduleOutlinedIcon,
  PieChartOutlineOutlined as PieChartOutlineOutlinedIcon,
  HelpOutline as HelpOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
  WarningAmberOutlined as WarningAmberOutlinedIcon,
  ShowChartOutlined as ShowChartOutlinedIcon,
  AccountBalanceWalletOutlined as AccountBalanceWalletOutlinedIcon,
  FunctionsOutlined as FunctionsOutlinedIcon,
  TuneOutlined as TuneOutlinedIcon,
} from '@mui/icons-material';


import logo from './assets/calcchainlogodark.png';
import darkLogo from './assets/calcchainlogo.png';

import { AnimatePresence, LazyMotion, domAnimation, m, useAnimationControls } from 'framer-motion';

import InputForm from './components/InputForm';

const ResultsDisplay = lazy(() => import('./components/ResultsDisplay'));
const CryptoInsights = lazy(() => import('./components/CryptoInsights'));
import ErrorBoundary from './ErrorBoundary';
import { createAppTheme } from './theme';
import { GridResults, GridParameters, Metric, GridType as GridTypeEnum } from './types';
import { calculateGridProfit } from './utils/calculator';

const NAV_HORIZONTAL_PADDING = { xs: 1.5, sm: 2, md: 3 };
const CONTENT_MAX_WIDTH = 1320;

// --- Variants for animations (unchanged) ---
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const resultsContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

// --- Types for props (unchanged) ---
interface InfoSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

// --- InfoSection Component (unchanged) ---
const InfoSection: React.FC<InfoSectionProps> = ({ title, icon, children, defaultExpanded }) => {
  const theme = useMuiTheme();
  return (
    <m.div initial="hidden" animate="visible" variants={sectionVariants}>
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <Accordion
          defaultExpanded={defaultExpanded}
          disableGutters
          elevation={0}
          TransitionProps={{ unmountOnExit: true }}
          sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
            sx={{
              '& .MuiAccordionSummary-content': { alignItems: 'center' },
              '&:hover': { bgcolor: theme.palette.action.hover },
              minHeight: { xs: 52, sm: 56 },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            {icon && (
              <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                {React.cloneElement(icon as React.ReactElement, { fontSize: 'small' })}
              </Box>
            )}
            <Typography variant="h6" component="h3" sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
              {title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, pb: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2 } }}>
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
              {children}
            </m.div>
          </AccordionDetails>
        </Accordion>
      </Card>
    </m.div>
  );
};

// --- Fallback for lazy loading (unchanged) ---
const LazyLoadingFallback: React.FC<{ height?: number | string; message?: string }> = ({ height = 200, message = 'Loading...' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height, width: '100%', my: 2, p: 2, textAlign: 'center' }}>
    <CircularProgress sx={{ mb: 1 }} />
    <Typography variant="caption" color="text.secondary">{message}</Typography>
  </Box>
);

// --- Skeleton placeholder (unchanged) ---
const ResultsSectionSkeleton: React.FC = () => {
  const theme = useMuiTheme();
  return (
    <Box>
      <Skeleton variant="rectangular" width="100%" height={150} sx={{ mb: 2, borderRadius: theme.shape.borderRadius }}/>
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2, borderRadius: theme.shape.borderRadius }}/>
      <Skeleton variant="rectangular" width="100%" height={180} sx={{ mb: 2, borderRadius: theme.shape.borderRadius }}/>
    </Box>
  );
};

// --- Main content component (AppContent - logic largely unchanged, ensure it uses the imported ThemeModeContext) ---
const AppContent: React.FC = () => {
  const themeFromProvider = useMuiTheme();
  const currentMode = themeFromProvider.palette.mode;
  const themeContext = useContext(ThemeModeContext); // This will now use the imported context

  const [results, setResults] = useState<GridResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const clearCalculationErrorFromApp = useCallback(() => setCalculationError(null), []);

  const handleCalculate = useCallback(
    async (params: GridParameters) => {
      setIsLoading(true);
      setCalculationError(null);
      setResults(null);
      try {
        const res = await calculateGridProfit(params);
        setResults(res);
      } catch (err: unknown) {
        let friendlyMessage = 'Calculation failed. Please check parameters and try again.';
        let specificErrorMessage: string | undefined = undefined;
        if (err instanceof Error) specificErrorMessage = err.message;
        else if (typeof err === 'string') specificErrorMessage = err;
        
        const lowerCaseErrorMessage = specificErrorMessage?.toLowerCase() || '';
        if (params.symbol && lowerCaseErrorMessage.includes('symbol')) {
          friendlyMessage = `No market data for symbol '${params.symbol.trim()}'. It might be delisted.`;
        } else if (specificErrorMessage) {
          friendlyMessage = `Calculation error: ${specificErrorMessage}`;
        }
        setCalculationError(friendlyMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const metrics = useMemo(() => {
    // ... (metrics calculation logic - kept condensed as per your last input) ...
    if (!results) return { primary: [], estimated: [], breakdown: [], more: [] };
    const primaryMetric: Metric | null = results.overallTotalValue !== undefined && results.overallTotalValue !== null ? { label: 'Total Estimated Value (Principal + Grid P/L + Buy/Sell P/L)', value: `$${results.overallTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, isPrimary: true, } : null;
    const estimated: Metric[] = [ ...(results.principalReturnFromEntryExit !== undefined && results.principalReturnFromEntryExit !== null ? [ { label: 'Net P/L from Buy/Sell (Hypothetical)', value: `$${results.principalReturnFromEntryExit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, }, ] : []), { label: 'Estimated Daily Net Profit (from Grids)', value: `$${results.estimatedDailyProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, }, { label: 'Est. Trades per Day (Round Trips)', value: results.estimatedTradesPerDay?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }), }, ].filter(Boolean) as Metric[];
    const breakdown: Metric[] = [ { label: 'Total Net Profit (from Grids)', value: `$${results.totalNetProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, }, { label: 'Total Grid Profit (Gross, before fees)', value: `$${results.totalGridProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, }, { label: 'Est. Daily Grid Profit (Gross, before fees)', value: `$${results.estimatedDailyGridProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, }, ];
    let gridStepLabel = 'Grid Step'; let gridStepValueDisplay = '';
    if (results.gridType === GridTypeEnum.Geometric) { gridStepLabel = 'Grid Step (Ratio)'; const ratio = results.gridSpacing; const percentage = (ratio - 1) * 100; gridStepValueDisplay = `${ratio?.toFixed(5)} (${percentage.toFixed(2)}%)`; } else { gridStepLabel = 'Grid Step (Value)'; gridStepValueDisplay = `$${results.gridSpacing?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`; }
    const more: Metric[] = [ { label: 'Investment per Grid Line', value: `$${results.investmentPerGrid?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, }, { label: gridStepLabel, value: gridStepValueDisplay, }, { label: 'Net Profit per Grid Tx (Round Trip)', value: `$${results.netProfitPerGridTransaction?.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`, }, { label: 'Average ATR per Minute', value: results.atrPerMin?.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 8 }), }, ];
    return { primary: primaryMetric ? [primaryMetric] : [], estimated, breakdown, more };
  }, [results]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: '100vh',
        backgroundColor: themeFromProvider.palette.background.default,
      }}
    >
      <MainAppBar onMenuOpen={handleMenuOpen} currentMode={currentMode} toggleTheme={themeContext.toggleThemeMode} anchorEl={anchorEl} handleMenuClose={handleMenuClose} />
      <Container
        maxWidth={false}
        sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto', px: NAV_HORIZONTAL_PADDING, pt: { xs: 2.5, md: 3.5 }, pb: 4 }}
      >
        <AnimatedSection>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: { xs: 2.5, md: 3.5 }, color: 'text.primary', textAlign: { xs: 'center', sm: 'left' } }}>
            Grid Trading Profit Estimator
          </Typography>
        </AnimatedSection>
        <AnimatedSection transition={{ delay: 0.1 }}>
          <Paper
            sx={{ p: { xs: 2, sm: 2.5 }, mb: { xs: 3, md: 4 }, bgcolor: currentMode === 'dark' ? themeFromProvider.palette.primary.dark : alpha(themeFromProvider.palette.primary.main, 1), color: themeFromProvider.palette.primary.contrastText, borderRadius: themeFromProvider.shape.borderRadius }}
            elevation={0}
          >
            <Typography component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>What is Grid Trading?</Typography>
            <Typography variant="body2">
              Grid trading automatically places buy and sell orders at preset intervals within a price range to profit from volatility.{' '}
              <a href="https://b2broker.com/news/understanding-grid-trading-purpose-pros-cons/" target="_blank" rel="noopener noreferrer" style={{ color: themeFromProvider.palette.info.light, textDecoration: 'underline', fontWeight: 500 }}>
                Learn more.
              </a>
            </Typography>
          </Paper>
        </AnimatedSection>
        <Grid container spacing={{ xs: 2.5, md: 4 }}>
          <Grid item xs={12} md={5}>
            <AnimatedSection transition={{ delay: 0.2 }}>
              <InputForm onCalculate={handleCalculate} calculationErrorFromApp={calculationError} onClearCalculationErrorFromApp={clearCalculationErrorFromApp} />
            </AnimatedSection>
          </Grid>
          <Grid item xs={12} md={7} sx={{ height: '100%', position: 'relative' }}>
            <ResultsArea isLoading={isLoading} results={results} calculationError={calculationError} onClearError={clearCalculationErrorFromApp} metrics={metrics} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// --- Animated section wrapper (unchanged) ---
const AnimatedSection: React.FC<{ children: React.ReactNode; transition?: object }> = ({ children, transition }) => (
  <m.div initial="hidden" animate="visible" variants={sectionVariants} transition={transition || {}}>
    {children}
  </m.div>
);

// --- Main AppBar component (unchanged) ---
interface MainAppBarProps {
  onMenuOpen: (e: React.MouseEvent<HTMLElement>) => void;
  currentMode: 'light' | 'dark';
  toggleTheme: () => void;
  anchorEl: null | HTMLElement;
  handleMenuClose: () => void;
}
const MainAppBar: React.FC<MainAppBarProps> = ({ onMenuOpen, currentMode, toggleTheme, anchorEl, handleMenuClose }) => {
  const themeToggleButtonTitle = currentMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ bgcolor: 'background.default', boxShadow: (theme) => theme.shadows[2], py: 1, borderBottom: (theme) => `0px solid ${theme.palette.divider}` }}>
      <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto', width: '100%', px: NAV_HORIZONTAL_PADDING }}>
        <Toolbar disableGutters sx={{ minHeight: { xs: 52, sm: 56 }, width: '100%', display: 'flex', justifyContent: 'space-between', px: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <a href="https://calcchain.com" aria-label="CalcChain Home">
              <m.img src={currentMode === 'dark' ? darkLogo : logo} alt="CalcChain Logo" style={{ display: 'block', height: '30px', width: 'auto' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: 'circOut' as const }}/>
            </a>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={themeToggleButtonTitle}>
              <IconButton sx={{ mr: { xs: 0.5, sm: 1 }, color: 'text.primary' }} onClick={toggleTheme} color="inherit" aria-label="toggle theme">
                {currentMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            <IconButton edge="end" color="inherit" aria-label="menu" onClick={onMenuOpen} size="medium" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' }, borderRadius: (theme) => theme.shape.borderRadius, p: { xs: 0.6, sm: 0.75 } }}>
              <MenuIcon fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
              <MenuItem onClick={handleMenuClose} selected sx={{ fontSize: '0.9rem' }}><ListItemIcon><TimelineOutlinedIcon fontSize="small" color="primary" /></ListItemIcon>Grid Trading Profit Estimator</MenuItem>
              <Divider />
              <MenuItem onClick={handleMenuClose} disabled sx={{ fontSize: '0.9rem' }}><ListItemIcon><ScheduleOutlinedIcon fontSize="small" /></ListItemIcon>DCA Simulator (Coming Soon)</MenuItem>
              <MenuItem onClick={handleMenuClose} disabled sx={{ fontSize: '0.9rem' }}><ListItemIcon><PieChartOutlineOutlinedIcon fontSize="small" /></ListItemIcon>Portfolio Tracker (Coming Soon)</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Box>
    </AppBar>
  );
};

// --- Results display and error handling (unchanged) ---
interface ResultsAreaProps { isLoading: boolean; results: GridResults | null; calculationError: string | null; onClearError: () => void; metrics: { primary: Metric[]; estimated: Metric[]; breakdown: Metric[]; more: Metric[]; };}
const ResultsArea: React.FC<ResultsAreaProps> = ({ isLoading, results, calculationError, onClearError, metrics }) => {
  const theme = useMuiTheme();
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AnimatePresence>{isLoading && !results && (<m.div key="global-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', inset: 0, zIndex: 10, backgroundColor: alpha(theme.palette.background.default, 0.85), display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: theme.shape.borderRadius, }}><CircularProgress color="primary" /></m.div>)}</AnimatePresence>
      <AnimatePresence>{calculationError && !isLoading && (<m.div key="calc-error-alert" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }} transition={{ duration: 0.3, ease: 'backOut' as const }}><MuiAlert severity="error" sx={{ mb: 2, width: '100%' }} onClose={onClearError} role="alert">{calculationError}</MuiAlert></m.div>)}</AnimatePresence>
      <AnimatePresence mode="wait">{results ? (<m.div key="results-content" initial="hidden" animate="visible" exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }} variants={resultsContainerVariants}><Suspense fallback={<ResultsSectionSkeleton />}><Box>{metrics.primary.length > 0 && (<ResultsDisplay title="Key Result" metrics={metrics.primary} titleIcon={<AccountBalanceWalletOutlinedIcon />} isLoading={isLoading} delay={0} />)}<Box sx={{ mt: { xs: 2.5, md: 3 } }}><ResultsDisplay title="Profit Estimates" metrics={metrics.estimated} titleIcon={<ShowChartOutlinedIcon />} isLoading={isLoading} delay={0.05} /></Box><Box sx={{ mt: { xs: 2.5, md: 3 } }}><ResultsDisplay title="Grid Profit Breakdown" metrics={metrics.breakdown} titleIcon={<FunctionsOutlinedIcon />} isLoading={isLoading} delay={0.1} /></Box><Box sx={{ mt: { xs: 2.5, md: 3 } }}><ResultsDisplay title="Additional Grid Metrics" metrics={metrics.more} titleIcon={<TuneOutlinedIcon />} isLoading={isLoading} delay={0.15} /></Box><m.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}><Box sx={{ mt: { xs: 3.5, md: 4.5 } }}><InfoSection title="Why Use Grid Trading?" icon={<HelpOutlineIcon />} defaultExpanded><Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..." />}><CryptoInsights message="Generates consistent profit in volatile, sideways markets." /></Suspense><Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..." />}><CryptoInsights message="Removes emotional decision-making by automating trades." /></Suspense><Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..." />}><CryptoInsights message="Works best for assets with predictable price swings." /></Suspense></InfoSection><InfoSection title="Grid Trading Insights" icon={<InfoOutlinedIcon />}><Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..." />}><CryptoInsights message="Grid trading places buy and sell orders at fixed price intervals to profit from market volatility." /></Suspense></InfoSection><InfoSection title="Potential Risks" icon={<WarningAmberOutlinedIcon />}><Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..." />}><CryptoInsights message="If the price breaks out of your set range, it can lead to losses." /></Suspense><Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..." />}><CryptoInsights message="Not suitable for all market conditions—strong trending markets can reduce effectiveness." /></Suspense><Suspense fallback={<LazyLoadingFallback height={30} message="Loading insight..." />}><CryptoInsights message="Always start with small amounts and manage risk carefully." /></Suspense></InfoSection></Box></m.div></Box></Suspense></m.div>) : (!isLoading && !calculationError && (<PlaceholderWelcome />))}</AnimatePresence>
    </Box>
  );
};

// --- Placeholder for welcome message (unchanged) ---
const PlaceholderWelcome: React.FC = () => {
  const theme = useMuiTheme();
  return (
    <Paper sx={{ p: { xs: 2.5, md: 4 }, textAlign: 'center', bgcolor: 'background.paper', color: 'text.primary', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, borderRadius: (theme) => theme.shape.borderRadius, }}>
      <m.img src="https://cdn-icons-png.flaticon.com/512/1995/1995526.png" alt="Get Started Icon" width={48} height={48} style={{ marginBottom: 16, filter: theme.palette.mode === 'dark' ? 'grayscale(30%) opacity(0.8)' : 'opacity(0.7)', }} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 150 }} />
      <Typography variant="h6" component="p" sx={{ fontWeight: 600, mb: 1 }}>Welcome to the Grid Trading Profit Estimator!</Typography>
      <Typography variant="body2" component="p" sx={{ color: 'text.secondary', maxWidth: 450, lineHeight: 1.6, }}>Enter your parameters or click "Optimize Values" for data-driven suggestions. Then hit Calculate to see your projected profits and trading metrics.</Typography>
    </Paper>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const animationControls = useAnimationControls();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    setIsInitialLoad(false);
    try {
      const savedMode = localStorage.getItem('calcchain-theme-mode') as 'light' | 'dark' | null;
      if (savedMode && savedMode !== mode) { // Only set if different and saved
          setMode(savedMode);
      }
    } catch (error) {
      console.error('Failed to load theme mode from localStorage:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mode dependency removed to prevent re-triggering setMode on mode change from toggle


  const themeModeProviderValue = useMemo(() => ({ // Renamed to avoid conflict with 'themeMode' name if any
    toggleThemeMode: () => {
      if (isInitialLoad) { // Should ideally not be callable if isInitialLoad is true
        console.warn("Theme toggle called during initial load phase.");
        return;
      }

      const newMode = mode === 'light' ? 'dark' : 'light';
      const newThemeInstance = createAppTheme(newMode);

      animationControls.start({
        backgroundColor: newThemeInstance.palette.background.default,
        clipPath: [
          "circle(0% at 50% 50%)",
          "circle(150% at 50% 50%)"
        ],
        transition: { duration: 0.6, ease: "easeInOut" },
      }).then(() => {
        setMode(newMode);
        try {
          localStorage.setItem('calcchain-theme-mode', newMode);
        } catch (error) {
          console.error('Failed to save theme mode to localStorage:', error);
        }
        animationControls.start({
          opacity: 0,
          transition: { duration: 0.4, delay: 0.05 },
          transitionEnd: {
            clipPath: "circle(0% at 50% 50%)",
            opacity: 1,
          }
        });
      });
    },
  }), [mode, animationControls, isInitialLoad, createAppTheme]); // Added createAppTheme to deps if it's not a stable import
                                                                  // If createAppTheme is stable (e.g. from import), it's not needed.
                                                                  // For this example, assuming it's stable and removing from deps.
                                                                  // Kept mode, animationControls, isInitialLoad

  return (
    // Use the correctly typed ThemeModeContext value here
    <ThemeModeContext.Provider value={themeModeProviderValue as ThemeModeContextType}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <LazyMotion features={domAnimation} strict>
            <AppContent />
            {!isInitialLoad && (
              <m.div
                animate={animationControls}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  backgroundColor: theme.palette.background.default, // Initialized with current theme's bg
                  clipPath: "circle(0% at 50% 50%)",
                  zIndex: 9999,
                  pointerEvents: 'none',
                }}
              />
            )}
          </LazyMotion>
        </ErrorBoundary>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export default App;