import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#3B82F6' },
    background:{
      default: '#111827',
      paper:   '#1F2937',
    },
    divider: '#374151',
    text: {
      primary:   '#F9FAFB',
      secondary: '#9CA3AF',
    },
  },
  typography: {
    fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
    h4: { fontWeight: 600, fontSize: '2rem', color: '#F9FAFB' },
    h6: { fontWeight: 600, fontSize: '1.25rem', color: '#F9FAFB' },
    subtitle2: { color: '#9CA3AF', fontSize: '0.875rem' },
    body1:    { color: '#E5E7EB', fontSize: '1rem' },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1F2937',
          boxShadow:        'none',
          borderBottom:     '1px solid #374151',
          borderRadius:     0    // <-- remove rounding
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: '1px solid #2e2e2e',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: '1px solid #2e2e2e',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
        margin: 'dense',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#444444',
            },
            '&:hover fieldset': {
              borderColor: '#555555',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#aaaaaa',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#1976d2',
          },
          '& .MuiOutlinedInput-input': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
  },
});

export default theme;