import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// Create root and render app with theme provider
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      {/* Reset and apply dark theme backgrounds */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);