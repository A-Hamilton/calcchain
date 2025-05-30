import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Collapse,
  Snackbar,
  Alert,
  MenuItem,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import { fetchCandles, getAtrPerMin, Candle } from "../utils/atr"; // Import Candle type
import { computeOptimalGridParams } from "../utils/optimizer";
import { GridParameters } from "../types"; // Assuming GridParameters is defined here or imported

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
  gridType: string;
  entryType: string;
};

type FieldConfig = {
  key: keyof FormFields;
  label: string;
  type: "number" | "text" | "select";
  help: string;
  options?: string[];
  adornment?: string;
};

export interface InputFormProps {
  onCalculate: (params: GridParameters) => void; // Use GridParameters type
  symbolError?: string | null;
}

const fieldConfigs: FieldConfig[] = [
  {
    key: "symbol",
    label: "Symbol",
    type: "text",
    help: "E.g., BTCUSDT, ETHBTC, BNBUSDT, etc.",
  },
  {
    key: "principal",
    label: "Principal",
    type: "number",
    help: "How much capital (USD or quote currency) you want to allocate.",
    adornment: "$",
  },
  {
    key: "lowerBound",
    label: "Lower Bound",
    type: "number",
    help: "Minimum price for grid trading range.",
  },
  {
    key: "upperBound",
    label: "Upper Bound",
    type: "number",
    help: "Maximum price for grid trading range.",
  },
  {
    key: "gridCount",
    label: "Grid Count",
    type: "number",
    help: "Number of grid intervals (more = finer grid, but higher fees).",
  },
  {
    key: "leverage",
    label: "Leverage",
    type: "number",
    help: "Leverage multiplier (1 = no leverage).",
  },
  {
    key: "feePercent",
    label: "Fee %",
    type: "number",
    help: "Exchange trading fee per trade (e.g., 0.05 for 0.05%).",
  },
  {
    key: "durationDays",
    label: "Duration (Days)",
    type: "number",
    help: "Simulation length in days.",
  },
];

const advancedFieldConfigs: FieldConfig[] = [
  {
    key: "buyPrice",
    label: "Buy Price (Override)",
    type: "number",
    help: "Override default first buy price (advanced). Used for optimizer if set.",
  },
  {
    key: "sellPrice",
    label: "Sell Price (Override)",
    type: "number",
    help: "Override default first sell price (advanced). Used for optimizer if set.",
  },
  {
    key: "gridType",
    label: "Grid Type",
    type: "select",
    options: ["arithmetic", "geometric"],
    help: "Arithmetic = even price steps; Geometric = even percentage steps. Geometric adapts to % moves.",
  },
  {
    key: "entryType",
    label: "Entry Type",
    type: "select",
    options: ["long", "short", "neutral"],
    help: "Long = buy low, sell high; Short = sell high, buy back lower; Neutral = both sides.",
  },
];

const initialForm: FormFields = {
  symbol: "BTCUSDT",
  principal: "1000",
  lowerBound: "",
  upperBound: "",
  gridCount: "",
  leverage: "1",
  feePercent: "0.05",
  durationDays: "365",
  buyPrice: "",
  sellPrice: "",
  gridType: "arithmetic",
  entryType: "long",
};

const whiteFieldSx = {
  "& input": { color: "#fff" },
  "& label": { color: "#90caf9" },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#0F1019" }, // Softer border
    "&:hover fieldset": { borderColor: "#222535" }, // Slightly visible on hover
    "&.Mui-focused fieldset": { borderColor: "#2B66F6" }, // Primary on focus
  },
};

