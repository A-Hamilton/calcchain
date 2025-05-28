import React from "react";
import { Paper, Typography, Box } from "@mui/material";

interface CryptoInsightsProps {
  message: string;
}

const CryptoInsights: React.FC<CryptoInsightsProps> = React.memo(({ message }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      my: 0.5,
      display: "flex",
      alignItems: "center",
      bgcolor: "background.paper",
      borderColor: "primary.main",
      borderRadius: 2,
      boxShadow: "none",
    }}
  >
    <Box
      sx={{
        fontSize: "1.25rem",
        color: "primary.main",
        mr: 1.2,
        display: "flex",
        alignItems: "center",
      }}
      aria-label="Insight"
      role="img"
    >
      💡
    </Box>
    <Typography variant="body2" color="text.primary">
      {message}
    </Typography>
  </Paper>
));

export default CryptoInsights;
