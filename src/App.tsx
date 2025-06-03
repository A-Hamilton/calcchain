import React, {
  useState,
  useCallback,
  useMemo,
  Suspense,
  lazy,
  useContext,
  useEffect,
  memo,
} from "react";
import { ThemeProvider, useTheme as useMuiTheme, alpha } from "@mui/material/styles";
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
  useMediaQuery,
  Fade,
} from "@mui/material";
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
  Accessibility as AccessibilityIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

import logo from "./assets/calcchainlogodark.png";
import darkLogo from "./assets/calcchainlogo.png";

import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useAnimationControls,
} from "framer-motion";

import InputForm from "./components/InputForm";
import { ThemeModeContext, ThemeModeContextType } from "./ThemeModeContext";
import ErrorBoundary from "./ErrorBoundary";
import { createAppTheme } from "./theme";
import {
  GridResults,
  GridParameters,
  Metric,
  GridType as GridTypeEnum,
} from "./types";
import { calculateGridProfit } from "./utils/calculator";
import { debounce, performanceMonitor, cleanupMemory } from "./utils/performance";
import { registerServiceWorker, createUpdateNotification } from "./utils/serviceWorker";
import PerformanceMonitor from "./components/PerformanceMonitor";

const ResultsDisplay = lazy(() => 
  import("./components/ResultsDisplay").then(module => ({
    default: module.default
  }))
);

const CryptoInsights = lazy(() => 
  import("./components/CryptoInsights").then(module => ({
    default: module.default
  }))
);

// Preload critical components for better performance
const preloadCriticalComponents = () => {
  // Preload ResultsDisplay after a short delay
  setTimeout(() => {
    import("./components/ResultsDisplay");
  }, 1000);
  
  // Preload CryptoInsights after user interaction
  setTimeout(() => {
    import("./components/CryptoInsights");
  }, 2000);
};

// Constants for responsive design
const NAV_HORIZONTAL_PADDING = { xs: 1.5, sm: 2, md: 3 };
const CONTENT_MAX_WIDTH = 1320;

// Enhanced animation variants with improved easing
const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const resultsContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

const pulseVariant = {
  animate: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Enhanced TypeScript interfaces
interface InfoSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  severity?: "info" | "warning" | "success";
}

interface MainAppBarProps {
  onMenuOpen: (e: React.MouseEvent<HTMLElement>) => void;
  currentMode: "light" | "dark";
  toggleTheme: () => void;
  anchorEl: null | HTMLElement;
  handleMenuClose: () => void;
}

interface ResultsAreaProps {
  isLoading: boolean;
  results: GridResults | null;
  calculationError: string | null;
  onClearError: () => void;
  metrics: {
    primary: Metric[];
    estimated: Metric[];
    breakdown: Metric[];
    more: Metric[];
  };
}

