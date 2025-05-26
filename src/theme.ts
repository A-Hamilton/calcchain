import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#2B66F6' },
    background:{
      default: '#0F1019',
      paper:   '#0F1019',
    },
    divider: '#374151',
    text: {
      primary:   '#FFFFFF',
      secondary: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
    h4: { fontWeight: 600, fontSize: '2rem', color: '#FFFFFF' },
    h6: { fontWeight: 600, fontSize: '1.25rem', color: '#FFFFFF' },
    subtitle2: { color: '#FFFFFF', fontSize: '0.875rem' },
    body1:    { color: '#FFFFFF', fontSize: '1rem' },
  }, 
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F1019',
          boxShadow:        'none',
          borderBottom:     '1px solid #374151',
          borderRadius:     0    // <-- remove rounding
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#10131D',
          border: '1px solid #10131D',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#10131D',
          border: '1px solid #10131D',
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
              borderColor: '#0F1019',
            },
            '&:hover fieldset': {
              borderColor: '#0F1019',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2B66F6',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#2B66F6',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#2B66F6',
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