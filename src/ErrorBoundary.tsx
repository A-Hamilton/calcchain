import React from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Divider,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  Home as HomeIcon,
  ErrorOutline as ErrorOutlineIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { m, AnimatePresence } from "framer-motion";

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
};

type ErrorBoundaryProps = React.PropsWithChildren<{
  fallback?: React.ComponentType<{
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}>;

// Enhanced error boundary with better UX and debugging features
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
    };
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Enhanced error logging with context
    const errorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.retryCount,
    };

    // Log to console with enhanced formatting
    if (typeof window !== "undefined" && window.console) {
      console.group(`🚨 Application Error [${this.state.errorId}]`);
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Full Report:", errorReport);
      console.groupEnd();
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Optional: Send to error reporting service
    // this.reportErrorToService(errorReport);
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: this.generateErrorId(),
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private copyErrorReport = async () => {
    const errorReport = {
      errorId: this.state.errorId,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    } catch (err) {
      console.warn("Failed to copy error report:", err);
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.handleRetry}
          />
        );
      }

      // Default enhanced error UI
      return <EnhancedErrorUI {...this.state} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Enhanced error UI component
const EnhancedErrorUI: React.FC<{
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  onRetry: () => void;
}> = ({ error, errorInfo, errorId, onRetry }) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const copyErrorReport = React.useCallback(async () => {
    const errorReport = {
      errorId,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy error report:", err);
    }
  }, [error, errorInfo, errorId]);

  const isNetworkError =
    error?.message?.toLowerCase().includes("network") ||
    error?.message?.toLowerCase().includes("fetch") ||
    error?.name === "TypeError";

  const errorVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
        type: "spring",
        stiffness: 120,
        damping: 20,
      },
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <m.div variants={errorVariants} initial="hidden" animate="visible">
        <Paper
          elevation={3}
          sx={{
            maxWidth: 600,
            width: "100%",
            borderRadius: theme.shape.borderRadius * 2,
            overflow: "hidden",
            border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
              color: theme.palette.error.contrastText,
              p: 3,
              textAlign: "center",
            }}
          >
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 48, mb: 1 }} />
            </m.div>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {isNetworkError
                ? "It looks like there's a connection issue. Please check your internet and try again."
                : "We've encountered an unexpected error. Don't worry, we're on it!"}
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
              {/* Error summary */}
              <Alert
                severity="error"
                variant="outlined"
                sx={{
                  "& .MuiAlert-message": {
                    width: "100%",
                  },
                }}
              >
                <AlertTitle sx={{ fontWeight: 600 }}>Error Details</AlertTitle>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Chip
                    label={`ID: ${errorId.slice(-8)}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                  <Chip
                    label={error?.name || "Unknown Error"}
                    size="small"
                    color="error"
                    sx={{ fontSize: "0.7rem" }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                >
                  {error?.message || "An unknown error occurred"}
                </Typography>
              </Alert>

              {/* Quick actions */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={onRetry}
                  fullWidth
                  sx={{ minHeight: 48 }}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={() => (window.location.href = "/")}
                  fullWidth
                  sx={{ minHeight: 48 }}
                >
                  Go Home
                </Button>
              </Stack>

              <Divider />

              {/* Advanced options */}
              <Box>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowDetails(!showDetails)}
                  sx={{ mb: 1 }}
                >
                  {showDetails ? "Hide" : "Show"} Technical Details
                </Button>

                <AnimatePresence>
                  {showDetails && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: alpha(theme.palette.error.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          fontWeight={600}
                        >
                          Stack Trace:
                        </Typography>
                        <Typography
                          variant="caption"
                          component="pre"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.7rem",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            maxHeight: 200,
                            overflow: "auto",
                            color: "text.secondary",
                            lineHeight: 1.4,
                          }}
                        >
                          {error?.stack || "No stack trace available"}
                        </Typography>

                        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={copyErrorReport}
                            disabled={copied}
                            sx={{ fontSize: "0.75rem" }}
                          >
                            {copied ? "Copied!" : "Copy Report"}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<BugReportIcon />}
                            onClick={() => window.location.reload()}
                            sx={{ fontSize: "0.75rem" }}
                          >
                            Reload Page
                          </Button>
                        </Box>
                      </Paper>
                    </m.div>
                  )}
                </AnimatePresence>
              </Box>

              {/* Help text */}
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                If this problem persists, please try refreshing the page or
                contact support.
                <br />
                Reference ID:{" "}
                <code style={{ fontSize: "0.8em" }}>{errorId}</code>
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </m.div>
    </Box>
  );
};

export default ErrorBoundary;
