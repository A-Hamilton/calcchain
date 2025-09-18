import React, { useState, useCallback, useMemo } from "react";
import {
  Paper,
  Typography,
  Box,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Chip,
  Fade,
  useMediaQuery,
} from "@mui/material";
import {
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon, 
  Lightbulb as LightbulbIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
} from "@mui/icons-material";
import { m, AnimatePresence } from "framer-motion";

interface CryptoInsightsProps {
  message: string;
  variant?: "tip" | "insight" | "warning" | "info";
  interactive?: boolean;
  showActions?: boolean;
}

// Enhanced animation variants
const paperVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    rotateX: -5,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
      type: "spring" as const,
      stiffness: 120,
      damping: 20,
    },
  },
} as const;

const iconVariants = {
  initial: { scale: 0.8, rotate: -10 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: "backOut" as const,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      duration: 0.2,
      ease: "easeInOut" as const,
    },
  },
} as const;

const CryptoInsights: React.FC<CryptoInsightsProps> = React.memo(
  ({
    message,
    variant = "insight",
    interactive = true,
    showActions = true,
  }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [copied, setCopied] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [shared, setShared] = useState(false);

    // Variant configurations
    const variantConfig = useMemo(() => {
      const configs = {
        tip: {
          icon: <TipsAndUpdatesIcon />,
          emoji: "💡",
          color: theme.palette.info.main,
          bgcolor: alpha(theme.palette.info.main, 0.08),
          borderColor: alpha(theme.palette.info.main, 0.2),
          label: "Pro Tip",
        },
        insight: {
          icon: <LightbulbIcon />,
          emoji: "💡",
          color: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          borderColor: alpha(theme.palette.primary.main, 0.2),
          label: "Insight",
        },
        warning: {
          icon: <LightbulbIcon />,
          emoji: "⚠️",
          color: theme.palette.warning.main,
          bgcolor: alpha(theme.palette.warning.main, 0.08),
          borderColor: alpha(theme.palette.warning.main, 0.2),
          label: "Important",
        },
        info: {
          icon: <LightbulbIcon />,
          emoji: "ℹ️",
          color: theme.palette.info.main,
          bgcolor: alpha(theme.palette.info.main, 0.06),
          borderColor: alpha(theme.palette.info.main, 0.15),
          label: "Info",
        },
      };
      return configs[variant];
    }, [variant, theme]);

    // Action handlers
    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.warn("Failed to copy insight:", err);
      }
    }, [message]);

    const handleShare = useCallback(async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: "Grid Trading Insight",
            text: message,
            url: window.location.href,
          });
        } else {
          // Fallback to copy
          await handleCopy();
        }
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.warn("Failed to share insight:", err);
      }
    }, [message, handleCopy]);

    const handleBookmark = useCallback(() => {
      setBookmarked((prev) => !prev);
      // Here you could integrate with a bookmarking system
      const bookmarks = JSON.parse(
        localStorage.getItem("crypto-insights-bookmarks") || "[]",
      );
      if (!bookmarked) {
        bookmarks.push({ message, timestamp: Date.now(), variant });
        localStorage.setItem(
          "crypto-insights-bookmarks",
          JSON.stringify(bookmarks),
        );
      } else {
        const filtered = bookmarks.filter(
          (item: any) => item.message !== message,
        );
        localStorage.setItem(
          "crypto-insights-bookmarks",
          JSON.stringify(filtered),
        );
      }
    }, [message, variant, bookmarked]);

    // Check if already bookmarked on mount
    React.useEffect(() => {
      try {
        const bookmarks = JSON.parse(
          localStorage.getItem("crypto-insights-bookmarks") || "[]",
        );
        setBookmarked(bookmarks.some((item: any) => item.message === message));
      } catch (err) {
        console.warn("Failed to load bookmarks:", err);
      }
    }, [message]);

    return (
      <m.div
        variants={paperVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -2, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.5, sm: 2 },
            my: 0.5,
            display: "flex",
            alignItems: "flex-start",
            bgcolor: variantConfig.bgcolor,
            borderColor: variantConfig.borderColor,
            borderWidth: "1.5px",
            borderRadius: theme.shape.borderRadius,
            boxShadow: "none",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
            "&:hover": interactive
              ? {
                  borderColor: variantConfig.color,
                  bgcolor: alpha(variantConfig.color, 0.12),
                  transform: "translateY(-1px)",
                  boxShadow: `0 4px 12px ${alpha(variantConfig.color, 0.15)}`,
                }
              : {},
            "&:focus-within": {
              outline: `2px solid ${variantConfig.color}`,
              outlineOffset: "2px",
            },
          }}
          role="article"
          aria-label={`${variantConfig.label}: ${message}`}
        >
          {/* Enhanced icon with animation */}
          <Box
            sx={{
              fontSize: "1.5rem",
              color: variantConfig.color,
              mr: { xs: 1, sm: 1.5 },
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              mt: 0.25,
            }}
            aria-label={variantConfig.label}
            role="img"
            component={m.div}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            {variantConfig.emoji}
          </Box>

          {/* Content area */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Variant label */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <Chip
                label={variantConfig.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  bgcolor: alpha(variantConfig.color, 0.15),
                  color: variantConfig.color,
                  border: `1px solid ${alpha(variantConfig.color, 0.3)}`,
                  "& .MuiChip-label": {
                    px: 1,
                  },
                }}
              />
            </Box>

            {/* Message content */}
            <Typography
              variant="body2"
              sx={{
                color: "text.primary",
                lineHeight: 1.5,
                fontSize: { xs: "0.875rem", sm: "0.9rem" },
                fontWeight: 500,
                wordBreak: "break-word",
              }}
            >
              {message}
            </Typography>

            {/* Action buttons */}
            {showActions && interactive && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 1.5,
                  justifyContent: "flex-end",
                }}
              >
                <Tooltip
                  title={copied ? "✓ Copied!" : "Copy insight"}
                  arrow
                  TransitionComponent={Fade}
                >
                  <IconButton
                    size="medium"
                    onClick={handleCopy}
                    sx={{
                      width: 36,
                      height: 36,
                      color: "text.secondary",
                      border: `1px solid ${alpha(variantConfig.color, 0.2)}`,
                      borderRadius: 1,
                      "&:hover": {
                        color: variantConfig.color,
                        bgcolor: alpha(variantConfig.color, 0.1),
                        borderColor: variantConfig.color,
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                      opacity: copied ? 1 : 0.8,
                    }}
                    aria-label="Copy insight to clipboard"
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  title={bookmarked ? "✓ Bookmarked" : "Bookmark insight"}
                  arrow
                  TransitionComponent={Fade}
                >
                  <IconButton
                    size="medium"
                    onClick={handleBookmark}
                    sx={{
                      width: 36,
                      height: 36,
                      color: bookmarked
                        ? variantConfig.color
                        : "text.secondary",
                      border: `1px solid ${alpha(variantConfig.color, bookmarked ? 0.4 : 0.2)}`,
                      borderRadius: 1,
                      bgcolor: bookmarked
                        ? alpha(variantConfig.color, 0.1)
                        : "transparent",
                      "&:hover": {
                        color: variantConfig.color,
                        bgcolor: alpha(variantConfig.color, 0.15),
                        borderColor: variantConfig.color,
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                    aria-label={
                      bookmarked ? "Remove bookmark" : "Bookmark insight"
                    }
                  >
                    {bookmarked ? (
                      <BookmarkIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <BookmarkBorderIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </Tooltip>

                {!isMobile && (
                  <Tooltip
                    title={shared ? "✓ Shared!" : "Share insight"}
                    arrow
                    TransitionComponent={Fade}
                  >
                    <IconButton
                      size="medium"
                      onClick={handleShare}
                      sx={{
                        width: 36,
                        height: 36,
                        color: "text.secondary",
                        border: `1px solid ${alpha(variantConfig.color, 0.2)}`,
                        borderRadius: 1,
                        "&:hover": {
                          color: variantConfig.color,
                          bgcolor: alpha(variantConfig.color, 0.1),
                          borderColor: variantConfig.color,
                          transform: "scale(1.05)",
                        },
                        transition: "all 0.2s ease",
                        opacity: shared ? 1 : 0.8,
                      }}
                      aria-label="Share insight"
                    >
                      <ShareIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>

          {/* Success feedback overlays */}
          <AnimatePresence>
            {copied && (
              <m.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: alpha(theme.palette.success.main, 0.9),
                  color: theme.palette.success.contrastText,
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  pointerEvents: "none",
                  zIndex: 10,
                  backdropFilter: "blur(4px)",
                }}
              >
                ✓ Copied!
              </m.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {shared && (
              <m.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: alpha(theme.palette.info.main, 0.9),
                  color: theme.palette.info.contrastText,
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  pointerEvents: "none",
                  zIndex: 10,
                  backdropFilter: "blur(4px)",
                }}
              >
                ✓ Shared!
              </m.div>
            )}
          </AnimatePresence>

          {/* Subtle background pattern */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 60,
              height: 60,
              opacity: 0.03,
              background: `radial-gradient(circle, ${variantConfig.color} 1px, transparent 1px)`,
              backgroundSize: "8px 8px",
              pointerEvents: "none",
            }}
          />
        </Paper>
      </m.div>
    );
  },
);

export default CryptoInsights;
