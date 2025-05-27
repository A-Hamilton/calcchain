import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
  SxProps,
  Theme,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Collapse,
  Box,
  MenuItem,
  Divider,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { calculateGridProfit } from "../utils/calculator";
import { getAtrPerMin } from "../utils/atr";
import { computeOptimalGridParams } from "../utils/optimizer";
import { GridParameters, EntryType } from "../types";

type FieldKey =
  | "symbol"
  | "principal"
  | "lowerBound"
  | "upperBound"
  | "gridCount"
  | "leverage"
  | "fee"
  | "duration"
  | "buyPrice"
  | "sellPrice"
  | "gridType"
  | "entryType";

interface FieldConfig {
  key: FieldKey;
  label: string;
  type: "text" | "number" | "select";
  adornment?: string;
  adornPos?: "start" | "end";
  integerOnly?: boolean;
  helpText?: string;
  selectOptions?: { value: string; label: string }[];
}

const fieldConfigs: FieldConfig[] = [
  {
    key: "symbol",
    label: "Crypto Symbol",
    type: "text",
    helpText: "Enter the trading symbol for the cryptocurrency (e.g., BTC, ETH, SOL).",
  },
  {
    key: "principal",
    label: "Principal",
    type: "number",
    adornment: "$",
    adornPos: "start",
    helpText: "The total capital you want to allocate to this grid trading strategy.",
  },
  {
    key: "lowerBound",
    label: "Lower Bound",
    type: "number",
    adornment: "$",
    adornPos: "start",
    helpText: "Lowest price where your bot will place buy orders.",
  },
  {
    key: "upperBound",
    label: "Upper Bound",
    type: "number",
    adornment: "$",
    adornPos: "start",
    helpText: "Highest price where your bot will place sell orders.",
  },
  {
    key: "gridCount",
    label: "Grid Count",
    type: "number",
    integerOnly: true,
    helpText: "How many grid levels between your lower and upper bounds. More grids = more frequent, smaller trades.",
  },
  {
    key: "leverage",
    label: "Leverage",
    type: "number",
    integerOnly: true,
    adornment: "×",
    adornPos: "end",
    helpText: "Multiplier on your position size. Use with caution; increases both risk and reward.",
  },
  {
    key: "fee",
    label: "Fee (%)",
    type: "number",
    helpText: "Trading fee percentage per transaction, typically set by your exchange.",
  },
  {
    key: "duration",
    label: "Duration (Days)",
    type: "number",
    integerOnly: true,
    helpText: "Number of days you want to simulate or plan the grid for.",
  },
];

const advancedFieldConfigs: FieldConfig[] = [
  {
    key: "buyPrice",
    label: "Buy Price",
    type: "number",
    adornment: "$",
    adornPos: "start",
    helpText: "Optional: Override the price at which to trigger buys.",
  },
  {
    key: "sellPrice",
    label: "Sell Price",
    type: "number",
    adornment: "$",
    adornPos: "start",
    helpText: "Optional: Override the price at which to trigger sells.",
  },
  {
    key: "gridType",
    label: "Grid Type",
    type: "select",
    selectOptions: [
      { value: "arithmetic", label: "Arithmetic" },
      { value: "geometric", label: "Geometric" },
    ],
    helpText: "Choose the grid calculation method.",
  },
  {
    key: "entryType",
    label: "Entry Type",
    type: "select",
    selectOptions: [
      { value: "long", label: "Long" },
      { value: "short", label: "Short" },
      { value: "neutral", label: "Neutral" },
    ],
    helpText: "Direction of grid trading: Long (buy low, sell high), Short (buy high, sell low), Neutral (mean reversion).",
  },
];

const initialForm: Record<FieldKey, string> = {
  symbol: "BTC",
  principal: "1000",
  lowerBound: "0",
  upperBound: "0",
  gridCount: "0",
  leverage: "1",
  fee: "0.05",
  duration: "365",
  buyPrice: "",
  sellPrice: "",
  gridType: "arithmetic",
  entryType: "long",
};

