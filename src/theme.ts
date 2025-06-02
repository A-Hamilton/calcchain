import {
  createTheme,
  ThemeOptions,
  PaletteOptions,
  alpha,
} from "@mui/material/styles";
import { common } from "@mui/material/colors";

// Enhanced font stack with better fallbacks
const fontFamily = [
  "Inter",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "sans-serif",
  "Apple Color Emoji",
  "Segoe UI Emoji",
].join(",");

// Enhanced shape options with consistent border radius
const shapeOptions = {
  borderRadius: 6, // Refined from 8 to 6 for modern look
};

// Enhanced shadow definitions for better depth perception
const customShadows = {
  light: {
    card: "0px 1px 3px 0px rgba(0,0,0,0.1),0px 1px 2px 0px rgba(0,0,0,0.06)",
    cardHover:
      "0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -1px rgba(0,0,0,0.06)",
    inputForm:
      "0px 2px 4px -1px rgba(0,0,0,0.1),0px 4px 5px 0px rgba(0,0,0,0.07),0px 1px 10px 0px rgba(0,0,0,0.06)",
    keyResult:
      "0px 10px 15px -3px rgba(0,0,0,0.1),0px 4px 6px -2px rgba(0,0,0,0.05)",
    menu: "0px 10px 15px -3px rgba(0,0,0,0.1),0px 4px 6px -2px rgba(0,0,0,0.05)",
    appBar: "0px 1px 3px 0px rgba(0,0,0,0.1),0px 1px 2px 0px rgba(0,0,0,0.06)",
  },
  dark: {
    card: "none",
    cardHover: `0px 4px 20px ${alpha("#2B66F6", 0.15)}`,
    inputForm: `0px 8px 32px ${alpha("#000000", 0.24)}`,
    keyResult: `0px 6px 25px -6px ${alpha("#2B66F6", 0.55)}`,
    menu: `0px 8px 32px ${alpha("#000000", 0.32)}`,
    appBar: `0px 4px 16px ${alpha("#000000", 0.16)}`,
  },
};

// Enhanced dark palette with better contrast ratios
const darkPalette: PaletteOptions = {
  mode: "dark",
  primary: {
    main: "#2B66F6",
    light: "#5C85F6",
    dark: "#1A4CB8",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#64748B",
    light: "#94A3B8",
    dark: "#475569",
    contrastText: "#ffffff",
  },
  background: {
    default: "#0A0C12",
    paper: "#10141C",
  },
  divider: alpha("#ffffff", 0.12),
  text: {
    primary: "#FFFFFF",
    secondary: "#94A3B8",
    disabled: alpha("#ffffff", 0.38),
  },
  error: {
    main: "#F44336",
    light: "#E57373",
    dark: "#D32F2F",
    contrastText: "#fff",
  },
  warning: {
    main: "#FFA726",
    light: "#FFB74D",
    dark: "#F57C00",
    contrastText: "rgba(0, 0, 0, 0.87)",
  },
  info: {
    main: "#29B6F6",
    light: "#4FC3F7",
    dark: "#0288D1",
    contrastText: "rgba(0, 0, 0, 0.87)",
  },
  success: {
    main: "#66BB6A",
    light: "#81C784",
    dark: "#388E3C",
    contrastText: "rgba(0, 0, 0, 0.87)",
  },
  action: {
    active: alpha("#ffffff", 0.54),
    hover: alpha("#ffffff", 0.08),
    selected: alpha("#ffffff", 0.16),
    disabled: alpha("#ffffff", 0.26),
    disabledBackground: alpha("#ffffff", 0.12),
    focus: alpha("#2B66F6", 0.32),
  },
};

