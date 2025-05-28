// src/utils/atr.ts

/**
 * Represents a single candle (OHLCV) from an exchange.
 */
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time?: number;
}

/**
 * Fetches historical candle data from Binance API.
 * @param symbol - Trading pair symbol, e.g. 'BTCUSDT'
 * @param interval - Candle interval, e.g. '1m', '1d'
 * @param limit - How many candles to fetch
 * @returns Array of Candle objects
 */
export async function fetchCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch candles");
  const raw = await res.json();
  return raw.map((c: any[]) => ({
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[5]),
    time: c[0],
  }));
}

/**
 * Computes the ATR (Average True Range) over a period from a candle array.
 * @param candles - Array of candles (most recent last)
 * @param period - Number of periods to compute ATR over
 */
export function computeAtr(candles: Candle[], period: number): number {
  if (candles.length < period + 1) throw new Error("Not enough candle data for ATR");
  const trArr: number[] = [];
  for (let i = 1; i <= period; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const highLow = curr.high - curr.low;
    const highClose = Math.abs(curr.high - prev.close);
    const lowClose = Math.abs(curr.low - prev.close);
    const tr = Math.max(highLow, highClose, lowClose);
    trArr.push(tr);
  }
  const sum = trArr.reduce((acc, n) => acc + n, 0);
  return sum / period;
}

/**
 * Fetches ATR for a symbol at given interval and period.
 * @param symbol - E.g. 'BTCUSDT'
 * @param interval - E.g. '1m', '1d'
 * @param period - E.g. 200
 */
export async function getAtr(symbol: string, interval: string, period: number): Promise<number> {
  const candles = await fetchCandles(symbol, interval, period + 1);
  return computeAtr(candles, period);
}

/**
 * Gets a blended ATR per minute, combining 1m and 1d volatility.
 * Returns a smoothed per-minute ATR value.
 * @param symbol - Trading pair
 * @param period - ATR period, defaults to 200
 */
// Fetches ATR using daily candles and returns ATR per minute

export async function getAtrPerMin(symbol: string, period: number = 14): Promise<number> {
  const candles = await fetchCandles(symbol, "1d", period + 1);
  const atr1d = computeAtr(candles, period);
  return atr1d / 1440; // 1440 minutes in a day
}

