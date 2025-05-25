// src/App.tsx
import React from 'react';
import { createTheme, ThemeProvider, CssBaseline, Container, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { GridResults } from './types';

// Create a Material UI theme (optional customization)
const theme = createTheme({
  palette: {
    mode: 'light',
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif'
  }
});

const App: React.FC = () => {
  const [results, setResults] = React.useState<GridResults | null>(null);

  // Handler to receive calculation results from the InputForm
  const handleCalculate = (calcResults: GridResults) => {
    setResults(calcResults);
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline /> {/* Global baseline for MUI styles */}
        <Container maxWidth="md" sx={{ padding: 4 }}>
          <Typography variant="h4" gutterBottom>
            Crypto Grid Trading Profit Estimator
          </Typography>
          {/* Input form for parameters */}
          <InputForm onCalculate={handleCalculate} />
          {/* Results display (shown after calculation) */}
          {results && <ResultsDisplay result={results} />}
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
