// src/components/ResultsDisplay.tsx
import React from "react";
import { Card, CardContent, Typography, Grid, Box, useTheme, Tooltip, CircularProgress, Skeleton, alpha } from "@mui/material";
import { m } from "framer-motion";
import type { Metric } from "../types";

interface ResultsDisplayProps {
  title: string;
  metrics: Metric[];
  titleIcon?: React.ReactNode;
  isLoading?: boolean;
  delay?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", delay }
  }),
};

const metricItemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.3,
      ease: "circOut",
    },
  }),
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(({ title, metrics, titleIcon, isLoading, delay = 0 }) => {
  const theme = useTheme();
  const isKeyResult = title === "Key Result";

  // USER SUGGESTION: Dark Theme - Glow/Highlighting for Key Result box (less intense/broader)
  // USER SUGGESTION: Light Theme - Contrast (softening shadows for Key Result card as well)
  const keyResultBoxShadow = isKeyResult 
    ? (theme.palette.mode === 'dark' 
        ? `0 6px 25px -6px ${alpha(theme.palette.primary.main, 0.55)}` // Softer glow for dark
        : `0 4px 15px -4px ${alpha(theme.palette.primary.main, 0.35)}`) // Softer glow for light
    : (theme.palette.mode === 'light' ? theme.shadows[1] : "none"); // Use theme shadow for light, none for dark general cards


  return (
    <m.div custom={delay} initial="hidden" animate="visible" variants={cardVariants}>
      <Card
        elevation={0} 
        sx={{
          // Key Result card specific styling
          bgcolor: isKeyResult 
            ? (theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.95) : theme.palette.primary.main) 
            : "background.paper", // General cards use theme's paper
          color: isKeyResult ? theme.palette.primary.contrastText : "text.primary",
          borderRadius: theme.shape.borderRadius,
          border: `1px solid ${isKeyResult ? alpha(theme.palette.primary.main, 0.6) : theme.palette.divider}`,
          boxShadow: keyResultBoxShadow, // Apply refined shadow
          position: 'relative',
          overflow: 'hidden',
          // General cards (not Key Result) will inherit shadow from theme.ts MuiCard override
          // This specific sx boxShadow for Key Result overrides the theme's MuiCard one.
        }}
      >
        {isKeyResult && isLoading && (
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: alpha(theme.palette.common.black, 0.75),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1, borderRadius: 'inherit'
          }}>
            <CircularProgress color="primary" size={36} />
          </Box>
        )}
        <CardContent sx={{ p: {xs: 2, md: 2.5}, opacity: (isKeyResult && isLoading) ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
          <Box sx={{display: 'flex', alignItems: 'center', mb: isKeyResult ? 2.5 : 2 }}>
            {titleIcon && <Box component="span" sx={{mr: 1.25, color: isKeyResult ? theme.palette.primary.contrastText : 'primary.main', display: 'flex', alignItems: 'center'}}>{React.cloneElement(titleIcon as React.ReactElement, { fontSize: "medium" })}</Box>}
            <Typography
              variant="h6" // Theme now has h6 at fontWeight 550
              color={isKeyResult ? theme.palette.primary.contrastText : "primary.main"}
              sx={{
                fontWeight: 600, 
                fontSize: isKeyResult ? '1.4rem' : '1.15rem',
                borderBottom: isKeyResult ? `2px solid ${alpha(theme.palette.primary.light, 0.7)}` : 'none',
                pb: isKeyResult ? 0.5 : 0,
                display: 'inline-block',
                lineHeight: 1.3
              }}
            >
              {title}
            </Typography>
          </Box>
          <Grid container spacing={{xs: 2, md: 2.5}}>
            {metrics.map((metricItem, i) => (
              <Grid
                item
                xs={12}
                sm={metricItem.isPrimary ? 12 : 6}
                // USER SUGGESTION: Responsive Layout - ensure this logic is sound for various metric counts
                md={metricItem.isPrimary ? 12 : (metrics.length > 2 ? 4 : 6)} // Adjusted for better 2-item layout
                key={`${metricItem.label}-${i}-${String(metricItem.value)}`}
              >
                <m.div custom={i} initial="hidden" animate="visible" variants={metricItemVariants}>
                  <Box
                    sx={{
                      p: metricItem.isPrimary ? {xs:2, md:2.5} : {xs:1.5, md:2}, // Slightly adjusted padding
                      bgcolor: 'transparent',
                      borderRadius: theme.shape.borderRadius > 2 ? theme.shape.borderRadius - 2 : 2,
                      border: `1px solid ${isKeyResult && metricItem.isPrimary ? alpha(theme.palette.primary.light, theme.palette.mode === 'dark' ? 0.3 : 0.5) : alpha(theme.palette.divider, 0.7)}`,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      minHeight: metricItem.isPrimary ? 'auto' : '100px',
                      transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out',
                      '&:hover': !metricItem.isPrimary ? {
                        transform: 'translateY(-3px)',
                        boxShadow: `0 5px 10px -3px ${alpha(theme.palette.common.black, 0.12)}`, // Softer hover shadow
                        borderColor: theme.palette.primary.main,
                      } : {}
                    }}
                  >
                    {isKeyResult && isLoading && metricItem.isPrimary ? (
                      <>
                        <Skeleton variant="text" width="60%" sx={{ fontSize: '0.75rem', mb: 0.5, bgcolor: alpha(theme.palette.common.white, 0.2) }} />
                        <Skeleton variant="text" width="80%" sx={{ fontSize: {xs: '2.25rem', md:'3rem'}, bgcolor: alpha(theme.palette.common.white, 0.3) }} />
                      </>
                    ) : (
                      <>
                        <Tooltip title={metricItem.label} placement="top-start" arrow enterDelay={500}>
                          <Typography
                            variant="subtitle2"
                            sx={{ 
                              fontSize: '0.75rem', 
                              mb: metricItem.isPrimary ? 0.75 : 0.5, // More space for primary metric label
                              lineHeight: 1.2, 
                              cursor: 'default', 
                              color: isKeyResult ? alpha(theme.palette.primary.contrastText, 0.85) : 'text.secondary',
                              opacity: isKeyResult ? 0.9 : 1 
                            }}
                          >
                            {metricItem.label}
                          </Typography>
                        </Tooltip>
                        <Typography
                          variant={metricItem.isPrimary ? "h3" : "h6"} // h3 from theme (fw600), h6 from theme (fw550)
                          color={metricItem.value !== undefined && metricItem.value !== null ? (isKeyResult ? theme.palette.primary.contrastText : "text.primary") : (isKeyResult ? alpha(theme.palette.common.white, 0.5) : "text.disabled")}
                          fontStyle={metricItem.value !== undefined && metricItem.value !== null ? "normal" : "italic"}
                          sx={{
                            // USER SUGGESTION: Text Clarity - Ensure bold enough
                            fontWeight: metricItem.isPrimary ? 700 : 600, // Explicitly make primary metric bolder, and other metrics bolder
                            fontSize: metricItem.isPrimary ? {xs: '2.25rem', md:'3rem'} : {xs: '1.1rem', md:'1.25rem'},
                            wordBreak: 'break-word',
                            lineHeight: metricItem.isPrimary ? 1.1 : 1.3,
                          }}
                        >
                          {metricItem.value !== undefined && metricItem.value !== null ? String(metricItem.value) : "–"}
                        </Typography>
                      </>
                    )}
                  </Box>
                </m.div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </m.div>
  );
});

export default ResultsDisplay;
