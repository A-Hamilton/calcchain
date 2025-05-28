import React from "react";
import { Alert } from "@mui/material";

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: unknown) {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // Optionally log to your error reporting service
    if (typeof window !== "undefined" && window.console) {
      // eslint-disable-next-line no-console
      console.error("App Error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 4 }}>
          Something went wrong. Please reload the page or try again later.
        </Alert>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
