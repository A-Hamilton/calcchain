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
  Box,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { calculateGridProfit } from "../utils/calculator";
import { getAtrPerMin } from "../utils/atr";
import { computeOptimalGridParams } from "../utils/optimizer";
import { GridParameters } from "../types";

type FieldKey =
  | "symbol"
  | "principal"
  | "lowerBound"
  | "upperBound"
  | "gridCount"
  | "leverage"
  | "fee"
  | "duration";

interface FieldConfig {
  key: FieldKey;
  label: string;
  type: "text" | "number";
  adornment?: string;
  adornPos?: "start" | "end";
  integerOnly?: boolean;
  helpText?: string;
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

const initialForm: Record<FieldKey, string> = {
  symbol: "BTC",
  principal: "1000",
  lowerBound: "0",
  upperBound: "0",
  gridCount: "0",
  leverage: "1",
  fee: "0.05",
  duration: "365",
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

  const handleChange = useCallback(
    (key: FieldKey) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value.trim() }));
      setErrors((err) => ({ ...err, [key]: undefined }));
    },
    []
  );

  const validate = useCallback(() => {
    const newErr: Partial<Record<FieldKey, string>> = {};
    fieldConfigs.forEach(({ key, type, integerOnly }) => {
      const val = form[key].trim();
      if (!val) newErr[key] = "Required";
      else if (type === "number") {
        const num = Number(val);
        if (isNaN(num) || num <= 0) newErr[key] = "Must be > 0";
        else if (integerOnly && num % 1 !== 0) newErr[key] = "Must be whole";
      }
    });
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  }, [form]);

  // Accepts a showAlert arg: true to show the snackbar, false to suppress
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
        };
        const { lower, upper, count } = computeOptimalGridParams(ctx);

        setForm((f) => ({
          ...f,
          lowerBound: String(lower.toFixed(2)),
          upperBound: String(upper.toFixed(2)),
          gridCount: String(count),
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
    [form.symbol, form.principal, form.fee]
  );

  useEffect(() => {
    // Run optimize, but do NOT show the alert on first load
    handleOptimize(false);
    setIsFirstLoad(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      };

      const results = await calculateGridProfit(params);
      console.log("🔍 ATR/min in submit handler:", results.atrPerMin);
      onCalculate(params);
    },
    [form, onCalculate, validate]
  );

  const isValid = useMemo(() => validate(), [form, validate]);

  return (
    <Card sx={{ bgcolor: "background.paper" }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: "#FFF", mb: 1 }}>
          Grid Parameters
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            {fieldConfigs.map((cfg) => (
              <Grid item xs={6} key={cfg.key}>
                <TextField
                  label={
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {cfg.label}
                      {cfg.helpText && (
                        <Tooltip title={cfg.helpText} arrow>
                          <IconButton
                            size="small"
                            tabIndex={-1}
                            sx={{ ml: 0.5, color: "#9CA3AF", p: 0 }}
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
              </Grid>
            ))}

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
          </Grid>
        </form>
      </CardContent>
      {/* Snackbar Message */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          icon={<InfoOutlinedIcon sx={{ color: "#FFF" }}/> }
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
