// src/theme.ts
import { createTheme, ThemeOptions, PaletteOptions, alpha as muiAlpha } from "@mui/material/styles"; // Renamed alpha to muiAlpha to avoid conflict
import { common } from '@mui/material/colors';

const fontFamily = [
  "Inter",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "sans-serif"
].join(",");

// USER SUGGESTION: Reducing the corner radii slightly
const shapeOptions = {
  borderRadius: 6, // Changed from 8 to 6
};

const darkPalette: PaletteOptions = {
  mode: "dark",
  primary: { main: "#2B66F6", light: "#5C85F6", dark: "#1A4CB8", contrastText: "#ffffff", },
  secondary: { main: "#64748B", light: "#94A3B8", dark: "#475569", contrastText: "#ffffff", },
  background: { default: "#0A0C12", paper: "#10141C", },
  divider: "rgba(255, 255, 255, 0.12)",
  text: { primary: "#FFFFFF", secondary: "#94A3B8", disabled: "rgba(255, 255, 255, 0.38)", },
  error: { main: "#F44336", light: "#E57373", dark: "#D32F2F", contrastText: "#fff", },
  warning: { main: "#FFA726", light: "#FFB74D", dark: "#F57C00", contrastText: "rgba(0, 0, 0, 0.87)", },
  info: { main: "#29B6F6", light: "#4FC3F7", dark: "#0288D1", contrastText: "rgba(0, 0, 0, 0.87)", },
  success: { main: "#66BB6A", light: "#81C784", dark: "#388E3C", contrastText: "rgba(0, 0, 0, 0.87)", },
  action: {
    active: "rgba(255, 255, 255, 0.54)", hover: "rgba(255, 255, 255, 0.08)",
    selected: "rgba(255, 255, 255, 0.16)", disabled: "rgba(255, 255, 255, 0.26)",
    disabledBackground: "rgba(255, 255, 255, 0.12)",
  }
};

const lightPalette: PaletteOptions = {
  mode: "light",
  primary: { main: "#2B66F6", light: "#42A5F5", dark: "#1565C0", contrastText: "#ffffff", },
  secondary: { main: "#9C27B0", light: "#BA68C8", dark: "#7B1FA2", contrastText: "#ffffff", },
  background: { default: "#FAFBFD", paper: "#FFFFFF", },
  divider: "rgba(0, 0, 0, 0.12)",
  text: { primary: "rgba(0, 0, 0, 0.87)", secondary: "rgba(0, 0, 0, 0.65)", disabled: "rgba(0, 0, 0, 0.38)", },
  error: { main: "#D32F2F", light: "#E57373", dark: "#C62828", contrastText: "#fff", },
  warning: { main: "#ED6C02", light: "#FF9800", dark: "#E65100", contrastText: "#fff", },
  info: { main: "#0288D1", light: "#03A9F4", dark: "#01579B", contrastText: "#fff", },
  success: { main: "#2E7D32", light: "#4CAF50", dark: "#1B5E20", contrastText: "#fff", },
  action: {
    active: "rgba(0, 0, 0, 0.54)", hover: "rgba(0, 0, 0, 0.04)",
    selected: "rgba(0, 0, 0, 0.08)", disabled: "rgba(0, 0, 0, 0.26)",
    disabledBackground: "rgba(0, 0, 0, 0.12)",
  }
};

const getModeTypography = (palette: PaletteOptions) => ({
  fontFamily,
  h1: { fontWeight: 700, fontSize: "2.75rem", color: palette.text?.primary },
  h2: { fontWeight: 700, fontSize: "2.25rem", color: palette.text?.primary },
  h3: { fontWeight: 600, fontSize: "1.75rem", color: palette.text?.primary }, // Key Result title
  h4: { fontWeight: 600, fontSize: "1.5rem", color: palette.text?.primary },
  h5: { fontWeight: 500, fontSize: "1.25rem", color: palette.text?.primary },
  // USER SUGGESTION: Text Clarity for key numerical outputs (ResultsDisplay uses h6 for non-primary metrics)
  h6: { fontWeight: 550, fontSize: "1.1rem", color: palette.text?.primary }, // Increased fontWeight from 500
  subtitle1: { fontSize: "1rem", color: palette.text?.secondary },
  subtitle2: { fontSize: "0.875rem", color: palette.text?.secondary }, // Used for metric labels
  body1: { fontSize: "1rem", color: palette.text?.primary },
  body2: { fontSize: "0.875rem", color: palette.text?.secondary },
  button: { textTransform: 'none' as const, fontWeight: 500 },
  caption: { fontSize: "0.75rem", color: palette.text?.secondary },
  overline: { fontSize: "0.65rem", letterSpacing: "0.05em", color: palette.text?.secondary }
});