// Enhanced InfoSection Component with accessibility improvements
const InfoSection = memo<InfoSectionProps>(({
  title,
  icon,
  children,
  defaultExpanded = false,
  severity = "info",
}) => {
  const theme = useMuiTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const severityColors = {
    info: theme.palette.info.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
  };

  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card
        sx={{
          mb: 2,
          overflow: "hidden",
          border: `1px solid ${alpha(severityColors[severity], 0.2)}`,
          "&:hover": {
            boxShadow: `0 4px 20px ${alpha(severityColors[severity], 0.15)}`,
            borderColor: alpha(severityColors[severity], 0.4),
          },
          transition: "all 0.3s ease-in-out",
        }}
      >
        <Accordion
          expanded={expanded}
          onChange={(_, isExpanded) => setExpanded(isExpanded)}
          disableGutters
          elevation={0}
          TransitionProps={{ unmountOnExit: true }}
          sx={{
            bgcolor: "transparent",
            "&:before": { display: "none" },
            "&.Mui-expanded": {
              margin: 0,
            },
          }}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  color: "text.secondary",
                  transition: "transform 0.3s ease, color 0.2s ease",
                  "&:hover": { color: "primary.main" },
                }}
              />
            }
            sx={{
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                margin: "12px 0",
                "&.Mui-expanded": {
                  margin: "12px 0",
                },
              },
              "&:hover": {
                bgcolor: alpha(theme.palette.action.hover, 0.5),
              },
              "&:focus-visible": {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: -2,
              },
              minHeight: { xs: 52, sm: 56 },
              px: { xs: 1.5, sm: 2 },
              transition: "background-color 0.2s ease",
              cursor: "pointer",
            }}
            aria-expanded={expanded}
            aria-controls={`${title.toLowerCase().replace(/\s+/g, "-")}-content`}
            id={`${title.toLowerCase().replace(/\s+/g, "-")}-header`}
          >
            {icon && (
              <Box
                sx={{
                  mr: 1.5,
                  display: "flex",
                  alignItems: "center",
                  color: severityColors[severity],
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.1)" },
                }}
                aria-hidden="true"
              >
                {React.cloneElement(icon as React.ReactElement, {
                  fontSize: "small",
                })}
              </Box>
            )}            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 500,
                fontSize: "1.05rem",
                color: "text.primary",
              }}
            >
              {title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              pt: 0,
              pb: { xs: 1.5, sm: 2 },
              px: { xs: 1.5, sm: 2 },
            }}
            id={`${title.toLowerCase().replace(/\s+/g, "-")}-content`}
            role="region"
            aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-header`}
          >
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {children}
            </m.div>
          </AccordionDetails>
        </Accordion>      </Card>
    </m.div>
  );
});

InfoSection.displayName = 'InfoSection';

// Memoized loading fallback component
const LazyLoadingFallback = memo<{
  height?: number | string;
  message?: string;
  showProgress?: boolean;
}>(({ height = 200, message = "Loading...", showProgress = true }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height,
      width: "100%",
      my: 2,
      p: 2,
      textAlign: "center",
      borderRadius: (theme) => theme.shape.borderRadius,
      border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
    }}
    role="status"
    aria-live="polite"
    aria-label={message}
  >
    {showProgress && (
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <CircularProgress sx={{ mb: 1 }} size={24} />
      </m.div>
    )}
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontWeight: 500 }}
    >
      {message}
    </Typography>
  </Box>
));

LazyLoadingFallback.displayName = 'LazyLoadingFallback';

// Enhanced skeleton with shimmer effect
const ResultsSectionSkeleton = memo(() => {
  const theme = useMuiTheme();
  return (
    <Box role="status" aria-label="Loading results">
      {[150, 200, 180].map((height, index) => (
        <m.div
          key={height}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height={height}
            sx={{
              mb: 2,
              borderRadius: theme.shape.borderRadius,
              "&::after": {
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
              },
            }}
          />
        </m.div>      ))}
    </Box>
  );
});

ResultsSectionSkeleton.displayName = 'ResultsSectionSkeleton';

// Enhanced main app bar with better accessibility
const MainAppBar = memo<MainAppBarProps>(({
  onMenuOpen,
  currentMode,
  toggleTheme,
  anchorEl,
  handleMenuClose,
}) => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const themeToggleButtonTitle =
    currentMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.shadows[2],
        py: 1,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backdropFilter: "blur(8px)",
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
      }}
    >
      <Box
        sx={{
          maxWidth: CONTENT_MAX_WIDTH,
          mx: "auto",
          width: "100%",
          px: NAV_HORIZONTAL_PADDING,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 52, sm: 56 },
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            px: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <m.a
              href="https://calcchain.com"
              aria-label="CalcChain Home"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ display: "flex", alignItems: "center" }}
            >
              <m.img
                src={currentMode === "dark" ? darkLogo : logo}
                alt="CalcChain Logo"
                style={{
                  display: "block",
                  height: isMobile ? "26px" : "30px",
                  width: "auto",
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "circOut" }}
              />
            </m.a>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title={themeToggleButtonTitle} arrow>
              <IconButton
                sx={{
                  mr: { xs: 0.5, sm: 1 },
                  color: "text.primary",
                  "&:focus-visible": {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                  },
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    transform: "scale(1.05)",
                  },
                }}
                onClick={toggleTheme}
                color="inherit"
                aria-label={themeToggleButtonTitle}
                component={m.button}
                whileTap={{ scale: 0.95 }}
              >
                {currentMode === "dark" ? (
                  <Brightness7Icon />
                ) : (
                  <Brightness4Icon />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title="Open navigation menu" arrow>
              <IconButton
                edge="end"
                color="inherit"
                aria-label="Open navigation menu"
                aria-expanded={Boolean(anchorEl)}
                aria-haspopup="true"
                onClick={onMenuOpen}
                size="medium"
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": {
                    bgcolor: "primary.dark",
                    transform: "scale(1.05)",
                  },
                  "&:focus-visible": {
                    outline: `2px solid ${theme.palette.primary.light}`,
                    outlineOffset: 2,
                  },
                  borderRadius: (theme) => theme.shape.borderRadius,
                  p: { xs: 0.6, sm: 0.75 },
                  transition: "all 0.2s ease",
                }}
                component={m.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              TransitionComponent={Fade}
              sx={{
                "& .MuiPaper-root": {
                  mt: 1,
                  minWidth: 280,
                },
              }}
            >
              <MenuItem
                onClick={handleMenuClose}
                selected
                sx={{
                  fontSize: "0.9rem",
                  "&:focus-visible": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
                role="menuitem"
              >
                <ListItemIcon>
                  <TimelineOutlinedIcon fontSize="small" color="primary" />
                </ListItemIcon>
                Grid Trading Profit Estimator
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={handleMenuClose}
                disabled
                sx={{ fontSize: "0.9rem" }}
                role="menuitem"
              >
                <ListItemIcon>
                  <ScheduleOutlinedIcon fontSize="small" />
                </ListItemIcon>
                DCA Simulator (Coming Soon)
              </MenuItem>
              <MenuItem
                onClick={handleMenuClose}
                disabled
                sx={{ fontSize: "0.9rem" }}
                role="menuitem"
              >
                <ListItemIcon>
                  <PieChartOutlineOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Portfolio Tracker (Coming Soon)
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>      </Box>
    </AppBar>
  );
});

MainAppBar.displayName = 'MainAppBar';

// Enhanced results area with better error handling and loading states
const ResultsArea = memo<ResultsAreaProps>(({
  isLoading,
  results,
  calculationError,
  onClearError,
  metrics,
}) => {
  const theme = useMuiTheme();

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <AnimatePresence>
        {isLoading && !results && (
          <m.div
            key="global-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              backgroundColor: alpha(theme.palette.background.default, 0.85),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.shape.borderRadius,
              backdropFilter: "blur(4px)",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <m.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ display: "inline-block" }}
              >
                <CircularProgress color="primary" size={40} />
              </m.div>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2, fontWeight: 500 }}
              >
                Calculating...
              </Typography>
            </Box>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {calculationError && !isLoading && (
          <m.div
            key="calc-error-alert"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: -20,
              scale: 0.95,
              transition: { duration: 0.2 },
            }}
            transition={{
              duration: 0.3,
              ease: "backOut",
              type: "spring",
              stiffness: 300,
            }}
          >
            <MuiAlert
              severity="error"
              sx={{
                mb: 2,
                width: "100%",
                "& .MuiAlert-message": {
                  fontSize: "0.9rem",
                  fontWeight: 500,
                },
              }}
              onClose={onClearError}
              role="alert"
              aria-live="assertive"
            >
              {calculationError}
            </MuiAlert>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {results ? (
          <m.div
            key="results-content"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            variants={resultsContainerVariants}
          >
            <Suspense fallback={<ResultsSectionSkeleton />}>
              <Box>
                {metrics.primary.length > 0 && (
                  <m.div variants={pulseVariant} animate="animate">
                    <ResultsDisplay
                      title="Key Result"
                      metrics={metrics.primary}
                      titleIcon={<AccountBalanceWalletOutlinedIcon />}
                      isLoading={isLoading}
                      delay={0}
                    />
                  </m.div>
                )}

                <Box sx={{ mt: { xs: 2.5, md: 3 } }}>
                  <ResultsDisplay
                    title="Profit Estimates"
                    metrics={metrics.estimated}
                    titleIcon={<ShowChartOutlinedIcon />}
                    isLoading={isLoading}
                    delay={0.05}
                  />
                </Box>

                <Box sx={{ mt: { xs: 2.5, md: 3 } }}>
                  <ResultsDisplay
                    title="Grid Profit Breakdown"
                    metrics={metrics.breakdown}
                    titleIcon={<FunctionsOutlinedIcon />}
                    isLoading={isLoading}
                    delay={0.1}
                  />
                </Box>

                <Box sx={{ mt: { xs: 2.5, md: 3 } }}>
                  <ResultsDisplay
                    title="Additional Grid Metrics"
                    metrics={metrics.more}
                    titleIcon={<TuneOutlinedIcon />}
                    isLoading={isLoading}
                    delay={0.15}
                  />
                </Box>

                <m.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.4,
                      },
                    },
                  }}
                >
                  <Box sx={{ mt: { xs: 3.5, md: 4.5 } }}>
                    <InfoSection
                      title="Why Use Grid Trading?"
                      icon={<HelpOutlineIcon />}
                      defaultExpanded
                      severity="success"
                    >
                      <Suspense
                        fallback={
                          <LazyLoadingFallback
                            height={30}
                            message="Loading insight..."
                          />
                        }
                      >
                        <CryptoInsights message="Generates consistent profit in volatile, sideways markets." />
                      </Suspense>
                      <Suspense
                        fallback={
                          <LazyLoadingFallback
                            height={30}
                            message="Loading insight..."
                          />
                        }
                      >
                        <CryptoInsights message="Removes emotional decision-making by automating trades." />
                      </Suspense>
                      <Suspense
                        fallback={
                          <LazyLoadingFallback
                            height={30}
                            message="Loading insight..."
                          />
                        }
                      >
                        <CryptoInsights message="Works best for assets with predictable price swings." />
                      </Suspense>
                    </InfoSection>

                    <InfoSection
                      title="Grid Trading Insights"
                      icon={<InfoOutlinedIcon />}
                      severity="info"
                    >
                      <Suspense
                        fallback={
                          <LazyLoadingFallback
                            height={30}
                            message="Loading insight..."
                          />
                        }
                      >
                        <CryptoInsights message="Grid trading places buy and sell orders at fixed price intervals to profit from market volatility." />
                      </Suspense>
                    </InfoSection>

                    <InfoSection
                      title="Potential Risks"
                      icon={<WarningAmberOutlinedIcon />}
                      severity="warning"
                    >
                      <Suspense
                        fallback={
                          <LazyLoadingFallback
                            height={30}
                            message="Loading insight..."
                          />
                        }
                      >
                        <CryptoInsights message="If the price breaks out of your set range, it can lead to losses." />
                      </Suspense>
                      <Suspense
                        fallback={
                          <LazyLoadingFallback
                            height={30}
                            message="Loading insight..."
                          />
                        }
                      >
                        <CryptoInsights message="Not suitable for all market conditions—strong trending markets can reduce effectiveness." />
                      </Suspense>
                      <Suspense
                        fallback={
                          <LazyLoadingFallback
                            height={30}
                            message="Loading insight..."
                          />
                        }
                      >
                        <CryptoInsights message="Always start with small amounts and manage risk carefully." />
                      </Suspense>
                    </InfoSection>
                  </Box>
                </m.div>
              </Box>
            </Suspense>
          </m.div>
        ) : (
          !isLoading && !calculationError && <PlaceholderWelcome />
        )}      </AnimatePresence>
    </Box>
  );
});

ResultsArea.displayName = 'ResultsArea';

// Enhanced placeholder with better onboarding
const PlaceholderWelcome = memo(() => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper
      sx={{
        p: { xs: 2.5, md: 4 },
        textAlign: "center",
        bgcolor: "background.paper",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
        borderRadius: (theme) => theme.shape.borderRadius,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      }}
      role="region"
      aria-label="Welcome message"
    >
      <m.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{
          delay: 0.1,
          duration: 0.6,
          type: "spring",
          stiffness: 150,
          damping: 15,
        }}
      >
        <Box
          component="div"
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
            mx: "auto",
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <TuneOutlinedIcon
            sx={{
              fontSize: 32,
              color: "primary.main",
            }}
          />
        </Box>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h2"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
          }}
        >
          Welcome to Grid Trading!
        </Typography>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Typography
          variant="body1"
          component="p"
          sx={{
            color: "text.secondary",
            maxWidth: 450,
            lineHeight: 1.6,
            mb: 3,
            fontSize: { xs: "0.95rem", md: "1rem" },
          }}
        >
          Enter your parameters or click <strong>"Optimize Values"</strong> for
          data-driven suggestions. Then hit <strong>Calculate</strong> to see
          your projected profits and trading metrics.
        </Typography>
      </m.div>

      <m.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessibilityIcon sx={{ fontSize: 16, color: "success.main" }} />
            <Typography variant="caption" color="text.secondary">
              Accessible
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <SpeedIcon sx={{ fontSize: 16, color: "info.main" }} />
            <Typography variant="caption" color="text.secondary">
              Fast & Responsive
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TuneOutlinedIcon sx={{ fontSize: 16, color: "primary.main" }} />
            <Typography variant="caption" color="text.secondary">
              AI-Optimized
            </Typography>
          </Box>
        </Box>      </m.div>
    </Paper>
  );
});

PlaceholderWelcome.displayName = 'PlaceholderWelcome';

// Enhanced main content component
const AppContent = memo(() => {
  const themeFromProvider = useMuiTheme();
  const currentMode = themeFromProvider.palette.mode;
  const themeContext = useContext(ThemeModeContext);

  const [results, setResults] = useState<GridResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    // Performance monitoring
    performanceMonitor.startRender('AppContent');
    
    return () => {
      // Cancel any pending calculations
      setIsLoading(false);
      setCalculationError(null);
      
      // Performance monitoring cleanup
      performanceMonitor.endRender('AppContent');
      
      // Memory cleanup
      cleanupMemory();
    };
  }, []);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget), []);
  
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);
  
  const clearCalculationErrorFromApp = useCallback(
    () => setCalculationError(null),
    [],
  );

  // Memoized styles for better performance
  const titleGradientStyle = useMemo(() => ({
    fontWeight: 700,
    mb: { xs: 2.5, md: 3.5 },
    color: "text.primary",
    textAlign: { xs: "center", sm: "left" } as const,
    background: `linear-gradient(45deg, ${themeFromProvider.palette.primary.main}, ${themeFromProvider.palette.secondary.main})`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }), [themeFromProvider.palette.primary.main, themeFromProvider.palette.secondary.main]);

  const containerStyle = useMemo(() => ({
    maxWidth: CONTENT_MAX_WIDTH,
    mx: "auto",
    width: "100%",
    px: NAV_HORIZONTAL_PADDING,
  }), []);

  const mainContainerStyle = useMemo(() => ({
    maxWidth: CONTENT_MAX_WIDTH,
    mx: "auto",
    px: NAV_HORIZONTAL_PADDING,
    pt: { xs: 2.5, md: 3.5 },
    pb: 4,
  }), []);

  // Enhanced calculation handler with better error handling and AbortController for cleanup  // Enhanced calculation handler with better error handling and AbortController for cleanup
  const handleCalculateInternal = useCallback(async (params: GridParameters) => {
    const abortController = new AbortController();
    
    setIsLoading(true);
    setCalculationError(null);
    setResults(null);

    try {
      const res = await calculateGridProfit(params);
      
      // Check if component is still mounted
      if (!abortController.signal.aborted) {
        setResults(res);
      }
    } catch (err: unknown) {
      if (!abortController.signal.aborted) {
        let friendlyMessage =
          "Calculation failed. Please check parameters and try again.";
        let specificErrorMessage: string | undefined = undefined;

        if (err instanceof Error) {
          specificErrorMessage = err.message;
        } else if (typeof err === "string") {
          specificErrorMessage = err;
        }

        const lowerCaseErrorMessage = specificErrorMessage?.toLowerCase() || "";
        if (params.symbol && lowerCaseErrorMessage.includes("symbol")) {
          friendlyMessage = `No market data for symbol '${params.symbol.trim()}'. It might be delisted or temporarily unavailable.`;
        } else if (specificErrorMessage) {
          friendlyMessage = `Calculation error: ${specificErrorMessage}`;
        }

        setCalculationError(friendlyMessage);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }

    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, []);

  // Debounced calculation handler to prevent excessive API calls
  const handleCalculate = useMemo(
    () => debounce(handleCalculateInternal, 300),
    [handleCalculateInternal]
  );

  // Enhanced metrics calculation with better formatting
  const metrics = useMemo(() => {
    if (!results)
      return { primary: [], estimated: [], breakdown: [], more: [] };

    const formatCurrency = (value: number, decimals = 2) =>
      `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

    const formatNumber = (value: number, decimals = 2) =>
      value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    const primaryMetric: Metric | null =
      results.overallTotalValue !== undefined &&
      results.overallTotalValue !== null
        ? {
            label:
              "Total Estimated Value (Principal + Grid P/L + Buy/Sell P/L)",
            value: formatCurrency(results.overallTotalValue),
            isPrimary: true,
          }
        : null;

    const estimated: Metric[] = [
      ...(results.principalReturnFromEntryExit !== undefined &&
      results.principalReturnFromEntryExit !== null
        ? [
            {
              label: "Net P/L from Buy/Sell (Hypothetical)",
              value: formatCurrency(results.principalReturnFromEntryExit),
            },
          ]
        : []),
      {
        label: "Estimated Daily Net Profit (from Grids)",
        value: formatCurrency(results.estimatedDailyProfit),
      },
      {
        label: "Est. Trades per Day (Round Trips)",
        value: formatNumber(results.estimatedTradesPerDay, 1),
      },
    ].filter(Boolean) as Metric[];

    const breakdown: Metric[] = [
      {
        label: "Total Net Profit (from Grids)",
        value: formatCurrency(results.totalNetProfit),
      },
      {
        label: "Total Grid Profit (Gross, before fees)",
        value: formatCurrency(results.totalGridProfit),
      },
      {
        label: "Est. Daily Grid Profit (Gross, before fees)",
        value: formatCurrency(results.estimatedDailyGridProfit),
      },
    ];

    let gridStepLabel = "Grid Step";
    let gridStepValueDisplay = "";

    if (results.gridType === GridTypeEnum.Geometric) {
      gridStepLabel = "Grid Step (Ratio)";
      const ratio = results.gridSpacing;
      const percentage = (ratio - 1) * 100;
      gridStepValueDisplay = `${ratio?.toFixed(5)} (${percentage.toFixed(2)}%)`;
    } else {
      gridStepLabel = "Grid Step (Value)";
      gridStepValueDisplay = formatCurrency(results.gridSpacing, 6);
    }

    const more: Metric[] = [
      {
        label: "Investment per Grid Line",
        value: formatCurrency(results.investmentPerGrid),
      },
      {
        label: gridStepLabel,
        value: gridStepValueDisplay,
      },
      {
        label: "Net Profit per Grid Tx (Round Trip)",
        value: formatCurrency(results.netProfitPerGridTransaction, 4),
      },
      {
        label: "Average ATR per Minute",
        value: formatNumber(results.atrPerMin, 8),
      },
    ];

    return {
      primary: primaryMetric ? [primaryMetric] : [],
      estimated,
      breakdown,
      more,
    };
  }, [results]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: "100vh",
        backgroundColor: themeFromProvider.palette.background.default,
      }}
    >
      <MainAppBar
        onMenuOpen={handleMenuOpen}
        currentMode={currentMode}
        toggleTheme={themeContext.toggleThemeMode}
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
      />        <Container
          maxWidth={false}
          sx={mainContainerStyle}
        >
          <m.div initial="hidden" animate="visible" variants={sectionVariants}>
            <Typography
              variant="h4"
              component="h1"
              sx={titleGradientStyle}
            >
            Grid Trading Profit Estimator
          </Typography>
        </m.div>

        <m.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2 }}
        >
          <Paper
            component="a"
            href="https://support.pionex.com/hc/en-us/articles/45085712163225-Grid-Trading-Bot#h_01JQDJY326ASK9EM41WQ3ZQDX5/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              p: { xs: 2.5, sm: 3 },
              mb: { xs: 3, md: 4 },
              bgcolor: alpha(themeFromProvider.palette.primary.main, 0.95),
              color: themeFromProvider.palette.primary.contrastText,
              borderRadius: themeFromProvider.shape.borderRadius,
              border: `2px solid ${alpha(themeFromProvider.palette.primary.light, 0.3)}`,
              boxShadow: `0 4px 20px ${alpha(themeFromProvider.palette.primary.main, 0.25)}`,
              textDecoration: "none",
              display: "block",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: `0 8px 32px ${alpha(themeFromProvider.palette.primary.main, 0.4)}`,
                borderColor: alpha(
                  themeFromProvider.palette.primary.light,
                  0.6,
                ),
                "&::before": {
                  opacity: 1,
                },
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(45deg, ${alpha(themeFromProvider.palette.primary.light, 0.1)}, transparent)`,
                opacity: 0,
                transition: "opacity 0.3s ease",
                pointerEvents: "none",
              },
              "&:focus-visible": {
                outline: `3px solid ${alpha(themeFromProvider.palette.primary.light, 0.8)}`,
                outlineOffset: "2px",
              },
            }}            elevation={0}
            aria-label="Learn about Grid Trading - opens in new tab"
          >
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: alpha(
                        themeFromProvider.palette.primary.light,
                        0.2,
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: "1.2rem" }}>📈</Typography>
                  </Box>
                  <Typography
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      color: "inherit",
                    }}
                  >
                    What is Grid Trading?
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: alpha(
                      themeFromProvider.palette.primary.light,
                      0.2,
                    ),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.3s ease",
                  }}
                  className="learn-more-icon"
                >
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                    →
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.6,
                  color: "inherit",
                  opacity: 0.95,
                }}
              >
                Grid trading automatically places buy and sell orders at preset
                intervals within a price range to profit from volatility.
                <strong style={{ fontWeight: 600, marginLeft: "8px" }}>
                  Click to learn more about this strategy →
                </strong>
              </Typography>
            </Box>
          </Paper>
        </m.div>

        <Grid container spacing={{ xs: 2.5, md: 4 }}>
          <Grid item xs={12} md={5}>
            <m.div
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              transition={{ delay: 0.2 }}
            >
              <InputForm
                onCalculate={handleCalculate}
                calculationErrorFromApp={calculationError}
                onClearCalculationErrorFromApp={clearCalculationErrorFromApp}
              />
            </m.div>
          </Grid>

          <Grid
            item
            xs={12}
            md={7}
            sx={{ height: "100%", position: "relative" }}
          >
            <ResultsArea
              isLoading={isLoading}
              results={results}
              calculationError={calculationError}
              onClearError={clearCalculationErrorFromApp}
              metrics={metrics}
            />
          </Grid>
        </Grid>      </Container>
    </Box>
  );
});

AppContent.displayName = 'AppContent';

// Enhanced animated section wrapper
const AnimatedSection: React.FC<{
  children: React.ReactNode;
  transition?: object;
  className?: string;
}> = ({ children, transition, className }) => (
  <m.div
    initial="hidden"
    animate="visible"
    variants={sectionVariants}
    transition={transition || {}}
    className={className}
  >
    {children}
  </m.div>
);

// Main App component with enhanced theme handling
const App: React.FC = () => {
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const animationControls = useAnimationControls();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Enhanced theme persistence with error handling
  useEffect(() => {
    setIsInitialLoad(false);
    try {
      const savedMode = localStorage.getItem("calcchain-theme-mode") as
        | "light"
        | "dark"
        | null;
      if (savedMode && savedMode !== mode) {
        setMode(savedMode);
      }
    } catch (error) {
      console.warn("Failed to load theme preference from localStorage:", error);
    }
  }, []);  // Preload critical components for better performance
  useEffect(() => {
    if (!isInitialLoad) {
      preloadCriticalComponents();
      
      // Log performance metrics in development
      if (import.meta.env.DEV) {
        setTimeout(() => {
          performanceMonitor.logMetrics();
        }, 3000);
      }
    }
  }, [isInitialLoad]);

  // Register service worker when app loads
  useEffect(() => {
    // Register service worker with handlers for updates
    registerServiceWorker({
      onUpdate: (registration) => {
        // Create notification UI when update is available
        const notification = createUpdateNotification(() => {
          // Force page reload when user clicks update button
          window.location.reload();
        });
      },
      onSuccess: (registration) => {
        console.log('Content cached successfully for offline use');
      },
      onError: (error) => {
        console.error('Service worker registration failed:', error);
      }
    });

    // Cleanup function to avoid memory leaks
    return () => {
      cleanupMemory();
    };
  }, []);

  // Register service worker when app loads
  useEffect(() => {
    // Register service worker with handlers for updates
    registerServiceWorker({
      onUpdate: (registration) => {
        setShowUpdateNotification(true);
        
        // Create notification UI when update is available
        const notification = createUpdateNotification(() => {
          // Force page reload when user clicks update button
          window.location.reload();
        });
      },
      onSuccess: (registration) => {
        console.log('Content cached successfully for offline use');
      },
      onError: (error) => {
        console.error('Service worker registration failed:', error);
      }
    });

    // Cleanup function to avoid memory leaks
    return () => {
      cleanupMemory();
    };
  }, []);

  // Enhanced theme toggle with smooth animation
  const themeModeProviderValue = useMemo(
    () => ({
      toggleThemeMode: () => {
        if (isInitialLoad) return;

        const newMode = mode === "light" ? "dark" : "light";
        const newThemeInstance = createAppTheme(newMode);

        animationControls
          .start({
            backgroundColor: newThemeInstance.palette.background.default,
            clipPath: ["circle(0% at 50% 50%)", "circle(150% at 50% 50%)"],
            transition: { duration: 0.6, ease: "easeInOut" },
          })
          .then(() => {
            setMode(newMode);
            try {
              localStorage.setItem("calcchain-theme-mode", newMode);
            } catch (error) {
              console.warn(
                "Failed to save theme preference to localStorage:",
                error,
              );
            }
            animationControls.start({
              opacity: 0,
              transition: { duration: 0.4, delay: 0.05 },
              transitionEnd: {
                clipPath: "circle(0% at 50% 50%)",
                opacity: 1,
              },
            });
          });
      },
    }),
    [mode, animationControls, isInitialLoad],
  );

  return (
    <ThemeModeContext.Provider
      value={themeModeProviderValue as ThemeModeContextType}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>          <LazyMotion features={domAnimation} strict>
            <AppContent />
            {/* Add Performance Monitor for production environments only */}
            {import.meta.env.PROD && <PerformanceMonitor />}
            {!isInitialLoad && (
              <m.div
                animate={animationControls}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  backgroundColor: theme.palette.background.default,
                  clipPath: "circle(0% at 50% 50%)",
                  zIndex: 9999,
                  pointerEvents: "none",
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
