import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface CryptoInsightsProps {
  message: string;
}

// Lightbulb emoji with aria-label for accessibility
const CryptoInsights: React.FC<CryptoInsightsProps> = React.memo(({ message }) => (
  <Paper variant="outlined" sx={{ p: 2, alignItems: 'center', margin: 1, bgcolor: '#1C1D2B', display: 'flex' }}>
    <Box
      component="span"
      sx={{ fontSize: '1.25rem', color: 'primary.main', mr: 1 }}
      aria-label="Insight"
      role="img"
    >
      💡
    </Box>
    <Typography variant="body2">
      {message}
    </Typography>
  </Paper>
));

export default CryptoInsights;