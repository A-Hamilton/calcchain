import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface CryptoInsightsProps {
  message: string;
}

const CryptoInsights: React.FC<CryptoInsightsProps> = ({ message }) => (
  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
    <Box
      component="span"
      sx={{ fontSize: '1.25rem', color: 'primary.main', mr: 1 }}
    >
      💡
    </Box>
    <Typography variant="body2">
      {message}
    </Typography>
  </Paper>
);

export default CryptoInsights;
