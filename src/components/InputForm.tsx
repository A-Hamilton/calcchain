import React, { useState } from "react";
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
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import { fetchCandles, getAtrPerMin } from "../utils/atr";
import { computeOptimalGridParams } from "../utils/optimizer";

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
  onCalculate: (params: any) => void;
  symbolError?: string | null; // Receives error from App
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
    help: "Override default first buy price (advanced).",
  },
  {
    key: "sellPrice",
    label: "Sell Price (Override)",
    type: "number",
    help: "Override default first sell price (advanced).",
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
    "& fieldset": { borderColor: "#0F1019" },
    "&:hover fieldset": { borderColor: "#0F1019" },
    "&.Mui-focused fieldset": { borderColor: "#2B66F6" },
  },
};

const InputForm: React.FC<InputFormProps> = ({ onCalculate, symbolError }) => {
  const [form, setForm] = useState<FormFields>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [localSymbolError, setLocalSymbolError] = useState<string | null>(null);

  // Basic validation
  const validate = () => {
    const next: Partial<Record<keyof FormFields, string>> = {};
    if (!form.symbol) next.symbol = "Required";
    if (!form.principal || Number(form.principal) <= 0) next.principal = "Must be > 0";
    if (!form.lowerBound || Number(form.lowerBound) <= 0) next.lowerBound = "Must be > 0";
    if (!form.upperBound || Number(form.upperBound) <= 0) next.upperBound = "Must be > 0";
    if (!form.gridCount || Number(form.gridCount) <= 0) next.gridCount = "Must be > 0";
    if (!form.leverage || Number(form.leverage) < 1) next.leverage = "Must be ≥ 1";
    if (!form.feePercent || Number(form.feePercent) < 0) next.feePercent = "Must be ≥ 0";
    if (!form.durationDays || Number(form.durationDays) <= 0) next.durationDays = "Must be > 0";
    if (form.lowerBound && form.upperBound && Number(form.lowerBound) >= Number(form.upperBound))
      next.upperBound = "Must be > Lower Bound";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  
  React.useEffect(() => {
    validate();
  }, [form]);

  // Render each field; handle error for the symbol input (either from App or local optimizer)
  const renderField = (cfg: FieldConfig) => (
    <Grid item xs={12} sm={6} key={cfg.key} sx={{ position: "relative" }}>
      <TextField
        label={cfg.label}
        name={cfg.key}
        value={form[cfg.key]}
        onChange={e => {
          setForm(f => ({
            ...f,
            [cfg.key]: e.target.value,
          }));
          if (cfg.key === "symbol") {
            setLocalSymbolError(null);
          }
        }}
        type={cfg.type === "number" ? "number" : "text"}
        select={cfg.type === "select"}
        inputProps={{
          inputMode: cfg.type === "number" ? "decimal" : undefined,
          min: 0,
          step: cfg.type === "number" ? "any" : undefined,
          "aria-label": cfg.label,
        }}
        sx={whiteFieldSx}
        variant="outlined"
        fullWidth
        margin="dense"
        helperText={
          cfg.key === "symbol"
            ? errors.symbol || localSymbolError || symbolError || cfg.help
            : errors[cfg.key] || cfg.help
        }
        error={
          cfg.key === "symbol"
            ? Boolean(errors.symbol) || Boolean(localSymbolError) || Boolean(symbolError)
            : Boolean(errors[cfg.key])
        }
        InputProps={cfg.adornment ? { startAdornment: <span>{cfg.adornment}</span> } : undefined}
        SelectProps={cfg.options ? { native: false } : undefined}
        InputLabelProps={{}}
      >
        {cfg.options &&
          cfg.options.map(opt => (
            <MenuItem key={opt} value={opt}>
              {opt[0].toUpperCase() + opt.slice(1)}
            </MenuItem>
          ))}
      </TextField>
      <Tooltip title={cfg.help} placement="right">
        <IconButton size="small" sx={{ position: "absolute", right: 8, top: 8 }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Grid>
  );

const handleOptimize = async () => {
  setLocalSymbolError(null);
  try {
    const symbol = form.symbol.trim() || "BTCUSDT";
    const candles = await fetchCandles(symbol, "1d", 5);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const lowerBound = Math.min(...lows);
    const upperBound = Math.max(...highs);
    const principal = Number(form.principal) || 1000;
    const feePercent = Number(form.feePercent) || 0.05;

    // Fetch ATR and call optimizer for gridCount
    const atr = await getAtrPerMin(symbol);
    const gridType = (form.gridType === "arithmetic" || form.gridType === "geometric")
  ? form.gridType as "arithmetic" | "geometric"
  : "arithmetic";

    // Use your optimizer
    const { count } = computeOptimalGridParams({
      symbol,
      principal,
      atr,
      feePercent,
      gridType,
    });

    setForm(f => ({
      ...f,
      lowerBound: lowerBound.toString(),
      upperBound: upperBound.toString(),
      gridCount: count.toString(),
    }));
    
    setShowSnackbar(true);
  } catch (err: any) {
    setLocalSymbolError(
      "Failed to fetch data for symbol. Please check spelling, e.g. BTCUSDT or ETHBTC."
    );
    setShowSnackbar(false);
  }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLocalSymbolError(null);
    const params = {
      symbol: form.symbol.trim(),
      principal: Number(form.principal),
      lowerBound: Number(form.lowerBound),
      upperBound: Number(form.upperBound),
      gridCount: Number(form.gridCount),
      leverage: Number(form.leverage),
      feePercent: Number(form.feePercent),
      durationDays: Number(form.durationDays),
      buyPrice: form.buyPrice ? Number(form.buyPrice) : undefined,
      sellPrice: form.sellPrice ? Number(form.sellPrice) : undefined,
      gridType: form.gridType as "arithmetic" | "geometric",
      entryType: form.entryType as "long" | "short" | "neutral",
    };
    onCalculate(params);
  };

  const isValid = Object.keys(errors).length === 0;

  return (
    <Card sx={{ bgcolor: "background.paper", p: 2 }}>
      <CardContent>
        <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
          Grid Parameters
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Alert icon={<TuneIcon color="primary" />} severity="info">
            Not sure what values to use? Click <strong>Optimize Values</strong> to use real-time data and AI to fill in optimal grid settings!
          </Alert>
        </Box>
        <form onSubmit={handleSubmit} autoComplete="off">
          <Grid container spacing={2}>
            {fieldConfigs.map(renderField)}
          </Grid>
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleOptimize}
              sx={{ minHeight: 48, fontSize: { xs: 16, md: 18 } }}
              type="button"
            >
              Optimize Values
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ minHeight: 48, fontSize: { xs: 16, md: 18 } }}
              disabled={!isValid}
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
            <Collapse in={advancedOpen}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {advancedFieldConfigs.map(renderField)}
              </Grid>
            </Collapse>
          </Box>
        </form>
        <Snackbar
          open={showSnackbar}
          autoHideDuration={2500}
          onClose={() => setShowSnackbar(false)}
        >
          <Alert severity="success" sx={{ width: "100%" }}>
            Optimized values have been set!
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default React.memo(InputForm);