// Enhanced light palette with improved accessibility
const lightPalette: PaletteOptions = {
  mode: "light",
  primary: {
    main: "#2B66F6",
    light: "#42A5F5",
    dark: "#1565C0",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#9C27B0",
    light: "#BA68C8",
    dark: "#7B1FA2",
    contrastText: "#ffffff",
  },
  background: {
    default: "#F8F9FA", // Slightly warmer than pure gray
    paper: "#FFFFFF",
  },
  divider: alpha("#000000", 0.12),
  text: {
    primary: alpha("#000000", 0.87),
    secondary: alpha("#000000", 0.65),
    disabled: alpha("#000000", 0.38),
  },
  error: {
    main: "#D32F2F",
    light: "#E57373",
    dark: "#C62828",
    contrastText: "#fff",
  },
  warning: {
    main: "#ED6C02",
    light: "#FF9800",
    dark: "#E65100",
    contrastText: "#fff",
  },
  info: {
    main: "#0288D1",
    light: "#03A9F4",
    dark: "#01579B",
    contrastText: "#fff",
  },
  success: {
    main: "#2E7D32",
    light: "#4CAF50",
    dark: "#1B5E20",
    contrastText: "#fff",
  },
  action: {
    active: alpha("#000000", 0.54),
    hover: alpha("#000000", 0.04),
    selected: alpha("#000000", 0.08),
    disabled: alpha("#000000", 0.26),
    disabledBackground: alpha("#000000", 0.12),
    focus: alpha("#2B66F6", 0.12),
  },
};

// Enhanced typography with better hierarchy and readability
const getModeTypography = (palette: PaletteOptions) => ({
  fontFamily,
  h1: {
    fontWeight: 700,
    fontSize: "2.75rem",
    lineHeight: 1.2,
    letterSpacing: "-0.01562em",
    color: palette.text?.primary,
  },
  h2: {
    fontWeight: 700,
    fontSize: "2.25rem",
    lineHeight: 1.25,
    letterSpacing: "-0.00833em",
    color: palette.text?.primary,
  },
  h3: {
    fontWeight: 600,
    fontSize: "1.75rem",
    lineHeight: 1.3,
    letterSpacing: "0em",
    color: palette.text?.primary,
  },
  h4: {
    fontWeight: 600,
    fontSize: "1.5rem",
    lineHeight: 1.35,
    letterSpacing: "0.00735em",
    color: palette.text?.primary,
  },
  h5: {
    fontWeight: 500,
    fontSize: "1.25rem",
    lineHeight: 1.4,
    letterSpacing: "0em",
    color: palette.text?.primary,
  },
  h6: {
    fontWeight: 550, // Enhanced for better readability of numerical outputs
    fontSize: "1.1rem",
    lineHeight: 1.45,
    letterSpacing: "0.0075em",
    color: palette.text?.primary,
  },
  subtitle1: {
    fontSize: "1rem",
    lineHeight: 1.5,
    letterSpacing: "0.00938em",
    color: palette.text?.secondary,
  },
  subtitle2: {
    fontSize: "0.875rem",
    lineHeight: 1.5,
    letterSpacing: "0.00714em",
    color: palette.text?.secondary,
  },
  body1: {
    fontSize: "1rem",
    lineHeight: 1.6,
    letterSpacing: "0.00938em",
    color: palette.text?.primary,
  },
  body2: {
    fontSize: "0.875rem",
    lineHeight: 1.6,
    letterSpacing: "0.01071em",
    color: palette.text?.secondary,
  },
  button: {
    textTransform: "none" as const,
    fontWeight: 500,
    letterSpacing: "0.02857em",
  },
  caption: {
    fontSize: "0.75rem",
    lineHeight: 1.5,
    letterSpacing: "0.03333em",
    color: palette.text?.secondary,
  },
  overline: {
    fontSize: "0.65rem",
    lineHeight: 1.5,
    letterSpacing: "0.08333em",
    textTransform: "uppercase" as const,
    fontWeight: 500,
    color: palette.text?.secondary,
  },
});

// Enhanced breakpoints for better responsive design
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// Enhanced spacing function for consistent layouts
const spacing = (factor: number) => `${0.25 * factor}rem`;

