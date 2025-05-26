import React, { useState } from 'react';
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
} from '@mui/material';
import { calculateGridProfit } from '../utils/calculator';
import { GridParameters, GridResults } from '../types';

interface InputFormProps {
  onCalculate: (results: GridResults) => void;
}

const InputForm: React.FC<InputFormProps> = ({ onCalculate }) => {
  const [symbol, setSymbol]         = useState('BTC');
  const [botType, setBotType]       = useState<'Long'|'Short'>('Long');
  const [principal, setPrincipal]   = useState(1000);
  const [lowerBound, setLowerBound] = useState(50000);
  const [upperBound, setUpperBound] = useState(150000);
  const [gridCount, setGridCount]   = useState(200);
  const [leverage, setLeverage]     = useState(1);
  const [fee, setFee]               = useState(0.1);
  const [duration, setDuration]     = useState(100);
  const [unit, setUnit]             = useState<'Days'|'Hours'>('Days');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert duration to days
    const durationDays = unit === 'Days' ? duration : duration / 24;

    // Build params (using a default atrPerMin=1 so you see non-zero trades/day)
    const params: GridParameters = {
      symbol,
      botType,
      principal,
      lowerBound,
      upperBound,
      gridCount,
      leverage,
      atrPerMin: 1,                // ← Must be >0 or your trades/day = 0!
      feePercent: fee / 100,
      durationDays,
    };

    // **Call your real calculator**
    const results: GridResults = calculateGridProfit(params);
    onCalculate(results);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Grid Parameters
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Crypto Symbol */}
            <Grid item xs={6}>
              <TextField
                label="Crypto Symbol"
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                fullWidth
              />
            </Grid>
            {/* Bot Type */}
            <Grid item xs={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Bot Type</InputLabel>
                <Select
                  value={botType}
                  label="Bot Type"
                  onChange={e => setBotType(e.target.value as any)}
                >
                  <MenuItem value="Long">Long</MenuItem>
                  <MenuItem value="Short">Short</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Principal */}
            <Grid item xs={6}>
              <TextField
                label="Principal"
                type="number"
                value={principal}
                onChange={e => setPrincipal(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                fullWidth
              />
            </Grid>
            {/* Lower Bound */}
            <Grid item xs={6}>
              <TextField
                label="Lower Bound"
                type="number"
                value={lowerBound}
                onChange={e => setLowerBound(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                fullWidth
              />
            </Grid>

            {/* Upper Bound */}
            <Grid item xs={6}>
              <TextField
                label="Upper Bound"
                type="number"
                value={upperBound}
                onChange={e => setUpperBound(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                fullWidth
              />
            </Grid>
            {/* Grid Count */}
            <Grid item xs={6}>
              <TextField
                label="Grid Count"
                type="number"
                value={gridCount}
                onChange={e => setGridCount(Number(e.target.value))}
                fullWidth
              />
            </Grid>

            {/* Leverage */}
            <Grid item xs={6}>
              <TextField
                label="Leverage"
                type="number"
                value={leverage}
                onChange={e => setLeverage(Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">×</InputAdornment>,
                }}
                fullWidth
              />
            </Grid>
            {/* Fee (%) */}
            <Grid item xs={6}>
              <TextField
                label="Fee (%)"
                type="number"
                value={fee}
                onChange={e => setFee(Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                fullWidth
              />
            </Grid>

            {/* Duration */}
            <Grid item xs={6}>
              <TextField
                label="Duration"
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            {/* Unit */}
            <Grid item xs={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Unit</InputLabel>
                <Select
                  value={unit}
                  label="Unit"
                  onChange={e => setUnit(e.target.value as any)}
                >
                  <MenuItem value="Days">Days</MenuItem>
                  <MenuItem value="Hours">Hours</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Calculate */}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth>
                Calculate
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default InputForm;
