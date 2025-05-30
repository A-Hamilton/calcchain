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

  return (
    <m.div custom={delay} initial="hidden" animate="visible" variants={cardVariants}>
      <Card
        elevation={isKeyResult ? 6 : 2}
        sx={{
          bgcolor: isKeyResult ? alpha(theme.palette.primary.dark, 0.9) : "background.paper",
          color: isKeyResult ? theme.palette.primary.contrastText : "text.primary",
          borderRadius: 2.5,
          border: `1px solid ${isKeyResult ? theme.palette.primary.main : theme.palette.divider}`,
          mb: 2.5,
          boxShadow: isKeyResult ? `0 8px 30px -8px ${alpha(theme.palette.primary.main, 0.7)}`: theme.shadows[2],
          position: 'relative',
          overflow: 'hidden',
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
              variant="h6"
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
          {/* Ensure Grid container has 'container' prop, and items only have 'item' and responsive props */}
          <Grid container spacing={{xs: 2, md: 2.5}}>
            {metrics.map((metricItem, i) => (
              <Grid
                item // item prop is sufficient for grid items
                xs={12}
                sm={metricItem.isPrimary ? 12 : 6}
                md={metricItem.isPrimary ? 12 : (metrics.length > 3 && metrics.length !==1 ? 4 : 6)}
                key={`${metricItem.label}-${i}-${String(metricItem.value)}`}
              >
                <m.div custom={i} initial="hidden" animate="visible" variants={metricItemVariants}>
                  <Box
                    sx={{
                      p: metricItem.isPrimary ? {xs:2, md:3} : {xs:1.25, md:1.75},
                      bgcolor: 'transparent',
                      borderRadius: 1.5,
                      border: metricItem.isPrimary ? `1px solid ${alpha(theme.palette.primary.light, 0.5)}` : `1px solid ${theme.palette.divider}`,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      minHeight: metricItem.isPrimary ? 'auto' : '95px',
                      transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out',
                      '&:hover': !metricItem.isPrimary ? {
                        transform: 'translateY(-4px) scale(1.01)',
                        boxShadow: `0 10px 25px -5px ${alpha(theme.palette.common.black, 0.2)}`,
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
                        {metricItem.label.startsWith("Grid Step") ? (
                          <Tooltip title={metricItem.label} placement="top-start" arrow>
                            <Typography
                              variant="subtitle2"
                              color={isKeyResult ? theme.palette.primary.contrastText : "text.secondary"}
                              sx={{ fontSize: '0.75rem', mb: 0.5, lineHeight: 1.2, cursor: 'default', opacity: isKeyResult ? 0.85 : 0.7 }}
                            >
                              {metricItem.label}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography
                            variant="subtitle2"
                            color={isKeyResult ? theme.palette.primary.contrastText : "text.secondary"}
                            sx={{ fontSize: '0.75rem', mb: 0.5, lineHeight: 1.2, opacity: isKeyResult ? 0.85 : 0.7 }}
                          >
                            {metricItem.label}
                          </Typography>
                        )}
                        <Typography
                          variant={metricItem.isPrimary ? "h3" : "h6"}
                          color={metricItem.value !== undefined && metricItem.value !== null ? (isKeyResult ? theme.palette.primary.contrastText : "text.primary") : (isKeyResult ? alpha(theme.palette.common.white, 0.5) : "text.disabled")}
                          fontStyle={metricItem.value !== undefined && metricItem.value !== null ? "normal" : "italic"}
                          sx={{
                            fontWeight: metricItem.isPrimary ? 700 : 500,
                            fontSize: metricItem.isPrimary ? {xs: '2.25rem', md:'3rem'} : {xs: '1.05rem', md:'1.2rem'},
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
