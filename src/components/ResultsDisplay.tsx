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
  Stack,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Share as ShareIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
} from "@mui/icons-material";
import { m, AnimatePresence, useSpring, useTransform } from "framer-motion";
import type { Metric } from "../types";

interface ResultsDisplayProps {
  title: string;
  metrics: Metric[];
  titleIcon?: React.ReactNode;
  isLoading?: boolean;
  delay?: number;
  variant?: "primary" | "secondary";
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
    },
  }),
};

const metricItemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 15,
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
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

// Enhanced metric item component with card-based layout
const MetricItem: React.FC<{
  metric: Metric;
  index: number;
  isKeyResult: boolean;
  theme: any;
  isLoading: boolean;
}> = React.memo(({ metric, index, isKeyResult, theme, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Determine if value is positive/negative for styling
  const numericValue = useMemo(() => {
    if (typeof metric.value === "number") return metric.value;
    if (typeof metric.value === "string") {
      const cleaned = metric.value.replace(/[$,%]/g, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }
    return null;
  }, [metric.value]);

  const isPositive = numericValue !== null && numericValue > 0;
  const isNegative = numericValue !== null && numericValue < 0;

  // Action handlers with better feedback
  const handleCopy = useCallback(async () => {
    if (!metric.value) return;

    try {
      await navigator.clipboard.writeText(String(metric.value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy to clipboard:", err);
    }
  }, [metric.value]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: metric.label,
          text: `${metric.label}: ${metric.value}`,
          url: window.location.href,
        });
      } else {
        await handleCopy();
      }
    } catch (err) {
      console.warn("Failed to share metric:", err);
    }
  }, [metric.label, metric.value, handleCopy]);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const toggleBookmark = useCallback(() => {
    setBookmarked((prev) => !prev);
    // Store in localStorage for persistence
    try {
      const bookmarks = JSON.parse(
        localStorage.getItem("metric-bookmarks") || "[]",
      );
      if (!bookmarked) {
        bookmarks.push({
          label: metric.label,
          value: metric.value,
          timestamp: Date.now(),
        });
      } else {
        const filtered = bookmarks.filter(
          (item: any) => item.label !== metric.label,
        );
        localStorage.setItem("metric-bookmarks", JSON.stringify(filtered));
      }
      localStorage.setItem("metric-bookmarks", JSON.stringify(bookmarks));
    } catch (err) {
      console.warn("Failed to save bookmark:", err);
    }
  }, [metric.label, metric.value, bookmarked]);

  return (
    <Grid
      item
      xs={12}
      sm={metric.isPrimary ? 12 : 6}
      md={metric.isPrimary ? 12 : index < 2 ? 6 : 4}
      key={`${metric.label}-${index}-${String(metric.value)}`}
    >
      <m.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={metricItemVariants}
        whileHover={{ y: -2, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Paper
          elevation={metric.isPrimary ? 3 : 1}
          sx={{
            p: metric.isPrimary ? { xs: 3, md: 3.5 } : { xs: 2, md: 2.5 },
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: metric.isPrimary ? 140 : 120,
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
            cursor: metric.isPrimary ? "default" : "pointer",
            bgcolor: metric.isPrimary
              ? isKeyResult
                ? alpha(theme.palette.primary.main, 0.03)
                : alpha(theme.palette.background.paper, 1)
              : theme.palette.background.paper,
            border: `1px solid ${
              metric.isPrimary && isKeyResult
                ? alpha(theme.palette.primary.main, 0.2)
                : theme.palette.divider
            }`,
            "&:hover": !metric.isPrimary
              ? {
                  transform: "translateY(-3px)",
                  boxShadow: theme.shadows[4],
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                }
              : {},
            "&:focus-visible": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: "2px",
            },
          }}
          role={metric.isPrimary ? "banner" : "article"}
          aria-label={`${metric.label}: ${isVisible ? metric.value : "Hidden"}`}
          tabIndex={metric.isPrimary ? -1 : 0}
        >
          {/* Shimmer effect for loading */}
          {isKeyResult && isLoading && metric.isPrimary && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                pointerEvents: "none",
              }}
              component={m.div}
              variants={shimmerVariants}
              animate="animate"
            />
          )}

          {/* Loading state for primary metric */}
          {isKeyResult && isLoading && metric.isPrimary ? (
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Skeleton
                variant="text"
                width="70%"
                sx={{
                  fontSize: "0.875rem",
                  mb: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              />
              <Skeleton
                variant="text"
                width="90%"
                sx={{
                  fontSize: { xs: "2.5rem", md: "3.25rem" },
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                }}
              />
            </Box>
          ) : (
            <Stack spacing={metric.isPrimary ? 2 : 1.5} sx={{ flex: 1 }}>
              {/* Metric header with enhanced layout */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  minHeight: 20,
                }}
              >
                <Box sx={{ flex: 1, pr: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontSize: metric.isPrimary ? "0.875rem" : "0.8rem",
                      lineHeight: 1.4,
                      color: isKeyResult
                        ? alpha(theme.palette.primary.contrastText, 0.8)
                        : "text.secondary",
                      fontWeight: metric.isPrimary ? 600 : 500,
                      // Shortened labels for better scannability
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {/* Shortened label logic */}
                    {metric.label ===
                    "Total Estimated Value (Principal + Grid P/L + Buy/Sell P/L)"
                      ? "Total Estimated Value"
                      : metric.label ===
                          "Estimated Daily Net Profit (from Grids)"
                        ? "Daily Net Profit"
                        : metric.label === "Est. Trades per Day (Round Trips)"
                          ? "Daily Trades"
                          : metric.label === "Total Net Profit (from Grids)"
                            ? "Total Net Profit"
                            : metric.label ===
                                "Total Grid Profit (Gross, before fees)"
                              ? "Total Gross Profit"
                              : metric.label ===
                                  "Est. Daily Grid Profit (Gross, before fees)"
                                ? "Daily Gross Profit"
                                : metric.label === "Investment per Grid Line"
                                  ? "Per Grid Investment"
                                  : metric.label ===
                                      "Net Profit per Grid Tx (Round Trip)"
                                    ? "Profit per Trade"
                                    : metric.label === "Average ATR per Minute"
                                      ? "ATR/Min"
                                      : metric.label}
                  </Typography>

                  {/* Full label tooltip for shortened labels */}
                  {(metric.label.length > 25 || metric.label.includes("(")) && (
                    <Tooltip
                      title={metric.label}
                      placement="top-start"
                      arrow
                      enterDelay={500}
                      TransitionComponent={Zoom}
                    >
                      <IconButton
                        size="small"
                        sx={{
                          p: 0.25,
                          mt: 0.25,
                          color: "text.disabled",
                          "&:hover": {
                            color: "primary.main",
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                        aria-label="Show full label"
                      >
                        <InfoIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {/* Enhanced action buttons with better icons and larger click targets */}
                {!metric.isPrimary && metric.value && (
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={copied ? "Copied!" : "Copy value"} arrow>
                      <IconButton
                        size="small"
                        onClick={handleCopy}
                        sx={{
                          width: 28,
                          height: 28,
                          color: "text.secondary",
                          "&:hover": {
                            color: "primary.main",
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            transform: "scale(1.1)",
                          },
                          transition: "all 0.2s ease",
                        }}
                        aria-label="Copy metric value"
                      >
                        <ContentCopyIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>

                    {!isMobile && (
                      <Tooltip title="Share metric" arrow>
                        <IconButton
                          size="small"
                          onClick={handleShare}
                          sx={{
                            width: 28,
                            height: 28,
                            color: "text.secondary",
                            "&:hover": {
                              color: "info.main",
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s ease",
                          }}
                          aria-label="Share metric"
                        >
                          <ShareIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}

                    {metric.label.toLowerCase().includes("profit") && (
                      <Tooltip
                        title={isVisible ? "Hide value" : "Show value"}
                        arrow
                      >
                        <IconButton
                          size="small"
                          onClick={toggleVisibility}
                          sx={{
                            width: 28,
                            height: 28,
                            color: "text.secondary",
                            "&:hover": {
                              color: "warning.main",
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s ease",
                          }}
                          aria-label={
                            isVisible
                              ? "Hide metric value"
                              : "Show metric value"
                          }
                        >
                          {isVisible ? (
                            <VisibilityOffIcon sx={{ fontSize: 14 }} />
                          ) : (
                            <VisibilityIcon sx={{ fontSize: 14 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                )}
              </Box>

              {/* Enhanced metric value with bolder styling */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}
              >
                <Typography
                  variant={metric.isPrimary ? "h3" : "h6"}
                  sx={{
                    // BOLDER VALUES - Key improvement for scannability
                    fontWeight: metric.isPrimary ? 800 : 700, // Increased from 700/600
                    fontSize: metric.isPrimary
                      ? { xs: "2.25rem", md: "3rem" }
                      : { xs: "1.25rem", md: "1.4rem" }, // Slightly larger
                    wordBreak: "break-word",
                    lineHeight: metric.isPrimary ? 1.1 : 1.2,
                    color:
                      metric.value !== undefined && metric.value !== null
                        ? isKeyResult
                          ? theme.palette.primary.contrastText
                          : isPositive && !metric.isPrimary
                            ? theme.palette.success.main
                            : isNegative && !metric.isPrimary
                              ? theme.palette.error.main
                              : "text.primary"
                        : isKeyResult
                          ? alpha(theme.palette.common.white, 0.5)
                          : "text.disabled",
                    fontStyle:
                      metric.value !== undefined && metric.value !== null
                        ? "normal"
                        : "italic",
                    transition: "all 0.3s ease",
                    filter: isVisible ? "none" : "blur(4px)",
                    // Enhanced contrast for better readability
                    textShadow: metric.isPrimary
                      ? `0 1px 2px ${alpha(theme.palette.common.black, 0.1)}`
                      : "none",
                  }}
                >
                  {metric.value !== undefined && metric.value !== null
                    ? String(metric.value)
                    : "–"}
                </Typography>

                {/* Enhanced trend indicator */}
                {!metric.isPrimary && numericValue !== null && isVisible && (
                  <Box sx={{ display: "flex", alignItems: "center", ml: 0.5 }}>
                    {isPositive && (
                      <Chip
                        icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                        label="Positive"
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          bgcolor: alpha(theme.palette.success.main, 0.15),
                          color: theme.palette.success.dark,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                          "& .MuiChip-icon": {
                            color: theme.palette.success.main,
                          },
                          "& .MuiChip-label": {
                            px: 1,
                          },
                        }}
                      />
                    )}
                    {isNegative && (
                      <Chip
                        icon={<TrendingDownIcon sx={{ fontSize: 14 }} />}
                        label="Negative"
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          bgcolor: alpha(theme.palette.error.main, 0.15),
                          color: theme.palette.error.dark,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                          "& .MuiChip-icon": {
                            color: theme.palette.error.main,
                          },
                          "& .MuiChip-label": {
                            px: 1,
                          },
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>

              {/* Units and additional context for better clarity */}
              {metric.value && !metric.isPrimary && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.disabled",
                      fontSize: "0.7rem",
                      fontWeight: 500,
                    }}
                  >
                    {metric.label.includes("$") ||
                    (typeof metric.value === "string" &&
                      metric.value.includes("$"))
                      ? "USD"
                      : metric.label.includes("%") ||
                          (typeof metric.value === "string" &&
                            metric.value.includes("%"))
                        ? "Percentage"
                        : metric.label.includes("Trades") ||
                            metric.label.includes("Count")
                          ? "Count"
                          : metric.label.includes("ATR")
                            ? "Volatility"
                            : ""}
                  </Typography>

                  {/* Bookmark for important metrics */}
                  {metric.label.toLowerCase().includes("profit") && (
                    <IconButton
                      size="small"
                      onClick={toggleBookmark}
                      sx={{
                        width: 20,
                        height: 20,
                        color: bookmarked ? "warning.main" : "text.disabled",
                        "&:hover": {
                          color: "warning.main",
                          transform: "scale(1.1)",
                        },
                        transition: "all 0.2s ease",
                      }}
                      aria-label={
                        bookmarked ? "Remove bookmark" : "Bookmark metric"
                      }
                    >
                      {bookmarked ? (
                        <BookmarkIcon sx={{ fontSize: 12 }} />
                      ) : (
                        <BookmarkBorderIcon sx={{ fontSize: 12 }} />
                      )}
                    </IconButton>
                  )}
                </Box>
              )}
            </Stack>
          )}

          {/* Success feedback overlays with better positioning */}
          <AnimatePresence>
            {copied && (
              <m.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: alpha(theme.palette.success.main, 0.95),
                  color: theme.palette.success.contrastText,
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  pointerEvents: "none",
                  zIndex: 10,
                  backdropFilter: "blur(4px)",
                  boxShadow: theme.shadows[3],
                }}
              >
                ✓ Copied!
              </m.div>
            )}
          </AnimatePresence>
        </Paper>
      </m.div>
    </Grid>
  );
});

// Main ResultsDisplay component with enhanced features
const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(
  ({
    title,
    metrics,
    titleIcon,
    isLoading = false,
    delay = 0,
    variant = "secondary",
    collapsible = false,
    defaultExpanded = true,
  }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [expanded, setExpanded] = useState(defaultExpanded);
    const isKeyResult = title === "Key Result" || variant === "primary";

    // Enhanced shadow and styling based on variant
    const keyResultBoxShadow = useMemo(() => {
      if (!isKeyResult) {
        return theme.palette.mode === "light"
          ? theme.shadows[2]
          : theme.shadows[1];
      }

      return theme.palette.mode === "dark"
        ? `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.6)}`
        : `0 6px 24px -6px ${alpha(theme.palette.primary.main, 0.4)}`;
    }, [isKeyResult, theme]);

    const cardBackground = useMemo(() => {
      if (isKeyResult) {
        return theme.palette.mode === "dark"
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
            color: isKeyResult
              ? theme.palette.primary.contrastText
              : "text.primary",
            borderRadius: theme.shape.borderRadius,
            border: `2px solid ${borderColor}`,
            boxShadow: keyResultBoxShadow,
            position: "relative",
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
            "&:hover": {
              transform: "translateY(-1px)",
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
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: alpha(theme.palette.common.black, 0.7),
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                borderRadius: "inherit",
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <m.div variants={pulseVariants} animate="animate">
                  <CircularProgress
                    color="primary"
                    size={48}
                    thickness={3}
                    sx={{
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                    }}
                  />
                </m.div>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 2,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 500,
                    display: "block",
                  }}
                >
                  Calculating...
                </Typography>
              </Box>
            </Box>
          )}

          <CardContent
            sx={{
              p: { xs: 2.5, md: 3 },
              opacity: isKeyResult && isLoading ? 0.3 : 1,
              transition: "opacity 0.3s ease",
              position: "relative",
            }}
          >
            {/* Enhanced header with better visual hierarchy */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: isKeyResult ? 3 : 2.5,
                pb: 1,
                borderBottom: `1px solid ${alpha(
                  isKeyResult
                    ? theme.palette.primary.contrastText
                    : theme.palette.divider,
                  0.2,
                )}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                {titleIcon && (
                  <Box
                    component="span"
                    sx={{
                      mr: 1.5,
                      color: isKeyResult
                        ? theme.palette.primary.contrastText
                        : "primary.main",
                      display: "flex",
                      alignItems: "center",
                      p: 1,
                      borderRadius: "50%",
                      bgcolor: isKeyResult
                        ? alpha(theme.palette.primary.light, 0.2)
                        : alpha(theme.palette.primary.main, 0.1),
                      transition: "all 0.3s ease",
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
                  color={
                    isKeyResult
                      ? theme.palette.primary.contrastText
                      : "primary.main"
                  }
                  sx={{
                    fontWeight: 700, // Bolder title
                    fontSize: isKeyResult ? "1.6rem" : "1.3rem",
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
                    color: isKeyResult
                      ? theme.palette.primary.contrastText
                      : "text.secondary",
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      backgroundColor: alpha(
                        isKeyResult
                          ? theme.palette.primary.light
                          : theme.palette.action.hover,
                        0.1,
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

            {/* Metrics grid with enhanced spacing */}
            <Collapse in={!collapsible || expanded} timeout={400}>
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

            {/* Enhanced empty state */}
            {metrics.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  color: isKeyResult
                    ? alpha(theme.palette.primary.contrastText, 0.6)
                    : "text.secondary",
                }}
              >                <InfoIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" component="h3" gutterBottom>
                  No metrics available
                </Typography>
                <Typography variant="body2">
                  Calculate your grid parameters to see detailed metrics here.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </m.div>
    );
  },
);

export default ResultsDisplay;
