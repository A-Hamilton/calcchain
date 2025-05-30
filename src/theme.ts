// src/theme.ts
import { createTheme, ThemeOptions } from "@mui/material/styles";

// Use Inter, fall back to Roboto/Arial if not available
const fontFamily = [
  "Inter",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "sans-serif"
].join(",");

const themeOptions: ThemeOptions = {
  palette: {
    mode: "dark",
    primary: {
      main: "#2B66F6", // A vibrant blue
      light: "#5C85F6", // Lighter shade for hover/accents
      dark: "#1A4CB8",  // Darker shade for active/pressed states
      contrastText: "#ffffff",
    },
    secondary: { // Define a secondary color if needed, e.g., for secondary actions
      main: "#64748B", // Example: Slate gray
      light: "#94A3B8",
      dark: "#475569",
      contrastText: "#ffffff",
    },
    background: {
      default: "#0A0C12", // Slightly darker background for more depth
      paper: "#10141C",   // Paper elements, slightly lighter than default
    },
    divider: "rgba(255, 255, 255, 0.12)", // Standard MUI dark theme divider
    text: {
      primary: "#E2E8F0",    // Light gray for primary text (better than pure white)
      secondary: "#94A3B8",  // Softer gray for secondary text
      disabled: "rgba(255, 255, 255, 0.38)",
    },
    error: { // Define error colors
        main: "#F44336",
        light: "#E57373",
        dark: "#D32F2F",
        contrastText: "#fff",
    },
    warning: { // Define warning colors
        main: "#FFA726",
        light: "#FFB74D",
        dark: "#F57C00",
        contrastText: "rgba(0, 0, 0, 0.87)",
    },
    info: { // Define info colors
        main: "#29B6F6",
        light: "#4FC3F7",
        dark: "#0288D1",
        contrastText: "rgba(0, 0, 0, 0.87)",
    },
    success: { // Define success colors
        main: "#66BB6A",
        light: "#81C784",
        dark: "#388E3C",
        contrastText: "rgba(0, 0, 0, 0.87)",
    },
    action: { // Define action colors for hover, selected states
        active: "rgba(255, 255, 255, 0.54)",
        hover: "rgba(255, 255, 255, 0.08)", // Subtle hover for dark theme
        selected: "rgba(255, 255, 255, 0.16)",
        disabled: "rgba(255, 255, 255, 0.26)",
        disabledBackground: "rgba(255, 255, 255, 0.12)",
    }
  },
  typography: {
    fontFamily,
    h1: { fontWeight: 700, fontSize: "2.75rem" },
    h2: { fontWeight: 700, fontSize: "2.25rem" },
    h3: { fontWeight: 600, fontSize: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.5rem" }, // Adjusted from original for better hierarchy
    h5: { fontWeight: 500, fontSize: "1.25rem" },
    h6: { fontWeight: 500, fontSize: "1.1rem" },  // Adjusted
    subtitle1: { fontSize: "1rem", color: "#CBD5E1" }, // For slightly less prominent subtitles
    subtitle2: { fontSize: "0.875rem", color: "#94A3B8" },
    body1: { fontSize: "1rem", color: "#E2E8F0" },
    body2: { fontSize: "0.875rem", color: "#94A3B8" },
    button: { textTransform: "none", fontWeight: 500 }, // Buttons by default
    caption: { fontSize: "0.75rem", color: "#94A3B8" },
    overline: { fontSize: "0.65rem", color: "#94A3B8", letterSpacing: "0.05em" }
  },
  shape: { // Define border radius
    borderRadius: 8, // Default border radius for components
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({ // Access theme if needed for dynamic values
          backgroundColor: theme.palette.background.paper, // Use paper color for app bar
          boxShadow: theme.shadows[2], // Subtle shadow
          borderBottom: `1px solid ${theme.palette.divider}`,
          borderRadius: 0, // App bar usually has no radius
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`, // Add a subtle border
          boxShadow: "none", // Can use theme.shadows[1] or a custom one if preferred
          borderRadius: theme.shape.borderRadius, // Use global border radius
        }),
      },
    },
    MuiPaper: { // General Paper styles
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
        margin: "dense", // Consistent margin
      },
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiOutlinedInput-root": {
            color: theme.palette.text.primary,
            borderRadius: theme.shape.borderRadius, // Consistent border radius
            "& fieldset": {
              borderColor: theme.palette.divider, // Default border color
            },
            "&:hover fieldset": {
              borderColor: theme.palette.primary.light, // Border color on hover
            },
            "&.Mui-focused fieldset": {
              borderColor: theme.palette.primary.main, // Border color when focused
              borderWidth: '1px', // Ensure border width is consistent
            },
          },
          "& .MuiInputLabel-root": { // Label styling
            color: theme.palette.text.secondary,
            "&.Mui-focused": {
              color: theme.palette.primary.main, // Label color when focused
            },
          },
          "& input": { // Input text color
            color: theme.palette.text.primary,
          },
          "& .MuiFormHelperText-root": { // Helper text styling
            color: theme.palette.text.secondary,
            fontSize: "0.75rem",
          }
        }),
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true, // Flatter buttons by default
      },
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none", // Keep button text as is
          borderRadius: theme.shape.borderRadius, // Consistent border radius
          padding: "8px 22px", // Standard padding
          fontWeight: 500,
        }),
        containedPrimary: ({ theme }) => ({ // Specific overrides for contained primary buttons
          color: theme.palette.primary.contrastText,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          }
        }),
        outlinedPrimary: ({ theme }) => ({ // Specific overrides for outlined primary buttons
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.action.hover, // Use theme's hover color
              borderColor: theme.palette.primary.light,
            }
        }),
      },
    },
    MuiMenu: { // Added Menu style overrides
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius * 1.5, // Slightly larger radius for menu
            minWidth: 260,
            backgroundColor: theme.palette.background.paper, // Use paper background
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[6], // A bit more pronounced shadow for menus
          }),
        },
    },
    MuiAccordion: { // Style overrides for Accordion
        styleOverrides: {
            root: ({ theme }) => ({
                backgroundColor: 'transparent', // Make accordion background transparent to inherit from parent
                boxShadow: 'none',
                '&:before': {
                    display: 'none', // Remove the default top border line
                },
                '&.Mui-expanded': {
                    margin: '8px 0', // Adjust margin when expanded
                },
            }),
        }
    },
    MuiAccordionSummary: { // Style overrides for AccordionSummary
        styleOverrides: {
            root: ({ theme }) => ({
                padding: `0 ${theme.spacing(2)}`,
                minHeight: 48,
                '&.Mui-expanded': {
                    minHeight: 48,
                },
                '& .MuiAccordionSummary-content': {
                    margin: `${theme.spacing(1.5)} 0`, // 12px top/bottom margin for content
                    '&.Mui-expanded': {
                        margin: `${theme.spacing(1.5)} 0`,
                    },
                },
            }),
        }
    },
    MuiAccordionDetails: { // Style overrides for AccordionDetails
        styleOverrides: {
            root: ({ theme }) => ({
                padding: theme.spacing(0, 2, 2, 2), // Adjust padding
            }),
        }
    },
    MuiTooltip: { // Style overrides for Tooltip
        styleOverrides: {
            tooltip: ({ theme }) => ({
                backgroundColor: theme.palette.grey[700], // MUI's standard dark tooltip color
                color: theme.palette.common.white,
                fontSize: '0.75rem',
                borderRadius: theme.shape.borderRadius / 2, // Smaller radius for tooltips
            }),
            arrow: ({ theme }) => ({
                color: theme.palette.grey[700],
            }),
        }
    }
  },
};

const theme = createTheme(themeOptions);

export default theme;