const whiteFieldSx: SxProps<Theme> = {
  "& input[type=number]": { MozAppearance: "textfield" },
  "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
  },
  "& .MuiInputBase-input": { color: "#FFF" },
  "& .MuiInputAdornment-root, & .MuiInputLabel-root": { color: "#FFF" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#4B5563" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9CA3AF" },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2B66F6" },
};

interface InputFormProps {
  onCalculate: (params: GridParameters) => Promise<void>;
}

export default function InputForm({ onCalculate }: InputFormProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleChange = useCallback(
    (key: FieldKey) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value.trim() }));
      setErrors((err) => ({ ...err, [key]: undefined }));
    },
    []
  );

  const validate = useCallback((): boolean => {
    const newErr: Partial<Record<FieldKey, string>> = {};
    [...fieldConfigs, ...advancedFieldConfigs].forEach(({ key, type, integerOnly }) => {
      const val = form[key]?.trim();
      if (
        fieldConfigs.map(f => f.key).includes(key) &&
        !val
      ) {
        newErr[key] = "Required";
      } else if (type === "number" && val) {
        const num = Number(val);
        if (isNaN(num) || num <= 0) newErr[key] = "Must be > 0";
        else if (integerOnly && num % 1 !== 0) newErr[key] = "Must be whole";
      }
      const advConfig = advancedFieldConfigs.find(f => f.key === key);
      if (
        advConfig &&
        advConfig.type === 'number' &&
        val
      ) {
        const num = Number(val);
        if (isNaN(num) || num <= 0) newErr[key] = "Must be > 0";
      }
    });
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  }, [form]);

  const handleOptimize = useCallback(
    async (showAlert = true) => {
      try {
        const pair = form.symbol.toUpperCase() + "USDT";
        const priceRes = await axios.get(
          `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`
        );
        const price = parseFloat(priceRes.data.price);
        const atr = await getAtrPerMin(pair, 200);
        const ctx = {
          symbol: pair,
          principal: price,
          atr,
          feePercent: Number(form.fee) / 100,
          buyPrice: form.buyPrice ? Number(form.buyPrice) : undefined,
          sellPrice: form.sellPrice ? Number(form.sellPrice) : undefined,
          gridType: form.gridType as "arithmetic" | "geometric",
          entryType: form.entryType as EntryType,
        };
        const { lower, upper, count } = computeOptimalGridParams(ctx);

        setForm((f) => ({
          ...f,
          lowerBound: form.buyPrice ? form.buyPrice : String(lower.toFixed(2)),
          upperBound: form.sellPrice ? form.sellPrice : String(upper.toFixed(2)),
          gridCount: String(count),
          buyPrice: form.buyPrice || String(lower.toFixed(2)),
          sellPrice: form.sellPrice || String(upper.toFixed(2)),
        }));

        setErrors((err) => ({
          ...err,
          lowerBound: undefined,
          upperBound: undefined,
          gridCount: undefined,
        }));

        if (showAlert) setShowSnackbar(true);
      } catch (e) {
        console.error(e);
      }
    },
    [form.symbol, form.principal, form.fee, form.buyPrice, form.sellPrice, form.gridType, form.entryType]
  );

  useEffect(() => {
    handleOptimize(false);
    setIsFirstLoad(false);
  }, []); // only run on mount

  const handleOptimizeButton = useCallback(() => {
    handleOptimize(true);
  }, [handleOptimize]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const params: GridParameters = {
        symbol: form.symbol.toUpperCase() + "USDT",
        principal: Number(form.principal),
        lowerBound: Number(form.lowerBound),
        upperBound: Number(form.upperBound),
        gridCount: Number(form.gridCount),
        leverage: Number(form.leverage),
        feePercent: Number(form.fee) / 100,
        durationDays: Number(form.duration),
        buyPrice: form.buyPrice ? Number(form.buyPrice) : undefined,
        sellPrice: form.sellPrice ? Number(form.sellPrice) : undefined,
        gridType: form.gridType as "arithmetic" | "geometric",
        entryType: form.entryType as EntryType,
      };

      await calculateGridProfit(params);
      onCalculate(params);
    },
    [form, onCalculate, validate]
  );

  const isValid = useMemo(() => validate(), [form, validate]);

  const renderField = (cfg: FieldConfig) => {
    if (cfg.type === "select") {
      return (
        <TextField
          key={cfg.key}
          select
          label={
            <span style={{ display: "flex", alignItems: "center" }}>
              {cfg.label}
              {cfg.helpText && (
                <Tooltip title={cfg.helpText} arrow>
                  <IconButton
                    size="small"
                    tabIndex={-1}
                    sx={{ ml: 0.5, color: "#9CA3AF", p: 0 }}
                    aria-label={`Help for ${cfg.label}`}
                  >
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </span>
          }
          value={form[cfg.key]}
          onChange={handleChange(cfg.key)}
          required={false}
          InputLabelProps={{ required: false }}
          error={!!errors[cfg.key]}
          helperText={errors[cfg.key]}
          fullWidth
          sx={whiteFieldSx}
        >
          {cfg.selectOptions?.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }
    return (
      <TextField
        key={cfg.key}
        label={
          <span style={{ display: "flex", alignItems: "center" }}>
            {cfg.label}
            {cfg.helpText && (
              <Tooltip title={cfg.helpText} arrow>
                <IconButton
                  size="small"
                  tabIndex={-1}
                  sx={{ ml: 0.5, color: "#9CA3AF", p: 0 }}
                  aria-label={`Help for ${cfg.label}`}
                >
                  <InfoOutlinedIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </span>
        }
        type={cfg.type}
        value={form[cfg.key]}
        onChange={handleChange(cfg.key)}
        required={false}
        InputLabelProps={{ required: false }}
        error={!!errors[cfg.key]}
        helperText={errors[cfg.key]}
        fullWidth
        InputProps={
          cfg.adornment
            ? {
                [`${cfg.adornPos}Adornment`]: (
                  <InputAdornment position={cfg.adornPos!}>
                    {cfg.adornment}
                  </InputAdornment>
                ),
              }
            : undefined
        }
        inputProps={
          cfg.type === "number"
            ? {
                min: 1,
                step: cfg.integerOnly ? 1 : "any",
              }
            : undefined
        }
        sx={whiteFieldSx}
      />
    );
  };

  return (
    <Card sx={{ bgcolor: "background.paper" }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: "#FFF", mb: 1 }}>
          Grid Parameters
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            {/* Main Fields */}
            {fieldConfigs.map((cfg) => (
              <Grid item xs={6} key={cfg.key}>
                {renderField(cfg)}
              </Grid>
            ))}

            {/* Buttons */}
            <Grid item xs={6}>
              <Button variant="outlined" fullWidth onClick={handleOptimizeButton}>
                Optimize Values
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={!isValid}
              >
                Calculate
              </Button>
            </Grid>

            {/* Advanced Settings Toggle */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                <Button
                  variant="text"
                  startIcon={advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setAdvancedOpen(o => !o)}
                  sx={{ color: "#FFF", fontWeight: 600, textTransform: "none" }}
                >
                  Advanced Settings
                </Button>
                <Divider sx={{ flexGrow: 1, ml: 2, borderColor: "#FFF" }} />
              </Box>
              <Collapse in={advancedOpen} unmountOnExit>
                <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                  {advancedFieldConfigs.map(cfg => (
                    <Grid item xs={6} key={cfg.key}>
                      {renderField(cfg)}
                    </Grid>
                  ))}
                </Grid>
              </Collapse>
            </Grid>
          </Grid>
        </form>
      </CardContent>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          icon={<InfoOutlinedIcon sx={{ color: "#FFF" }}/>}
          severity="success"
          variant="filled"
          sx={{
            width: "100%",
            bgcolor: "#2B66F6",
            color: "#FFF",
            "& .MuiAlert-icon": {
              color: "#FFF",
            },
            border: "2px solid #1641A9",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Optimized values have been set!
        </Alert>
      </Snackbar>
    </Card>
  );
}