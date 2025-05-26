// src/components/InputForm.tsx
import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useCallback,
  useMemo
} from 'react';
import axios from 'axios';
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
} from '@mui/material';
import { calculateGridProfit } from '../utils/calculator';
import { GridParameters, GridResults } from '../types';

/** All the form fields we care about */
type FieldKey =
  | 'symbol'
  | 'principal'
  | 'lowerBound'
  | 'upperBound'
  | 'gridCount'
  | 'leverage'
  | 'fee'
  | 'duration';

interface FieldConfig {
  key: FieldKey;
  label: string;
  type: 'text' | 'number';
  adornment?: string;
  adornPos?: 'start' | 'end';
  integerOnly?: boolean;
}

const fieldConfigs: FieldConfig[] = [
  { key: 'symbol',     label: 'Crypto Symbol',   type: 'text' },
  { key: 'principal',  label: 'Principal',       type: 'number', adornment: '$', adornPos: 'start' },
  { key: 'lowerBound', label: 'Lower Bound',     type: 'number', adornment: '$', adornPos: 'start' },
  { key: 'upperBound', label: 'Upper Bound',     type: 'number', adornment: '$', adornPos: 'start' },
  { key: 'gridCount',  label: 'Grid Count',      type: 'number', integerOnly: true },
  { key: 'leverage',   label: 'Leverage',        type: 'number', integerOnly: true, adornment: '×', adornPos: 'end' },
  { key: 'fee',        label: 'Fee (%)',         type: 'number' },
  { key: 'duration',   label: 'Duration (Days)', type: 'number', integerOnly: true },
];

/** Initial form state with requested defaults */
const initialForm: Record<FieldKey, string> = {
  symbol:     'BTC',
  principal: '1000',  // default $1,000
  lowerBound: '0',
  upperBound: '0',
  gridCount:  '0',
  leverage:   '1',     // default 1×
  fee:        '0.05',  // default 0.05%
  duration:   '365',   // default 365 days
};

// Shared MUI styling to keep inputs white & hide native spinners
const whiteFieldSx: SxProps<Theme> = {
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
  },
  '& .MuiInputBase-input':            { color: '#FFF' },
  '& .MuiInputAdornment-root, & .MuiInputLabel-root': { color: '#FFF' },
  '& .MuiOutlinedInput-notchedOutline':               { borderColor: '#4B5563' },
  '&:hover .MuiOutlinedInput-notchedOutline':         { borderColor: '#9CA3AF' },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline':  { borderColor: '#2B66F6' },
};

interface InputFormProps {
  onCalculate: (results: GridResults) => void;
}

export default function InputForm({ onCalculate }: InputFormProps) {
  const [form, setForm]     = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<FieldKey,string>>>({});

  // Update one field and clear its error
  const handleChange = useCallback(
    (key: FieldKey) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value.trim() }));
      setErrors(err => ({ ...err, [key]: undefined }));
    },
    []
  );

  // Validate fields
  const validate = useCallback(() => {
    const newErr: Partial<Record<FieldKey,string>> = {};
    fieldConfigs.forEach(({ key, type, integerOnly }) => {
      const val = form[key].trim();
      if (!val) newErr[key] = 'Required';
      else if (type === 'number') {
        const num = Number(val);
        if (isNaN(num) || num <= 0) newErr[key] = 'Must be > 0';
        else if (integerOnly && num % 1 !== 0) newErr[key] = 'Must be whole';
      }
    });
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  }, [form]);

  // Optimize values via Binance 5-day candle
  const handleOptimize = useCallback(async () => {
    try {
      const pair = form.symbol.toUpperCase() + 'USDT';
      const res = await axios.get(
        `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1d&limit=5`
      );
      const data = res.data as any[][];
      const lows = data.map(k => parseFloat(k[3]));
      const highs = data.map(k => parseFloat(k[2]));
      const lower = Math.min(...lows);
      const upper = Math.max(...highs);
      const count = 10;

      setForm(f => ({ ...f, lowerBound: String(lower), upperBound: String(upper), gridCount: String(count) }));
      setErrors(err => ({ ...err, lowerBound: undefined, upperBound: undefined, gridCount: undefined }));
    } catch (e) {
      console.error(e);
    }
  }, [form.symbol]);

  // Auto-optimize on mount
  useEffect(() => { handleOptimize(); }, [handleOptimize]);

  // Submit
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const params: GridParameters = {
      symbol:       form.symbol,
      principal:    Number(form.principal),
      lowerBound:   Number(form.lowerBound),
      upperBound:   Number(form.upperBound),
      gridCount:    Number(form.gridCount),
      leverage:     Number(form.leverage),
      feePercent:   Number(form.fee) / 100,
      durationDays: Number(form.duration),
      atrPerMin:    1,
    };
    onCalculate(calculateGridProfit(params));
  }, [form, onCalculate, validate]);

  const isValid = useMemo(() => validate(), [form, validate]);

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#FFF', mb: 1 }}>
          Grid Parameters
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            {fieldConfigs.map(cfg => (
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
                  InputProps={cfg.adornment ? { [`${cfg.adornPos}Adornment`]: <InputAdornment position={cfg.adornPos!}>{cfg.adornment}</InputAdornment> } : undefined}
                  inputProps={cfg.type==='number' ? { min:1, step: cfg.integerOnly?1:'any' } : undefined}
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
              <Button type="submit" variant="contained" fullWidth disabled={!isValid}>
                Calculate
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}
