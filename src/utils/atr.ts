// src/utils/atr.ts
import axios from 'axios';
import { BINANCE_API_BASE_URL, MINUTES_IN_DAY, DEFAULT_ATR_PERIOD } from '../constants';

/**
 * Represents a single candle (OHLCV) from an exchange.
 */
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time?: number; // Binance kline open time
}

/**
 * Fetches historical candle data from Binance API using Axios.
 * @param symbol - Trading pair symbol, e.g. 'BTCUSDT'
 * @param interval - Candle interval, e.g. '1m', '1d'
 * @param limit - How many candles to fetch
 * @returns Array of Candle objects
 * @throws Error if API request fails or returns unexpected data
 */
export async function fetchCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  const url = `${BINANCE_API_BASE_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  try {
    const response = await axios.get<any[][]>(url); // Expecting an array of arrays
    const rawData = response.data;

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error(`No candle data returned for symbol ${symbol}. It might be an invalid symbol or pair.`);
    }

    return rawData.map((c: any[]) => ({
      time: Number(c[0]),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
  } catch (error) {
    let errorMessage = `Failed to fetch candles for ${symbol}.`;
    if (axios.isAxiosError(error) && error.response) {
      // Try to get a more specific error message from Binance response
      const binanceErrorMsg = error.response.data?.msg;
      errorMessage = binanceErrorMsg 
        ? `Binance API Error: ${binanceErrorMsg} (Symbol: ${symbol}, Interval: ${interval})`
        : `Binance API Error: Status ${error.response.status} (Symbol: ${symbol}, Interval: ${interval})`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error(`Error in fetchCandles for ${symbol}:`, errorMessage, error);
    throw new Error(errorMessage); // Re-throw with a potentially more informative message
  }
}

/**
 * Computes the ATR (Average True Range) over a period from a candle array.
 * @param candles - Array of candles (ordered from oldest to newest, most recent last)
 * @param period - Number of periods to compute ATR over (must be < candles.length)
 * @returns The ATR value
 * @throws Error if not enough candle data for the given period
 */
export function computeAtr(candles: Candle[], period: number): number {
  if (!candles || candles.length < period + 1) {
    throw new Error(`Not enough candle data for ATR calculation. Need ${period + 1} candles, got ${candles.length}.`);
  }
  
  const trueRanges: number[] = [];
  // Calculate 'period' number of True Range values using the last 'period + 1' candles.
  // The loop starts from 'candles.length - period' to iterate 'period' times.
  // For each iteration 'i', 'candles[i]' is the current candle and 'candles[i-1]' is the previous.
  for (let i = candles.length - period; i < candles.length; i++) {
    const currentCandle = candles[i];
    const previousCandle = candles[i-1]; 

    const highLow = currentCandle.high - currentCandle.low;
    const highPrevClose = Math.abs(currentCandle.high - previousCandle.close);
    const lowPrevClose = Math.abs(currentCandle.low - previousCandle.close);
    
    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }
  
  const sumOfTrueRanges = trueRanges.reduce((acc, tr) => acc + tr, 0);
  if (period === 0) return 0; // Avoid division by zero if period is somehow 0
  return sumOfTrueRanges / period;
}


/**
 * Fetches ATR for a symbol at given interval and period.
 * @param symbol - E.g. 'BTCUSDT'
 * @param interval - E.g. '1m', '1d'
 * @param period - E.g. 14, 200
 * @returns The ATR value for the specified interval
 */
export async function getAtr(symbol: string, interval: string, period: number = DEFAULT_ATR_PERIOD): Promise<number> {
  // Fetch period + 1 candles to have enough data for 'period' TR calculations
  const candles = await fetchCandles(symbol, interval, period + 1); 
  return computeAtr(candles, period);
}

/**
 * Gets an estimated ATR per minute, typically derived from daily volatility.
 * This provides a smoothed per-minute ATR value.
 * @param symbol - Trading pair symbol
 * @param period - ATR period for daily candles, defaults to DEFAULT_ATR_PERIOD (14)
 * @returns Estimated ATR per minute
 */
export async function getAtrPerMin(symbol: string, period: number = DEFAULT_ATR_PERIOD): Promise<number> {
  // Fetch daily candles. Need 'period + 1' candles for 'period' TRs.
  const dailyCandles = await fetchCandles(symbol, "1d", period + 1);
  const atr1d = computeAtr(dailyCandles, period);
  // The check `if (MINUTES_IN_DAY === 0)` was removed as MINUTES_IN_DAY is a non-zero constant (1440).
  return atr1d / MINUTES_IN_DAY; 
}
