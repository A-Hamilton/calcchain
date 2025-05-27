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
} from "@mui/material";
import { calculateGridProfit } from "../utils/calculator";
import { getAtrPerMin } from "../utils/atr";
import { computeOptimalGridParams } from "../utils/optimizer";
import { GridParameters, GridResults } from "../types";

/** All the form fields we care about */
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
}

const fieldConfigs: FieldConfig[] = [
  { key: "symbol", label: "Crypto Symbol", type: "text" },
  {
    key: "principal",
    label: "Principal",
    type: "number",
    adornment: "$",
    adornPos: "start",
  },
  {
    key: "lowerBound",
    label: "Lower Bound",
    type: "number",
    adornment: "$",
    adornPos: "start",
  },
  {
    key: "upperBound",
    label: "Upper Bound",
    type: "number",
    adornment: "$",
    adornPos: "start",
  },
  { key: "gridCount", label: "Grid Count", type: "number", integerOnly: true },
  {
    key: "leverage",
    label: "Leverage",
    type: "number",
    integerOnly: true,
    adornment: "×",
    adornPos: "end",
  },
  { key: "fee", label: "Fee (%)", type: "number" },
  {
    key: "duration",
    label: "Duration (Days)",
    type: "number",
    integerOnly: true,
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

  const handleOptimize = useCallback(async () => {
    try {
      // Build full symbol (e.g. BTC → BTCUSDT)
      const pair = form.symbol.toUpperCase() + "USDT";

      // 1. Fetch current market price, not use principal as price
      const priceRes = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`
      );
      const price = parseFloat(priceRes.data.price);

      // 2. Now fetch your blended ATR
      const atr = await getAtrPerMin(pair, 200);

      // 3. Compute optimal params around actual price
      const ctx = {
        symbol: pair,
        principal: price, // use price for range
        atr,
        feePercent: Number(form.fee) / 100,
      };
      const { lower, upper, count } = computeOptimalGridParams(ctx);

      // 4. Update the form
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
    } catch (e) {
      console.error(e);
    }
  }, [form.symbol, form.principal, form.fee]);

  // Auto-optimize on mount
  useEffect(() => {
    handleOptimize();
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
        // no atrPerMin → fetched & blended under the hood
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
                  label={cfg.label}
                  type={cfg.type}
                  value={form[cfg.key]}
                  onChange={handleChange(cfg.key)}
                  required
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
              <Button variant="outlined" fullWidth onClick={handleOptimize}>
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
    </Card>
  );
}
