import React, { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Paper,
  useTheme,
  Tooltip,
  CircularProgress,
  Skeleton,
  alpha,
  IconButton,
  Collapse,
  Chip,
  useMediaQuery,
  Zoom,
  Fade,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { m, AnimatePresence, useSpring, useTransform } from "framer-motion";
import type { Metric } from "../types";

interface ResultsDisplayProps {
  title: string;
  metrics: Metric[];
  titleIcon?: React.ReactNode;
  isLoading?: boolean;
  delay?: number;
  variant?: 'primary' | 'secondary';
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// Enhanced animation variants with spring physics
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    rotateX: -5,
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
      delay,
      type: "spring",
      stiffness: 120,
      damping: 20,
    }
  }),
};

const metricItemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 15,
    rotateY: -10,
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    rotateY: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
      type: "spring",
      stiffness: 150,
      damping: 25,
    },
  }),
};

const shimmerVariants = {
  animate: {
    x: ["-100%", "100%"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

const pulseVariants = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Enhanced metric item component with interactive features
const MetricItem: React.FC<{
  metric: Metric;
  index: number;
  isKeyResult: boolean;
  theme: any;
  isLoading: boolean;
}> = React.memo(({ metric, index, isKeyResult, theme, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determine if value is positive/negative for styling
  const numericValue = useMemo(() => {
    if (typeof metric.value === 'number') return metric.value;
    if (typeof metric.value === 'string') {
      const cleaned = metric.value.replace(/[$,%]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }
    return null;
  }, [metric.value]);

  const isPositive = numericValue !== null && numericValue > 0;
  const isNegative = numericValue !== null && numericValue < 0;

  // Copy to clipboard functionality
  const handleCopy = useCallback(async () => {
    if (!metric.value) return;

    try {
      await navigator.clipboard.writeText(String(metric.value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  }, [metric.value]);

  // Toggle visibility for sensitive data
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const spring = useSpring(0);
  const scale = useTransform(spring, [0, 1], [1, 1.05]);

  return (
    <Grid
      item
      xs={12}
      sm={metric.isPrimary ? 12 : 6}
      md={metric.isPrimary ? 12 : (index < 3 ? 4 : 6)}
      key={`${metric.label}-${index}-${String(metric.value)}`}
    >
      <m.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={metricItemVariants}
        whileHover={{ y: -3, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
              <Paper
                elevation={0}
                sx={{
                  p: metric.isPrimary ? { xs: 2.5, md: 3 } : { xs: 2, md: 2.5 },
                  bgcolor: metric.isPrimary
                    ? alpha(theme.palette.primary.main, 0.02)
                    : theme.palette.background.paper,
                  borderRadius: theme.shape.borderRadius,
                  border: `1px solid ${
                    isKeyResult && metric.isPrimary
                      ? alpha(theme.palette.primary.light, theme.palette.mode === 'dark' ? 0.4 : 0.6)
                      : theme.palette.divider
                  }`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: metric.isPrimary ? 'auto' : '120px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  cursor: metric.isPrimary ? 'default' : 'pointer',
                  boxShadow: metric.isPrimary
                    ? theme.shadows[2]
                    : theme.shadows[1],
                  '&:hover': !metric.isPrimary ? {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                  } : {},
                  // Accessibility improvements
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: '2px',
                  },
                }}
                role={metric.isPrimary ? "banner" : "article"}
                aria-label={`${metric.label}: ${isVisible ? metric.value : 'Hidden'}`}
                tabIndex={metric.isPrimary ? -1 : 0}
              >
          {/* Shimmer effect for loading */}
          {isKeyResult && isLoading && metric.isPrimary && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                pointerEvents: 'none',
              }}
              component={m.div}
              variants={shimmerVariants}
              animate="animate"
            />
          )}

          {/* Loading state for primary metric */}
          {isKeyResult && isLoading && metric.isPrimary ? (
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Skeleton
                variant="text"
                width="60%"
                sx={{
                  fontSize: '0.75rem',
                  mb: 1,
                  bgcolor: alpha(theme.palette.common.white, 0.2)
                }}
              />
              <Skeleton
                variant="text"
                width="85%"
                sx={{
                  fontSize: { xs: '2.25rem', md: '3rem' },
                  bgcolor: alpha(theme.palette.common.white, 0.3)
                }}
              />
            </Box>
          ) : (
            <>
              {/* Metric header with enhanced interactivity */}
              <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: metric.isPrimary ? 1 : 0.5,
              }}>
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {metric.label}
                      </Typography>
                      {metric.isPrimary && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                          This is your primary result metric
                        </Typography>
                      )}
                    </Box>
                  }
                  placement="top-start"
                  arrow
                  enterDelay={500}
                  TransitionComponent={Zoom}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontSize: metric.isPrimary ? '0.8rem' : '0.75rem',
                      lineHeight: 1.3,
                      cursor: 'help',
                      color: isKeyResult
                        ? alpha(theme.palette.primary.contrastText, 0.85)
                        : 'text.secondary',
                      opacity: isKeyResult ? 0.9 : 1,
                      fontWeight: metric.isPrimary ? 600 : 500,
                      flex: 1,
                      pr: 1,
                    }}
                  >
                    {metric.label}
                  </Typography>
                </Tooltip>

                {/* Action buttons for non-primary metrics */}
                {!metric.isPrimary && metric.value && (
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                    <Tooltip title={copied ? "Copied!" : "Copy value"} arrow>
                      <IconButton
                        size="small"
                        onClick={handleCopy}
                        sx={{
                          opacity: 0.6,
                          color: 'text.secondary',
                          '&:hover': {
                            opacity: 1,
                            color: 'primary.main',
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          },
                          transition: 'all 0.2s ease',
                          width: 20,
                          height: 20,
                        }}
                        aria-label="Copy metric value"
                      >
                        <ContentCopyIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>

                    {metric.label.toLowerCase().includes('profit') && (
                      <Tooltip title={isVisible ? "Hide value" : "Show value"} arrow>
                        <IconButton
                          size="small"
                          onClick={toggleVisibility}
                          sx={{
                            opacity: 0.6,
                            color: 'text.secondary',
                            '&:hover': {
                              opacity: 1,
                              color: 'primary.main',
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                            transition: 'all 0.2s ease',
                            width: 20,
                            height: 20,
                          }}
                          aria-label={isVisible ? "Hide metric value" : "Show metric value"}
                        >
                          {isVisible ?
                            <VisibilityOffIcon sx={{ fontSize: 12 }} /> :
                            <VisibilityIcon sx={{ fontSize: 12 }} />
                          }
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>

              {/* Enhanced metric value with conditional styling */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant={metric.isPrimary ? "h3" : "h6"}
                  sx={{
                    fontWeight: metric.isPrimary ? 700 : 600,
                    fontSize: metric.isPrimary
                      ? { xs: '2rem', md: '2.75rem' }
                      : { xs: '1.1rem', md: '1.25rem' },
                    wordBreak: 'break-word',
                    lineHeight: metric.isPrimary ? 1.1 : 1.3,
                    color: metric.value !== undefined && metric.value !== null
                      ? (isKeyResult ? theme.palette.primary.contrastText : "text.primary")
                      : (isKeyResult ? alpha(theme.palette.common.white, 0.5) : "text.disabled"),
                    fontStyle: metric.value !== undefined && metric.value !== null ? "normal" : "italic",
                    transition: 'all 0.3s ease',
                    // Add color coding for financial values
                    ...(isPositive && !isKeyResult && {
                      color: theme.palette.success.main,
                    }),
                    ...(isNegative && !isKeyResult && {
                      color: theme.palette.error.main,
                    }),
                    filter: isVisible ? 'none' : 'blur(4px)',
                  }}
                >
                  {metric.value !== undefined && metric.value !== null ? String(metric.value) : "–"}
                </Typography>

                {/* Trend indicator for numeric values */}
                {!metric.isPrimary && numericValue !== null && isVisible && (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                    {isPositive && (
                      <Chip
                        icon={<TrendingUpIcon sx={{ fontSize: 12 }} />}
                        label="+"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                          '& .MuiChip-icon': {
                            color: theme.palette.success.main,
                          },
                        }}
                      />
                    )}
                    {isNegative && (
                      <Chip
                        icon={<TrendingDownIcon sx={{ fontSize: 12 }} />}
                        label="−"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.main,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                          '& .MuiChip-icon': {
                            color: theme.palette.error.main,
                          },
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>

              {/* Success feedback for copy action */}
              <AnimatePresence>
                {copied && (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: alpha(theme.palette.success.main, 0.9),
                      color: theme.palette.success.contrastText,
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    Copied!
                  </m.div>
                )}
              </AnimatePresence>
            </>
          )}
        </Box>
      </m.div>
    </Grid>
  );
});

// Main ResultsDisplay component with enhanced features
const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(({
  title,
  metrics,
  titleIcon,
  isLoading = false,
  delay = 0,
  variant = 'secondary',
  collapsible = false,
  defaultExpanded = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isKeyResult = title === "Key Result" || variant === 'primary';

  // Enhanced shadow and styling based on variant
  const keyResultBoxShadow = useMemo(() => {
    if (!isKeyResult) {
      return theme.palette.mode === 'light' ? theme.shadows[1] : "none";
    }

    return theme.palette.mode === 'dark'
      ? `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.6)}`
      : `0 6px 24px -6px ${alpha(theme.palette.primary.main, 0.4)}`;
  }, [isKeyResult, theme]);

  const cardBackground = useMemo(() => {
    if (isKeyResult) {
      return theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`
        : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
    }
    return theme.palette.background.paper;
  }, [isKeyResult, theme]);

  const borderColor = useMemo(() => {
    if (isKeyResult) {
      return alpha(theme.palette.primary.light, 0.6);
    }
    return theme.palette.divider;
  }, [isKeyResult, theme]);

  return (
    <m.div
      custom={delay}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card
        elevation={0}
        sx={{
          background: cardBackground,
          color: isKeyResult ? theme.palette.primary.contrastText : "text.primary",
          borderRadius: theme.shape.borderRadius,
          border: `1.5px solid ${borderColor}`,
          boxShadow: keyResultBoxShadow,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isKeyResult
              ? `0 12px 40px -8px ${alpha(theme.palette.primary.main, 0.7)}`
              : `0 8px 25px ${alpha(theme.palette.common.black, 0.12)}`,
          },
        }}
        role="region"
        aria-label={`${title} metrics`}
      >
        {/* Global loading overlay for key result */}
        {isKeyResult && isLoading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.common.black, 0.7),
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            borderRadius: 'inherit'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <m.div
                variants={pulseVariants}
                animate="animate"
              >
                <CircularProgress
                  color="primary"
                  size={48}
                  thickness={3}
                  sx={{
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                  }}
                />
              </m.div>
              <Typography
                variant="caption"
                sx={{
                  mt: 2,
                  color: theme.palette.primary.contrastText,
                  fontWeight: 500,
                  display: 'block'
                }}
              >
                Calculating...
              </Typography>
            </Box>
          </Box>
        )}

        <CardContent sx={{
          p: { xs: 2, md: 2.5 },
          opacity: (isKeyResult && isLoading) ? 0.3 : 1,
          transition: 'opacity 0.3s ease',
          position: 'relative',
        }}>
          {/* Enhanced header */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: isKeyResult ? 3 : 2.5,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {titleIcon && (
                <Box
                  component="span"
                  sx={{
                    mr: 1.5,
                    color: isKeyResult ? theme.palette.primary.contrastText : 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    p: 0.5,
                    borderRadius: '50%',
                    bgcolor: isKeyResult
                      ? alpha(theme.palette.primary.light, 0.2)
                      : alpha(theme.palette.primary.main, 0.1),
                    transition: 'all 0.3s ease',
                  }}
                  aria-hidden="true"
                >
                  {React.cloneElement(titleIcon as React.ReactElement, {
                    fontSize: "medium",
                  })}
                </Box>
              )}

              <Typography
                variant="h6"
                color={isKeyResult ? theme.palette.primary.contrastText : "primary.main"}
                sx={{
                  fontWeight: 600,
                  fontSize: isKeyResult ? '1.5rem' : '1.2rem',
                  lineHeight: 1.3,
                  flex: 1,
                }}
                component="h3"
              >
                {title}
              </Typography>
            </Box>

            {/* Collapsible toggle */}
            {collapsible && (
              <IconButton
                onClick={() => setExpanded(!expanded)}
                sx={{
                  color: isKeyResult ? theme.palette.primary.contrastText : 'text.secondary',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(
                      isKeyResult ? theme.palette.primary.light : theme.palette.action.hover,
                      0.1
                    ),
                  },
                }}
                aria-label={expanded ? "Collapse section" : "Expand section"}
                aria-expanded={expanded}
              >
                <ExpandMoreIcon />
              </IconButton>
            )}
          </Box>

          {/* Metrics grid with enhanced layout */}
          <Collapse in={!collapsible || expanded} timeout={300}>
            <Grid container spacing={{ xs: 2, md: 2.5 }}>
              {metrics.map((metricItem, i) => (
                <MetricItem
                  key={`${metricItem.label}-${i}`}
                  metric={metricItem}
                  index={i}
                  isKeyResult={isKeyResult}
                  theme={theme}
                  isLoading={isLoading}
                />
              ))}
            </Grid>
          </Collapse>

          {/* Empty state */}
          {metrics.length === 0 && (
            <Box sx={{
              textAlign: 'center',
              py: 4,
              color: isKeyResult ? alpha(theme.palette.primary.contrastText, 0.6) : 'text.secondary'
            }}>
              <InfoIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">
                No metrics available
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </m.div>
  );
});

export default ResultsDisplay;