const InputForm: React.FC<InputFormProps> = ({ onCalculate, symbolError: appSymbolError }) => {
  const [form, setForm] = useState<FormFields>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [localSymbolError, setLocalSymbolError] = useState<string | null>(null);


  const validate = useCallback(() => {
    const nextErrors: Partial<Record<keyof FormFields, string>> = {};
    if (!form.symbol.trim()) nextErrors.symbol = "Symbol is required.";
    if (!form.principal || Number(form.principal) <= 0) nextErrors.principal = "Must be > 0.";
    if (form.lowerBound && (isNaN(Number(form.lowerBound)) || Number(form.lowerBound) <= 0)) nextErrors.lowerBound = "Must be a positive number.";
    if (form.upperBound && (isNaN(Number(form.upperBound)) || Number(form.upperBound) <= 0)) nextErrors.upperBound = "Must be a positive number.";
    if (form.gridCount && (isNaN(Number(form.gridCount)) || Number(form.gridCount) <= 0 || !Number.isInteger(Number(form.gridCount)))) nextErrors.gridCount = "Must be a positive integer.";
    if (!form.leverage || Number(form.leverage) < 1) nextErrors.leverage = "Must be ≥ 1.";
    if (form.feePercent === '' || Number(form.feePercent) < 0) nextErrors.feePercent = "Must be ≥ 0.";
    if (!form.durationDays || Number(form.durationDays) <= 0 || !Number.isInteger(Number(form.durationDays))) nextErrors.durationDays = "Must be a positive integer.";
    
    if (form.lowerBound && form.upperBound && Number(form.lowerBound) >= Number(form.upperBound)) {
      nextErrors.upperBound = "Upper Bound must be greater than Lower Bound.";
    }
    if (form.buyPrice && (isNaN(Number(form.buyPrice)) || Number(form.buyPrice) < 0)) nextErrors.buyPrice = "Must be a non-negative number.";
    if (form.sellPrice && (isNaN(Number(form.sellPrice)) || Number(form.sellPrice) < 0)) nextErrors.sellPrice = "Must be a non-negative number.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form]);
  
  useEffect(() => {
    validate();
  }, [form, validate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === "symbol") {
      setLocalSymbolError(null); // Clear local error when symbol changes
    }
  };

  const renderField = (cfg: FieldConfig) => (
    <Grid item xs={12} sm={6} key={cfg.key} sx={{ position: "relative" }}>
      <TextField
        label={cfg.label}
        name={cfg.key}
        value={form[cfg.key]}
        onChange={handleChange}
        type={cfg.type === "number" ? "number" : "text"}
        select={cfg.type === "select"}
        inputProps={{
          inputMode: cfg.type === "number" ? "decimal" : undefined,
          min: (cfg.key === 'feePercent' || cfg.key === 'buyPrice' || cfg.key === 'sellPrice') ? 0 : 1, // Allow 0 for fee and buy/sell overrides
          step: (cfg.key === 'gridCount' || cfg.key === 'durationDays' || cfg.key === 'leverage') ? "1" : "any",
          "aria-label": cfg.label,
        }}
        sx={whiteFieldSx}
        variant="outlined"
        fullWidth
        margin="dense"
        helperText={
          (cfg.key === "symbol" ? (localSymbolError || appSymbolError || errors.symbol) : errors[cfg.key]) || cfg.help
        }
        error={
          Boolean(cfg.key === "symbol" ? (localSymbolError || appSymbolError || errors.symbol) : errors[cfg.key])
        }
        InputProps={cfg.adornment ? { startAdornment: <Box component="span" sx={{mr:1, color: 'text.secondary'}}>{cfg.adornment}</Box> } : undefined}
        SelectProps={cfg.options ? { native: false } : undefined}
        InputLabelProps={{ shrink: true }}
      >
        {cfg.options &&
          cfg.options.map(opt => (
            <MenuItem key={opt} value={opt}>
              {opt[0].toUpperCase() + opt.slice(1)}
            </MenuItem>
          ))}
      </TextField>
      <Tooltip title={cfg.help} placement="right" arrow>
        <IconButton size="small" sx={{ position: "absolute", right: 0, top: "50%", transform: 'translateY(-50%)', mr: 0.5, color: 'text.secondary' }}>
          <InfoOutlinedIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Grid>
  );

const handleOptimize = async () => {
  setLocalSymbolError(null);
  setIsOptimizing(true);
  try {
    const symbol = form.symbol.trim() || "BTCUSDT"; // Default to BTCUSDT if empty
    
    // Fetch candles to get recent price data
    // Fetching more candles (e.g., 14 for ATR period + 1 for current price)
    const candles: Candle[] = await fetchCandles(symbol, "1d", 15); 
    if (!candles || candles.length === 0) {
        throw new Error("No candle data received from API.");
    }
    const currentPrice = candles[candles.length - 1].close; // Use the last close price as current
    
    const investmentAmount = Number(form.principal) || 1000;
    const feePercent = Number(form.feePercent) || 0.05; // Default fee if not set

    // Fetch ATR (Average True Range) per minute
    const atr = await getAtrPerMin(symbol, 14); // Using a common 14-period ATR
    const gridTypeOpt = (form.gridType === "arithmetic" || form.gridType === "geometric")
      ? form.gridType as "arithmetic" | "geometric"
      : "arithmetic";

    const userBuyPrice = form.buyPrice ? Number(form.buyPrice) : undefined;
    const userSellPrice = form.sellPrice ? Number(form.sellPrice) : undefined;

    // Use your optimizer
    const optimalParams = computeOptimalGridParams({
      symbol,
      currentPrice: currentPrice,
      principal: investmentAmount, // Pass investment amount
      atr,
      feePercent,
      gridType: gridTypeOpt,
      buyPrice: userBuyPrice, // Pass user-defined buy/sell if they exist
      sellPrice: userSellPrice,
    });

    setForm(f => ({
      ...f,
      symbol, // Ensure symbol is updated if it was defaulted
      lowerBound: optimalParams.lower.toFixed(Math.max(2, (currentPrice < 1 ? 6 : 2))), // Dynamic precision
      upperBound: optimalParams.upper.toFixed(Math.max(2, (currentPrice < 1 ? 6 : 2))), // Dynamic precision
      gridCount: optimalParams.count.toString(),
    }));
    
    setSnackbarMessage("Optimized values have been set!");
    setSnackbarSeverity("success");
    setShowSnackbar(true);
  } catch (err: any) {
    console.error("Optimization Error:", err);
    const message = err?.response?.data?.msg || err?.message || "Failed to fetch data for symbol. Ensure it's valid (e.g., BTCUSDT).";
    setLocalSymbolError(message);
    setSnackbarMessage(message);
    setSnackbarSeverity("error");
    setShowSnackbar(true);
  } finally {
    setIsOptimizing(false);
  }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
        setSnackbarMessage("Please correct the errors in the form.");
        setSnackbarSeverity("error");
        setShowSnackbar(true);
        return;
    }
    setLocalSymbolError(null); // Clear local errors on successful submission attempt
    
    const params: GridParameters = {
      symbol: form.symbol.trim(),
      principal: Number(form.principal),
      lowerBound: Number(form.lowerBound),
      upperBound: Number(form.upperBound),
      gridCount: Number(form.gridCount),
      leverage: Number(form.leverage),
      feePercent: Number(form.feePercent), // Already a percentage
      durationDays: Number(form.durationDays),
      // atrPerMin will be fetched by calculator if not provided
      buyPrice: form.buyPrice ? Number(form.buyPrice) : undefined,
      sellPrice: form.sellPrice ? Number(form.sellPrice) : undefined,
      gridType: form.gridType as "arithmetic" | "geometric",
      entryType: form.entryType as "long" | "short" | "neutral",
    };
    onCalculate(params);
  };

  const isFormValid = Object.keys(errors).length === 0 && !localSymbolError && !appSymbolError;

  return (
    <Card sx={{ bgcolor: "background.paper", p: {xs: 1.5, md: 2}, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
          Grid Parameters
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Alert icon={<TuneIcon color="primary" />} severity="info" variant="outlined" sx={{borderColor: 'primary.dark', bgcolor: 'rgba(43, 102, 246, 0.1)'}}>
            Not sure what values to use? Click <strong>Optimize Values</strong> to use real-time data and AI to fill in optimal grid settings!
          </Alert>
        </Box>
        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <Grid container spacing={2}>
            {fieldConfigs.map(renderField)}
          </Grid>
          <Box sx={{ mt: 3, display: "flex", gap: 2, flexDirection: {xs: 'column', sm: 'row'} }}>
            <Button
              variant="outlined"
              onClick={handleOptimize}
              sx={{ flexGrow: 1, minHeight: 48, fontSize: { xs: '0.9rem', md: '1rem' } }}
              type="button"
              disabled={isOptimizing || !form.symbol.trim()} // Disable if no symbol
              startIcon={isOptimizing ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isOptimizing ? "Optimizing..." : "Optimize Values"}
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ flexGrow: 1, minHeight: 48, fontSize: { xs: '0.9rem', md: '1rem' } }}
              disabled={!isFormValid} // Use combined validity
            >
              Calculate
            </Button>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button
              onClick={() => setAdvancedOpen(x => !x)}
              color="primary"
              sx={{ textTransform: "none" }}
              endIcon={<TuneIcon />}
              type="button"
            >
              {advancedOpen ? "Hide Advanced Settings" : "Show Advanced Settings"}
            </Button>
            <Collapse in={advancedOpen} timeout="auto" unmountOnExit>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {advancedFieldConfigs.map(renderField)}
              </Grid>
            </Collapse>
          </Box>
        </form>
        <Snackbar
          open={showSnackbar}
          autoHideDuration={4000}
          onClose={() => setShowSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowSnackbar(false)} severity={snackbarSeverity} sx={{ width: "100%" }} variant="filled">
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default React.memo(InputForm);