export const createAppTheme = (mode: 'light' | 'dark') => {
  const currentPalette = mode === 'dark' ? darkPalette : lightPalette;
  const currentTypography = getModeTypography(currentPalette);

  // USER SUGGESTION: Light Theme - Slightly softening the shadows for cards
  const lightCardShadow = '0px 1px 3px 0px rgba(0,0,0,0.1),0px 1px 2px 0px rgba(0,0,0,0.06)'; // Softer than theme.shadows[1]
  const lightInputFormCardShadow = '0px 2px 4px -1px rgba(0,0,0,0.1),0px 4px 5px 0px rgba(0,0,0,0.07),0px 1px 10px 0px rgba(0,0,0,0.06)'; // Softer than theme.shadows[2]


  const components: ThemeOptions['components'] = {
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[2],
            borderBottom: `1px solid ${theme.palette.divider}`,
            borderRadius: 0, // App bar typically has no radius
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiCard: { // For ResultsDisplay cards (excluding Key Result) and InfoSection Accordions
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'light' ? lightCardShadow : "none",
            borderRadius: theme.shape.borderRadius,
          }),
        },
      },
      MuiPaper: { // General Paper styles, will affect InputForm Card if it's a Paper
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius,
            // Apply specific shadow to InputForm card (assuming it's a Paper or Card)
            // This targets the InputForm Card specifically if it's the main Paper element there.
            // If InputForm is a Card, MuiCard overrides will apply.
            // For more specific targeting, use a class or sx prop in InputForm.tsx
          }),
        },
      },
      // Specific override for the InputForm Card if it's a direct Card component
      // This ensures its shadow is distinct if needed.
      // If InputForm is a Paper wrapping a Card, this might not be needed or MuiCard applies.
      // For simplicity, relying on MuiCard for general cards and MuiPaper for InputForm's outer layer.
      // The `InputForm.tsx` itself uses a `<Card>` component, so MuiCard overrides will apply to it.
      // We can make its shadow slightly different if needed.
      // Let's assume the MuiCard override above is for general display cards.
      // For InputForm card, we can use a more prominent shadow.
      // This is tricky as MuiPaper and MuiCard can overlap.
      // The InputForm.tsx uses <Card>, so MuiCard overrides apply.
      // If we want InputForm card to be different from ResultsDisplay cards:
      // One way is to add a specific class to InputForm's Card and target it here,
      // or use sx prop in InputForm.tsx.
      // For now, let's make MuiCard have a slightly more prominent shadow in light mode
      // and then ResultsDisplay cards can have a lighter one via sx prop if desired.

      // Let's adjust MuiCard for general use, and InputForm will inherit this.
      // ResultsDisplay can override its own cards if a lighter shadow is needed.
      // The previous MuiCard override with `lightCardShadow` is good.
      // The InputForm Card will use this.

      MuiTextField: {
        defaultProps: { variant: "outlined", fullWidth: true, margin: "dense", },
        styleOverrides: {
          root: ({ theme }) => ({
            "& .MuiOutlinedInput-root": {
              color: theme.palette.text.primary,
              borderRadius: theme.shape.borderRadius,
              "& fieldset": { borderColor: theme.palette.divider, },
              "&:hover fieldset": { borderColor: theme.palette.primary.light, },
              "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main, borderWidth: '1px', },
            },
            "& .MuiInputLabel-root": {
              color: theme.palette.text.secondary,
              "&.Mui-focused": { color: theme.palette.primary.main, },
            },
            "& input": { color: theme.palette.text.primary, },
            "& .MuiFormHelperText-root": { color: theme.palette.text.secondary, fontSize: "0.75rem",}
          }),
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true, },
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: "none",
            borderRadius: theme.shape.borderRadius,
            padding: "8px 22px",
            fontWeight: 500,
          }),
          containedPrimary: ({ theme }) => ({
            color: theme.palette.primary.contrastText,
            '&:hover': { backgroundColor: theme.palette.primary.dark, }
          }),
          outlinedPrimary: ({ theme }) => ({
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderColor: theme.palette.primary.light,
              }
          }),
        },
      },
      MuiMenu: {
          styleOverrides: {
            paper: ({ theme }) => ({
              borderRadius: theme.shape.borderRadius * 1.5, // Slightly larger radius for menu
              minWidth: 260,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[6],
            }),
          },
      },
      MuiAccordion: { // Used in InfoSection
          styleOverrides: {
              root: ({ theme }) => ({
                  backgroundColor: 'transparent',
                  boxShadow: 'none', // Accordions within cards shouldn't have their own shadow
                  border: 'none', // Remove internal accordion border if it's inside a card
                  '&:before': { display: 'none', },
                  '&.Mui-expanded': { margin: '8px 0', },
                  // If Accordion is directly on page (not in card), it might need its own border/shadow
                  // For now, assuming it's nested.
              }),
          }
      },
      MuiAccordionSummary: {
          styleOverrides: {
              root: ({ theme }) => ({
                  padding: `0 ${theme.spacing(2)}`,
                  minHeight: 48,
                  '&.Mui-expanded': { minHeight: 48, },
                  '& .MuiAccordionSummary-content': {
                      margin: `${theme.spacing(1.5)} 0`,
                      '&.Mui-expanded': { margin: `${theme.spacing(1.5)} 0`, },
                  },
              }),
          }
      },
      MuiAccordionDetails: {
          styleOverrides: {
              root: ({ theme }) => ({ padding: theme.spacing(0, 2, 2, 2), }),
          }
      },
      MuiTooltip: {
          styleOverrides: {
              tooltip: ({ theme }) => ({
                  backgroundColor: theme.palette.grey[700],
                  color: common.white,
                  fontSize: '0.75rem',
                  borderRadius: theme.shape.borderRadius / 2, // Half of main radius for tooltips
              }),
              arrow: ({ theme }) => ({
                  color: theme.palette.grey[700],
              }),
          }
      }
  };

  return createTheme({
    palette: currentPalette,
    typography: currentTypography,
    shape: shapeOptions,
    components: components,
  });
};
