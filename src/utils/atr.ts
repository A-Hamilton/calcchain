// File: src/utils/atr.ts
import axios from 'axios';

interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetch candlestick data from Binance public API.
 */
export async function fetchCandles(
  symbol: string,
  interval: string,
  limit: number
): Promise<Candle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const resp = await axios.get(url);
  return resp.data.map((d: any) => ({
    openTime: d[0],
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
  }));
}

/**
 * Compute the Average True Range (ATR) over a given period.
 */
export function computeAtr(candles: Candle[], period: number): number {
  if (candles.length < period + 1) {
    throw new Error(`Not enough candles: got ${candles.length}, need ${period + 1}`);
  }
  const trs: number[] = [];
  for (let i = 1; i <= period; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    trs.push(tr);
  }
  return trs.reduce((sum, x) => sum + x, 0) / period;
}

/**
 * Get ATR for a symbol/interval/period by fetching candles then computing.
 */
export async function getAtr(
  symbol: string,
  interval: string,
  period: number
): Promise<number> {
  const candles = await fetchCandles(symbol, interval, period + 1);
  return computeAtr(candles, period);
}

/**
 * Get blended per-minute ATR by averaging 1m ATR and daily ATR scaled to minutes.
 */
export async function getAtrPerMin(
  symbol: string,
  period: number = 200
): Promise<number> {
  const [atr1m, atrDaily] = await Promise.all([
    getAtr(symbol, '1m', period),
    getAtr(symbol, '1d', period)
  ]);
  const atrDailyPerMin = atrDaily / 1440;
  return (atr1m + atrDailyPerMin) / 2;
}
