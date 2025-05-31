// src/components/InputForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, Typography, Grid, TextField, Button, Collapse, Snackbar, Alert, AlertColor,
  MenuItem, IconButton, Tooltip, Box, CircularProgress, Divider, alpha, useTheme, Theme
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { m, AnimatePresence } from "framer-motion";
import { fetchCandles, getAtrPerMin, Candle } from "../utils/atr";
import { computeOptimalGridParams } from "../utils/optimizer";
import { GridParameters, GridType, EntryType } from "../types";
import { DEFAULT_ATR_PERIOD } from "../constants";

type FormFields = {
  symbol: string;
  principal: string;
  lowerBound: string;
  upperBound: string;
  gridCount: string;
  leverage: string;
  feePercent: string;
  durationDays: string;
  buyPrice: string;
  sellPrice: string;
  gridType: GridType;
  entryType: EntryType;
};

type FieldConfig = {
  key: keyof FormFields;
  label: string;
  type: "number" | "text" | "select";
  help: string;
  options?: GridType[] | EntryType[];
  adornment?: string;
  group?: string;
};

export interface InputFormProps {
  onCalculate: (params: GridParameters) => void;
  calculationErrorFromApp?: string | null;
  onClearCalculationErrorFromApp?: () => void;
}

const fieldConfigs: FieldConfig[] = [
  { key: "symbol", label: "Symbol", type: "text", help: "E.g., BTCUSDT, ETHUSDT, etc.", group: "Asset & Investment" },
  { key: "principal", label: "Principal", type: "number", help: "Total capital (e.g., USD) for this grid strategy.", adornment: "$", group: "Asset & Investment" },
  { key: "lowerBound", label: "Lower Bound", type: "number", help: "Minimum price for the grid trading range.", group: "Grid Range" },
  { key: "upperBound", label: "Upper Bound", type: "number", help: "Maximum price for the grid trading range.", group: "Grid Range" },
  { key: "gridCount", label: "Grid Count", type: "number", help: "Number of grid lines/levels. More grids = smaller steps.", group: "Grid Configuration" },
  { key: "leverage", label: "Leverage", type: "number", help: "Leverage multiplier (e.g., 1 for no leverage, 5 for 5x).", group: "Grid Configuration" },
  { key: "feePercent", label: "Fee % per Trade", type: "number", help: "Exchange trading fee per single trade (e.g., 0.05 for 0.05%).", group: "Strategy Details" },
  { key: "durationDays", label: "Duration (Days)", type: "number", help: "Length of the simulation in days.", group: "Strategy Details" },
];

const advancedFieldConfigs: FieldConfig[] = [
  { key: "buyPrice", label: "Buy Price", type: "number", help: "Your intended entry price for the entire principal (if not using grid entry)." },
  { key: "sellPrice", label: "Sell Price", type: "number", help: "Your intended exit price for the entire principal (if not using grid exit)." },
  { key: "gridType", label: "Grid Type", type: "select", options: Object.values(GridType), help: "Arithmetic: fixed price steps. Geometric: fixed percentage steps." },
  { key: "entryType", label: "Entry Type / Bias", type: "select", options: Object.values(EntryType), help: "Long: buy low, sell high. Short: sell high, buy low. Neutral: trades both ways." },
];

const initialForm: FormFields = {
  symbol: "BTCUSDT", principal: "1000", lowerBound: "", upperBound: "",
  gridCount: "20", leverage: "1", feePercent: "0.05", durationDays: "30",
  buyPrice: "", sellPrice: "",
  gridType: GridType.Arithmetic,
  entryType: EntryType.Long,
};

const textFieldSx = {
  "& .MuiInputLabel-root": { color: "text.secondary" },
  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
  "& .MuiOutlinedInput-root": {
    "& input": { color: "text.primary" },
    "& .MuiSelect-select": {
      textAlign: 'left' as 'left', color: "text.primary", paddingRight: '52px', // Added 'as left' for explicit type
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as 'nowrap', // Added 'as nowrap'
    },
    "& .MuiInputAdornment-root.MuiInputAdornment-positionEnd": { marginRight: '8px' },
    "& fieldset": { borderColor: "divider" },
    "&:hover fieldset": { borderColor: "primary.light" },
    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: '1px' },
  },
  "& .MuiFormHelperText-root": {
    color: "text.secondary",
    fontSize: '0.7rem', marginLeft: '14px', marginRight: '14px',
    minHeight: '1.2em', lineHeight: '1.2em', whiteSpace: 'normal' as 'normal', // Added 'as normal'
  }
};

const formItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i:number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as "easeOut", }, // Added 'as easeOut'
  }),
};

const InputForm: React.FC<InputFormProps> = ({
  onCalculate, calculationErrorFromApp, onClearCalculationErrorFromApp
}) => {
  const theme = useTheme();
  const [form, setForm] = useState<FormFields>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: "", severity: "success" });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [localSymbolFetchError, setLocalSymbolFetchError] = useState<string | null>(null);

  const validate = useCallback(() => {
    const nextErrors: Partial<Record<keyof FormFields, string>> = {};
    if (!form.symbol.trim()) nextErrors.symbol = "Symbol is required.";
    if (!form.principal || Number(form.principal) <= 0) nextErrors.principal = "Must be > 0.";
    const lower = Number(form.lowerBound);
    const upper = Number(form.upperBound);
    const gridC = Number(form.gridCount);
    if (form.lowerBound && (isNaN(lower) || lower <= 0)) nextErrors.lowerBound = "Must be a positive number.";
    if (form.upperBound && (isNaN(upper) || upper <= 0)) nextErrors.upperBound = "Must be a positive number.";
    if (form.lowerBound && form.upperBound && !isNaN(lower) && !isNaN(upper) && lower >= upper) {
      nextErrors.upperBound = "Must be > Lower Bound.";
    }
    if (form.gridCount && (isNaN(gridC) || gridC <= 0 || !Number.isInteger(gridC))) nextErrors.gridCount = "Must be a positive integer.";
    if (!form.leverage || Number(form.leverage) < 1) nextErrors.leverage = "Must be ≥ 1.";
    if (form.feePercent === '' || isNaN(Number(form.feePercent)) || Number(form.feePercent) < 0) nextErrors.feePercent = "Must be ≥ 0.";
    if (!form.durationDays || Number(form.durationDays) <= 0 || !Number.isInteger(Number(form.durationDays))) nextErrors.durationDays = "Must be a positive integer.";
    if (form.buyPrice && (isNaN(Number(form.buyPrice)) || Number(form.buyPrice) < 0)) nextErrors.buyPrice = "Must be ≥ 0.";
    if (form.sellPrice && (isNaN(Number(form.sellPrice)) || Number(form.sellPrice) < 0)) nextErrors.sellPrice = "Must be ≥ 0.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form]);

  useEffect(() => { validate(); }, [form, validate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | {name?: string; value: unknown}>) => {
    const name = e.target.name as keyof FormFields;
    const value = e.target.value as string; // Select event value is string
    setForm(f => ({
        ...f,
        [name]: name === 'gridType' ? value as GridType :
                name === 'entryType' ? value as EntryType :
                value
    }));
    if (name === "symbol") setLocalSymbolFetchError(null);
    if (calculationErrorFromApp && onClearCalculationErrorFromApp) onClearCalculationErrorFromApp();
  };

  const renderSelectValue = (selectedValue: unknown) => {
    if (typeof selectedValue !== 'string') return '';
    return <Typography component="span" noWrap sx={{ textAlign: 'left', color: "text.primary", width: '100%', display: 'block' }}>{selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)}</Typography>;
  };

  const renderField = (cfg: FieldConfig, index: number) => (
    <Grid item component="div" xs={12} sm={6} key={cfg.key} >
      <m.div custom={index} variants={formItemVariants} initial="hidden" animate="visible">
        <TextField label={cfg.label} name={cfg.key} value={form[cfg.key]} onChange={handleChange} type={cfg.type === "number" ? "number" : "text"} select={cfg.type === "select"}
          inputProps={{ inputMode: cfg.type === "number" ? "decimal" : undefined, min: (cfg.key === 'feePercent' || cfg.key === 'buyPrice' || cfg.key === 'sellPrice') ? 0 : 1, step: (cfg.key === 'gridCount' || cfg.key === 'durationDays' || cfg.key === 'leverage') ? "1" : "any", "aria-label": cfg.label }}
          SelectProps={ cfg.options ? { native: false, MenuProps: { PaperProps: { sx: { maxHeight: 200, '& .MuiMenuItem-root': {textAlign: 'left'} } } }, renderValue: cfg.type === "select" ? renderSelectValue : undefined, IconComponent: () => null } : undefined }
          sx={textFieldSx} variant="outlined" fullWidth margin="dense"
          helperText={(cfg.key === "symbol" ? (localSymbolFetchError || calculationErrorFromApp || errors.symbol) : errors[cfg.key]) || cfg.help}
          error={Boolean(cfg.key === "symbol" ? (localSymbolFetchError || calculationErrorFromApp || errors.symbol) : errors[cfg.key])}
          InputProps={{ ...(cfg.adornment && {startAdornment: <Box component="span" sx={{mr:0.5, color: 'text.secondary'}}>{cfg.adornment}</Box> }),
            endAdornment: ( 
            <Tooltip title={cfg.help} placement="top" arrow>
              <IconButton 
                size="small" 
                sx={{ 
                  color: 'text.secondary', 
                  p: 0.5,
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.action.hover, 0.8), 
                    color: theme.palette.text.primary,
                  }
                }} 
                aria-label={`Info for ${cfg.label}`}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>)
          }}
        >
          {cfg.options && (cfg.options as Array<GridType | EntryType>).map(opt => (<MenuItem key={opt} value={opt} sx={{fontSize: '0.9rem', textAlign: 'left'}}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</MenuItem>))}
        </TextField>
      </m.div>
    </Grid>
  );

  const groupedFields = fieldConfigs.reduce((acc, field) => {
    const group = field.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, FieldConfig[]>);


const handleOptimize = async () => {
  if (calculationErrorFromApp && onClearCalculationErrorFromApp) onClearCalculationErrorFromApp();
  setLocalSymbolFetchError(null);
  setIsOptimizing(true);
  try {
    const symbol = form.symbol.trim();
    if (!symbol) {
      setLocalSymbolFetchError("Symbol is required for optimization.");
      setSnackbar({open: true, message: "Symbol is required for optimization.", severity: "error"});
      setIsOptimizing(false); return;
    }

    const candles: Candle[] = await fetchCandles(symbol, "1d", DEFAULT_ATR_PERIOD + 1);
    if (!candles || candles.length === 0) {
        throw new Error(`No candle data returned for symbol ${symbol}. It might be an invalid symbol.`);
    }
    const currentPrice = candles[candles.length - 1].close;
    const investmentAmount = Number(form.principal) || 1000;
    const feePercentValue = Number(form.feePercent) || 0.05;
    const atr = await getAtrPerMin(symbol, DEFAULT_ATR_PERIOD);
    const gridTypeOpt = form.gridType;
    const userBuyPrice = form.buyPrice && !isNaN(Number(form.buyPrice)) ? Number(form.buyPrice) : undefined;
    const userSellPrice = form.sellPrice && !isNaN(Number(form.sellPrice)) ? Number(form.sellPrice) : undefined;
    const optimalParams = computeOptimalGridParams({ symbol, currentPrice, principal: investmentAmount, atr, feePercent: feePercentValue, gridType: gridTypeOpt, buyPrice: userBuyPrice, sellPrice: userSellPrice });
    setForm(f => ({ ...f, symbol, lowerBound: optimalParams.lower.toFixed(Math.max(2, (currentPrice < 1 ? 5 : 2))), upperBound: optimalParams.upper.toFixed(Math.max(2, (currentPrice < 1 ? 5 : 2))), gridCount: optimalParams.count.toString() }));
    setSnackbar({open: true, message: "Optimal grid parameters have been applied!", severity: "success"});
  } catch (err: unknown) { // Changed from 'any' to 'unknown'
    let specificMessage = "Failed to optimize. Check symbol or network.";
    if (err instanceof Error) {
      // Check for symbol specific error message (case-insensitive)
      if (err.message.toLowerCase().includes("symbol") || err.message.toLowerCase().includes("market data")) {
          specificMessage = `No market data for symbol '${form.symbol.trim()}'. It might be delisted or connection issue.`;
      } else { 
          specificMessage = err.message; // Use the error's message directly
      }
    } else if (typeof err === 'string') {
        specificMessage = err; // Handle plain string errors
    }
    // It's good practice to log the original error object if it's not an instance of Error for further debugging
    // else { console.error("Optimization caught non-Error object:", err); }

    setLocalSymbolFetchError(specificMessage);
    setSnackbar({open: true, message: specificMessage, severity: "error"});
  } finally { setIsOptimizing(false); }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculationErrorFromApp && onClearCalculationErrorFromApp) onClearCalculationErrorFromApp();
    setLocalSymbolFetchError(null);
    if (!validate()) { setSnackbar({open: true, message: "Please correct the errors in the form before calculating.", severity: "error"}); return; }
    const params: GridParameters = {
      symbol: form.symbol.trim(), principal: Number(form.principal), lowerBound: Number(form.lowerBound), upperBound: Number(form.upperBound),
      gridCount: Number(form.gridCount), leverage: Number(form.leverage), feePercent: Number(form.feePercent), durationDays: Number(form.durationDays),
      buyPrice: form.buyPrice && !isNaN(Number(form.buyPrice)) ? Number(form.buyPrice) : undefined,
      sellPrice: form.sellPrice && !isNaN(Number(form.sellPrice)) ? Number(form.sellPrice) : undefined,
      gridType: form.gridType, entryType: form.entryType, atrPeriod: DEFAULT_ATR_PERIOD,
    };
    onCalculate(params);
  };

  const handleResetForm = () => {
    setForm(initialForm); setErrors({}); setLocalSymbolFetchError(null);
    if (calculationErrorFromApp && onClearCalculationErrorFromApp) { onClearCalculationErrorFromApp(); }
    setSnackbar({open: true, message: "Form has been reset to default values.", severity: "info"});
  };

  const isCalculateDisabled = Object.keys(errors).length > 0 || Boolean(localSymbolFetchError) || Boolean(calculationErrorFromApp) || isOptimizing;

  return (
    <Card sx={{ 
        bgcolor: "background.paper", 
        p: {xs: 1.5, md: 2}, 
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.palette.mode === 'light' ? theme.shadows[2] : theme.shadows[3]
    }}>
      <CardContent sx={{p: {xs: 1.5, md: 2}}}>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5}}>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>Grid Parameters</Typography>
          <Tooltip title="Reset to default values">
            <IconButton onClick={handleResetForm} size="small" sx={{color: 'text.secondary'}}><RestartAltIcon /></IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Alert icon={<TuneIcon fontSize="inherit" />} severity="info" variant="outlined" 
            sx={{
              borderColor: theme.palette.mode === 'light' ? theme.palette.info.main : theme.palette.primary.dark,
              bgcolor: alpha(theme.palette.info.main, 0.08), 
              color: theme.palette.mode === 'light' ? theme.palette.info.dark : theme.palette.info.light,
              '& .MuiAlert-icon': { color: theme.palette.mode === 'light' ? theme.palette.info.main : theme.palette.info.light },
              '& .MuiAlert-message': {fontSize: '0.85rem'} 
            }}
          >
            Unsure about values? Click <strong>Optimize Values</strong> for data-driven suggestions.
          </Alert>
        </Box>
        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          {Object.entries(groupedFields).map(([groupName, fieldsInGroup], groupIndex) => (
            <m.div key={groupName} initial="hidden" animate="visible" variants={{visible: {transition: {staggerChildren: 0.07}}}}>
              <Box sx={{ mb: groupIndex === Object.keys(groupedFields).length - 1 ? 2.5 : 3.5 }}>
                <m.div variants={formItemVariants} custom={0}> {/* custom={0} for consistent animation start */}
                  <Typography
                    variant="overline" 
                    display="block"
                    sx={{ 
                      color: theme.palette.mode === 'light' ? alpha(theme.palette.text.primary, 0.85) : theme.palette.text.secondary,
                      fontWeight: theme.palette.mode === 'light' ? 500 : 400,
                      fontSize: '0.8rem',
                      mb: 1.5, 
                      mt: groupIndex === 0 ? 0.5 : 2.5, 
                      pb: 0.5,
                      letterSpacing: '0.05em', 
                      borderBottom: `1px solid ${theme.palette.divider}` 
                    }}
                  >{groupName}</Typography>
                </m.div>
                <Grid container spacing={{xs:1.5, sm:2, md:2}}>
                  {fieldsInGroup.map((field, fieldIdx) => renderField(field, fieldIdx))}
                </Grid>
              </Box>
            </m.div>
          ))}
          <Box sx={{ mt: 3, pt: 1, display: "flex", gap: {xs:1.5, sm:2}, flexDirection: {xs: 'column', sm: 'row'} }}>
            <Button component={m.button} whileHover={{ scale: 1.03, y: -1, transition: { duration: 0.2, type: "spring", stiffness: 300 } }} whileTap={{ scale: 0.97 }}
              variant="outlined" color="primary" onClick={handleOptimize} sx={{ flexGrow: 1, minHeight: 48, fontSize: { xs: '0.875rem', md: '0.95rem' } }} type="button" disabled={isOptimizing || !form.symbol.trim()} startIcon={isOptimizing ? <CircularProgress size={20} color="inherit" /> : <TuneIcon />}
            > {isOptimizing ? "Optimizing..." : "Optimize Values"} </Button>
            <Button component={m.button} whileHover={{ scale: 1.03, y: -1, boxShadow: `0px 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`, transition: { duration: 0.2, type: "spring", stiffness: 300 } }} whileTap={{ scale: 0.97 }}
              type="submit" variant="contained" color="primary" sx={{ flexGrow: 1, minHeight: 48, fontSize: { xs: '0.875rem', md: '0.95rem' } }} disabled={isCalculateDisabled}
            > Calculate </Button>
          </Box>
          <Box sx={{ mt: 2.5, textAlign: 'right' }}>
            <Button onClick={() => setAdvancedOpen(x => !x)} color="primary" size="small" sx={{ textTransform: "none", fontWeight: 400, fontSize: '0.8rem' }} endIcon={<TuneIcon fontSize="small"/>} type="button">
              {advancedOpen ? "Hide Advanced Settings" : "Show Advanced Settings"}
            </Button>
            <AnimatePresence>
              {advancedOpen && (
                <m.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  transition={{duration: 0.3, ease: "easeInOut"}} style={{overflow: 'hidden'}}
                >
                  <Grid container spacing={{xs:1.5, sm:2, md:2}} sx={{ mt: 1 }}>
                    {advancedFieldConfigs.map((field, idx) => renderField(field, idx + fieldConfigs.length))}
                  </Grid>
                </m.div>
              )}
            </AnimatePresence>
          </Box>
        </form>
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({...s, open: false}))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert
            onClose={() => setSnackbar(s => ({...s, open: false}))} severity={snackbar.severity}
            sx={{ width: "100%", boxShadow: 6,
              ...(snackbar.severity === 'success' && { bgcolor: theme.palette.success.main, color: theme.palette.success.contrastText, '& .MuiAlert-icon': { color: theme.palette.success.contrastText } }),
              ...(snackbar.severity === 'info' && { bgcolor: theme.palette.info.main, color: theme.palette.info.contrastText, '& .MuiAlert-icon': { color: theme.palette.info.contrastText } }),
              ...(snackbar.severity === 'error' && { bgcolor: theme.palette.error.main, color: theme.palette.error.contrastText, '& .MuiAlert-icon': { color: theme.palette.error.contrastText } }),
              ...(snackbar.severity === 'warning' && { bgcolor: theme.palette.warning.main, color: theme.palette.warning.contrastText, '& .MuiAlert-icon': { color: theme.palette.warning.contrastText } }),
            }} variant="filled"
          > {snackbar.message} </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default React.memo(InputForm);