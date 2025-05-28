// src/theme.ts

import { createTheme } from "@mui/material/styles";

// Use Inter, fall back to Roboto/Arial if not available
const fontFamily = [
  "Inter",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "sans-serif"
].join(",");

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#2B66F6",
      dark: "#173472",
      contrastText: "#fff",
    },
    background: {
      default: "#0F1019",
      paper: "#10131D",
    },
    divider: "#374151",
    text: {
      primary: "#fff",
      secondary: "#bfc7d5",
    },
  },
  typography: {
    fontFamily,
    h4: {
      fontWeight: 600,
      fontSize: "2rem",
      color: "#fff",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.25rem",
      color: "#fff",
    },
    subtitle2: {
      color: "#bfc7d5",
    },
    body1: {
      color: "#fff",
    },
    body2: {
      color: "#bfc7d5",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0F1019",
          borderRadius: 0,
          borderBottom: "1px solid #374151",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#10131D",
          boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#10131D",
          border: "1px solid #222535",
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
        margin: "dense",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            color: "#fff",
            "& fieldset": {
              borderColor: "#0F1019",
            },
            "&:hover fieldset": {
              borderColor: "#0F1019",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2B66F6",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#90caf9",
            "&.Mui-focused": {
              color: "#2B66F6",
            },
          },
          "& input": {
            color: "#fff",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          padding: "8px 20px",
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