export const createAppTheme = (mode: "light" | "dark") => {
  const currentPalette = mode === "dark" ? darkPalette : lightPalette;
  const currentTypography = getModeTypography(currentPalette);
  const shadows = mode === "dark" ? customShadows.dark : customShadows.light;

  const components: ThemeOptions["components"] = {
    // Enhanced MuiCssBaseline for better defaults
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          scrollBehavior: "smooth",
        },
        body: {
          scrollbarWidth: "thin",
          scrollbarColor:
            mode === "dark"
              ? `${alpha("#ffffff", 0.3)} transparent`
              : `${alpha("#000000", 0.3)} transparent`,
        },
        "*": {
          boxSizing: "border-box",
        },
        "*:focus-visible": {
          outline: `2px solid ${currentPalette.primary?.main}`,
          outlineOffset: "2px",
        },
        // Custom scrollbar styling
        "*::-webkit-scrollbar": {
          width: "8px",
          height: "8px",
        },
        "*::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
        },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor:
            mode === "dark" ? alpha("#ffffff", 0.3) : alpha("#000000", 0.3),
          borderRadius: "4px",
          "&:hover": {
            backgroundColor:
              mode === "dark" ? alpha("#ffffff", 0.4) : alpha("#000000", 0.4),
          },
        },
      },
    },

    // Enhanced AppBar with backdrop blur
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: shadows.appBar,
          borderBottom: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          color: theme.palette.text.primary,
          transition: "all 0.3s ease-in-out",
        }),
      },
    },

    // Enhanced Card components with better shadows and borders
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: shadows.card,
          borderRadius: theme.shape.borderRadius,
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: shadows.cardHover,
            transform: "translateY(-1px)",
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
        }),
      },
    },

    // Enhanced Paper with consistent styling
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          transition: "all 0.3s ease-in-out",
        }),
      },
    },

    // Enhanced TextField with better focus states and animations
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
        margin: "dense",
      },
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiOutlinedInput-root": {
            color: theme.palette.text.primary,
            borderRadius: theme.shape.borderRadius,
            transition: "all 0.2s ease-in-out",
            backgroundColor: alpha(theme.palette.background.paper, 0.5),
            "& fieldset": {
              borderColor: theme.palette.divider,
              transition: "border-color 0.2s ease-in-out",
            },
            "&:hover fieldset": {
              borderColor: theme.palette.primary.light,
            },
            "&.Mui-focused": {
              backgroundColor: theme.palette.background.paper,
              "& fieldset": {
                borderColor: theme.palette.primary.main,
                borderWidth: "2px",
              },
            },
            "&.Mui-error fieldset": {
              borderColor: theme.palette.error.main,
            },
          },
          "& .MuiInputLabel-root": {
            color: theme.palette.text.secondary,
            transition: "color 0.2s ease-in-out",
            "&.Mui-focused": {
              color: theme.palette.primary.main,
            },
            "&.Mui-error": {
              color: theme.palette.error.main,
            },
          },
          "& input": {
            color: theme.palette.text.primary,
            "&::placeholder": {
              color: theme.palette.text.disabled,
              opacity: 1,
            },
            // Remove number input spinners
            '&[type="number"]::-webkit-outer-spin-button': {
              WebkitAppearance: "none",
              margin: 0,
              display: "none",
            },
            '&[type="number"]::-webkit-inner-spin-button': {
              WebkitAppearance: "none",
              margin: 0,
              display: "none",
            },
            '&[type="number"]': {
              MozAppearance: "textfield",
            },
          },
          "& .MuiFormHelperText-root": {
            color: theme.palette.text.secondary,
            fontSize: "0.75rem",
            marginTop: "6px",
            lineHeight: 1.4,
            "&.Mui-error": {
              color: theme.palette.error.main,
            },
          },
        }),
      },
    },

    // Enhanced Button with better hover states and accessibility
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none",
          borderRadius: theme.shape.borderRadius,
          padding: "10px 24px",
          fontWeight: 500,
          fontSize: "0.95rem",
          transition: "all 0.2s ease-in-out",
          position: "relative",
          overflow: "hidden",
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: "2px",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background: `linear-gradient(90deg, transparent, ${alpha("#ffffff", 0.2)}, transparent)`,
            transition: "left 0.6s ease-in-out",
          },
          "&:hover::before": {
            left: "100%",
          },
        }),
        containedPrimary: ({ theme }) => ({
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          color: theme.palette.primary.contrastText,
          boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
          "&:hover": {
            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.6)}`,
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "translateY(0px)",
          },
          "&:disabled": {
            background: theme.palette.action.disabledBackground,
            color: theme.palette.action.disabled,
            boxShadow: "none",
          },
        }),
        outlinedPrimary: ({ theme }) => ({
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
          borderWidth: "2px",
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            borderColor: theme.palette.primary.light,
            borderWidth: "2px",
            transform: "translateY(-1px)",
          },
          "&:focus": {
            borderWidth: "2px",
          },
        }),
      },
    },

    // Enhanced IconButton with better interaction feedback
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: alpha(theme.palette.action.hover, 0.8),
            transform: "scale(1.05)",
          },
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: "2px",
          },
        }),
      },
    },

    // Enhanced Menu with backdrop blur and better shadows
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius * 1.5,
          minWidth: 280,
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: shadows.menu,
          marginTop: "4px",
        }),
      },
    },

    // Enhanced MenuItem with better hover states
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: "all 0.2s ease-in-out",
          borderRadius: theme.shape.borderRadius / 2,
          margin: "2px 4px",
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: "translateX(2px)",
          },
          "&:focus-visible": {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: "-2px",
          },
          "&.Mui-selected": {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.16),
            },
          },
        }),
      },
    },

    // Enhanced Accordion for better UX
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: "transparent",
          boxShadow: "none",
          border: "none",
          "&:before": { display: "none" },
          "&.Mui-expanded": {
            margin: "8px 0",
          },
          "& .MuiAccordionSummary-root": {
            transition: "all 0.2s ease-in-out",
          },
        }),
      },
    },

    // Enhanced AccordionSummary with better spacing
    MuiAccordionSummary: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: `0 ${theme.spacing(2)}`,
          minHeight: 56,
          borderRadius: theme.shape.borderRadius,
          transition: "all 0.2s ease-in-out",
          "&.Mui-expanded": {
            minHeight: 56,
          },
          "&:hover": {
            backgroundColor: alpha(theme.palette.action.hover, 0.5),
          },
          "& .MuiAccordionSummary-content": {
            margin: `${theme.spacing(1.5)} 0`,
            "&.Mui-expanded": {
              margin: `${theme.spacing(1.5)} 0`,
            },
          },
          "& .MuiAccordionSummary-expandIconWrapper": {
            transition: "transform 0.3s ease-in-out",
            "&.Mui-expanded": {
              transform: "rotate(180deg)",
            },
          },
        }),
      },
    },

    // Enhanced AccordionDetails with better padding
    MuiAccordionDetails: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(0, 2, 2, 2),
        }),
      },
    },

    // Enhanced Tooltip with better styling
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor:
            mode === "dark" ? alpha("#000000", 0.9) : alpha("#424242", 0.9),
          color: common.white,
          fontSize: "0.75rem",
          fontWeight: 500,
          borderRadius: theme.shape.borderRadius / 2,
          padding: "8px 12px",
          maxWidth: 300,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          border: `1px solid ${alpha("#ffffff", 0.1)}`,
        }),
        arrow: ({ theme }) => ({
          color:
            mode === "dark" ? alpha("#000000", 0.9) : alpha("#424242", 0.9),
        }),
      },
    },

    // Enhanced Alert with better styling
    MuiAlert: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          fontSize: "0.9rem",
          fontWeight: 500,
          "& .MuiAlert-icon": {
            fontSize: "1.25rem",
          },
          "& .MuiAlert-message": {
            padding: 0,
          },
        }),
        filledSuccess: ({ theme }) => ({
          backgroundColor: theme.palette.success.main,
          color: theme.palette.success.contrastText,
        }),
        filledInfo: ({ theme }) => ({
          backgroundColor: theme.palette.info.main,
          color: theme.palette.info.contrastText,
        }),
        filledWarning: ({ theme }) => ({
          backgroundColor: theme.palette.warning.main,
          color: theme.palette.warning.contrastText,
        }),
        filledError: ({ theme }) => ({
          backgroundColor: theme.palette.error.main,
          color: theme.palette.error.contrastText,
        }),
      },
    },

    // Enhanced CircularProgress with better animations
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          animationDuration: "1.8s",
        },
      },
    },

    // Enhanced Skeleton with shimmer effect
    MuiSkeleton: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.action.hover, 0.1),
          "&::after": {
            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
          },
        }),
      },
    },

    // Enhanced Divider
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.palette.divider,
        }),
      },
    },

    // Enhanced Container for better responsive behavior
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: "16px",
          paddingRight: "16px",
          "@media (min-width: 600px)": {
            paddingLeft: "24px",
            paddingRight: "24px",
          },
        },
      },
    },
  };

  return createTheme({
    palette: currentPalette,
    typography: currentTypography,
    shape: shapeOptions,
    components: components,
    breakpoints,
    spacing,
    transitions: {
      easing: {
        easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
        easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
        easeIn: "cubic-bezier(0.4, 0, 1, 1)",
        sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
      },
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
    },
    zIndex: {
      mobileStepper: 1000,
      fab: 1050,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    },
  });
};
