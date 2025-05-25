// src/components/InputForm.tsx

import React, { useState } from 'react';
import {
  Grid,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { GridParameters } from '../types';
import { calculateGridProfit } from '../utils/calculator';

interface InputFormProps {
  onCalculate: (results: ReturnType<typeof calculateGridProfit>) => void;
}

const InputForm: React.FC<InputFormProps> = ({ onCalculate }) => {
  // --- form state ---
  const [symbol, setSymbol] = useState('BTC');
  const [botType, setBotType] = useState<'Long' | 'Short'>('Long');
  const [principal, setPrincipal] = useState(1000);
  const [lowerBound, setLowerBound] = useState(50000);
  const [upperBound, setUpperBound] = useState(150000);
  const [gridCount, setGridCount] = useState(200);
  const [leverage, setLeverage] = useState(1);
  const [fee, setFee] = useState(0.001); // e.g. 0.001 = 0.1%

  // Duration inputs
  const [durationAmount, setDurationAmount] = useState(100);
  const [durationUnit, setDurationUnit] =
    useState<'Days' | 'Months' | 'Years'>('Days');

  // ATR state
  const [atr1m, setAtr1m] = useState<number | null>(null);
  const [atrDaily, setAtrDaily] = useState<number | null>(null);
  const [combinedAtr, setCombinedAtr] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      principal <= 0 ||
      lowerBound <= 0 ||
      upperBound <= lowerBound ||
      gridCount < 1 ||
      leverage <= 0 ||
      fee < 0 ||
      durationAmount <= 0
    ) {
      alert('Please check your inputs—some values are invalid.');
      return;
    }

    // Convert duration into days
    let durationDays = durationAmount;
    if (durationUnit === 'Months') durationDays *= 30;
    else if (durationUnit === 'Years') durationDays *= 365;

    try {
      // Build symbol string
      const apiSymbol = symbol.toUpperCase().endsWith('USDT')
        ? symbol.toUpperCase()
        : symbol.toUpperCase() + 'USDT';

      // 1) Fetch 1m ATR (200 bars)
      const res1m = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${apiSymbol}&interval=1m&limit=200`
      );
      if (!res1m.ok) throw new Error('Failed to fetch 1m candles');
      const data1m: any[] = await res1m.json();
      let tr1m = 0;
      data1m.forEach((c, i) => {
        const high = parseFloat(c[2]),
          low = parseFloat(c[3]),
          prev = i > 0 ? parseFloat(data1m[i - 1][4]) : null;
        tr1m += i === 0
          ? high - low
          : Math.max(high - low, Math.abs(high - prev!), Math.abs(low - prev!));
      });
      const atrMinute = tr1m / data1m.length;
      setAtr1m(atrMinute);

      // 2) Fetch daily ATR (200 bars)
      const resD = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${apiSymbol}&interval=1d&limit=200`
      );
      if (!resD.ok) throw new Error('Failed to fetch daily candles');
      const dataD: any[] = await resD.json();
      let trD = 0;
      dataD.forEach((c, i) => {
        const high = parseFloat(c[2]),
          low = parseFloat(c[3]),
          prev = i > 0 ? parseFloat(dataD[i - 1][4]) : null;
        trD += i === 0
          ? high - low
          : Math.max(high - low, Math.abs(high - prev!), Math.abs(low - prev!));
      });
      const atrDay = trD / dataD.length;
      setAtrDaily(atrDay);

      // 3) Combine: (dailyATR/1440 + ATR1m) / 2
      const combo = (atrDay / 1440 + atrMinute) / 2;
      setCombinedAtr(combo);

      // 4) Build params & calculate
      const params: GridParameters = {
        symbol,
        botType,
        principal,
        lowerBound,
        upperBound,
        gridCount,
        leverage,
        atrPerMin: combo,
        feePercent: fee,
        durationDays,
      };

      onCalculate(calculateGridProfit(params));
    } catch (err) {
      console.error(err);
      alert(
        'Failed to fetch ATR data from Binance. Please check your internet or symbol.'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {/* ... existing inputs for symbol, bounds, etc ... */}

        {/* Display ATRs */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="ATR₁ₘ (200)"
            value={atr1m !== null ? atr1m.toFixed(2) : ''}
            InputProps={{ readOnly: true }}
            fullWidth
            helperText="1-minute ATR"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="ATR₁d (200)"
            value={atrDaily !== null ? atrDaily.toFixed(2) : ''}
            InputProps={{ readOnly: true }}
            fullWidth
            helperText="Daily ATR"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Combined ATR/min"
            value={combinedAtr !== null ? combinedAtr.toFixed(2) : ''}
            InputProps={{ readOnly: true }}
            fullWidth
            helperText="(ATR₁d/1440 + ATR₁ₘ)/2"
          />
        </Grid>

        {/* Calculate */}
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
          >
            CALCULATE
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default InputForm;
