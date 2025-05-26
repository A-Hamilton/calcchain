// src/components/InputForm.tsx
import React, { useState, ChangeEvent, FormEvent, useCallback, useMemo, memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  SxProps,
  Theme,
} from '@mui/material';
import { calculateGridProfit } from '../utils/calculator';
import { GridParameters, GridResults } from '../types';

/**
 * Configuration for each form field.
 */
type FieldKey =
  | 'symbol'
  | 'botType'
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
  { key: 'symbol', label: 'Crypto Symbol', type: 'text' },
  { key: 'botType', label: 'Bot Type', type: 'text' },
  { key: 'principal', label: 'Principal', type: 'number', adornment: '$', adornPos: 'start' },
  { key: 'lowerBound', label: 'Lower Bound', type: 'number', adornment: '$', adornPos: 'start' },
  { key: 'upperBound', label: 'Upper Bound', type: 'number', adornment: '$', adornPos: 'start' },
  { key: 'gridCount', label: 'Grid Count', type: 'number', integerOnly: true },
  { key: 'leverage', label: 'Leverage', type: 'number', integerOnly: true, adornment: '×', adornPos: 'end' },
  { key: 'fee', label: 'Fee (%)', type: 'number' },
  { key: 'duration', label: 'Duration (Days)', type: 'number', integerOnly: true },
];
const initialForm: Record<FieldKey, string> = {
  symbol: 'BTC', botType: 'Long', principal: '0', lowerBound: '0', upperBound: '0', gridCount: '0', leverage: '0', fee: '0', duration: '0',
};

// Shared styling for white inputs + hide number spinners
const whiteFieldSx: SxProps<Theme> = {
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none' },
  '& .MuiInputBase-input': { color: '#FFF' },
  '& .MuiInputAdornment-root, & .MuiInputLabel-root': { color: '#FFF' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4B5563' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9CA3AF' },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2B66F6' },
};

interface InputFormProps { onCalculate: (results: GridResults) => void; }
export default function InputForm({ onCalculate }: InputFormProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<FieldKey,string>>>({});

  // Stable change handler
  const handleChange = useCallback(
    (key: FieldKey) => (e: ChangeEvent<HTMLInputElement>) => {
      const newVal = key === 'symbol' || key === 'botType'
        ? e.target.value
        : e.target.value.trim();
      setForm(f => ({ ...f, [key]: newVal }));
      setErrors(err => ({ ...err, [key]: undefined }));
    },
    []
  );

  // Validate each field
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
    return !Object.keys(newErr).length;
  }, [form]);

  // Submit form
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      const params: GridParameters = {
        symbol: form.symbol,
        botType: form.botType as 'Long'|'Short',
        principal: +form.principal,
        lowerBound: +form.lowerBound,
        upperBound: +form.upperBound,
        gridCount: +form.gridCount,
        leverage: +form.leverage,
        atrPerMin: 1,
        feePercent: +form.fee/100,
        durationDays: +form.duration,
      };
      onCalculate(calculateGridProfit(params));
    }, [form, onCalculate, validate]
  );

  const isValid = useMemo(() => validate(), [form, validate]);

  return (
    <Card sx={{ bgcolor:'background.paper' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color:'#FFF' }}>
          Grid Parameters
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            {fieldConfigs.map(cfg => (
              <Grid item xs={6} key={cfg.key}>
                {cfg.key === 'botType' ? (
                  <FormControl fullWidth required error={!!errors[cfg.key]} sx={whiteFieldSx}>
                    <InputLabel>{cfg.label}</InputLabel>
                    <Select
                      value={form[cfg.key]}
                      label={cfg.label}
                      onChange={e => handleChange(cfg.key)(e as any)}
                      sx={{ color:'#FFF' }}
                    >
                      <MenuItem value="Long">Long</MenuItem>
                      <MenuItem value="Short">Short</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    label={cfg.label}
                    type={cfg.type}
                    value={form[cfg.key]}
                    onChange={handleChange(cfg.key)}
                    required
                    error={!!errors[cfg.key]}
                    helperText={errors[cfg.key]}
                    fullWidth
                    InputProps={cfg.adornment
                      ? { [`${cfg.adornPos}Adornment`]: <InputAdornment position={cfg.adornPos!}>{cfg.adornment}</InputAdornment> }
                      : undefined}
                    inputProps={cfg.type==='number' ? { min:1, step: cfg.integerOnly ? 1 : 'any' } : undefined}
                    sx={whiteFieldSx}
                  />
                )}
              </Grid>
            ))}
            <Grid item xs={12}>
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
